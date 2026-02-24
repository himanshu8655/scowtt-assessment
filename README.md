# Movie Memory (Variant B)

A full-stack Next.js app for Google-authenticated users to save their favorite movie and get AI-generated fun facts.

## Variant choice
I implemented **Variant B (Frontend/API-focused)** because it emphasizes API contracts, typed client behavior, and frontend state/caching orchestration.

## Stack
- TypeScript
- Next.js (App Router)
- React + TailwindCSS
- PostgreSQL
- Prisma
- Google OAuth (Firebase Auth + Firebase Admin verification)
- OpenAI API (SDK)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Add env vars (see below).
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   # or for local dev
   npx prisma migrate dev
   ```
4. Start app:
   ```bash
   npm run dev
   ```

## Required environment variables
```bash
# Database
DATABASE_URL=

# Session
JWT_SECRET=

# Firebase Admin (server)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Firebase client (browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# OpenAI
OPENAI_API_KEY=
```

## Database migration steps
- Schema is in `prisma/schema.prisma`.
- Run:
  ```bash
  npx prisma migrate dev
  npx prisma generate
  ```
- For production-like environments:
  ```bash
  npx prisma migrate deploy
  ```

## Architecture overview
- **Auth flow**:
  - User signs in with Firebase Google provider from `/`.
  - Browser sends Firebase `idToken` to `/api/auth/google`.
  - Server verifies token with Firebase Admin.
  - App creates/loads user in Postgres and sets signed `session` cookie.
  - First-time users are redirected to `/onboarding`, returning users to `/dashboard`.
- **Data model**:
  - `User` stores Google identity data and `favoriteMovie`.
  - `Fact` stores generated fact text and timestamp linked to user.
- **API contracts**:
  - `GET /api/me`: returns typed user profile payload.
  - `PUT /api/me/movie`: validates and updates favorite movie.
  - `GET /api/fact`: returns latest fact (cache path) or generates/stores one.
  - `POST /api/auth/logout`: clears session cookie.
- **Client API wrapper**:
  - `src/lib/api.ts` provides typed `apiGet`, `apiPut`, `apiPost`.
  - Errors are normalized into `ApiError` with `status`, `code`, and `message`.
- **Frontend orchestration**:
  - Dashboard supports inline movie edit with Save/Cancel.
  - Uses optimistic UI update and reverts on failure.
  - Movie facts are cached client-side for 30 seconds via React Query.
  - “Get new fact” bypasses cache and forces fresh generation.
  - Fact cache invalidates when movie changes.

## Variant B requirement mapping
1. **Typed API layer**: implemented with shared typed client + normalized errors.
2. **Inline edit flow**: implemented with Save/Cancel, optimistic update, rollback.
3. **Client-side cache**: 30-second stale window + explicit refresh + invalidation on movie update.
4. **Minimal frontend/API tests**:
   - API error normalization tests.
   - Movie edit optimistic/rollback behavior tests.

## Key tradeoffs
- Used session cookie auth for API authorization rather than relying on raw bearer token on each route.
- Kept fact caching simple in client state/query cache to satisfy Variant B focus.

## What I would improve with 2 more hours
- Add Playwright end-to-end tests for auth -> onboarding -> dashboard.
- Harden `/api/fact` fallback behavior and add retry/backoff UI.
- Add richer loading/empty/error UI states and toasts.
- Add stricter schema validation with zod shared between client/server.

## AI usage note
- Used AI for code refactoring suggestions (typed API client and optimistic update flow).
- Manually reviewed and adjusted generated code for project constraints.

## Optional walkthrough
- https://drive.google.com/drive/folders/1tgbf2qh691_FBImJ4T2QkSup0eOg0J1l?usp=drive_link
