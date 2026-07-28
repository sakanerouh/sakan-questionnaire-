alter table anonymous_sessions
  add column if not exists locale text not null default 'en';

alter table questionnaire_responses
  add column if not exists locale text not null default 'en';

alter table reports
  add column if not exists result_locale text not null default 'en',
  add column if not exists localized_content jsonb not null default '{}';

alter table anonymous_sessions
  drop constraint if exists anonymous_sessions_locale_check,
  add constraint anonymous_sessions_locale_check check (locale in ('en', 'fr'));

alter table questionnaire_responses
  drop constraint if exists questionnaire_responses_locale_check,
  add constraint questionnaire_responses_locale_check check (locale in ('en', 'fr'));

alter table reports
  drop constraint if exists reports_result_locale_check,
  add constraint reports_result_locale_check check (result_locale in ('en', 'fr'));
