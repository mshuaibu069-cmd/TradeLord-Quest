# VEQORO Command Center

The independent owner web control surface lives in `command-center/`.

## Hosting

The protected Command Center should be deployed on a normal HTTPS application host such as Vercel, not GitHub Pages. GitHub Pages is static public hosting and is not the right place for a password-protected owner control surface.

## Owner access

The site uses Supabase Auth. Only accounts whose `app_metadata.role` is `owner` or `super_admin` can enter the command dashboard.

The browser contains only the Supabase publishable key. Service-role and AI secrets remain server-side.

## What the owner can see

- all registered agents and their status
- active task count
- Council/change queue
- activity/audit history
- open and critical risks
- verified revenue/cost/profit data when connected
- agent task history

## Direct agent work

The owner can submit bounded research/analysis/recommendation/security/compliance/product/engineering tasks directly to active agents. The task is stored in VEQORO and the result is stored in the Activity Ledger.

High-risk or critical production changes remain governed by the existing Council and owner-approval architecture.

## Email

The notification data layer is ready. Transactional email delivery still requires the owner's email provider connection.