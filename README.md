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

## Supabase Admin Dashboard Setup

This project includes a separate KISHIB admin dashboard under `/login` and `/dashboard`.

Add the following to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

The admin dashboard uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only in browser/client code, and `SUPABASE_SERVICE_ROLE_KEY` only in server-side files.
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is used to display report images when the database stores a Cloudinary public id instead of a full image URL.

### Required database schema

Create the `admin_users` and `discount_codes` tables using SQL:

```sql
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'support',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  percentage integer not null,
  plan_type text,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### Evaluation image columns

The reports page reads saved user evaluations from `public.evaluations`.
It displays uploaded Cloudinary images from:

- `image_url`
- `cloudinary_public_id`

If the table does not exist yet, create it in the same shape used by the KISHIB evaluation app:

```sql
create table if not exists public.evaluations (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_name text,
  user_phone text,
  user_country text,
  user_city text,
  user_province text,
  title text,
  locale text,
  item_type text,
  image_url text,
  cloudinary_public_id text,
  analysis_result jsonb,
  created_at timestamptz,
  updated_at timestamptz
);
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
