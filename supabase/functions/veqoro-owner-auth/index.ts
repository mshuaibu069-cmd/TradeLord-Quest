import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const publicClient = createClient(url, anonKey);
const admin = createClient(url, serviceKey);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "verify_pin") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const pin = String(body?.pin ?? "");

      if (!email || !/^\d{6,12}$/.test(pin)) {
        return json({ ok: false, error: "Invalid credentials" }, 401);
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("id, username")
        .eq("username", email)
        .maybeSingle();

      if (!profile?.id) return json({ ok: false, error: "Invalid credentials" }, 401);

      const { data: authProfile } = await admin
        .schema("veqoro")
        .from("owner_auth_profiles")
        .select("user_id, pin_configured, email_otp_enabled")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!authProfile?.pin_configured || !authProfile.email_otp_enabled) {
        return json({ ok: false, error: "Owner authentication is not ready" }, 403);
      }

      const { data: pinOk, error: pinError } = await admin.rpc("verify_owner_pin", {
        p_user_id: profile.id,
        p_pin: pin,
      });

      if (pinError || pinOk !== true) {
        await admin.schema("veqoro").from("audit_events").insert({
          event_type: "owner_pin_verification",
          actor_type: "owner_auth",
          actor_id: profile.id,
          action_key: "owner.pin.verify",
          risk_level: "high",
          outcome: "denied",
          metadata: { reason: "invalid_or_locked_pin" },
        });
        return json({ ok: false, error: "Invalid credentials" }, 401);
      }

      const { data: challenge, error: challengeError } = await admin
        .schema("veqoro")
        .from("owner_auth_challenges")
        .insert({
          user_id: profile.id,
          challenge_type: "email_otp",
          status: "pending",
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          metadata: { purpose: "owner_dashboard_login" },
        })
        .select("id, expires_at")
        .single();

      if (challengeError) throw challengeError;

      await admin.schema("veqoro").from("audit_events").insert({
        event_type: "owner_pin_verified",
        actor_type: "owner_auth",
        actor_id: profile.id,
        action_key: "owner.pin.verify",
        risk_level: "high",
        outcome: "allowed",
        metadata: { challenge_id: challenge.id },
      });

      return json({
        ok: true,
        challenge_id: challenge.id,
        expires_at: challenge.expires_at,
        next: "email_otp",
      });
    }

    if (action === "setup_pin") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);

      const { data: { user }, error: userError } = await publicClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      if (userError || !user) return json({ error: "Unauthorized" }, 401);

      const pin = String(body?.pin ?? "");
      if (!/^\d{6,12}$/.test(pin)) {
        return json({ error: "PIN must contain 6 to 12 digits" }, 400);
      }

      const { data: securityProfile } = await admin
        .schema("veqoro")
        .from("owner_security_profiles")
        .select("user_id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!securityProfile || securityProfile.status !== "pending_setup") {
        return json({ error: "Owner PIN setup is not available" }, 403);
      }

      const { data: authProfile } = await admin
        .schema("veqoro")
        .from("owner_auth_profiles")
        .select("pin_configured")
        .eq("user_id", user.id)
        .single();

      if (authProfile?.pin_configured) {
        return json({ error: "PIN is already configured" }, 409);
      }

      const { error: setError } = await admin.rpc("set_owner_pin", {
        p_user_id: user.id,
        p_pin: pin,
      });
      if (setError) throw setError;

      await admin.schema("veqoro").from("audit_events").insert({
        event_type: "owner_pin_configured",
        actor_type: "owner_auth",
        actor_id: user.id,
        action_key: "owner.pin.configure",
        risk_level: "high",
        outcome: "allowed",
      });

      return json({ ok: true, next: "email_otp_setup" });
    }

    if (action === "finalize_login") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);

      const { data: { user }, error: userError } = await publicClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      if (userError || !user) return json({ error: "Unauthorized" }, 401);

      // Fail closed: this function currently has no OTP verification action or
      // server-side OTP comparison. Do not turn a pending challenge into a
      // verified login until a real email-code verification flow is implemented.
      return json({
        error: "Owner login is temporarily blocked because email-code verification is not configured safely.",
      }, 503);

      const challengeId = String(body?.challenge_id ?? "");
      if (!challengeId) return json({ error: "Missing challenge" }, 400);

      const { data: challenge, error: challengeError } = await admin
        .schema("veqoro")
        .from("owner_auth_challenges")
        .select("id, user_id, status, expires_at")
        .eq("id", challengeId)
        .maybeSingle();

      if (challengeError || !challenge || challenge.user_id !== user.id ||
          challenge.status !== "pending" ||
          new Date(challenge.expires_at).getTime() <= Date.now()) {
        return json({ error: "Invalid or expired challenge" }, 401);
      }

      const role = user.app_metadata?.role;
      if (role !== "owner" && role !== "super_admin") {
        await admin.schema("veqoro").from("audit_events").insert({
          event_type: "owner_login_denied",
          actor_type: "owner_auth",
          actor_id: user.id,
          action_key: "owner.dashboard.login",
          risk_level: "critical",
          outcome: "denied",
          metadata: { reason: "owner_role_not_configured" },
        });
        return json({ error: "Owner authorization is not configured" }, 403);
      }

      await admin
        .schema("veqoro")
        .from("owner_auth_challenges")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("id", challengeId);

      await admin
        .schema("veqoro")
        .from("owner_security_profiles")
        .update({ status: "active", last_security_review_at: new Date().toISOString() })
        .eq("user_id", user.id);

      await admin.schema("veqoro").from("audit_events").insert({
        event_type: "owner_login_completed",
        actor_type: "owner_auth",
        actor_id: user.id,
        action_key: "owner.dashboard.login",
        risk_level: "high",
        outcome: "allowed",
        metadata: { challenge_id: challengeId },
      });

      return json({ ok: true, owner: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "Internal authentication error" }, 500);
  }
});