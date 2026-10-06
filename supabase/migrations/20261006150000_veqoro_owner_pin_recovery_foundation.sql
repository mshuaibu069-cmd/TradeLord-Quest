create table if not exists veqoro.owner_auth_profiles (
  user_id uuid primary key,
  pin_verifier text,
  pin_configured boolean not null default false,
  email_otp_enabled boolean not null default true,
  failed_pin_attempts integer not null default 0 check (failed_pin_attempts >= 0),
  pin_locked_until timestamptz,
  last_pin_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists veqoro.owner_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  challenge_type text not null check (challenge_type in ('pin','email_otp','recovery')),
  status text not null default 'pending' check (status in ('pending','verified','expired','failed','consumed')),
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  consumed_at timestamptz
);

create table if not exists veqoro.owner_recovery_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  method_type text not null check (method_type in ('offline_key','phone')),
  verifier text,
  masked_value text,
  enabled boolean not null default false,
  verified boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, method_type)
);

alter table veqoro.owner_auth_profiles enable row level security;
alter table veqoro.owner_auth_challenges enable row level security;
alter table veqoro.owner_recovery_methods enable row level security;

revoke all on veqoro.owner_auth_profiles from anon, authenticated;
revoke all on veqoro.owner_auth_challenges from anon, authenticated;
revoke all on veqoro.owner_recovery_methods from anon, authenticated;

grant usage on schema veqoro to service_role;
grant all on veqoro.owner_auth_profiles to service_role;
grant all on veqoro.owner_auth_challenges to service_role;
grant all on veqoro.owner_recovery_methods to service_role;

create index if not exists owner_auth_challenges_user_status_idx
  on veqoro.owner_auth_challenges(user_id, status, expires_at);

create index if not exists owner_recovery_methods_user_idx
  on veqoro.owner_recovery_methods(user_id);

create or replace function veqoro.set_owner_pin(p_user_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = veqoro, public
as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{6,12}$' then
    raise exception 'PIN must contain 6 to 12 digits';
  end if;

  update veqoro.owner_auth_profiles
     set pin_verifier = crypt(p_pin, gen_salt('bf', 12)),
         pin_configured = true,
         failed_pin_attempts = 0,
         pin_locked_until = null,
         updated_at = now()
   where user_id = p_user_id;

  if not found then
    raise exception 'Owner authentication profile not found';
  end if;

  return true;
end;
$$;

create or replace function veqoro.verify_owner_pin(p_user_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = veqoro, public
as $$
declare
  v_profile veqoro.owner_auth_profiles%rowtype;
  v_ok boolean := false;
begin
  select * into v_profile
    from veqoro.owner_auth_profiles
   where user_id = p_user_id
   for update;

  if not found or not v_profile.pin_configured or v_profile.pin_verifier is null then
    return false;
  end if;

  if v_profile.pin_locked_until is not null and v_profile.pin_locked_until > now() then
    return false;
  end if;

  if p_pin is not null and p_pin ~ '^[0-9]{6,12}$'
     and crypt(p_pin, v_profile.pin_verifier) = v_profile.pin_verifier then
    update veqoro.owner_auth_profiles
       set failed_pin_attempts = 0,
           pin_locked_until = null,
           last_pin_success_at = now(),
           updated_at = now()
     where user_id = p_user_id;
    v_ok := true;
  else
    update veqoro.owner_auth_profiles
       set failed_pin_attempts = failed_pin_attempts + 1,
           pin_locked_until = case
             when failed_pin_attempts + 1 >= 5 then now() + interval '15 minutes'
             else pin_locked_until
           end,
           updated_at = now()
     where user_id = p_user_id;
  end if;

  return v_ok;
end;
$$;

revoke all on function veqoro.set_owner_pin(uuid,text) from public, anon, authenticated;
revoke all on function veqoro.verify_owner_pin(uuid,text) from public, anon, authenticated;
grant execute on function veqoro.set_owner_pin(uuid,text) to service_role;
grant execute on function veqoro.verify_owner_pin(uuid,text) to service_role;

insert into veqoro.decisions (
  decision_key,title,decision_text,reason,status,owner_approved,owner_approved_at,
  version,affected_systems
)
select
  'owner-login-pin-email-otp',
  'Owner login uses PIN plus email OTP',
  'Normal VEQORO Command Center owner entry requires the owner PIN followed by a one-time code delivered to the verified owner email. The PIN is never stored in plaintext.',
  'Separates the owner dashboard from ordinary product login while retaining a second factor.',
  'locked',
  true,
  now(),
  1,
  array['veqoro-command-center','veqoro-owner-auth']
where not exists (
  select 1 from veqoro.decisions where decision_key='owner-login-pin-email-otp'
);

insert into veqoro.decisions (
  decision_key,title,decision_text,reason,status,owner_approved,owner_approved_at,
  version,affected_systems
)
select
  'owner-recovery-offline-key-phone',
  'Owner recovery uses offline key plus verified recovery phone',
  'Owner recovery uses a high-entropy offline recovery key plus a verified recovery phone/step-up check. Phone alone is never sufficient for owner takeover.',
  'Reduces dependence on email while preventing a phone number from becoming a single point of compromise.',
  'locked',
  true,
  now(),
  1,
  array['veqoro-command-center','veqoro-owner-auth','veqoro-recovery']
where not exists (
  select 1 from veqoro.decisions where decision_key='owner-recovery-offline-key-phone'
);