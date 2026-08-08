# ⚡ Vimen — Fix blank screen + deploy to Google

---

## ── PROBLEM 1: Blank white screen ──────────────────────────────────

The screen was blank because `main.jsx` crashed immediately
when `VITE_CLERK_PUBLISHABLE_KEY` was missing from your `.env.local`.

**This is now fixed.** The app has 3 modes:

| Mode | What you need | What works |
|---|---|---|
| **Demo** | Nothing — just `npm run dev` | Everything, using fake seed data |
| **Auth** | Clerk key in `.env.local` | Real login/signup |
| **Full prod** | All keys in `.env.local` | Real database, payments, email, SMS |

---

## ── STEP 1: Get it running right now ───────────────────────────────

```powershell
# Open PowerShell in the Vimen-full folder
# (the folder that has package.json in it)

npm install
npm run dev
```

Open http://localhost:3000 — you'll see a login screen.
Enter **any email and any password** → you're in. All data is demo data.

---

## ── STEP 2: Add real services one at a time ────────────────────────

Create `.env.local` in the root of `Vimen-full/` (same folder as `package.json`):

```
# Start with this — leave the others empty for now
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_APP_URL=http://localhost:3000
```

Restart the dev server after adding keys:
```powershell
# Stop with Ctrl+C, then:
npm run dev
```

### Get your Clerk key (5 minutes)
1. Go to https://clerk.com → sign up free
2. Create application → choose "Email + Password"
3. Copy the **Publishable key** (starts with `pk_test_`)
4. Paste into `.env.local` as `VITE_CLERK_PUBLISHABLE_KEY`

### Get your Supabase keys (10 minutes)
1. Go to https://supabase.com → new project
2. Wait ~2 min for it to start
3. Go to **SQL Editor** → paste contents of `supabase/migrations/001_schema.sql` → Run
4. Then paste `supabase/migrations/002_marketplace.sql` → Run
5. Go to **Settings → API** → copy URL and anon key

### Get your Stripe key (5 minutes)
1. Go to https://dashboard.stripe.com → sign up
2. Developers → API keys → copy **Publishable key**

---

## ── STEP 3: Deploy to Vercel (free) ────────────────────────────────

Vercel is the easiest host. Your app gets a URL like `https://Vimen.vercel.app`.
This is NOT Google — it's better for web apps.

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy (run from inside Vimen-full/)
vercel

# Answer the prompts:
#  Set up and deploy? → Y
#  Which scope? → your account
#  Link to existing project? → N
#  Project name? → Vimen-app
#  Directory? → ./   (just press Enter)
#  Override build settings? → N
```

You'll get a URL. Share it with anyone.

### Add your env vars to Vercel

After deploying, go to https://vercel.com → your project → **Settings → Environment Variables**
and add each key from your `.env.local`:

```
VITE_CLERK_PUBLISHABLE_KEY    → your Clerk key
VITE_SUPABASE_URL             → your Supabase URL
VITE_SUPABASE_ANON_KEY        → your Supabase anon key
VITE_STRIPE_PUBLISHABLE_KEY   → your Stripe key
VITE_APP_URL                  → https://your-app.vercel.app
```

Then redeploy:
```powershell
vercel --prod
```

---

## ── STEP 4: Add a custom domain ────────────────────────────────────

### Option A — Buy on Vercel (easiest)
Vercel → your project → **Settings → Domains** → Buy domain

### Option B — Use a domain you already own
1. Vercel → Settings → Domains → Add → type your domain
2. Vercel shows you DNS records to add
3. Go to your domain registrar (GoDaddy, Namecheap, etc.)
4. Add the DNS records Vercel shows you
5. Wait 10–30 minutes → your domain points to Vimen

### Option C — Google Domains → Squarespace Domains
Google Domains was acquired by Squarespace.
Go to https://domains.squarespace.com → buy a domain
Then add the Vercel DNS records the same way.

---

## ── How to appear on Google Search ─────────────────────────────────

"Putting your app on Google" = making it searchable. Steps:

1. **Deploy to Vercel** (done above) — you get a public URL
2. **Google Search Console** → https://search.google.com/search-console
   → Add property → paste your Vercel URL → verify ownership
3. **Submit sitemap** → in Search Console → Sitemaps → enter your URL + `/sitemap.xml`
4. Google crawls and indexes your site within a few days

Note: The Vimen web app is a **dashboard** (requires login), so only the
landing page (`index.html` from the website folder) will appear in Google results.
The dashboard behind login won't be indexed — that's correct and expected.

---

## ── Common errors and fixes ─────────────────────────────────────────

| Error | Fix |
|---|---|
| Blank white screen | Open F12 → Console → read the error. Usually a missing `.env.local` key |
| `cd Vimen-full` not found | You're already inside it. Just run `npm run dev` |
| `Cannot find module '@clerk/clerk-react'` | Run `npm install` first |
| `Missing Supabase env vars` | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local` |
| Vercel build fails | Check that all `VITE_` env vars are set in Vercel dashboard |
| App works locally but blank on Vercel | Env vars not set in Vercel → Settings → Environment Variables |

---

## ── Folder structure reminder ───────────────────────────────────────

```
Vimen-full/               ← open THIS folder in VS Code / PowerShell
├── .env.local             ← CREATE THIS (copy from .env.example)
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx           ← FIXED: never crashes now
    ├── App.jsx            ← FIXED: works with or without API keys
    ├── lib/
    │   ├── state.jsx      ← NEW: seed data + reducer for demo mode
    │   ├── db.js          ← all Supabase calls
    │   └── ...
    └── pages/
        ├── DashboardPage.jsx   ← FIXED: dual mode
        ├── JobsPage.jsx
        └── ...
```
