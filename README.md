# 🏠 NestCare — Tenant Issue Reporter

A polished Next.js web app where tenants report home maintenance issues. On submission, n8n instantly sends a personalized confirmation via **WhatsApp** (Twilio) or **Email** (Gmail), and notifies the landlord with full details.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Automation | n8n (self-hosted via Docker) |
| WhatsApp | Twilio WhatsApp Sandbox |
| Email | Gmail via n8n OAuth2 |
| Hosting | Vercel |

---

## Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/nestcare-report
```

> For production on Vercel, replace with your n8n public webhook URL (use ngrok for local testing or n8n's cloud URL).

### 3. Start n8n with Docker

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Open n8n at http://localhost:5678

### 4. Import the n8n workflow

1. In n8n, go to **Workflows → Import from file**
2. Select `n8n-workflow.json` from this repo
3. Configure credentials (see below)
4. **Activate** the workflow

### 5. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## n8n Credentials Setup

### Gmail (for email notifications)

1. In n8n go to **Credentials → New → Gmail OAuth2**
2. Follow the Google OAuth setup — connect your Gmail account
3. Both "Send Email" and "Notify Landlord" nodes use this credential

### Twilio (for WhatsApp)

1. Sign up at https://twilio.com (free trial)
2. Go to **Messaging → Try it out → Send a WhatsApp message**
3. Note your **Account SID** and **Auth Token**
4. In n8n go to **Credentials → New → Twilio API**
5. Enter your Account SID and Auth Token

**Important — Twilio WhatsApp Sandbox opt-in:**
Each test recipient must send this message to +1 415 523 8886 once:
```
join <your-sandbox-keyword>
```
Find your keyword at: console.twilio.com → Messaging → Try it out → WhatsApp

### Update the landlord email

In the **"Notify Landlord"** node, replace:
```
YOUR_LANDLORD_EMAIL@example.com
```
with your actual email address.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create nestcare --public --push
```

### 2. Deploy on Vercel

```bash
npx vercel
```

Or connect your GitHub repo at https://vercel.com/new

### 3. Add environment variable on Vercel

In Vercel dashboard → Your project → Settings → Environment Variables:

```
N8N_WEBHOOK_URL = https://your-n8n-public-url/webhook/nestcare-report
```

### 4. Make n8n publicly accessible

For local n8n + Vercel frontend, use **ngrok**:

```bash
ngrok http 5678
```

Copy the `https://xxxx.ngrok.io` URL and use:
```
N8N_WEBHOOK_URL=https://xxxx.ngrok.io/webhook/nestcare-report
```

---

## Project Structure

```
nestcare/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main page (split layout)
│   │   ├── page.module.css     # Page styles
│   │   ├── globals.css         # Global styles & CSS variables
│   │   └── api/
│   │       └── report/
│   │           └── route.ts    # API route → forwards to n8n
│   └── components/
│       ├── ReportForm.tsx      # Form with validation & success state
│       └── ReportForm.module.css
├── n8n-workflow.json           # Import this into n8n
├── .env.example                # Copy to .env.local
└── README.md
```

---

## Data Flow

```
Tenant fills form
      ↓
Next.js /api/report
      ↓
n8n Webhook triggered
      ↓
  IF contactType === 'whatsapp'
  ├── YES → Twilio sends WhatsApp to tenant
  └── NO  → Gmail sends email to tenant
      ↓
Gmail notifies landlord (always)
```

---

## Customisation

- **Add more issue types**: Edit the `ISSUES` array in `ReportForm.tsx`
- **Change branding**: Update `NestCare` references in `page.tsx` and `layout.tsx`
- **Add apartment/unit field**: Add an input to the form and include it in the API payload
- **Slack landlord notification**: Replace the "Notify Landlord" Gmail node with a Slack node
