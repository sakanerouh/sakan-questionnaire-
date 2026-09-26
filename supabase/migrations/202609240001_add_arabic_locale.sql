alter table public.anonymous_sessions
  drop constraint if exists anonymous_sessions_locale_check,
  add constraint anonymous_sessions_locale_check check (locale in ('en', 'fr', 'ar'));

alter table public.questionnaire_responses
  drop constraint if exists questionnaire_responses_locale_check,
  add constraint questionnaire_responses_locale_check check (locale in ('en', 'fr', 'ar'));

alter table public.reports
  drop constraint if exists reports_result_locale_check,
  add constraint reports_result_locale_check check (result_locale in ('en', 'fr', 'ar'));

drop function if exists public.admin_operations_metrics(timestamptz, timestamptz, text);

create function public.admin_operations_metrics(
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

revoke execute on function public.admin_operations_metrics(timestamptz, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.admin_operations_metrics(timestamptz, timestamptz, text)
  to service_role;
