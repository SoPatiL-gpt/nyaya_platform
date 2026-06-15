<div align="center">
  <h1>Nyayadheesh Platform ⚖️</h1>
  <p><i>A modern, comprehensive platform for bridging the gap between clients and advocates.</i></p>

  [![CI](https://github.com/shubampatil002/nyayadheesh-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/shubampatil002/nyayadheesh-platform/actions/workflows/ci.yml)
  [![CodeQL](https://github.com/shubampatil002/nyayadheesh-platform/actions/workflows/codeql.yml/badge.svg)](https://github.com/shubampatil002/nyayadheesh-platform/actions/workflows/codeql.yml)
</div>

<hr />

## 🌟 Overview

The **Nyayadheesh Platform** is a powerful, React and Vite-based web application tailored for streamlining case workflows for clients and advocates. From seamless registration and dedicated dashboards to real-time chat and document management, the platform offers an intuitive, secure, and fully functional environment for legal case management.

## 🚀 Key Features

- **Role-Based Dashboards**: Tailored experiences for both Advocates and Clients.
- **Case Management**: Effortlessly create, track, and manage legal cases and hearings.
- **Document Vault**: Secure document uploads and storage powered by Firebase.
- **Real-time Communication**: Integrated chat application for direct client-advocate communication.
- **Smart Scheduling**: Manage appointments, hearings, and daily tasks efficiently.
- **Profile Management**: Detailed profiles and verification for advocates.

## 🛠️ Technology Stack

| Category         | Technology                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| **Frontend**     | React 19, Vite, React Router DOM                                          |
| **Backend/BaaS** | Firebase (Authentication, Cloud Firestore, Firebase Storage)              |
| **Tooling**      | ESLint, Prettier                                                          |
| **CI/CD**        | GitHub Actions (Security scanning, Node CI, CodeQL analysis, Dependabot) |

## ⚙️ Local Development Setup

To run this project locally, follow these steps:

### 1. Install Dependencies
```bash
npm ci
```

### 2. Environment Variables
Copy the provided environment template to your local `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in your Firebase Web App configuration values. 

> **Warning**
> Never commit your `.env` file to version control. The `.gitignore` file is configured to ignore it by default.

### 3. Start Development Server
```bash
npm run dev
```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Bundles the app for production into the `dist` directory. |
| `npm run lint` | Runs ESLint to catch and fix code quality issues. |
| `npm run preview` | Previews the production build locally. |

## 📁 Project Structure

```text
src/
├── components/        # Reusable UI components and route guards
├── lib/               # Firebase collection helpers and core logic
├── pages/             # Application views and screens
├── firebase.js        # Firebase initialization and exports
└── main.jsx           # Application entry point
```

## 🔒 Security Best Practices

We prioritize security across the entire stack:
- **Environment Variables**: Firebase configs and secrets are handled via `VITE_FIREBASE_*`.
- **Production Safety**: Database seed and migration scripts are **disabled** by default in production. Enable them only for controlled maintenance (`VITE_ENABLE_MAINTENANCE_ROUTES=true`).
- **Database Rules**: Ensure Firestore and Firebase Storage are protected by robust security rules before taking the app live.
- **CI/CD Hardening**: GitHub Actions use pinned commits, step-security harden-runner, CodeQL scanning, and strict Dependabot auditing.

## 🚢 Deployment Checklist

Before pushing to production, verify the following:
- [x] Run `npm run lint` to ensure code quality.
- [x] Run `npm run build` and ensure there are no build errors.
- [x] Verify `.env` is **not** staged (`git status --ignored --short`).
- [x] Ensure Firebase security rules are correctly configured for authenticated users only.
- [x] Check GitHub Actions CI workflows pass successfully.
