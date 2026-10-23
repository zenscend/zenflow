# Supabase setup

One-time configuration that lives in the Supabase/Google dashboards rather than
in this repo. Do all of it before testing sign-in.

## 1. Google OAuth

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID**
   → Application type **Web application**.
2. Authorised redirect URI — this is Supabase's callback, not ours:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
3. Supabase → **Authentication → Providers → Google** → enable, paste the client
   ID and secret.

## 2. Redirect URLs

Supabase → **Authentication → URL Configuration → Redirect URLs**, add both:

```
http://localhost:3000/auth/callback
https://<prod-domain>/auth/callback
```

These point at `src/app/auth/callback/route.ts`, which exchanges the OAuth code
for a session cookie.

## 3. Email/password

Supabase → **Authentication → Providers → Email**.

Turn **Confirm email** *off* to keep the current behaviour (register → straight
into onboarding). If you leave it on, `POST /api/auth/register` returns
`signedIn: false` and the register page sends the user to `/login?confirm=1`
instead — the inbox copy for that state is not built yet.

## 4. Logos bucket

Supabase → **Storage → New bucket**:

- Name: `logos` (hardcoded as `LOGOS_BUCKET` in `src/lib/storage.ts`)
- **Public** — quote/invoice PDFs are rendered server-side and fetch the logo
  over plain HTTPS, and `next.config.ts` only whitelists
  `*.supabase.co/storage/v1/object/public/**` for images.
- Allowed MIME types `image/png`, `image/jpeg`; size limit 2MB — same rules the
  upload route enforces.

**If the bucket already exists, check it is public.** `getPublicUrl()` builds a
URL whether or not the bucket is public, so a private bucket makes uploads
*appear* to succeed while every read 400s with `{"code":"NoSuchBucket"}` — a
broken preview on `/company` and a logo-less PDF. Verify with:

```bash
set -a && . ./.env && set +a
curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     "$SUPABASE_URL/storage/v1/bucket/logos" | python3 -m json.tool
```

Uploads go through `POST /api/company/logo` with the service-role key, so no
storage RLS policies are needed.

## 5. Existing accounts

Nothing to do. On the first sign-in, `auth()` matches the Supabase user to the
existing `public.user` row **by email** and stamps `auth_user_id` on it, so ids
— and every organisation, quote and invoice hanging off them — stay put.

Users who had a password keep it: `POST /api/auth/signin` verifies the old
bcrypt hash, creates the Supabase user with that same password, then nulls
`password_hash`. Once this returns 0:

```sql
select count(*) from "user" where password_hash is not null;
```

the fallback in `src/app/api/auth/signin/route.ts` and the `password_hash`
column can both go.
