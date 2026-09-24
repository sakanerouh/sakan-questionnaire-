create extension if not exists pgcrypto;

create table if not exists anonymous_sessions (
  id text primary key,
  email text,
  locale text not null default 'en' check (locale in ('en', 'fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references anonymous_sessions(id) on delete cascade,
  answers jsonb not null default '{}',
  locale text not null default 'en' check (locale in ('en', 'fr')),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists archetype_results (
  id text primary key,
  session_id text not null references anonymous_sessions(id) on delete cascade,
  dominant text not null,
  secondary text not null,
  scores jsonb not null,
  distribution jsonb not null,
  key_patterns jsonb not null default '[]',
  shadow_themes jsonb not null default '[]',
  dream_sabotage_themes jsonb not null default '[]',
  protection_themes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references anonymous_sessions(id) on delete cascade,
  stripe_checkout_session_id text,
  status text not null default 'pending',
  amount_total integer,
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  session_id text not null references anonymous_sessions(id) on delete cascade,
  result_id text references archetype_results(id) on delete set null,
  payment_status text not null default 'locked',
  content jsonb not null default '{}',
  content_source text not null default 'template',
  generation_status text not null default 'not_started',
  generated_at timestamptz,
  generation_error text,
  result_locale text not null default 'en' check (result_locale in ('en', 'fr')),
  localized_content jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table reports
  add column if not exists content_source text not null default 'template',
  add column if not exists generation_status text not null default 'not_started',
  add column if not exists generated_at timestamptz,
  add column if not exists generation_error text,
  add column if not exists result_locale text not null default 'en',
  add column if not exists localized_content jsonb not null default '{}';

alter table anonymous_sessions
  add column if not exists locale text not null default 'en';

alter table questionnaire_responses
  add column if not exists locale text not null default 'en';

alter table anonymous_sessions enable row level security;
alter table questionnaire_responses enable row level security;
alter table archetype_results enable row level security;
alter table payments enable row level security;
alter table reports enable row level security;

create index if not exists questionnaire_responses_session_id_idx
  on questionnaire_responses(session_id);

create index if not exists archetype_results_session_id_idx
  on archetype_results(session_id);

create index if not exists payments_session_id_idx
  on payments(session_id);

create index if not exists reports_session_id_idx
  on reports(session_id);

-- Secure admin access and versioned questionnaire content.
-- Keep this section aligned with 202608270001_secure_admin_questionnaire_versions.sql.
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_users_email_key on admin_users (lower(email));

create table if not exists admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_actor_created_idx on admin_audit_log (actor_user_id, created_at desc);
create index if not exists admin_audit_log_created_idx on admin_audit_log (created_at desc, id desc);

create table if not exists questionnaire_versions (
  id uuid primary key default gen_random_uuid(),
  version_number bigint,
  status text not null check (status in ('draft', 'published', 'archived')),
  definition jsonb not null,
  translations jsonb not null,
  change_summary text,
  base_version_id uuid references questionnaire_versions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint questionnaire_versions_number_status_check check (
    (status = 'draft' and version_number is null and published_at is null)
    or (status in ('published', 'archived') and version_number is not null and published_at is not null)
  )
);

create unique index if not exists questionnaire_versions_version_number_key on questionnaire_versions (version_number) where version_number is not null;
create unique index if not exists questionnaire_versions_one_draft_idx on questionnaire_versions ((status)) where status = 'draft';
create unique index if not exists questionnaire_versions_one_published_idx on questionnaire_versions ((status)) where status = 'published';
create index if not exists questionnaire_versions_base_version_id_idx on questionnaire_versions (base_version_id);
create index if not exists questionnaire_versions_status_created_idx on questionnaire_versions (status, created_at desc);

create table if not exists questionnaire_settings (
  singleton boolean primary key default true check (singleton),
  published_version_id uuid references questionnaire_versions(id) on delete restrict,
  updated_at timestamptz not null default now()
);

alter table anonymous_sessions add column if not exists questionnaire_version_id uuid references questionnaire_versions(id) on delete restrict;
alter table questionnaire_responses add column if not exists questionnaire_version_id uuid references questionnaire_versions(id) on delete restrict;
alter table questionnaire_responses add column if not exists current_screen_id text;
alter table reports add column if not exists questionnaire_version_id uuid references questionnaire_versions(id) on delete restrict;

create index if not exists anonymous_sessions_questionnaire_version_id_idx on anonymous_sessions(questionnaire_version_id);
create index if not exists questionnaire_responses_questionnaire_version_id_idx on questionnaire_responses(questionnaire_version_id);
create index if not exists questionnaire_responses_completed_created_idx on questionnaire_responses(completed, created_at desc);
create index if not exists reports_questionnaire_version_id_idx on reports(questionnaire_version_id);
create index if not exists reports_generation_status_created_idx on reports(generation_status, created_at desc);
create index if not exists payments_status_created_idx on payments(status, created_at desc);
create index if not exists anonymous_sessions_locale_created_idx on anonymous_sessions(locale, created_at desc);

alter table admin_users enable row level security;
alter table admin_audit_log enable row level security;
alter table questionnaire_versions enable row level security;
alter table questionnaire_settings enable row level security;

create or replace function protect_questionnaire_version_history()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Published questionnaire versions cannot be deleted.';
    end if;
    return old;
  end if;

  if old.status = 'archived' then
    raise exception 'Archived questionnaire versions are immutable.';
  end if;

  if old.status = 'published' then
    if new.status <> 'archived'
      or (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
      raise exception 'Published questionnaire versions are immutable.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_questionnaire_version_history_trigger on questionnaire_versions;
create trigger protect_questionnaire_version_history_trigger
before update or delete on questionnaire_versions
for each row execute function protect_questionnaire_version_history();

create or replace function publish_questionnaire_draft(
  p_draft_id uuid,
  p_actor uuid,
  p_change_summary text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_published_id uuid;
  next_version bigint;
  draft_record public.questionnaire_versions%rowtype;
begin
  if not exists (
    select 1 from public.admin_users
    where user_id = p_actor and active
  ) then
    raise exception 'Active administrator required.' using errcode = '42501';
  end if;

  select * into draft_record
  from public.questionnaire_versions
  where id = p_draft_id and status = 'draft'
  for update;

  if not found then
    raise exception 'Questionnaire draft not found.' using errcode = 'P0002';
  end if;

  select published_version_id into current_published_id
  from public.questionnaire_settings
  where singleton = true
  for update;

  if not found then
    raise exception 'Questionnaire settings are not initialized.' using errcode = 'P0002';
  end if;

  select coalesce(max(version_number), 0) + 1 into next_version
  from public.questionnaire_versions;

  if current_published_id is not null then
    update public.questionnaire_versions
    set status = 'archived'
    where id = current_published_id and status = 'published';
  end if;

  update public.questionnaire_versions
  set status = 'published',
      version_number = next_version,
      change_summary = nullif(trim(p_change_summary), ''),
      updated_by = p_actor,
      updated_at = now(),
      published_at = now()
  where id = p_draft_id;

  update public.questionnaire_settings
  set published_version_id = p_draft_id,
      updated_at = now()
  where singleton = true;

  insert into public.questionnaire_versions (
    status, definition, translations, base_version_id, created_by, updated_by
  ) values (
    'draft', draft_record.definition, draft_record.translations, p_draft_id, p_actor, p_actor
  );

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    p_actor,
    'questionnaire.publish',
    'questionnaire_version',
    p_draft_id::text,
    jsonb_build_object('version_number', next_version, 'change_summary', p_change_summary)
  );

  return p_draft_id;
end;
$$;

create or replace function admin_operations_metrics(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_locale text default null
)
returns table (
  starts bigint,
  completions bigint,
  paid bigint,
  revenue bigint,
  currency text,
  report_failures bigint,
  english bigint,
  french bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with filtered_sessions as (
    select s.id, s.locale
    from public.anonymous_sessions s
    where (p_from is null or s.created_at >= p_from)
      and (p_to is null or s.created_at <= p_to)
      and (p_locale is null or s.locale = p_locale)
  ), latest_response as (
    select distinct on (r.session_id) r.session_id, r.completed
    from public.questionnaire_responses r
    join filtered_sessions s on s.id = r.session_id
    order by r.session_id, r.created_at desc
  ), latest_payment as (
    select distinct on (p.session_id)
      p.session_id, p.status, p.amount_total, p.currency
    from public.payments p
    join filtered_sessions s on s.id = p.session_id
    order by p.session_id, p.created_at desc
  ), latest_report as (
    select distinct on (r.session_id) r.session_id, r.generation_status
    from public.reports r
    join filtered_sessions s on s.id = r.session_id
    order by r.session_id, r.created_at desc
  )
  select
    count(*)::bigint,
    count(*) filter (where coalesce(response.completed, false))::bigint,
    count(*) filter (where payment.status = 'paid')::bigint,
    coalesce(sum(payment.amount_total) filter (where payment.status = 'paid'), 0)::bigint,
    coalesce(max(payment.currency) filter (where payment.status = 'paid'), 'eur'),
    count(*) filter (where report.generation_status = 'failed')::bigint,
    count(*) filter (where session.locale = 'en')::bigint,
    count(*) filter (where session.locale = 'fr')::bigint
  from filtered_sessions session
  left join latest_response response on response.session_id = session.id
  left join latest_payment payment on payment.session_id = session.id
  left join latest_report report on report.session_id = session.id;
$$;

revoke all on table admin_users, admin_audit_log, questionnaire_versions, questionnaire_settings from public, anon, authenticated;
revoke all on sequence admin_audit_log_id_seq from public, anon, authenticated;
revoke execute on function protect_questionnaire_version_history() from public, anon, authenticated;
revoke execute on function publish_questionnaire_draft(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function admin_operations_metrics(timestamptz, timestamptz, text) from public, anon, authenticated;

grant select, insert, update, delete on table admin_users, admin_audit_log, questionnaire_versions, questionnaire_settings to service_role;
grant usage, select on sequence admin_audit_log_id_seq to service_role;
grant execute on function publish_questionnaire_draft(uuid, uuid, text) to service_role;
grant execute on function admin_operations_metrics(timestamptz, timestamptz, text) to service_role;
