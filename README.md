# LaganiSanjal

A platform that connects Nepali entrepreneurs and small businesses seeking funding with
investors looking for opportunities. Built as a static site (HTML + CSS + vanilla JavaScript)
backed by [Supabase](https://supabase.com) for the database, authentication and image storage.
Designed to be hosted for free on GitHub Pages.

## What it does

- **Businesses / startups** register their idea, business plan, future plan, funding need (in NRs)
  and up to 8 product sample photos.
- **Investors** register their preferences: industries, business stage, investment amount range and region.
- Every submission is **reviewed by an admin** before it appears publicly.
- **Members log in** to view their submissions, see the status (pending / approved / rejected),
  edit and resubmit. Editing an approved listing sends it back to pending for re-approval.
- **Admin panel** to approve, reject, remove, edit and delete listings, plus platform metrics
  (totals, pending count, page views, funding sought, breakdown by industry, recent activity).
- Contact details are **never shown publicly** — only the admin can see them.

## Project structure

```
index.html        Home
how.html          How it works
about.html        About (mentions the service is currently free)
browse.html       Public listings (businesses + investors) with filters
listing.html      Single listing detail
register.html     Business / investor registration + edit
login.html        Log in / sign up
dashboard.html    Member dashboard (own submissions)
admin.html        Admin panel + metrics
css/style.css     Single stylesheet (blue/white theme)
js/config.js      Supabase URL + anon key + limits
js/main.js        Shared nav, footer, helpers, auth, page-view tracking
js/register.js    Registration / edit logic + image upload
js/admin.js       Admin metrics + management
supabase/schema.sql   Database schema, security rules, storage (run once)
```

## One-time setup

### 1. Create the database
In the Supabase dashboard: **SQL Editor → New query**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql) and run it. This creates all tables, security
policies, triggers, the public views and the image storage bucket.

### 2. Connect your project
`js/config.js` already contains your project URL and the public **anon** key. (The anon key is
safe to expose — access is controlled by Supabase Row Level Security.)

### 3. Make yourself the admin
1. Open the live site and **create an account** (Register → log in) with your email.
2. In Supabase **SQL Editor**, run (replace the email with yours):

   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Reload `admin.html` — you now have full access.

### 4. (Optional) Email confirmation
By default Supabase may require email confirmation on sign-up. To let users log in immediately,
turn it off under **Authentication → Providers → Email → Confirm email**.

## Local preview
It is a static site — open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy on GitHub Pages
1. Push this folder to your GitHub repository.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   choose `main` and `/ (root)`, then save.
3. Your site goes live at `https://<username>.github.io/<repo>/`.

The `.nojekyll` file is included so GitHub Pages serves all files as-is.

## Notes
- Registering and listing is currently free for both businesses and investors. This is stated
  once on the About page and is easy to change later.
- Never put your Supabase **service_role** (secret) key in this project — only the anon key.
