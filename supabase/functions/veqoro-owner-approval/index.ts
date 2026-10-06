import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Server security configuration is incomplete.");

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized." }, 401);

    const role = user.app_metadata?.role;
    if (role !== "owner" && role !== "super_admin") {
      return json({ error: "Owner authorization required." }, 403);
    }

    const body = await req.json();
    const requestId = String(body.permission_request_id || "");
    const decision = String(body.decision || "");
    const note = body.note ? String(body.note) : null;

    if (!requestId || !["approve", "reject"].includes(decision)) {
      return json({ error: "permission_request_id and decision (approve/reject) are required." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: request, error: requestError } = await admin
      .schema("veqoro")
      .from("permission_requests")
      .select("id,agent_id,action_key,resource_type,resource_id,environment,risk_level,rationale,status")
      .eq("id", requestId)
      .single();

    if (requestError || !request) return json({ error: "Permission request not found." }, 404);
    if (request.status !== "pending") return json({ error: "Only pending requests can be decided." }, 409);

    const nextStatus = decision === "approve" ? "approved" : "rejected";

    const { error: updateError } = await admin
      .schema("veqoro")
      .from("permission_requests")
      .update({
        status: nextStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        result: { owner_decision: decision, note },
      })
      .eq("id", request.id)
      .eq("status", "pending");

    if (updateError) throw updateError;

    await admin.schema("veqoro").from("audit_events").insert({
      event_type: "owner_permission_decision",
      actor_type: "owner",
      actor_id: user.id,
      action_key: request.action_key,
      resource_type: request.resource_type,
      resource_id: request.resource_id,
      risk_level: request.risk_level,
      permission_request_id: request.id,
      outcome: nextStatus,
      metadata: {
        environment: request.environment,
        note,
        execution: "not_performed",
      },
    });

    return json({
      ok: true,
      permission_request_id: request.id,
      status: nextStatus,
      execution: "not_performed",
      message: decision === "approve"
        ? "Owner approval recorded. The protected action has NOT been executed."
        : "Owner rejection recorded. The protected action has NOT been executed.",
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Approval service error." }, 400);
  }
});