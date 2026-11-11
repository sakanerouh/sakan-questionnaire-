import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

// Requires a disposable local PostgreSQL server. Never points at a hosted DB.
const connection = new URL(process.env.AUDIT_TEST_DATABASE_URL || "postgresql://postgres@127.0.0.1:55449/postgres");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(connection.hostname), "Only a disposable loopback database is allowed");
const database = `sakan_audit_${randomUUID().replaceAll("-", "")}`;
const control = connection.toString();
connection.pathname = `/${database}`;
const run = (query, url = connection.toString()) => execFileSync("psql", [url, "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1"], {
  input: query, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
}).trim();
const service = (query) => run(`set role service_role; ${query}`);
const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;
const fails = (query, expected) => {
  try { run(query); assert.fail("Expected query to fail"); }
  catch (error) { assert.match(String(error.stderr || error.message), expected); }
};
let count = 0;
const check = (name, fn) => { fn(); count++; console.log(`PASS ${name}`); };
const actor = "00000000-0000-4000-8000-000000000001";
const outsider = "00000000-0000-4000-8000-000000000002";
const hash = "a".repeat(64);
const resumeHash = "b".repeat(64);
const browserHash = "c".repeat(64);
const result = { id: "prepaid-result", dominant: "anticipator", secondary: "harmonizer", scores: {}, distribution: {}, keyPatterns: [], shadowThemes: [], dreamSabotageThemes: [], protectionThemes: [] };

try {
  run(`create database ${database};`, control);
  run(`do $$ begin
    if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
    if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
  end $$;
  create schema auth; create table auth.users(id uuid primary key);
  grant usage on schema public, auth to service_role;
  alter default privileges in schema public grant all on tables to service_role;
  alter default privileges in schema public grant all on sequences to service_role;
  `);
  const schema = readFileSync("supabase/schema.sql", "utf8").split("-- Audit prepayment; aligned")[0];
  run(schema);
  run(`insert into anonymous_sessions(id) values('legacy');
    insert into archetype_results(id,session_id,dominant,secondary,scores,distribution) values('legacy-report','legacy','anticipator','harmonizer','{}','{}');
    insert into reports(id,session_id,result_id) values('legacy-report','legacy','legacy-report');
    insert into payments(session_id,stripe_checkout_session_id,status) values('legacy','cs_legacy','checkout_created');
    insert into auth.users(id) values('${actor}'),('${outsider}');
    insert into admin_users(user_id,email) values('${actor}','admin@example.com');`);
  run(readFileSync("supabase/migrations/20261111105858_audit_prepayment.sql", "utf8"));

  check("migration preserves pre-existing audit flow", () => assert.equal(run("select payment_flow from anonymous_sessions where id='legacy'"), "post_audit"));
  check("new sessions default to prepaid", () => {
    run("insert into anonymous_sessions(id) values('default-new')");
    assert.equal(run("select payment_flow from anonymous_sessions where id='default-new'"), "pre_audit");
  });
  check("access tokens have RLS and no public read privilege", () => {
    assert.equal(run("select relrowsecurity from pg_class where oid='audit_access_tokens'::regclass"), "t");
    assert.equal(run("select has_table_privilege('anon','audit_access_tokens','select') or has_table_privilege('authenticated','audit_access_tokens','select')"), "f");
  });
  for (const role of ["anon", "authenticated"]) {
    check(`${role} cannot issue credentials, grant payment or approve transfers`, () => {
      const privileges = run(`select bool_or(has_function_privilege('${role}',p.oid,'execute')) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'audit_%'`);
      assert.equal(privileges, "f");
    });
  }
  check("service role creates session and hashed browser credential atomically", () => {
    service(`select audit_create_session('prepaid','ar','${hash}');`);
    assert.equal(service("select count(*) from audit_access_tokens where session_id='prepaid' and purpose='browser' and expires_at>now()+interval '179 days'"), "1");
  });
  const prepare = (session, method = "card", report = null) => JSON.parse(service(`select audit_prepare_payment('${session}','${method}','client@example.com',${report ? literal(report) : "null"},${method === "card" ? "'price_audit'" : "null"});`));
  let card;
  check("duplicate checkout preparation reuses a payment ID", () => { card = prepare("prepaid"); assert.equal(prepare("prepaid").id, card.id); });
  check("an older pending checkout is reconciled before preparing another charge", () => {
    service(`update payments set created_at=now()-interval '2 days' where id='${card.id}'`);
    assert.equal(prepare("prepaid").id, card.id);
  });
  check("new audit cannot masquerade as a legacy report purchase", () => fails("set role service_role; select audit_prepare_payment('prepaid','card','client@example.com','legacy-report','price_audit')", /Invalid report/));
  check("unpaid audits cannot commit results", () => fails(`set role service_role; select audit_save_completion('prepaid','{}','ar',null,null,${literal(JSON.stringify(result))},false)`, /Payment required/));
  const fulfill = (id, session, checkout, report, grants, status = "paid", amount = 1100) => service(`select audit_fulfill_card(${id ? literal(id) : "null"},'${session}','${checkout}',${report ? literal(report) : "null"},'${status}',${grants},${amount},'eur')`);
  check("paid checkout grants access before any report exists", () => {
    fulfill(card.id, "prepaid", "cs_prepaid", null, true);
    assert.equal(service("select grants_access from payments where stripe_checkout_session_id='cs_prepaid'"), "t");
    assert.equal(service("select count(*) from reports where session_id='prepaid'"), "0");
  });
  check("duplicate and out-of-order webhook calls never revoke access", () => {
    fulfill(card.id, "prepaid", "cs_prepaid", null, true);
    fulfill(card.id, "prepaid", "cs_prepaid", null, false, "unpaid");
    assert.equal(service("select status||':'||grants_access from payments where stripe_checkout_session_id='cs_prepaid'"), "paid:true");
  });
  check("paid session cannot prepare a second charge", () => assert.equal(prepare("prepaid").id, card.id));
  check("fulfillment rejects mismatched session or checkout", () => {
    fails(`set role service_role; select audit_fulfill_card('${card.id}','default-new','cs_foreign',null,'paid',true,1100,'eur')`, /Payment mismatch/);
    fails(`set role service_role; select audit_fulfill_card('${card.id}','prepaid','cs_other',null,'paid',true,1100,'eur')`, /Payment mismatch/);
  });
  const complete = (value = result) => JSON.parse(service(`select audit_save_completion('prepaid','{"why-now":"A saved answer"}','ar',null,'why-now',${literal(JSON.stringify(value))},false)`));
  check("completion creates the included paid report", () => { complete(); assert.equal(service("select payment_status from reports where id='prepaid-result'"), "paid"); });
  check("completion retries preserve result, payment and generated content", () => {
    service("update reports set content='{\"saved\":true}',generation_status='ready' where id='prepaid-result'");
    assert.equal(complete({ ...result, id: "duplicate-result" }).id, "prepaid-result");
    assert.equal(service("select payment_status||':'||generation_status||':'||(content->>'saved') from reports where id='prepaid-result'"), "paid:ready:true");
    assert.equal(service("select count(*) from reports where session_id='prepaid'"), "1");
  });
  check("late autosaves cannot overwrite completed answers or progress", () => {
    service("select audit_save_progress('prepaid','{\"why-now\":\"stale autosave\"}','ar',null,'orientation')");
    assert.equal(service("select completed::text||':'||(answers->>'why-now')||':'||current_screen_id from questionnaire_responses where session_id='prepaid'"), "true:A saved answer:why-now");
  });
  check("legacy checkout still unlocks its report", () => {
    fulfill(null, "legacy", "cs_legacy", "legacy-report", true);
    assert.equal(service("select payment_status from reports where id='legacy-report'"), "paid");
  });
  check("100 percent discount grants persist independently of latest attempt", () => {
    service("select audit_create_session('discount','en','" + "d".repeat(64) + "')");
    const payment = prepare("discount"); fulfill(payment.id,"discount","cs_discount",null,true,"no_payment_required",0);
    assert.equal(service("select grants_access from payments where session_id='discount'"), "t");
  });
  service("select audit_create_session('bank','en','" + "e".repeat(64) + "')");
  let bank;
  check("bank requests reuse a pending reference", () => { bank = prepare("bank", "bank_transfer"); assert.equal(prepare("bank", "bank_transfer").id, bank.id); });
  check("non-admin cannot approve even through the service-only function", () => fails(`set role service_role; select audit_approve_transfer('${bank.id}','${outsider}',12000,'mad','BANK-1')`, /Unauthorized/));
  check("unpaid access links cannot be issued", () => fails(`set role service_role; select audit_issue_resume('bank','${actor}','${resumeHash}')`, /Payment is not approved/));
  check("approval records received money and administrator with an audit log", () => {
    service(`select audit_approve_transfer('${bank.id}','${actor}',12000,'mad','BANK-1')`);
    assert.equal(service(`select status||':'||amount_total||':'||currency||':'||approved_by from payments where id='${bank.id}'`), `paid:12000:mad:${actor}`);
    assert.equal(service("select count(*) from admin_audit_log where action='audit_transfer_approved'"), "1");
  });
  check("approval retries do not overwrite received money or duplicate logs", () => {
    service(`select audit_approve_transfer('${bank.id}','${actor}',9999,'eur','OTHER')`);
    assert.equal(service(`select amount_total from payments where id='${bank.id}'`), "12000");
    assert.equal(service("select count(*) from admin_audit_log where action='audit_transfer_approved'"), "1");
  });
  check("approval issues an audited seven-day link", () => {
    service(`select audit_issue_resume('bank','${actor}','${resumeHash}')`);
    assert.equal(service("select count(*) from audit_access_tokens where purpose='resume' and expires_at>now()+interval '6 days'"), "1");
    assert.equal(service("select count(*) from admin_audit_log where action='audit_access_link_issued'"), "1");
  });
  check("link redemption binds a new browser to the same audit", () => assert.equal(service(`select audit_redeem_resume('${resumeHash}','${browserHash}')`), "bank"));
  check("access links cannot be used twice", () => fails(`set role service_role; select audit_redeem_resume('${resumeHash}','${"f".repeat(64)}')`, /expired or already used/));
  check("regenerating a link invalidates the older unused link", () => {
    service(`select audit_issue_resume('bank','${actor}','${"1".repeat(64)}'); select audit_issue_resume('bank','${actor}','${"2".repeat(64)}')`);
    fails(`set role service_role; select audit_redeem_resume('${"1".repeat(64)}','${"3".repeat(64)}')`, /expired or already used/);
  });
  check("expired links cannot grant credentials", () => {
    service(`update audit_access_tokens set expires_at=now()-interval '1 second' where token_hash='${"2".repeat(64)}'`);
    fails(`set role service_role; select audit_redeem_resume('${"2".repeat(64)}','${"3".repeat(64)}')`, /expired or already used/);
  });
  check("operations count discounted purchases and keep mixed currencies separate", () => {
    const metrics = JSON.parse(service("select row_to_json(m) from admin_operations_metrics() m"));
    assert.equal(metrics.currency, "mixed"); assert.equal(metrics.revenue, 0); assert.equal(metrics.paid, 4);
  });
  check("a pending retry never hides a paid audit in operations", () => {
    service("insert into payments(session_id,status,method) values('prepaid','pending','bank_transfer')");
    assert.equal(service("select paid from admin_operations_metrics(null,null,'ar')"), "1");
  });
  check("schema snapshot can be reapplied without resetting audit modes or report access", () => {
    run(readFileSync("supabase/schema.sql", "utf8"));
    assert.equal(run("select payment_flow from anonymous_sessions where id='legacy'"), "post_audit");
    assert.equal(run("select payment_flow from anonymous_sessions where id='prepaid'"), "pre_audit");
    assert.equal(run("select payment_status||':'||generation_status from reports where id='prepaid-result'"), "paid:ready");
  });
  console.log(`Database checks passed: ${count}`);
} finally {
  run(`drop database if exists ${database} with (force);`, control);
}
