# Prosketu Safety Hardening Plan — VEQORO / TradeLord Quest

**Status:** Owner-approved for implementation planning; not a claim that controls are already implemented.
**Created:** 2026-10-09
**Scope:** Safety controls for the existing educational simulator and future VEQORO AI/support systems.
**Release rule:** Do not merge or deploy application/backend changes until the affected code, database policies, Edge Functions, configuration, and tests have been inspected. Keep the current app build intact while testing.

## Non-negotiable product boundaries

- Virtual balances and simulated orders only.
- No real-money deposits, withdrawals, or real-money orders in V1.
- No guaranteed-profit claims or claims that AI can predict outcomes with certainty.
- AI Teacher is educational, not a broker or a replacement for regulated financial advice.
- Do not introduce binary-options-style real-money functionality.
- Never ship Supabase service-role keys, provider secrets, or AI keys in the mobile app.
- Do not redistribute market news or data unless the relevant licence permits it.

## Controls to verify and implement in the correct layer

### 1. Backend authority and virtual trading
- Treat the server/database as the source of truth for virtual balances, positions, points, streaks, premium entitlements, and competition results.
- Verify every order on the server: authenticated owner, valid symbol, permitted side, finite positive quantity, supported precision, quote/price source, balance/position limits, and transaction consistency.
- Reject client-supplied balance, points, premium, fill-price, or competition-score updates unless independently validated server-side.
- Use atomic database transactions or equivalent consistency protections for order and balance changes.
- Add abuse/rate limits to order and high-value actions.
- Keep all virtual trading clearly simulated and prevent any connection to real-money execution.

### 2. AI and agent permissions
- Keep AI tools disabled unless explicitly allowlisted for that agent and task.
- Default agents to observe, summarize, classify, and recommend; do not allow unsupervised consequential actions.
- Require human approval for account suspensions, account deletion handling, billing/premium changes, privacy/security/legal escalations, competition disqualification, and other high-impact actions.
- Treat retrieved pages, news, emails, tickets, documents, and user content as untrusted input; never let those inputs override system permissions or reveal secrets.
- Add per-action authorization, audit events, rate limits, and an operator-controlled emergency stop before enabling autonomous execution.
- Never place credentials or secrets in prompts, client code, logs, or user-visible AI output.

### 3. Support operations and complaints
- AI may categorize tickets and draft suggested responses.
- AI recommendations must not silently become final legal, privacy, security, billing, or account-enforcement decisions.
- Escalate sensitive/high-impact cases to an authorized human.
- Restrict support-agent access to the minimum data needed; log access and decisions without unnecessarily copying private complaint content.
- Provide a route for users to dispute or request human review of significant restrictions.

### 4. Authentication, account security, and secrets
- Confirm Row Level Security is enabled and tested for every user-owned table.
- Confirm every database policy checks the authenticated user/authorized role and does not trust a user-supplied ID alone.
- Keep service-role and third-party API keys server-side; rotate any secret found in client bundles or logs.
- Review account recovery, session handling, rate limiting, email verification, and owner/admin multi-factor authentication before production.
- Enable Supabase leaked-password protection before production, after verifying current project settings.
- Ensure admin privileges are assigned server-side and cannot be self-granted by a client.

### 5. Privacy, age, and analytics
- Inventory personal data and third-party SDKs; document purpose, lawful basis where applicable, retention, sharing, and deletion.
- Avoid location collection unless a feature genuinely requires it.
- Keep optional analytics off by default until the consent/notice design and actual SDK behavior are verified.
- Define the intended minimum age and assess child access and safeguards before public launch.
- Provide clear privacy information, account/data access and deletion paths, and a documented retention schedule.
- Assess whether a data-protection impact assessment is needed for planned profiling, AI, or children's data.

### 6. Store distribution and product claims
- Check current Google Play and Apple rules against actual features, screenshots, metadata, and monetization before submission.
- Keep public messaging consistent with an educational virtual-money simulator.
- Verify Android developer verification and package/signing ownership requirements for each distribution channel and target country.
- Do not claim that the app is licensed or approved by a financial regulator unless verified and authorized.

### 7. Market news and intellectual property
- Use original educational explanations or properly licensed sources.
- Record each provider's permitted use, attribution, storage, display, and redistribution rights.
- Do not copy full articles or redistribute market-data feeds unless the applicable terms allow it.

## Required verification before any safety-related release

- [ ] Inspect all migrations, RLS policies, RPCs, Edge Functions, and trading/support service code.
- [ ] Confirm virtual order validation and balance updates happen server-side and atomically.
- [ ] Test unauthenticated access, cross-user access, privilege escalation, forged balances/points, invalid quantities, and replay/race conditions.
- [ ] Test prompt injection through user tickets and retrieved content; confirm no unauthorized tools or data access.
- [ ] Test human approval and escalation for high-impact support decisions.
- [ ] Inspect the mobile bundle for secrets and verify production secrets are server-side.
- [ ] Verify account deletion, privacy settings, and analytics behavior against the actual backend.
- [ ] Run project lint/type checks and relevant tests; run Expo diagnostics.
- [ ] Test the existing preview APK on the phone before replacing it with a new build.
- [ ] Review changes and test results before merging; do not deploy automatically from this checklist.

## Initial code-review findings (2026-10-09)

These are repository observations, not a full security audit or proof of deployed-project behavior.

- **Fixed on this review branch:** `src/services/support.js` previously spread caller-supplied privacy values after the authenticated `user_id`, allowing a caller to override that ID in the upsert. The update now accepts only the two boolean switches exposed in the privacy screen (`support_ai_enabled` and `product_analytics_enabled`) and forces the authenticated user's ID last. This is isolated on the review branch and has not been merged or deployed.
- **Trading backend not yet verified:** the mobile service calls the `place_virtual_order` RPC, but the corresponding SQL function and authoritative trading schema/policies were not found in the tracked migration files inspected so far. Do not assume order security is verified until the deployed function definition and grants/policies are inspected.
- **Owner authentication containment added on this review branch:** `veqoro-owner-auth/index.ts` had no OTP verification action, while `finalize_login` marked a pending challenge verified without checking a code. I changed `finalize_login` to fail closed with HTTP 503 rather than grant owner login through an unverified challenge. This is a containment measure, not a completed OTP implementation; owner dashboard login will remain unavailable through this action until a real code-delivery and server-side verification flow is implemented and tested. I also removed the old unreachable login-granting code after the fail-closed return so it cannot be mistaken for an active, verified flow. Not merged or deployed.
- **Support Edge Function configuration tightened on this review branch:** added explicit `verify_jwt = true` entries for `support-agent`, `veqoro-control-plane`, and `veqoro-owner-approval` in `supabase/config.toml`. The handler also verifies the caller's user token and ticket ownership. Confirm the deployed configuration matches this file before release; this branch change has not been deployed.
- **Support-agent privacy and request handling hardened on this review branch:** third-party AI processing now requires an explicit `support_ai_enabled = true` value (missing settings no longer silently opt a user in); the endpoint accepts POST only, bounds request bodies to 16 KiB, validates the ticket identifier, returns a generic not-found result for tickets not owned by the caller, filters push-token formats, and avoids returning internal exception text. These changes are not deployed and have not yet been runtime-tested.
- **Support AI consent default corrected on this review branch:** the privacy screen now defaults the support-AI switch to off, and a review-only SQL migration changes the database default to off and resets historical `true` values because the previous default did not prove explicit consent. This is privacy-protective but will disable external AI summaries until users turn the option back on. Do not apply the migration until the deployed migration-history drift is reconciled and the change is reviewed; it has not been applied.
- **MODAX Telegram operator hardened on this review branch:** the webhook now fails closed if the owner chat allowlist is missing, checks the Telegram webhook secret before revealing that configuration problem, accepts POST only, bounds payload/message size, and no longer stores the full private Telegram message in the operator event payload. This does not change Telegram/Supabase production configuration and has not been runtime-tested.
- **Control-plane checks hardened on this review branch:** request payload and key fields are bounded, permission-policy lookup errors now deny the request instead of behaving as if no policy exists, audit-write results are checked, and server errors no longer return raw database/provider exception text. These changes are not deployed or runtime-tested.
- **Automated type-check workflow added and being validated:** the tracked `package.json` has no test/lint/type-check scripts, so I added `.github/workflows/prosketu-edge-function-checks.yml` to type-check the five modified safety-critical Edge Functions with Deno. The first CI attempt exposed a missing npm dependency needed by Supabase Edge Runtime type declarations; I added `deno.json` with automatic npm resolution and the required OpenAI type dependency. The subsequent GitHub Actions run completed successfully: all five modified Edge Functions passed `deno check` at commit `dc3f501e4177d9d830fee1c52246cc78bc424263` (run: https://github.com/mshuaibu069-cmd/TradeLord-Quest/actions/runs/37952828014). This is a type-check pass, not an end-to-end/runtime security test. Runtime behavior still requires testing before merging.
- **RLS and production settings remain unverified:** the tracked migrations do not yet provide enough evidence to certify all user-table policies or the deployed Supabase leaked-password-protection setting. Inspect the actual deployed policies/settings before release; no production configuration was changed.

## Change log

- 2026-10-09: Owner approved implementing the safety recommendations from the Prosketu risk scan. This document records the required control set and verification gates. It does not certify that these controls are implemented; code-level work must follow repository inspection and tests.
- 2026-10-09: Restricted client-side privacy-setting updates, changed support-AI processing to explicit opt-in with a review-only default-off migration, hardened support-agent privacy defaults/request handling, hardened MODAX Telegram operator access/logging and control-plane policy handling, enabled gateway JWT checks for the control plane and owner approval functions, hardened owner approval request handling against duplicate decisions, added a Deno CI type-check workflow and configured its npm type dependency for the modified Edge Functions, and removed unreachable unsafe owner-login code on the review branch. Documented unresolved owner OTP, trading-RPC, deployed configuration, and test-coverage findings. No production deployment or database-setting changes were made.


## Connected Supabase production observations (read-only inspection, 2026-10-09)

These checks read the connected Supabase project only. No database schema, auth setting, Edge Function, or production data was changed.

- **Critical owner-auth release blocker:** the currently deployed `veqoro-owner-auth` Edge Function (active version 2, gateway JWT verification enabled) still contains a `finalize_login` path that changes a pending challenge to verified and returns owner success without checking an email OTP. The review-branch code instead fails closed with HTTP 503 and removes the unreachable unsafe grant path. That correction is not deployed. Do not treat owner dashboard login as protected by email OTP until the corrected flow is reviewed and a real OTP verification flow is implemented; do not deploy this containment without the required council/release review because it temporarily blocks owner login through that action.
- **Support-AI consent issue confirmed in the deployed version:** the active `support-agent` version currently allows external AI processing unless the preference is explicitly false, while the database column default is true. That is not reliable opt-in. The review branch now requires an explicit true value and defaults the UI/database to off through a review-only migration. Neither code nor migration has been deployed.
- **Leaked-password protection:** Supabase Security Advisor reports `auth_leaked_password_protection` as disabled. This requires a deliberate production Auth-setting change and verification; no setting was changed.
- **Migration drift:** the connected database's migration history includes many migrations (including server-side trading, owner security, council, memory, and Command Center work) that are not present in the repository's tracked `supabase/migrations` folder, which currently contains only three SQL files. Do not author or apply a guessed trading/schema migration until repository migrations are reconciled with the deployed schema.
- **Virtual trading RPC exists in production:** `public.place_virtual_order` delegates to `private.place_virtual_order_core`. Read-only inspection shows the core derives the user from `auth.uid()`, uses the server-side demo-market price, locks the profile row, checks available demo balance/position quantity, and writes position, balance, and transaction updates in one database function call. The public wrapper is executable by authenticated users. This is positive evidence for server authority, but direct exploit/race tests and grant/schema-exposure verification are still required.
- **Public user-data boundaries:** RLS is enabled on the inspected public user tables. Policies constrain profiles, support tickets, user devices, privacy settings, positions, and transactions to the authenticated user's own rows; the profile update grant inspected is limited to `display_name`, not virtual balance or points. This supports the existing boundary but does not replace testing every table/policy.
- **VEQORO schema lint notices:** Supabase reports 42 RLS-enabled `veqoro` tables with no policies. The inspected API-role table grants did not show direct `anon`/`authenticated` table grants for that schema, so this is not proof of an exposed-data vulnerability; it should be reviewed as a deliberate service-role-only design and kept under monitoring.
- **Deployed gateway checks:** the live Supabase function inventory reports JWT verification enabled for `support-agent`, `veqoro-control-plane`, `veqoro-owner-approval`, and `veqoro-owner-auth`. The review-branch config now explicitly records JWT verification for all four auth-required functions. Owner-auth gateway verification matches the deployed configuration; its OTP logic remains a separate release blocker.
- **Designated-owner and MFA boundaries preserved in the review branch:** the control-plane and owner-approval handlers now require the same designated owner ID and `owner` role observed in the deployed functions, and they ask Supabase Auth to verify the MFA assurance level instead of decoding the JWT payload themselves. These changes passed Deno type-checking but have not been deployed or runtime-tested.
