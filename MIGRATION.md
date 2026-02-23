# 🗄️ Supabase Migration Guide — The Board Rebuild

Run these SQL statements in your **Supabase SQL Editor**
(Dashboard → SQL Editor → New Query).

---

## 1. Add `user_id` to `exam_sessions`

This links sessions to authenticated users so personal bests
and leaderboard identity work correctly.

```sql
-- Add user_id column referencing auth.users
ALTER TABLE exam_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id
  ON exam_sessions(user_id);
```

---

## 2. Add `confidence` to `exam_answers`

Stores the Sure / Unsure rating per answer.

```sql
ALTER TABLE exam_answers
  ADD COLUMN IF NOT EXISTS confidence TEXT
  CHECK (confidence IN ('sure', 'unsure'));
```

---

## 3. Enable Google OAuth in Supabase Auth

1. Go to **Authentication → Providers → Google**
2. Enable Google
3. In Google Cloud Console (console.cloud.google.com):
   - Create a project (or use existing)
   - Go to **APIs & Services → Credentials → Create OAuth 2.0 Client**
   - Application type: **Web application**
   - Authorized redirect URI:
     ```
     https://<your-supabase-project>.supabase.co/auth/v1/callback
     ```
4. Copy the **Client ID** and **Client Secret** back into Supabase

---

## 4. Row Level Security (Recommended)

```sql
-- Users can only read their own sessions
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions"
  ON exam_sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users insert own sessions"
  ON exam_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users update own sessions"
  ON exam_sessions FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Leaderboard: anyone can see completed sessions
CREATE POLICY "Leaderboard is public"
  ON exam_sessions FOR SELECT
  USING (score IS NOT NULL);

-- Answers are private per session
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Answers tied to session owner"
  ON exam_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exam_sessions s
      WHERE s.id = exam_answers.session_id
      AND (s.user_id = auth.uid() OR s.user_id IS NULL)
    )
  );
```

> **Note:** If you have existing data without `user_id`, the
> `user_id IS NULL` clauses above ensure those records remain
> accessible while new sessions are properly user-scoped.

---

## 5. File Structure After Rebuild

```
src/
├── app/
│   ├── globals.css              ← Updated design system
│   ├── layout.js                ← ThemeProvider wrapper
│   ├── page.js                  ← Home (search, personal best)
│   ├── auth/
│   │   └── page.js              ← Email + Google login
│   ├── exam/[documentId]/
│   │   ├── page.js              ← Exam taking (nav, flag, pause, confidence)
│   │   └── setup/page.js        ← Exam setup
│   ├── results/[sessionId]/
│   │   └── page.js              ← Score ring, pass/fail, retake
│   ├── review/session/[sessionId]/
│   │   └── page.js              ← Answer review + explanations
│   └── leaderboard/[documentId]/
│       └── page.js              ← Medal ranks, score bars
└── components/
    ├── Shell.js                 ← Shared header/nav/auth
    └── ThemeProvider.js         ← Dark/light mode context
```

---

## 6. Install — No new packages needed

All features use your existing stack:
- `next` 16+
- `@supabase/supabase-js` 2+
- `tailwindcss` 4+

---

## 7. Environment Variables (unchanged)

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 8. Drop files into your project

Copy all rebuilt files into `C:\Users\asus\Desktop\the-board\src\`
replacing the originals, then run:

```bash
npm run dev
```

That's it. 🎓
