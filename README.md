# AgrIProperty Manager AI

> Full-stack AI-powered business management platform for **Ghana Real Estate** and **Eswatini Vegetable Farming** (targeting SA & Eswatini markets).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL + Auth) |
| AI | Claude API (claude-sonnet-4-20250514) |
| Notifications | WhatsApp Business API (Twilio) |
| Charts | Recharts |
| State | Zustand |
| Hosting | Vercel (frontend) + Railway (backend) |

---

## Project Structure

```
Project_Biz/
├── frontend/           # React.js + Tailwind frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # All page components
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── RealEstate/
│   │   │   ├── Farm/
│   │   │   ├── Finance/
│   │   │   ├── AI/
│   │   │   ├── Notifications/
│   │   │   └── Settings/
│   │   ├── services/   # API client functions
│   │   └── store/      # Zustand state management
│   └── package.json
├── backend/            # Node.js + Express API
│   ├── src/
│   │   ├── routes/     # All API route handlers
│   │   ├── services/   # Claude AI, Twilio, Currency, Weather
│   │   └── middleware/ # Auth, validation
│   └── package.json
├── database/
│   └── schema.sql      # Complete Supabase schema with RLS
├── .env.example        # Root environment variables template
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)
- An Anthropic API key (Claude)
- Optionally: Twilio account, OpenWeather API key, ExchangeRate API key

### 1. Clone and install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run the entire contents of `database/schema.sql`
3. In **Authentication** → **Providers**, enable Email and optionally Google OAuth
4. Get your project URL, anon key, and service role key from **Settings → API**

### 3. Set up environment variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your values
```

### 4. Run in development

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Visit `http://localhost:5173` → Register → Start managing your businesses!

---

## Modules

### 🏠 Real Estate (Ghana)
- Property management with full CRUD
- Tenant management + automated rent payment schedule generation
- Rent payment tracker with color-coded status (paid/pending/overdue)
- WhatsApp rent reminders sent 5 days before due date
- AI-generated tenancy agreements (Ghana Rent Act compliant)
- Maintenance request tracker with priority levels
- Per-property performance report

### 🌾 Farm (Eswatini → SA & Eswatini Markets)
- Crop lifecycle management (plant → harvest → sell)
- Harvest logging with quality grading (A/B/C/Reject)
- Buyer management (SA and Eswatini buyers)
- Order & invoice management with PDF download
- Farm expense tracker by crop cycle
- Planting calendar with live OpenWeather integration
- SA (JFPM, CTM, DM) + Eswatini (Manzini, Mbabane) market price tracker
- SIZA & GlobalG.A.P certification deadline tracker
- Per-crop profit report

### 💰 Finance Hub
- Combined P&L: Ghana RE + Eswatini Farm in one view
- Revenue breakdown with 6-month bar/line charts
- Expense category breakdown (pie charts)
- 3-month cash flow forecast
- Financial health score (excellent/good/needs attention)
- Live exchange rates (GHS, ZAR, SZL, USD)
- Export to CSV

### 🤖 AI Business Assistant
- Persistent multi-session chat
- Expert in: Ghana real estate, Eswatini/SA agriculture, African business
- Includes business data context (opt-in)
- Generates: tenancy agreements, buyer emails, business reports
- Quick prompts for common use cases
- AI Business Report generator

### 📊 Dashboard
- Welcome banner with date
- 6 KPI cards across both businesses
- 6-month revenue chart (RE + Farm combined)
- Recent activity feed
- Quick action buttons

### 🔔 Notifications
- In-app notification center with read/unread states
- WhatsApp alerts via Twilio (rent, harvest, orders, certifications)
- Daily summary report (opt-in)
- Automated cron jobs (8 AM rent reminders, 7 AM daily summary)

---

## API Endpoints

```
POST   /api/auth/profile          — Get/update user profile
GET    /api/properties            — List properties
POST   /api/properties            — Create property
GET    /api/properties/:id/report — Property performance report
GET    /api/tenants               — List tenants
POST   /api/tenants/:id/generate-agreement — AI tenancy agreement
POST   /api/rent-payments/mark-paid/:id   — Mark payment as paid
POST   /api/rent-payments/send-reminder/:id — Send WhatsApp reminder
GET    /api/crops/:id/profit-report — Crop profit analysis
POST   /api/buyers/:id/generate-email — AI buyer email
GET    /api/orders/:id/invoice    — Invoice data
GET    /api/finance/dashboard     — Full finance dashboard data
GET    /api/finance/summary       — Quick KPI summary
GET    /api/finance/rates         — Live exchange rates
POST   /api/ai/chat               — AI chat endpoint
POST   /api/ai/generate-report    — AI business report
GET    /api/weather               — Eswatini weather
GET    /api/market-prices/summary — SA & Eswatini market price summary
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (backend only) |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `TWILIO_ACCOUNT_SID` | Optional | For WhatsApp notifications |
| `TWILIO_AUTH_TOKEN` | Optional | For WhatsApp notifications |
| `OPENWEATHER_API_KEY` | Optional | Farm weather forecasts |
| `EXCHANGE_RATE_API_KEY` | Optional | Live exchange rates (falls back to static rates) |

---

## Security

- All API keys stored server-side in environment variables
- Supabase Row Level Security (RLS) enabled on all tables
- JWT tokens verified on every backend request
- Rate limiting: 200 req/15min (general), 20 req/min (AI)
- CORS configured for specific allowed origins
- Helmet.js security headers
- Input validation on all POST/PUT endpoints

---

## Currencies

| Currency | Symbol | Usage |
|----------|--------|-------|
| GHS | ₵ | Ghana real estate (rent, property values) |
| SZL | L | Eswatini farm expenses |
| ZAR | R | SA market sales (orders/invoices) |
| USD | $ | Exchange rate reference |

> Note: SZL and ZAR are pegged 1:1. The app handles both.
