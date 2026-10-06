import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const levels = ["observe", "analyze", "recommend", "simulate", "safe_automation", "human_approval", "critical_owner"] as const;
const risks = ["low", "medium", "high", "critical"] as const;

function levelRank(level: string) {
  const i = levels.indexOf(level as typeof levels[number]);
  return i < 0 ? -1 : i;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Server security configuration is incomplete.");

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized." }, 401);

    const role = user.app_metadata?.role;
    if (role !== "owner" && role !== "super_admin") return json({ error: "Owner authorization required." }, 403);

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();

    const agentKey = String(body.agent_key || "");
    const actionKey = String(body.action_key || "");
    const resourceType = body.resource_type ? String(body.resource_type) : null;
    const resourceId = body.resource_id ? String(body.resource_id) : null;
    const environment = String(body.environment || "development");
    const riskLevel = String(body.risk_level || "low");
    const rationale = String(body.rationale || "");
    const dataClasses = Array.isArray(body.data_classes) ? body.data_classes.map(String) : [];
    const simulationStatus = body.simulation_status ? String(body.simulation_status) : null;
    const actionLevel = String(body.action_level || "recommend");

    if (!agentKey || !actionKey || !rationale) return json({ error: "agent_key, action_key and rationale are required." }, 400);
    if (!risks.includes(riskLevel as typeof risks[number])) return json({ error: "Invalid risk_level." }, 400);
    if (!["development", "staging", "production"].includes(environment)) return json({ error: "Invalid environment." }, 400);
    if (levelRank(actionLevel) < 0) return json({ error: "Invalid action_level." }, 400);

    const { data: control, error: controlError } = await admin
      .schema("veqoro").from("control_state").select("*").eq("id", true).single();
    if (controlError || !control) throw new Error("Control state unavailable.");
    if (control.emergency_freeze) return json({ error: "VEQORO emergency freeze is active.", emergency_freeze: true }, 423);
    if (!control.ai_enabled) return json({ error: "VEQORO AI operations are disabled." }, 423);

    const { data: agent, error: agentError } = await admin
      .schema("veqoro").from("agents")
      .select("id,agent_key,name,status,permission_level,max_data_classification")
      .eq("agent_key", agentKey).single();
    if (agentError || !agent) return json({ error: "Agent not registered." }, 404);
    if (agent.status !== "active" && agent.status !== "planned") return json({ error: "Agent is not enabled." }, 403);

    const classificationRank: Record<string, number> = { public: 0, internal: 1, confidential: 2, crown_jewel: 3 };
    for (const dc of dataClasses) {
      if (!(dc in classificationRank)) return json({ error: "Invalid data classification." }, 400);
      const maxRank = classificationRank[agent.max_data_classification] ?? 1;
      if (classificationRank[dc] > maxRank) return json({ error: "Agent data-classification boundary exceeded.", data_classification: dc }, 403);
    }

    const agentRank = levelRank(agent.permission_level);
    const requestedRank = levelRank(actionLevel);

    // Optional per-agent policy can further restrict the agent baseline.
    const { data: policy } = await admin.schema("veqoro").from("permission_policies")
      .select("decision_mode,allowed_environment,resource_scope,enabled")
      .eq("agent_id", agent.id).eq("action_key", actionKey).maybeSingle();

    if (policy && (!policy.enabled || (policy.allowed_environment !== "any" && policy.allowed_environment !== environment))) {
      return json({ error: "Action is blocked by a VEQORO permission policy." }, 403);
    }

    const approvalRequired =
      requestedRank > agentRank ||
      riskLevel === "high" ||
      riskLevel === "critical" ||
      requestedRank >= levelRank("safe_automation") ||
      policy?.decision_mode === "human_approval";

    if (approvalRequired) {
      const { data: request, error: insertError } = await admin.schema("veqoro").from("permission_requests").insert({
        agent_id: agent.id, action_key: actionKey, resource_type: resourceType, resource_id: resourceId,
        environment, risk_level: riskLevel, rationale, data_classes: dataClasses,
        simulation_status: simulationStatus, status: "pending"
      }).select("id,status,requested_at").single();
      if (insertError) throw insertError;

      await admin.schema("veqoro").from("audit_events").insert({
        event_type: "permission_request_created",
        actor_type: "owner", actor_id: user.id, action_key: actionKey,
        resource_type: resourceType, resource_id: resourceId, risk_level: riskLevel,
        permission_request_id: request.id, outcome: "approval_required",
        metadata: { agent_key: agentKey, action_level: actionLevel, environment }
      });

      return json({ ok: true, status: "approval_required", permission_request_id: request.id });
    }

    await admin.schema("veqoro").from("audit_events").insert({
      event_type: "control_plane_check",
      actor_type: "owner", actor_id: user.id, action_key: actionKey,
      resource_type: resourceType, resource_id: resourceId, risk_level: riskLevel,
      outcome: "allowed_no_execution",
      metadata: { agent_key: agentKey, action_level: actionLevel, environment }
    });

    return json({
      ok: true,
      status: "allowed_no_execution",
      message: "Control Plane approved the request boundary. No protected action was executed by this endpoint."
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Control Plane error." }, 400);
  }
});