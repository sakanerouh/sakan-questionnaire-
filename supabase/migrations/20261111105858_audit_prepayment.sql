-- Deploy before the application. Existing sessions keep finish-then-pay behavior.
begin;

alter table public.anonymous_sessions add column payment_flow text not null default 'post_audit'
  check (payment_flow in ('pre_audit', 'post_audit'));
alter table public.anonymous_sessions alter column payment_flow set default 'pre_audit';

alter table public.payments
  add column method text not null default 'card' check (method in ('card', 'bank_transfer', 'demo')),
  add column grants_access boolean not null default false,
  add column report_id text references public.reports(id),
  add column email text,
  add column price_id text,
  add column approved_by uuid references auth.users(id) on delete set null,
  add column approved_at timestamptz,
  add column transfer_reference text;

-- Legacy reports already carry their authorization. No new client can select legacy mode.
update public.payments set grants_access = true where status = 'paid';
create unique index payments_stripe_checkout_unique on public.payments(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create index payments_audit_grant_idx on public.payments(session_id) where grants_access;
create unique index payments_transfer_reference_unique on public.payments(transfer_reference)
  where method = 'bank_transfer' and transfer_reference is not null;

create table public.audit_access_tokens (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.anonymous_sessions(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  purpose text not null check (purpose in ('browser', 'resume')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index audit_access_tokens_session_idx on public.audit_access_tokens(session_id);
alter table public.audit_access_tokens enable row level security;
revoke all on public.audit_access_tokens from public, anon, authenticated;
grant all on public.audit_access_tokens to service_role;

create function public.audit_create_session(p_session_id text, p_locale text, p_token_hash text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.anonymous_sessions(id, locale, payment_flow) values(p_session_id, p_locale, 'pre_audit');
  insert into public.audit_access_tokens(session_id, token_hash, purpose, expires_at)
    values(p_session_id, p_token_hash, 'browser', now() + interval '180 days');
end;
$$;

-- Serialize payment preparation for a session; Stripe uses this row's ID as its idempotency key.
create function public.audit_prepare_payment(p_session_id text, p_method text, p_email text, p_report_id text, p_price_id text)
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
create function public.audit_fulfill_card(p_payment_id uuid, p_session_id text, p_checkout_id text,
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

create function public.audit_approve_transfer(p_payment_id uuid, p_actor uuid, p_amount integer, p_currency text, p_reference text)
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

create function public.audit_issue_resume(p_session_id text, p_actor uuid, p_token_hash text)
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

create function public.audit_redeem_resume(p_token_hash text, p_browser_hash text)
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
create function public.audit_save_progress(p_session_id text, p_answers jsonb, p_locale text, p_version uuid, p_screen text)
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
create function public.audit_save_completion(p_session_id text, p_answers jsonb, p_locale text,
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
