# Nyayadheesh Platform

A React + Vite web app for client and advocate case workflows, including registration, dashboards, case creation, hearings, document uploads, chat, scheduling, and profile management.

## Tech Stack

- React 19
- Vite
- Firebase Auth
- Cloud Firestore
- Firebase Storage
- React Router
- ESLint

## Setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Fill `.env` with your Firebase web app configuration.

4. Start development:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` starts the local Vite server.
- `npm run build` creates a production build in `dist`.
- `npm run lint` runs ESLint.
- `npm run preview` previews the production build locally.

## Security Notes

- `.env` and `.env.*` are ignored by git. Do not commit Firebase values, service-account files, private keys, tokens, or production credentials.
- Firebase web config values are read from `VITE_FIREBASE_*` environment variables.
- Database seed and migration pages are disabled in production by default.
- Only enable `VITE_ENABLE_MAINTENANCE_ROUTES=true` or `VITE_RUN_STARTUP_MIGRATION=true` for controlled maintenance work.
- Set `VITE_DEMO_SEED_PASSWORD` locally only when you intentionally seed demo users.
- Protect Firestore and Storage with Firebase security rules before deploying publicly.
- GitHub Actions are restricted to least-privilege permissions, pinned to action commit SHAs, monitored with Harden Runner, and scanned with CodeQL.
- Dependabot is configured for npm and GitHub Actions updates.

## Project Structure

```text
src/
  components/        Shared route and UI components
  lib/               Firebase collection helpers
  pages/             Application screens
  firebase.js        Firebase client initialization
  main.jsx           App bootstrap
public/              Static assets
```

## Deployment Checklist

- Run `npm run lint`.
- Run `npm run build`.
- Confirm `.env` is not staged with `git status --ignored --short`.
- Confirm Firebase security rules are configured for real user access.
