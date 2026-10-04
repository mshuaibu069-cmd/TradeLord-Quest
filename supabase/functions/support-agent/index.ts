import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function classify(category: string, subject: string, message: string) {
  const text = (category + " " + subject + " " + message).toLowerCase();
  const security = /(hack|hacked|stolen|password|account takeover|security|fraud|unauthori[sz]ed|scam|data breach)/.test(text);
  const privacy = /(privacy|data|delete|personal information|tracking)/.test(text);
  const billing = /(payment|charge|subscription|premium|refund|billing)/.test(text);
  const legal = /(lawyer|legal|sue|court|police|fine|regulator|complaint to authority)/.test(text);
  const priority = security || legal ? "high" : (billing || privacy ? "medium" : "normal");
  const requiresHuman = security || legal || /refund|account deletion|data breach/.test(text);

  let recommendation = "Routine support: acknowledge the report, provide the relevant help information, and keep the case open until the user confirms resolution.";
  if (security) recommendation = "Security case: protect the account first, preserve relevant security logs, rate-limit suspicious activity, and escalate to human review.";
  else if (privacy) recommendation = "Privacy case: minimize data exposure, verify the requester, follow the privacy/deletion workflow, and escalate if rights or sensitive data are involved.";
  else if (billing) recommendation = "Billing case: verify the subscription/payment record server-side. Do not expose payment secrets or promise a refund before review.";
  if (legal) recommendation = "Legal/regulatory case: do not make legal conclusions. Preserve relevant records and escalate to owner/legal review.";

  return { priority, requiresHuman, recommendation };
}

async function sendExpoPush(tokens: string[], title: string, body: string, data: Record<string, unknown>) {
  if (!tokens.length) return;
  const messages = tokens.map(to => ({ to, sound: "default", title, body, data }));
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  if (!response.ok) throw new Error("Push notification service returned " + response.status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized.");

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const ticketId = String(body.ticket_id || "");
    if (!ticketId) throw new Error("ticket_id is required.");

    const { data: ticket, error: ticketError } = await admin
      .from("support_tickets")
      .select("id,user_id,category,subject,message")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket || ticket.user_id !== user.id) throw new Error("Ticket not found.");

    const { data: privacy } = await admin
      .from("user_privacy_settings")
      .select("support_ai_enabled")
      .eq("user_id", user.id)
      .single();

    const result = classify(ticket.category, ticket.subject, ticket.message);
    let summary = "Support case received and classified automatically.";
    let agentVersion = "rules-v2";

    // Optional AI layer. The secret is server-side only and is deliberately absent from the APK.
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (openaiKey && privacy?.support_ai_enabled !== false) {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + openaiKey },
          body: JSON.stringify({
            model: Deno.env.get("SUPPORT_AI_MODEL") || "gpt-5-mini",
            input: [
              {
                role: "system",
                content: "You are a support triage assistant for an educational trading simulator. Summarize briefly, suggest a safe next action, never provide legal conclusions, never request passwords or secrets, and flag security, privacy, billing, deletion, or legal/regulatory cases for human review.",
              },
              {
                role: "user",
                content: JSON.stringify({ category: ticket.category, subject: ticket.subject, message: ticket.message }),
              },
            ],
            max_output_tokens: 300,
          }),
        });
        if (aiResponse.ok) {
          const ai = await aiResponse.json();
          const parts: string[] = [];
          for (const item of (Array.isArray(ai.output) ? ai.output : [])) {
            for (const part of (Array.isArray(item.content) ? item.content : [])) {
              if (part.text) parts.push(part.text);
            }
          }
          if (parts.length) {
            summary = parts.join(" ").slice(0, 2000);
            agentVersion = "openai-v1";
          }
        }
      } catch (_) {
        // Safe rules-based triage remains the fallback.
      }
    }

    await admin.from("support_tickets").update({
      status: result.requiresHuman ? "escalated" : "triaged",
      priority: result.priority,
      ai_summary: summary,
      ai_recommendation: result.recommendation,
      requires_human: result.requiresHuman,
      agent_version: agentVersion,
      user_notified: false,
      updated_at: new Date().toISOString(),
    }).eq("id", ticket.id).eq("user_id", user.id);

    if (result.requiresHuman) {
      await admin.from("owner_review_queue").insert({
        ticket_id: ticket.id,
        user_id: user.id,
        reason: result.recommendation,
      });
    }

    const { data: devices } = await admin.from("user_devices")
      .select("expo_push_token").eq("user_id", user.id).eq("enabled", true);

    try {
      await sendExpoPush(
        (devices || []).map(d => d.expo_push_token),
        result.requiresHuman ? "Your complaint was escalated" : "Your complaint was received",
        result.requiresHuman
          ? "We reviewed your report and sent it for human review. You will be notified when there is an update."
          : "We reviewed your report automatically. You will be notified when there is an update.",
        { screen: "support", ticket_id: ticket.id }
      );
      await admin.from("support_tickets").update({ user_notified: true }).eq("id", ticket.id);
    } catch (_) {}

    return new Response(JSON.stringify({
      ok: true,
      ticket_id: ticket.id,
      status: result.requiresHuman ? "escalated" : "triaged",
      priority: result.priority,
      requires_human: result.requiresHuman,
      agent_version: agentVersion,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Support agent failed." }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});