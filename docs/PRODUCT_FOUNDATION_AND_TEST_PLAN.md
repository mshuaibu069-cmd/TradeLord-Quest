# TradeLord Quest — Product Foundation & Current Test Plan

## Locked product decisions
- App: TradeLord Quest.
- Tagline: Learn. Practice. Compete.
- V1 is an educational trading simulator using virtual money only.
- Bottom navigation has exactly six visible areas: Home, Trade, Academy, News, AI Teacher, More.
- Competition, Points & Rewards, Premium, Profile/Account, Help & Complaints, Privacy & Security, and Terms stay inside More.
- The app opens with a brief mandatory "Powered by VEQORO" screen. Do not remove it.
- VEQORO is the current master brand direction; its white V + VEQORO wordmark is the locked logo concept.
- Free/Premium pricing is a separate decision and is not treated as final purchase configuration yet.
- Premium reference pricing currently shown in the prototype is not connected to billing.
- Support complaints are stored server-side and triaged by a server-side support agent.
- Routine support can be handled automatically; security, privacy, billing/refund, deletion, legal/regulatory, and other high-impact cases are escalated for human review.
- Users receive support-status push notifications when the support workflow can deliver them.
- The support agent must never request passwords, API keys, payment secrets, or other credentials.
- Security monitoring is limited to signals needed for account/service protection and abuse investigation; the app should not imply that it secretly watches everything a user does.
- AI API keys and service-role secrets remain server-side and must never be shipped in the mobile app.
- Account deletion is available in-app; the final public release also needs an external deletion resource and a complete public privacy policy.

## Current architecture
Phone app -> Supabase Auth/Database/Edge Functions -> server-side support/AI logic.
The mobile app uses only publishable Supabase configuration.

## Current backend protections
- Profiles and user settings use Row Level Security.
- Server-managed trading fields are protected from direct client manipulation.
- Virtual transactions are server-controlled.
- Support tickets are scoped to the authenticated user.
- Support-agent Edge Function verifies the user's JWT.
- High-impact support cases enter owner_review_queue.
- Push-device registration is stored server-side.
- The Telegram operator is separate from the mobile app and must use restricted permissions.

## Current phone test path
1. Commit/push the current branch.
2. Log into EAS from Codespaces.
3. Run an Android preview build that produces an APK.
4. Open the EAS build artifact on the phone and install it.
5. Test startup, auth, six-item navigation, More menu, demo trading, support complaint submission, privacy controls, deletion request, and Powered by VEQORO.
6. Fix any blocking errors before adding new features.

Expo documents that an Android preview/development build can produce an installable APK, while Play Store production uses an AAB. EAS Update can later deliver compatible JavaScript/style/image changes without rebuilding the native binary.
