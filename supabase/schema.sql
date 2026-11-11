create extension if not exists pgcrypto;

create table if not exists anonymous_sessions (
  id text primary key,
  email text,
  locale text not null default 'en' check (locale in ('en', 'fr', 'ar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references anonymous_sessions(id) on delete cascade,
  answers jsonb not null default '{}',
  locale text not null default 'en' check (locale in ('en', 'fr', 'ar')),
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
  result_locale text not null default 'en' check (result_locale in ('en', 'fr', 'ar')),
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
  french bigint,
  arabic bigint
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
    count(*) filter (where session.locale = 'fr')::bigint,
    count(*) filter (where session.locale = 'ar')::bigint
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

-- Audit prepayment; aligned with 20261111105858_audit_prepayment.sql.
-- Deploy before the application. Existing sessions keep finish-then-pay behavior.
begin;

alter table public.anonymous_sessions add column if not exists payment_flow text not null default 'post_audit'
  check (payment_flow in ('pre_audit', 'post_audit'));
alter table public.anonymous_sessions alter column payment_flow set default 'pre_audit';

alter table public.payments
  add column if not exists method text not null default 'card' check (method in ('card', 'bank_transfer', 'demo')),
  add column if not exists grants_access boolean not null default false,
  add column if not exists report_id text references public.reports(id),
  add column if not exists email text,
  add column if not exists price_id text,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists transfer_reference text;

-- Legacy reports already carry their authorization. No new client can select legacy mode.
update public.payments set grants_access = true where status = 'paid';
create unique index if not exists payments_stripe_checkout_unique on public.payments(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create index if not exists payments_audit_grant_idx on public.payments(session_id) where grants_access;
create unique index if not exists payments_transfer_reference_unique on public.payments(transfer_reference)
  where method = 'bank_transfer' and transfer_reference is not null;

create table if not exists public.audit_access_tokens (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.anonymous_sessions(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  purpose text not null check (purpose in ('browser', 'resume')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists audit_access_tokens_session_idx on public.audit_access_tokens(session_id);
alter table public.audit_access_tokens enable row level security;
revoke all on public.audit_access_tokens from public, anon, authenticated;
grant all on public.audit_access_tokens to service_role;

create or replace function public.audit_create_session(p_session_id text, p_locale text, p_token_hash text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.anonymous_sessions(id, locale, payment_flow) values(p_session_id, p_locale, 'pre_audit');
  insert into public.audit_access_tokens(session_id, token_hash, purpose, expires_at)
    values(p_session_id, p_token_hash, 'browser', now() + interval '180 days');
end;
$$;

-- Serialize payment preparation for a session; Stripe uses this row's ID as its idempotency key.
create or replace function public.audit_prepare_payment(p_session_id text, p_method text, p_email text, p_report_id text, p_price_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare payment public.payments; flow text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_session_id, 1));
  select payment_flow into strict flow from public.anonymous_sessions where id = p_session_id;
  if p_method not in ('card', 'bank_transfer', 'demo') or length(trim(p_email)) = 0 then raise exception 'Invalid payment'; end if;
  if p_report_id is not null and (flow <> 'post_audit' or not exists (
    select 1 from public.reports where id = p_report_id and session_id = p_session_id
  )) then raise exception 'Invalid report'; end if;
  if flow = 'post_audit' and p_report_id is null then raise exception 'Legacy checkout requires a report'; end if;
  update public.anonymous_sessions set email = p_email, updated_at = now() where id = p_session_id;
  if flow = 'pre_audit' then
    select * into payment from public.payments where session_id = p_session_id and grants_access
      and status in ('paid', 'no_payment_required') order by created_at desc limit 1;
    if payment.id is not null then return pg_catalog.to_jsonb(payment); end if;
  end if;
  select * into payment from public.payments where session_id = p_session_id and method = p_method
    and report_id is not distinct from p_report_id and price_id is not distinct from p_price_id
    and email = p_email and status in ('pending', 'checkout_created')
    order by created_at desc limit 1;
  if payment.id is null then
    insert into public.payments(session_id, method, email, report_id, price_id, status)
      values(p_session_id, p_method, p_email, p_report_id, p_price_id, 'pending') returning * into payment;
  end if;
  return pg_catalog.to_jsonb(payment);
end;
$$;

-- Both webhook and verified return use this monotonic, transactionally idempotent function.
create or replace function public.audit_fulfill_card(p_payment_id uuid, p_session_id text, p_checkout_id text,
  p_report_id text, p_status text, p_grants boolean, p_amount integer, p_currency text)
returns void language plpgsql security invoker set search_path = '' as $$
declare payment public.payments; flow text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_session_id, 1));
  select payment_flow into strict flow from public.anonymous_sessions where id = p_session_id;
  select * into payment from public.payments where
    (p_payment_id is not null and id = p_payment_id) or (p_payment_id is null and stripe_checkout_session_id = p_checkout_id)
    for update;
  -- A legacy webhook can beat its old insert. Its signed metadata still must match a legacy report.
  if payment.id is null and p_payment_id is null and flow = 'post_audit' and exists (
    select 1 from public.reports where id = p_report_id and session_id = p_session_id
  ) then
    insert into public.payments(session_id, stripe_checkout_session_id, report_id, status)
      values(p_session_id, p_checkout_id, p_report_id, 'pending') returning * into payment;
  end if;
  if payment.id is null or payment.session_id <> p_session_id or payment.method <> 'card'
    or (payment.stripe_checkout_session_id is not null and payment.stripe_checkout_session_id <> p_checkout_id)
    or (payment.report_id is not null and payment.report_id is distinct from p_report_id)
    or (flow = 'pre_audit' and p_report_id is not null) then raise exception 'Payment mismatch'; end if;
  update public.payments set stripe_checkout_session_id = p_checkout_id,
    status = case when grants_access then status else p_status end,
    grants_access = grants_access or p_grants, amount_total = p_amount, currency = p_currency, updated_at = now()
    where id = payment.id;
  if p_grants then
    update public.reports set payment_status = 'paid', updated_at = now()
      where session_id = p_session_id and (flow = 'pre_audit' or id = p_report_id);
  end if;
end;
$$;

create or replace function public.audit_approve_transfer(p_payment_id uuid, p_actor uuid, p_amount integer, p_currency text, p_reference text)
returns text language plpgsql security invoker set search_path = '' as $$
declare payment public.payments;
begin
  if not exists(select 1 from public.admin_users where user_id = p_actor and active) then raise exception 'Unauthorized'; end if;
  if p_amount <= 0 or p_currency !~ '^[a-z]{3}$' or length(trim(p_reference)) = 0 then raise exception 'Invalid transfer'; end if;
  select * into strict payment from public.payments where id = p_payment_id for update;
  if payment.method <> 'bank_transfer' or payment.status not in ('pending', 'paid') then raise exception 'Invalid transfer request'; end if;
  if payment.grants_access then return payment.session_id; end if;
  update public.payments set status = 'paid', grants_access = true, amount_total = p_amount, currency = p_currency,
    transfer_reference = trim(p_reference), approved_by = p_actor, approved_at = now(), updated_at = now() where id = payment.id;
  update public.reports set payment_status = 'paid', updated_at = now() where session_id = payment.session_id;
  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id, metadata)
    values(p_actor, 'audit_transfer_approved', 'payment', payment.id::text,
      pg_catalog.jsonb_build_object('amount', p_amount, 'currency', p_currency, 'reference', trim(p_reference)));
  return payment.session_id;
end;
$$;

create or replace function public.audit_issue_resume(p_session_id text, p_actor uuid, p_token_hash text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.admin_users where user_id = p_actor and active) then raise exception 'Unauthorized'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_session_id, 1));
  if not exists(select 1 from public.payments where session_id = p_session_id and grants_access and status in ('paid', 'no_payment_required'))
    then raise exception 'Payment is not approved'; end if;
  update public.audit_access_tokens set used_at = now() where session_id = p_session_id and purpose = 'resume' and used_at is null;
  insert into public.audit_access_tokens(session_id, token_hash, purpose, expires_at)
    values(p_session_id, p_token_hash, 'resume', now() + interval '7 days');
  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id)
    values(p_actor, 'audit_access_link_issued', 'anonymous_session', p_session_id);
end;
$$;

create or replace function public.audit_redeem_resume(p_token_hash text, p_browser_hash text)
returns text language plpgsql security invoker set search_path = '' as $$
declare session text;
begin
  update public.audit_access_tokens set used_at = now() where token_hash = p_token_hash and purpose = 'resume'
    and used_at is null and expires_at > now() returning session_id into session;
  if session is null then raise exception 'Link expired or already used'; end if;
  if not exists(select 1 from public.payments where session_id = session and grants_access and status in ('paid', 'no_payment_required'))
    then raise exception 'Payment is not approved'; end if;
  insert into public.audit_access_tokens(session_id, token_hash, purpose, expires_at)
    values(session, p_browser_hash, 'browser', now() + interval '180 days');
  return session;
end;
$$;

revoke all on function public.audit_create_session(text,text,text),
  public.audit_prepare_payment(text,text,text,text,text),
  public.audit_fulfill_card(uuid,text,text,text,text,boolean,integer,text),
  public.audit_approve_transfer(uuid,uuid,integer,text,text),
  public.audit_issue_resume(text,uuid,text), public.audit_redeem_resume(text,text) from public, anon, authenticated;
grant execute on function public.audit_create_session(text,text,text),
  public.audit_prepare_payment(text,text,text,text,text),
  public.audit_fulfill_card(uuid,text,text,text,text,boolean,integer,text),
  public.audit_approve_transfer(uuid,uuid,integer,text,text),
  public.audit_issue_resume(text,uuid,text), public.audit_redeem_resume(text,text) to service_role;

-- Autosaves and completion share a lock. A late autosave cannot overwrite the
-- completed answers or flip a completed response back to incomplete.
create or replace function public.audit_save_progress(p_session_id text, p_answers jsonb, p_locale text, p_version uuid, p_screen text)
returns void language plpgsql security invoker set search_path = '' as $$
declare response public.questionnaire_responses;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_session_id, 1));
  select * into response from public.questionnaire_responses where session_id = p_session_id order by created_at desc limit 1 for update;
  if response.completed then return; end if;
  if response.id is null then
    insert into public.questionnaire_responses(session_id, answers, locale, questionnaire_version_id, current_screen_id)
      values(p_session_id, p_answers, p_locale, p_version, p_screen);
  else
    update public.questionnaire_responses set answers = p_answers, locale = p_locale,
      questionnaire_version_id = p_version, current_screen_id = p_screen, updated_at = now() where id = response.id;
  end if;
end;
$$;
revoke all on function public.audit_save_progress(text,jsonb,text,uuid,text) from public, anon, authenticated;
grant execute on function public.audit_save_progress(text,jsonb,text,uuid,text) to service_role;

-- Serialize completion retries so an existing paid/generated report is never reset.
create or replace function public.audit_save_completion(p_session_id text, p_answers jsonb, p_locale text,
  p_version uuid, p_screen text, p_result jsonb, p_demo boolean default false)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare response public.questionnaire_responses; result public.archetype_results; report_status text; flow text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_session_id, 1));
  select payment_flow into strict flow from public.anonymous_sessions where id = p_session_id;
  select * into response from public.questionnaire_responses where session_id = p_session_id order by created_at desc limit 1 for update;
  if response.completed and response.answers = p_answers then
    select r.* into result from public.archetype_results r join public.reports p on p.result_id = r.id
      where p.session_id = p_session_id order by p.created_at desc limit 1;
    if result.id is not null then return pg_catalog.to_jsonb(result); end if;
  end if;
  if exists(select 1 from public.payments where session_id = p_session_id and grants_access and status in ('paid','no_payment_required')) then
    report_status := 'paid';
  elsif p_demo and exists(select 1 from public.payments where session_id = p_session_id and grants_access and status = 'demo_unlocked') then
    report_status := 'demo_unlocked';
  elsif flow = 'pre_audit' then raise exception 'Payment required';
  else report_status := 'locked'; end if;
  if response.id is null then
    insert into public.questionnaire_responses(session_id, answers, locale, completed, questionnaire_version_id, current_screen_id)
      values(p_session_id, p_answers, p_locale, true, p_version, p_screen);
  else
    update public.questionnaire_responses set answers = p_answers, locale = p_locale, completed = true,
      questionnaire_version_id = p_version, current_screen_id = p_screen, updated_at = now() where id = response.id;
  end if;
  insert into public.archetype_results(id, session_id, dominant, secondary, scores, distribution,
    key_patterns, shadow_themes, dream_sabotage_themes, protection_themes)
  values(p_result->>'id', p_session_id, p_result->>'dominant', p_result->>'secondary', p_result->'scores', p_result->'distribution',
    p_result->'keyPatterns', p_result->'shadowThemes', p_result->'dreamSabotageThemes', p_result->'protectionThemes') returning * into result;
  insert into public.reports(id, session_id, result_id, payment_status, content_source, result_locale, questionnaire_version_id)
    values(result.id, p_session_id, result.id, report_status, 'ai', p_locale, p_version);
  return pg_catalog.to_jsonb(result);
end;
$$;
revoke all on function public.audit_save_completion(text,jsonb,text,uuid,text,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.audit_save_completion(text,jsonb,text,uuid,text,jsonb,boolean) to service_role;

-- A pending retry cannot hide an approved payment. Bank transfers may be in a
-- different currency from card payments; never add EUR and MAD into one total.
create or replace function public.admin_operations_metrics(
  p_from timestamptz default null, p_to timestamptz default null, p_locale text default null
)
returns table(starts bigint, completions bigint, paid bigint, revenue bigint, currency text,
  report_failures bigint, english bigint, french bigint, arabic bigint)
language sql stable security invoker set search_path = '' as $$
  with filtered_sessions as (
    select s.id, s.locale from public.anonymous_sessions s
    where (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at <= p_to)
      and (p_locale is null or s.locale = p_locale)
  ), latest_response as (
    select distinct on (r.session_id) r.session_id, r.completed from public.questionnaire_responses r
    join filtered_sessions s on s.id = r.session_id order by r.session_id, r.created_at desc
  ), latest_payment as (
    select distinct on (p.session_id) p.session_id, p.status, p.amount_total, p.currency from public.payments p
    join filtered_sessions s on s.id = p.session_id order by p.session_id, p.grants_access desc, p.created_at desc
  ), latest_report as (
    select distinct on (r.session_id) r.session_id, r.generation_status from public.reports r
    join filtered_sessions s on s.id = r.session_id order by r.session_id, r.created_at desc
  )
  select count(*)::bigint, count(*) filter (where coalesce(response.completed, false))::bigint,
    count(*) filter (where payment.status in ('paid','no_payment_required'))::bigint,
    case when count(distinct payment.currency) filter (where payment.status in ('paid','no_payment_required')) > 1 then 0
      else coalesce(sum(payment.amount_total) filter (where payment.status in ('paid','no_payment_required')),0)::bigint end,
    case when count(distinct payment.currency) filter (where payment.status in ('paid','no_payment_required')) > 1 then 'mixed'
      else coalesce(max(payment.currency) filter (where payment.status in ('paid','no_payment_required')),'eur') end,
    count(*) filter (where report.generation_status = 'failed')::bigint,
    count(*) filter (where session.locale='en')::bigint, count(*) filter (where session.locale='fr')::bigint,
    count(*) filter (where session.locale='ar')::bigint
  from filtered_sessions session
  left join latest_response response on response.session_id=session.id
  left join latest_payment payment on payment.session_id=session.id
  left join latest_report report on report.session_id=session.id;
$$;

commit;
