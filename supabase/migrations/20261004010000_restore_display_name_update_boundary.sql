-- Restore only the profile field the mobile app is allowed to edit.
-- The profiles RLS policy still restricts UPDATE to the signed-in user's own row.
grant update (display_name) on table public.profiles to authenticated;
