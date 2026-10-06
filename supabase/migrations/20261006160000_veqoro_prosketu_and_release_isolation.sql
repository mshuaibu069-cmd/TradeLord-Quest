create table if not exists veqoro.release_controls (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references veqoro.products(id),
  environment text not null check (environment in ('development','staging','production')),
  release_key text not null,
  status text not null default 'draft' check (status in ('draft','testing','canary','active','paused','rolled_back','completed')),
  user_visibility text not null default 'isolated' check (user_visibility in ('isolated','degraded','maintenance')),
  health_gate jsonb not null default '{}'::jsonb,
  rollback_plan jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table veqoro.release_controls enable row level security;
revoke all on veqoro.release_controls from anon, authenticated;
grant usage on schema veqoro to service_role;
grant all on veqoro.release_controls to service_role;
create index if not exists release_controls_product_env_idx on veqoro.release_controls(product_id, environment, status);

insert into veqoro.agents (
  agent_key,name,role,status,permission_level,max_data_classification,version,purpose,constraints
)
select
  'prosketu','Prosketu Agent','legal-compliance-monitoring','planned','analyze','confidential','0.1.0',
  'Continuously monitor public internet sources for app and website enforcement, blocking, takedowns, regulatory actions, policy violations, security incidents, and recurring causes; identify whether VEQORO products may face similar risk and send evidence-based findings to the AI Council for review.',
  jsonb_build_object(
    'must_use_public_sources', true,
    'must_record_source_urls', true,
    'must_distinguish_fact_from_inference', true,
    'must_not_present_as_lawyer', true,
    'must_escalate_high_risk_to_council', true,
    'must_not_change_production_directly', true,
    'must_not_contact_authorities_or_third_parties_without_owner_approval', true,
    'must_not_delete_or_disable_user_data_or_accounts', true
  )
where not exists (select 1 from veqoro.agents where agent_key='prosketu');

insert into veqoro.decisions (
  decision_key,title,decision_text,reason,status,owner_approved,owner_approved_at,version,affected_systems
)
select
  'prosketu-compliance-monitoring',
  'Prosketu Agent monitors external enforcement and escalates risk to the AI Council',
  'Prosketu Agent may research public web sources for app and website blocking, takedowns, regulatory enforcement, policy violations, security incidents, and corrective actions. It must preserve source evidence, distinguish verified facts from inference, identify possible impact to VEQORO products, and escalate material findings to the AI Council. It has no direct production-change authority.',
  'Early detection can reduce avoidable legal, platform-policy, security, privacy, and business risk.',
  'locked',true,now(),1,
  array['veqoro-command-center','prosketu','ai-council','tradelord-quest']
where not exists (select 1 from veqoro.decisions where decision_key='prosketu-compliance-monitoring');

insert into veqoro.decisions (
  decision_key,title,decision_text,reason,status,owner_approved,owner_approved_at,version,affected_systems
)
select
  'isolated-production-releases',
  'Production changes are isolated from end users until health gates pass',
  'Server changes should use backward-compatible migrations, staged testing/canary controls where available, health checks, feature flags, and rollback plans so users are not unnecessarily exposed to deployment work or partial failures. User-visible maintenance is reserved for unavoidable outages.',
  'Reducing blast radius is safer than exposing every deployment directly to production users.',
  'locked',true,now(),1,
  array['veqoro-command-center','tradelord-quest','supabase','expo-eas'];