# Security Policy

## Reporting Security Issues

Please report security issues privately to the repository owner instead of opening a public issue.

## Secret Handling

- Never commit `.env`, Firebase service-account JSON files, API tokens, private keys, or production credentials.
- Use `.env.example` for variable names only.
- Rotate any credential immediately if it was committed or shared publicly.

## Deployment Safety

- Keep maintenance routes disabled unless actively running controlled setup work.
- Use Firebase Auth, Firestore rules, and Storage rules to enforce role-based access.
- Review seeded demo users before connecting the app to a production Firebase project.
