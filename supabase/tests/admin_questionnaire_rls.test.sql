begin;

select plan(17);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.admin_users'::regclass),
  'admin_users has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.admin_audit_log'::regclass),
  'admin_audit_log has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.questionnaire_versions'::regclass),
  'questionnaire_versions has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.questionnaire_settings'::regclass),
  'questionnaire_settings has RLS enabled'
);

select ok(not has_table_privilege('anon', 'public.admin_users', 'select'), 'anon cannot select admin users');
select ok(not has_table_privilege('authenticated', 'public.admin_users', 'select'), 'authenticated cannot select admin users');
select ok(not has_table_privilege('anon', 'public.questionnaire_versions', 'select'), 'anon cannot select questionnaire versions');
select ok(not has_table_privilege('authenticated', 'public.questionnaire_versions', 'update'), 'authenticated cannot update questionnaire versions');
select ok(not has_table_privilege('anon', 'public.admin_audit_log', 'select'), 'anon cannot select audit records');
select ok(not has_table_privilege('authenticated', 'public.admin_audit_log', 'select'), 'authenticated cannot select audit records');
select ok(not has_table_privilege('anon', 'public.questionnaire_settings', 'select'), 'anon cannot select questionnaire settings');
select ok(not has_table_privilege('authenticated', 'public.questionnaire_settings', 'update'), 'authenticated cannot update questionnaire settings');
select ok(not has_function_privilege('anon', 'public.publish_questionnaire_draft(uuid,uuid,text)', 'execute'), 'anon cannot publish questionnaire drafts');
select ok(not has_function_privilege('authenticated', 'public.publish_questionnaire_draft(uuid,uuid,text)', 'execute'), 'authenticated cannot publish questionnaire drafts');
select ok(not has_function_privilege('anon', 'public.admin_operations_metrics(timestamptz,timestamptz,text)', 'execute'), 'anon cannot read admin metrics');
select ok(not has_function_privilege('authenticated', 'public.admin_operations_metrics(timestamptz,timestamptz,text)', 'execute'), 'authenticated cannot read admin metrics');
select ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.questionnaire_versions'::regclass
      and tgname = 'protect_questionnaire_version_history_trigger'
      and not tgisinternal
  ),
  'published questionnaire history has an immutability trigger'
);

select * from finish();
rollback;
