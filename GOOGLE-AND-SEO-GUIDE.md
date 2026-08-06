# ⚡ Tradie — Fix Blank Screen + Get on Google + Maps

---

## PART 1 — Fix the blank screen RIGHT NOW

The blank screen was caused by one missing file: `src/lib/state.jsx`.
It has been created. Here's what to do now:

```
tradie-full/
  src/
    lib/
      state.jsx     ← THIS WAS MISSING, now created ✓
```

### Steps to run it now:

```powershell
# 1. Make sure you're in the RIGHT folder
#    (you may already be there)
cd C:\Projects\tradie-full

# 2. Confirm you're in the right place
dir src    # should show: pages, components, lib, etc.

# 3. Install dependencies (only needed once)
npm install

# 4. Start the app
npm run dev

# 5. Open in browser
# → http://localhost:3000
# → Sign in with any email/password
```

### Still blank? Check the browser console:
1. Press **F12** → click **Console** tab
2. Look for red error messages
3. Most common errors and fixes:

| Error | Fix |
|---|---|
| `Cannot find module './lib/state.jsx'` | You're missing the file — re-download the zip |
| `VITE_CLERK_PUBLISHABLE_KEY` warning | Normal — app runs in demo mode, ignore it |
| `supabase.js: missing env vars` | Normal in demo mode — app still works |
| White screen, no console errors | Hard refresh: Ctrl+Shift+R |
| Port 3000 already in use | Change port in vite.config.js to 3001 |

---

## PART 2 — Deploy to the internet (Vercel)

Vercel is free and takes 3 minutes.

```powershell
# Step 1 — Push code to GitHub
git init
git add .
git commit -m "Initial Tradie app"

# Create a GitHub repo at https://github.com/new
# Then connect it:
git remote add origin https://github.com/YOURUSERNAME/tradie-full.git
git push -u origin main
```

Then:
1. Go to **https://vercel.com** → sign up with your GitHub account
2. Click **"Add New Project"** → import your `tradie-full` repo
3. Framework: **Vite** (auto-detected)
4. Click **Deploy** — done in ~60 seconds
5. You get a free URL like `tradie-full.vercel.app`

### Add environment variables in Vercel:
Go to your project → **Settings → Environment Variables** → add:
```
VITE_SUPABASE_URL          = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY     = eyJ...
VITE_CLERK_PUBLISHABLE_KEY = pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY= pk_live_...
VITE_APP_URL               = https://yourdomain.com
```

### Connect a custom domain:
1. Buy a domain at **Namecheap** (~€10/year) or **Google Domains**
2. Vercel → Settings → Domains → Add domain → follow instructions
3. Takes 10 minutes, then your site is live at `yourdomain.com`

---

## PART 3 — Get found on Google (SEO)

### Step 1 — Update your domain in these files

Find and replace `yourdomain.com` in:
- `index.html` (all og: meta tags and canonical URL)
- `public/robots.txt` (the Sitemap line)
- `public/sitemap.xml` (all `<loc>` URLs)

### Step 2 — Submit to Google Search Console

This is how you tell Google your site exists.

1. Go to **https://search.google.com/search-console**
2. Click **"Add property"** → enter your domain
3. Verify ownership (Vercel makes this easy — use the HTML tag method)
4. In the left menu → **Sitemaps** → enter `sitemap.xml` → Submit
5. Google will start crawling within 24–48 hours

### Step 3 — Submit to Bing (bonus, 5 minutes)

1. Go to **https://www.bing.com/webmasters**
2. Import from Google Search Console — one click, done

### Step 4 — What makes Google rank you

The most important pages for SEO are the **public booking pages**:
`yourdomain.com/b/jakemorrison`

Each one is effectively a landing page for a search like:
- "electrician Brighton book online"
- "electrician near me"

To rank for these, each booking page needs:
- The tradesperson's **name** and **trade** in the title
- Their **city/area** mentioned clearly
- A **description** with relevant keywords
- Their **phone number** visible

These are already in the booking page design — just make sure tradespeople
fill in their profile completely in Settings.

### Step 5 — Google Analytics (see who visits)

1. Go to **https://analytics.google.com** → Create account
2. Add property → get your Measurement ID (looks like `G-XXXXXXXXXX`)
3. Add to `index.html` just before `</head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## PART 4 — Get on Google Maps & navigation platforms

This is for YOUR BUSINESS (Tradie the company), not your customers.
Each tradesperson registers their own business separately.

### Google Maps — Google Business Profile

This shows your business in Maps and in local search results.
It's completely free.

1. Go to **https://business.google.com**
2. Click "Manage now" → "Add your business"
3. Fill in:
   - **Business name:** Tradie
   - **Category:** Software Company (or "Application developer")
   - **Website:** yourdomain.com
   - **Phone:** your contact number
   - **Address:** your address (or mark as service area if remote)
4. Verify by postcard (Google mails a code to your address — 5 days)
5. Once verified, you appear in Google Maps

**For tradesperson users:** Tell them to create their own Google Business Profile
at business.google.com so their plumbing/electrical firm appears on Maps too.
This is separate from the Tradie app.

### Apple Maps — Apple Business Connect

Shows your business on iPhones in Maps and Siri.

1. Go to **https://businessconnect.apple.com**
2. Sign in with Apple ID → Add a place
3. Fill in your business details
4. Verify via phone call or email
5. Takes 1–5 business days to appear

### Bing Maps — Bing Places

1. Go to **https://www.bingplaces.com**
2. Sign in → Add a new business
3. Fill in details → Verify
5. Automatically syncs to Bing search results

### For your USERS — tell tradespeople to list on:

| Platform | URL | Best for |
|---|---|---|
| Google Business Profile | business.google.com | Every tradesperson — #1 priority |
| Checkatrade | checkatrade.com/register | UK — verified reviews |
| TrustATrader | trusttrader.com | UK — leads |
| MyBuilder | mybuilder.com | UK — jobs marketplace |
| Rated People | ratedpeople.com | UK — homeowner leads |
| Bark.com | bark.com | UK/international |
| Pages Jaunes | pagesjaunes.fr | France — critical for Normandy |
| Societe.com | societe.com | France — business credibility |

---

## PART 5 — Local SEO for Normandy (your specific market)

Since you're in Rouen, here's exactly what to do for local presence:

### Directories to list in (all free):

```
1. Google Business Profile  → business.google.com
2. Pages Jaunes             → pagesjaunes.fr/professionnel
3. Kompass                  → fr.kompass.com/registration
4. Societe.com              → societe.com (auto-populated from Infogreffe)
5. 118000.fr                → register as business
6. Annuaire.com             → add business listing
7. Yelp France              → biz.yelp.fr
```

### Local keywords to target:

Write blog posts or landing pages targeting these:
- "logiciel artisan bâtiment Rouen"
- "application devis factures électricien Normandie"
- "gestion chantier artisan Rouen"
- "facturation électricien en ligne"

### CAPEB partnership:
CAPEB Normandie (capeb.fr) is the trade federation.
If you can get listed on their site or partner with them,
Google treats that as a strong local trust signal.

---

## PART 6 — Share your booking pages everywhere

Each tradesperson's booking page (`yourdomain.com/b/jakemorrison`) should go:

```
✅ Instagram bio link
✅ Facebook "About" section → Website field
✅ WhatsApp Business profile → Website
✅ Email signature
✅ Van signage (as QR code)
✅ Business cards
✅ Quotes/estimates header
```

### Generate a QR code for the booking page:
Go to **https://qr-code-generator.com** → paste the booking URL → download PNG.
Print it on business cards and stick it on the van. Free.

---

## Summary — what to do in order

| # | Action | Time | Cost |
|---|---|---|---|
| 1 | Run locally: `npm run dev` | 2 min | Free |
| 2 | Deploy to Vercel | 5 min | Free |
| 3 | Buy domain (Namecheap) | 5 min | ~€10/yr |
| 4 | Add domain to Vercel | 5 min | Free |
| 5 | Submit to Google Search Console | 10 min | Free |
| 6 | Create Google Business Profile | 15 min + 5 days for postcard | Free |
| 7 | Add to Apple Maps & Bing Maps | 10 min | Free |
| 8 | List on Pages Jaunes | 10 min | Free |
| 9 | Add Google Analytics | 10 min | Free |
| 10 | Share booking page link everywhere | 30 min | Free |
