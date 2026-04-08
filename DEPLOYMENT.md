# Deployment Guide

## Frontend → Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit — AgrIProperty Manager AI"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New → Project"**
3. Import your GitHub repo
4. Set **Root Directory** to `frontend`
5. Build settings are auto-detected from `vite.config.js`
6. Add environment variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
   - `VITE_API_URL` → your Railway backend URL (e.g. `https://your-app.railway.app/api`)
7. Click **Deploy**

### 3. Configure Vercel rewrites (optional)

Create `frontend/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Backend → Railway

### 1. Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project → Deploy from GitHub repo"**
3. Select your repository
4. Set **Root Directory** to `backend`
5. Railway auto-detects Node.js and runs `npm start`
6. Add environment variables in Railway dashboard:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-20250514
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
OPENWEATHER_API_KEY=...
EXCHANGE_RATE_API_KEY=...
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.vercel.app
PORT=5000
```

7. Railway will provide a URL like `https://your-app.railway.app`
8. Copy this URL and update `VITE_API_URL` in Vercel

---

## Supabase Setup

### 1. Create project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users (London for Ghana/Eswatini)

### 2. Run schema
1. SQL Editor → New Query
2. Paste entire contents of `database/schema.sql`
3. Click Run

### 3. Enable Google OAuth (optional)
1. Authentication → Providers → Google → Enable
2. Add your Google OAuth credentials
3. Add `https://your-project.supabase.co/auth/v1/callback` to Google OAuth redirect URIs

### 4. Configure email templates
1. Authentication → Email Templates
2. Customize the confirmation email with your branding

---

## Twilio WhatsApp Setup

### 1. Create Twilio account
1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token

### 2. Set up WhatsApp Sandbox (for testing)
1. Go to Messaging → Try it out → Send a WhatsApp message
2. Note the sandbox number (usually `+14155238886`)
3. Each user needs to join the sandbox by texting "join [word]" to that number

### 3. Production WhatsApp Business API
For production, you need to:
1. Apply for WhatsApp Business API approval
2. Get a dedicated WhatsApp Business number
3. Update `TWILIO_WHATSAPP_FROM` to your approved number

---

## OpenWeather API

1. Register at [openweathermap.org](https://openweathermap.org)
2. Go to API keys → Generate a key
3. Free tier allows 1,000 calls/day (sufficient for a small farm)
4. Add to backend `.env` as `OPENWEATHER_API_KEY`

---

## Exchange Rate API

1. Register at [exchangerate-api.com](https://www.exchangerate-api.com)
2. Free tier: 1,500 requests/month
3. Add to backend `.env` as `EXCHANGE_RATE_API_KEY`
4. Without this key, the app uses fallback static rates (still functional)

---

## Custom Domain (optional)

### Vercel
1. Go to your Vercel project → Settings → Domains
2. Add your custom domain (e.g. `app.agriproperty.com`)
3. Update DNS with the CNAME/A records Vercel provides

### Update CORS
After setting a custom domain, update `ALLOWED_ORIGINS` in Railway:
```
ALLOWED_ORIGINS=https://app.agriproperty.com,https://your-app.vercel.app
```

---

## Monitoring & Maintenance

### Vercel
- Logs: Vercel Dashboard → Project → Functions tab
- Analytics: Vercel Analytics (free tier available)

### Railway
- Logs: Railway Dashboard → your service → Logs tab
- Metrics: CPU/memory usage visible in Railway dashboard
- Auto-restart: Railway automatically restarts crashed services

### Supabase
- Database: Supabase Dashboard → Table Editor
- Logs: Supabase → Logs → API/Auth/Database logs
- Backups: Supabase automatically backs up daily (Pro plan)

---

## Environment Summary

| Service | Free Tier | Production Recommendation |
|---------|-----------|--------------------------|
| Vercel | ✅ Generous free tier | Pro ($20/mo) for team features |
| Railway | $5 credit/mo free | Starter ($5/mo) |
| Supabase | 500MB DB, 2 projects | Pro ($25/mo) for backups |
| Anthropic | Pay-per-use | Budget ~$20-50/mo for moderate use |
| Twilio | Free trial credit | ~$0.005/message |
| OpenWeather | 1,000 calls/day | Free tier sufficient |
| ExchangeRate | 1,500 calls/mo | Free tier sufficient |
