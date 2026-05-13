create extension if not exists pgcrypto;

create table if not exists anonymous_sessions (
  id text primary key,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references anonymous_sessions(id) on delete cascade,
  answers jsonb not null default '{}',
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
