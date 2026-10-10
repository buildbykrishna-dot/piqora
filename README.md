# Piqora — College Classroom Quiz & Learning Platform

**Piqora** is a complete, Kahoot/Blooket-inspired live classroom quiz, interactive revision, and learning analytics platform designed specifically for higher education and college lectures.

Production Domain: `https://piqora.vercel.app`

---

## 🚀 Key Features

1. **Mobile-First Student Game-Joining:**
   - Prominent Game PIN entry directly on the homepage (`/` and `/join`).
   - Supports `/join?pin=123456` with automatic PIN pre-fill.
   - Live session validation, active status check, and duplicate nickname prevention.
   - Zero registration required for students.

2. **Shareable Session QR Codes:**
   - Every live quiz host screen (`/host/:id`) renders a high-resolution QR code encoding the production join URL (`https://piqora.vercel.app/join?pin=[PIN]`).
   - Students can aim their phone camera at the classroom projector screen and join instantly.

3. **Teacher Authentication with Google Sign-In:**
   - Dedicated `/login` page with polished "Continue with Google" sign-in.
   - Powered by Firebase Authentication SDK (`GoogleAuthProvider` via `signInWithPopup`).
   - Role-based authorization: user profiles in `profiles/{uid}` control teacher status and permissions.
   - Protected teacher routes (`/dashboard`, `/dashboard/content`, `/dashboard/quizzes/*`, etc.) with redirection to `/login` if unauthenticated.
   - Built-in instant faculty demo mode for rapid reviewer testing.

4. **Classroom Live Gaming Engine:**
   - Unique 6-digit session PIN generation.
   - Live waiting room with animated participant badges.
   - 4 large distinct color answer buttons:
     - ▲ Red (Option A)
     - ◆ Blue (Option B)
     - ● Amber (Option C)
     - ■ Emerald (Option D)
   - Real-time countdown timer, live answer counter, and authoritative scoring.
   - Post-question answer reveal with student choice distribution bars and faculty explanations.
   - Standings leaderboard and 3-tier podium celebration with confetti!

5. **Curriculum Creation & Question Banks:**
   - Manual 4-option Quiz Editor with draft and publish toggles.
   - Reusable Question Banks (pool questions by semester and module).
   - Revision Lessons with rich formatting and external lecture links.
   - 1-click CSV and Excel template downloader and spreadsheet import wizard.

6. **Comprehension Analytics:**
   - Question-by-question accuracy bar chart powered by Recharts.
   - "Hardest Questions" review to identify lecture topics needing re-teaching.
   - Downloadable summary reports.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Canvas-Confetti, QRCode
- **Analytics Visualizations:** Recharts
- **Spreadsheet Processing:** PapaParse (CSV) & SheetJS XLSX (Excel)
- **Database & Auth:** Cloud Firestore & Firebase Authentication (Google Sign-In)
- **Deployment:** Vercel (`vercel.json` SPA rewrites) & Google Cloud Run

---

## 📋 Required Firebase Console Configuration

To enable Google Sign-In on your production domain:

1. **Enable Google Sign-in Provider:**
   - Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → **Authentication** → **Sign-in method**.
   - Click **Google**, toggle **Enable**, select the project support email, and click **Save**.

2. **Add Authorized Domains:**
   - In Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
   - Click **Add domain** and add:
     - `piqora.vercel.app`
     - Any custom Vercel preview domains (`*.vercel.app`)

---

## 🚢 Vercel Deployment

A `vercel.json` configuration file is included to configure Single Page Application rewrites so direct navigation to `/join`, `/login`, `/dashboard`, `/host/:id`, and `/play/:id` works seamlessly:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Deploying to Vercel:
```bash
npm install -g vercel
vercel
```

---

## 📦 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run locally at `http://localhost:3000`.
