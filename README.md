# 🏏 StepUp Cricket Academy — Website

## File Structure

```
/
├── index.html          ← Main website
├── style.css           ← All styles
├── script.js           ← Frontend logic
├── vercel.json         ← Vercel config
└── api/
    ├── adminLogin.js   ← Admin login serverless function
    └── sendTelegram.js ← Telegram notification serverless function
```

---

## 🚀 Deploy to GitHub + Vercel

### Step 1 — Push to GitHub
1. Go to [github.com](https://github.com) → New Repository → name it `stepupcricketacademy`
2. Upload all files (keep the `api/` folder!)
3. Commit and push.

### Step 2 — Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Click **Deploy** (default settings are fine)

### Step 3 — Set Environment Variables
In Vercel Dashboard → Your Project → **Settings → Environment Variables**, add:

| Variable Name         | Value                          |
|-----------------------|-------------------------------|
| `ADMIN_EMAIL`         | your admin email               |
| `ADMIN_PASSWORD`      | your admin password            |
| `TELEGRAM_BOT_TOKEN`  | token from @BotFather          |
| `TELEGRAM_CHAT_ID`    | your chat ID (e.g. -100xxxxxxx)|

After adding variables, **Redeploy** the project.

---

## 🤖 How to get Telegram credentials

1. Open Telegram → search **@BotFather** → `/newbot` → copy the token
2. Add the bot to your group/channel
3. To get Chat ID: visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` after sending a message
4. Use the `id` field from `"chat"` object (negative number for groups)

---

## ✅ Features
- Player registration form with GPS location
- Telegram notification on every new registration
- Admin login (secured via Vercel environment variables)
- Admin dashboard with player table + CSV export
- Open/Close admissions toggle
- Mobile responsive design
