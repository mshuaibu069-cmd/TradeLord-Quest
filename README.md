# TradeLord Quest

**Learn. Practice. Compete.**

TradeLord Quest is an educational trading simulator using virtual money.

## Current foundation

- Expo SDK 57
- Supabase Authentication
- Secure user profiles with Row Level Security
- Virtual balance, points, streak, and Premium foundation
- Authenticated Home dashboard
- Phone-first cloud development setup
- Expo EAS internal Android APK build profile
- Controlled VEQORO support-operations foundation

## Cloud-first workflow

- **GitHub** is the source of truth.
- **GitHub Codespaces** is the primary coding environment.
- **Supabase** handles the database, authentication, and Edge Functions.
- **Expo EAS** handles cloud Android builds.
- **VEQORO support-operations layer** is being built as a controlled operations layer.

## Branches

- `main`: release line
- `foundation/supabase-architecture`: original Supabase foundation
- `cloud/phone-first`: current phone-first cloud setup

## Development

In Codespaces:

`npm install`

Then verify the Expo project:

`npx expo-doctor`

For a phone-installable internal Android build:

`eas build --platform android --profile preview`

The preview profile produces an APK for direct Android installation. Production builds use an AAB for Google Play.

## Security rules

Never put a Supabase secret/service-role key or an OpenAI secret key in the mobile app.

The support-operations layer is intentionally limited at first to observation, reporting, replies, and recommendations. Production changes require human approval.

See [docs/PHONE-FIRST.md](docs/PHONE-FIRST.md) for the phone-first workflow.
