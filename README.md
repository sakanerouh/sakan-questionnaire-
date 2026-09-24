This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Private administration setup

The application includes an invite-only admin portal at `/en/admin` (or `/fr/admin`). Public questionnaire participants remain anonymous and do not receive accounts.

1. Apply `supabase/migrations/202608270001_secure_admin_questionnaire_versions.sql` to the Supabase project before deploying the admin application.
2. Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to local and deployed environment variables. Use the project’s `sb_publishable_...` key; never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
3. In Supabase Authentication URL Configuration, set the production Site URL and allow `https://YOUR_DOMAIN/auth/confirm` plus the local equivalent `http://localhost:3000/auth/confirm`.
4. Create or invite each administrator in Supabase Authentication. Then allowlist the user with the SQL Editor:

```sql
insert into public.admin_users (user_id, email, display_name)
select id, email, 'Administrator'
from auth.users
where lower(email) = lower('ADMIN_EMAIL_HERE')
on conflict (user_id) do update
set email = excluded.email,
    display_name = excluded.display_name,
    active = true,
    updated_at = now();
```

The first versioned-content request seeds the current bundled questionnaire as immutable version 1 and creates a private draft. Unknown emails cannot create an account through the admin login because magic-link requests use `shouldCreateUser: false`.

For local database security checks, run `supabase test db` after the migration. The pgTAP assertions live in `supabase/tests/admin_questionnaire_rls.test.sql`.
