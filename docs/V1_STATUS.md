# TradeLord Quest — V1 Build Status

Updated: 2026-09-30

## Current foundation
- Expo React Native app on the cloud/phone-first branch.
- Supabase email authentication.
- Server-backed profiles.
- Virtual balance, points, streak, and premium date fields.
- RLS for user-owned profile/settings/transaction data.
- Home dashboard.

## Added in this build
- VEQORO powered-by brand screen shown at app launch.
- Secure complaint flow connected to a JWT-protected Supabase support-agent Edge Function.
- Rules-based support triage with optional server-side AI layer; sensitive/high-impact cases create an owner-review queue.
- Privacy settings, account deletion request flow, and support/security disclosures.
- Multi-screen navigation.
- Demo Trading UI.
- Server-held demo market prices.
- Server-side virtual positions.
- Secure place_virtual_order RPC.
- Buy/sell validation against server-held demo balance and positions.
- Trading Academy shell.
- Challenges shell.
- Demo Market News screen.
- Points & Rewards screen.
- Premium reference-pricing screen.
- AI Teacher security shell.
- Account screen.

## Security decisions
- The mobile client cannot directly write virtual positions or virtual transactions.
- Demo orders use the server-held demo price.
- The order RPC is executable by authenticated users only.
- OpenAI API keys must never be shipped in the mobile app.
- Points, Premium, competitions, and other important rewards must be server-validated before release. Profile fields such as virtual balance, points, streak, and premium status are not client-writable; display name is the only profile update exposed to the app.

## Still required before production
- Native push-notification package/credentials and EAS rebuild so support updates can reach users while the app is closed.
- Owner/admin dashboard for reviewing the support-agent queue and making decisions.
1. Saved academy progress and quizzes.
2. Persistent challenge/competition system and leaderboard.
3. Authorized live market-news feed.
4. Secure AI Teacher backend with usage limits.
5. Google Play Billing and subscription verification.
6. AdMob and frequency controls.
7. Admin dashboard, monitoring, audit logs, moderation, and security controls.
8. Privacy policy, terms, account deletion, data-safety setup, and final QA.
9. EAS Android builds and Play Store release work.

## V1 scope
TradeLord Quest remains a virtual-money educational simulator. No deposits, withdrawals, or real-money trading are part of V1.
