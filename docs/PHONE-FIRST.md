# TradeLord Quest — Phone-First Development

This project is designed to be developed primarily from a phone.

## Workflow

1. GitHub is the source of truth.
2. GitHub Codespaces is the cloud coding environment.
3. Supabase Dashboard/MCP handles the backend.
4. Expo EAS builds Android APKs in the cloud.
5. EAS internal distribution provides an install link for the phone.
6. EAS Update can later deliver JavaScript/assets without rebuilding the native app when the change is compatible.

## Branches

- `main`: protected release line.
- `foundation/supabase-architecture`: original Supabase foundation.
- `cloud/phone-first`: phone-first cloud setup and EAS configuration.

## Build profiles

- `preview`: internal Android APK for phone testing.
- `production`: Android App Bundle for Google Play.

## Important security rules

- Never commit Supabase secret/service-role keys.
- Never commit an OpenAI API key.
- Never commit an EAS/Expo token.
- Keep production secrets in the appropriate secret store.
- Keep GitHub as the source of truth for code; do not rely on dashboard-only edits for permanent backend code.

## Current limitation

The first EAS project link and account authentication require a one-time user action in the cloud environment. After that, builds can be run from the phone.
