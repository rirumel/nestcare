# 🏠 NestCare — Smart Property Maintenance Platform

NestCare transforms how tenants report home issues and how landlords manage them — replacing phone calls and paper forms with an intelligent, automated, multilingual platform.

---

## 🧩 The Problem
Tenants have no easy way to report home issues. Landlords miss reports, forget to follow up, and have no data to predict what breaks next.

## 💡 The Solution
A polished web form where tenants submit issues in seconds. The moment they submit, automation kicks in — they get a WhatsApp or email confirmation, the landlord gets alerted, and the data feeds an ML engine that predicts future maintenance needs.

## 📈 The Impact
- Zero friction for tenants — no app, no account needed
- Landlords get instant alerts with full context
- ML forecasts help prevent reactive maintenance
- Dashboard gives property managers actionable insights at a glance

---

## ✨ Mega Features

**🔄 Workflow Automation (n8n)**
Every form submission triggers a fully automated pipeline — personalized WhatsApp or email confirmation to the tenant, plus a detailed notification to the landlord. Zero manual work.

**🤖 ML Forecasting & Analytics**
Anomaly detection (Z-score), next occurrence prediction, trend analysis (linear regression), and seasonal pattern recognition — all computed from real report history.

**🧠 AI Insight Narrator (Claude)**
Every chart has a "What does this mean?" button. Claude explains the data in plain language and reads it aloud via browser text-to-speech. Works in English and German.

**🌍 Full EN/DE Translation**
Every page — form, dashboard, login, AI explanations and voice narration — switches instantly between English and German. Preference saved in localStorage.

**🌗 Dark / Light Theme**
Enterprise-grade theme system built with CSS custom properties. Toggle via moon/sun icon. Preference persisted across sessions with no flash on load.

**📊 Analytics Dashboard**
Password-protected landlord dashboard with KPI cards, 90-day trend chart, issue distribution donut, seasonal radar, weekly pattern bar chart, predictive maintenance forecast cards, and a paginated reports table.

---

## 🔗 Live Demo

| | URL |
|---|---|
| Tenant Form | https://nestcare-five.vercel.app |
| Landlord Dashboard | https://nestcare-five.vercel.app/dashboard |
| Dashboard Password | `nestcare2024` |
| FastAPI Docs | https://nestcare-production.up.railway.app/docs |

> **WhatsApp note:** Uses Twilio sandbox. Send `join fewer-best` to `+1 415 523 8886` on WhatsApp before testing to open a 24-hour session.

---

## 🛠 Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14, TypeScript, CSS Modules |
| Automation | n8n (self-hosted, Hostinger) |
| WhatsApp | Twilio WhatsApp Sandbox |
| Email | Gmail via n8n OAuth2 |
| ML Service | Python, FastAPI, Scikit-learn, Pandas, NumPy |
| Database | PostgreSQL |
| AI Insights | Anthropic Claude API |
| TTS | Web Speech API (browser-native, free) |
| Frontend Host | Vercel |
| ML + DB Host | Railway |

---

## 📁 Project Structure

```
nestcare/
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Tenant form page
│   │   ├── globals.css                # Theme CSS variables
│   │   ├── dashboard/                 # Dashboard + login
│   │   └── api/                       # report, explain, dashboard-auth
│   ├── components/
│   │   ├── ReportForm.tsx
│   │   ├── Dashboard.tsx
│   │   ├── InsightNarrator.tsx
│   │   └── ThemeLanguageBar.tsx
│   ├── context/
│   │   ├── ThemeContext.tsx
│   │   └── LanguageContext.tsx
│   ├── translations/index.ts          # All EN/DE strings
│   └── lib/api.ts                     # FastAPI client
├── predictor/
│   ├── main.py                        # FastAPI endpoints
│   ├── predictor.py                   # ML logic
│   ├── models.py                      # DB models
│   ├── seed.py                        # 365-day data seeder
│   └── Dockerfile
└── n8n-workflow-fixed.json

```

---

## ⚙️ Local Setup

```bash
# 1. Clone and install
git clone https://github.com/rirumel/nestcare
cd nestcare
npm install

# 2. Environment variables
cp .env.example .env.local
# Fill in: N8N_WEBHOOK_URL, NEXT_PUBLIC_PREDICTOR_URL,
#          DASHBOARD_PASSWORD, ANTHROPIC_API_KEY

# 3. Start FastAPI
cd predictor
pip3.11 install -r requirements.txt
python3.11 -m uvicorn main:app --reload --port 8000

# 4. Seed the database (recommended)
python3.11 seed.py

# 5. Start n8n
docker run -it --rm --name n8n -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n n8nio/n8n

# 6. Start Next.js
cd ..
npm run dev
```

Open http://localhost:3000

---

## ⚠️ Known Limitations

| Limitation | Detail |
|---|---|
| Twilio sandbox sessions | Recipients must send `join <keyword>` to the sandbox number every 24 hours to receive WhatsApp messages |
| Sandbox not for production | Twilio sandbox uses a shared number — upgrade to WhatsApp Business API for 24/7 delivery |
| Seed data only | ML forecasts are based on generated seed data, not real historical reports |
| Single property | Current version supports one property/landlord — multi-tenant not yet implemented |
| No real auth | Dashboard uses a simple password cookie — not suitable for multi-user production use |

---

## 🔮 Future Plans

- [ ] Multi-property and multi-landlord support
- [ ] Production WhatsApp Business API integration
- [ ] Tenant portal with report history and status tracking
- [ ] Push notifications for landlords
- [ ] Maintenance ticket system with status updates (open → in progress → resolved)
- [ ] Photo upload for issue reports
- [ ] SMS fallback when WhatsApp is unavailable
- [ ] Mobile app (React Native)
- [ ] GDPR-compliant data export and deletion