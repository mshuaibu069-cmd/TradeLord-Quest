import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function jwtAal(auth: string) {
  try {
    const token = auth.slice("Bearer ".length).split(".")[1];
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return payload.aal === "aal2" ? "aal2" : "aal1";
  } catch {
    return "aal1";
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required." }, 405);
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > 16_384) return json({ error: "Request too large." }, 413);

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

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_384) return json({ error: "Request too large." }, 413);
    const body = JSON.parse(rawBody);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request body." }, 400);
    const requestId = typeof body.permission_request_id === "string" ? body.permission_request_id.trim() : "";
    const decision = typeof body.decision === "string" ? body.decision : "";
    const note = body.note == null ? null : (typeof body.note === "string" ? body.note.trim() : "");

    if (!requestId || requestId.length > 128 || !["approve", "reject"].includes(decision) || (note !== null && note.length > 1000)) {
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

    const aal = jwtAal(auth);
    if ((request.risk_level === "high" || request.risk_level === "critical") && aal !== "aal2") {
      return json({
        error: "AAL2 MFA is required to approve or reject high-risk or critical actions.",
        required_aal: "aal2",
        current_aal: aal,
      }, 403);
    }

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
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!data) return json({ error: "This permission request has already been decided." }, 409);

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
        aal,
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
    console.error("Owner approval request failed.", error instanceof Error ? error.name : "unknown");
    return json({ error: "Approval service failed safely. No protected action was executed." }, 500);
  }
});