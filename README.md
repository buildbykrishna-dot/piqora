# Piqora — College Classroom Quiz & Learning Platform

**Piqora** is a complete, Kahoot/Blooket-inspired live classroom quiz, interactive revision, and learning analytics platform designed specifically for higher education and college lectures.

Production Domain: `https://piqora.vercel.app`

---

## 🚀 Key Features

1. **Teacher Authentication (Firebase Email & Password):**
   - **Account Registration (`/register`):** Faculty can register with full name, email, password (minimum 8 characters), and password confirmation with show/hide password toggles.
   - **Faculty Login (`/login`):** Email and password authentication with clear error messages for invalid credentials, disabled accounts, and network errors.
   - **Password Reset:** Built-in "Forgot Password?" dialog triggering Firebase's `sendPasswordResetEmail`.
   - **Instant Demo Mode:** Included for quick evaluator/grading previewing.

2. **Teacher Authorization & Security Rules:**
   - On registration, a teacher profile is provisioned in Firestore under `/profiles/{uid}` with `role: 'teacher'`.
   - Hardened `firestore.rules` enforces that only authenticated users with a valid `role == 'teacher'` or `admin` in `/profiles/{uid}` can create or modify quizzes, questions, question banks, lessons, and live sessions.
   - Role escalation attacks are blocked: users cannot elevate their role to `admin` or change their role field during updates.
   - Protected routes (`/dashboard`, `/dashboard/content`, etc.) require an authenticated teacher session and redirect to `/login`.

3. **Public Anonymous Student Experience:**
   - The homepage (`/`) and join portal (`/join`) are 100% public.
   - Students join live games with a 6-digit game PIN and display nickname without needing an account or login.
   - Deep-linking support for `/join?pin=123456` with automatic PIN pre-fill.
   - Duplicate student nicknames in the same room are rejected with inline feedback.

4. **Live Classroom Projector & Shareable QR Codes:**
   - Every live session (`/host/:id`) generates a shareable, high-resolution QR code encoding `https://piqora.vercel.app/join?pin=[PIN]`.
   - Real-time countdown timer ring, answer response counter, answer choice distribution bar chart, and 3-tier celebration podium with confetti.

5. **Curriculum Tools & Comprehension Analytics:**
   - Manual 4-option Quiz Editor with draft and publish toggles.
   - Reusable Question Banks & Curriculum Pools.
   - Revision Lessons with rich formatting and external links.
   - Standardized CSV (`piqora_questions_template.csv`) and Excel (`piqora_questions_template.xlsx`) spreadsheet import.
   - Recharts-powered question accuracy analytics with "Hardest Questions" alerts.

---

## 📋 Firebase Console Configuration

To enable Email/Password authentication for Piqora:

1. Open the [Firebase Console](https://console.firebase.google.com/) → Your Project.
2. Navigate to **Build** → **Authentication** → **Sign-in method**.
3. Under **Sign-in providers**, click **Email/Password**.
4. Toggle **Email/Password** to **Enabled** (you do not need Email link passwordless).
5. Click **Save**.

*Note: Since standard Email/Password authentication is used, teachers do not need Google OAuth authorization or domain allowlisting.*

---

## 🚢 Free Vercel Deployment

A `vercel.json` file is configured in the repository root for Single Page Application routing:

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

This guarantees that direct navigation or browser refresh on `/register`, `/login`, `/join`, `/dashboard`, `/host/:id`, and `/play/:id` loads correctly without 404 errors.

---

## 📦 Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Lint and check types
npm run lint

# Build for production
npm run build
```
