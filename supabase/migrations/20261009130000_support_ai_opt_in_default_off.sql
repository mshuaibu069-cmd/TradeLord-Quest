-- Privacy-first default: support-ticket text must not be sent to an external AI provider
-- unless the user explicitly enables the setting in the privacy screen.
-- This migration is review-only; reconcile deployed migration history before applying.
alter table public.user_privacy_settings
  alter column support_ai_enabled set default false;

-- Historical rows were created while the default was true and do not prove consent.
-- Reset them to off; each user can explicitly enable the option again.
update public.user_privacy_settings
   set support_ai_enabled = false
 where support_ai_enabled is distinct from false;
