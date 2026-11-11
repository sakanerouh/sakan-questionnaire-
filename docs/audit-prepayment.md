# Audit prepayment

New audits use: landing → `/[locale]/questionnaire/checkout` → `/[locale]/questionnaire/payment` → confirmed payment → questionnaire → result summary → included report. Public languages remain English and Arabic. Existing sessions are marked `post_audit` by the migration and retain result-then-payment behavior.

## Deploy database support first

1. Apply `supabase/migrations/20261111105858_audit_prepayment.sql` to the **Sakan Erouh** project. The schema snapshot includes the same changes for fresh installations. Existing sessions are backfilled as legacy; new inserts default to `pre_audit`.
2. Run the verification queries below with a privileged connection. Every new function is `SECURITY INVOKER`, executable only by `service_role`; token rows are protected by RLS and unavailable to `anon` and `authenticated`.
3. Verify the existing environment variables: `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, and the site URL. The configured Stripe Price must be an active one-time, positive-priced product. Production rejects test keys and never enables demo grants.
4. Deploy the application after the migration. The Stripe webhook remains `/api/stripe/webhook`; subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Keep this endpoint and its existing secret in place during deployment so already-open legacy checkouts still complete.
5. Verify a successful card payment, a cancelled/returned checkout, a complete 100% promotion-code purchase, bank approval/resume, and an old report purchase. Verify both the result summary and PDF access. Check delivery of Stripe webhook events and investigate non-2xx responses; successful payment confirmation is independently reconciled on return.

```sql
select payment_flow, count(*) from public.anonymous_sessions group by payment_flow;
select relrowsecurity from pg_class where oid = 'public.audit_access_tokens'::regclass;
select p.proname,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
  has_function_privilege('service_role', p.oid, 'execute') as service_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'audit_%';
```

The migration is additive. If the application must be rolled back, retain the database additions and webhook compatibility. An old application does **not** enforce prepayment; prefer fixing forward or temporarily disabling new checkout entry points rather than treating an old UI rollback as continued enforcement. Never remove payment or token records during rollback.

## Bank-transfer operations

- The public bank option saves a pending request and opens the existing WhatsApp business number with email and payment reference. It does not send a message automatically or include questionnaire answers. Agree the amount in MAD through that conversation; no conversion rate is fabricated.
- Open `/en/admin/payments` or `/ar/admin/payments`. The latest 500 requests are shown. Match the full request reference/email to the client, verify receipt in the bank, enter the actual amount, currency and unique bank reference, and select **Confirm receipt & create access link**.
- Copy the generated link and send it manually in the client's WhatsApp conversation. Approval and link issuance are logged. Opening WhatsApp alone does not unlock the audit. The original payment page checks pending approval every five seconds and offers **Start your audit** once approved.
- Access links are bearer credentials: share them only with the intended client. Their token is placed in the URL fragment, stored only as a hash, expires after seven days, and can be redeemed once. Issuing another link invalidates older unused links. Browser credentials last 180 days, are stored as hashes, and are delivered in an HttpOnly, SameSite=Lax cookie, Secure in production.
- If a paid client loses their browser cookie or changes devices, use **Create new access link** on their paid entry. This also supports card-payment recovery without charging again. Returning through a link restores server-saved answers and the same audit session.
- Email associates payment and audit records. It does not establish marketing permission. No participant account or automatic email/WhatsApp delivery is introduced.

## Behavior and interfaces

- `POST /api/questionnaire/access`: initializes or restores the anonymous session. Missing browser-only sessions receive a server ID while retaining local answers. Existing prepaid IDs cannot acquire new credentials by supplying the ID alone.
- `POST /api/checkout`: accepts `{ sessionId, email, locale, reportId? }`. `reportId` is required for legacy purchases and prohibited for prepaid purchases. Both variants use Stripe-hosted card checkout with promotion codes. Payment preparation and Stripe idempotency prevent repeated identical clicks from creating another checkout.
- `POST /api/checkout/verify`: accepts `{ sessionId, checkoutId }`, verifies ownership, retrieves canonical Stripe data, and calls the same transactional fulfillment function as the signed webhook. URL flags never establish access.
- `POST /api/checkout/transfer`: accepts `{ sessionId, email, locale }` and returns a pending reference plus the prefilled WhatsApp URL.
- `POST /api/admin/payments`: authenticated, same-origin approval or link issuance. Amounts use integer minor units with the actual currency.
- `POST /api/questionnaire/resume`: redeems an access-link token for a browser credential. Expired or consumed tokens return HTTP 410.

Questionnaire definition, autosave, completion and report APIs check the shared access service before work. Completion and autosave share a database lock; a delayed autosave cannot overwrite completed answers. Identical completion retries reuse the saved result/report and preserve generated content. Access checks examine successful grants rather than the latest failed/pending attempt. Operations counts discounted purchases as paid and displays **Multiple currencies** when a combined revenue total would mix currencies; individual payment amounts remain available in Payments and the CSV.

## Local validation

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run test:audit-db` requires `psql` and a disposable PostgreSQL server on `127.0.0.1:55449` (or `AUDIT_TEST_DATABASE_URL` pointing to another loopback server). It creates and removes a separate test database, simulates the Supabase roles, tests upgrading an existing schema, and checks grants, transfers, completion preservation and link redemption. It rejects hosted database URLs. It does not apply migrations to the connected Supabase project.

`ENABLE_DEMO_UNLOCK=true` permits explicit demo access only in development with configured database support when Stripe checkout configuration is missing. Production remains closed when payment/database support is missing. Browser UI checks should use intercepted synthetic payment/analysis responses rather than creating real charges or running paid AI generation.
