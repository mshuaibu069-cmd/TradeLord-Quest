# VEQORO Command Center

Owner-only web control surface for VEQORO.

## Security
- Supabase Auth handles the owner password.
- The browser contains only the publishable key.
- Service-role and AI keys remain server-side in the `veqoro-command-center` Edge Function.
- Protected work is bounded by VEQORO permissions and is not unrestricted execution.
- High/critical production changes remain subject to the existing Council + owner approval architecture.

## Current capabilities
- Owner login
- Agent status dashboard
- Direct bounded agent tasks
- Activity and Council/change visibility
- Risk visibility
- Business metrics when verified data is connected
- Task history
