# Daker-front CI/CD

## Branch Strategy
- `main`: production deployment branch
- `feature/*`: work branches

## CI
- Trigger: pull request to `main`
- Trigger: push to `main`
- Workflow: `.github/workflows/ci.yml`
- Action:
  - Set up Node.js 20
  - Run `npm ci`
  - Run `npm run lint`
  - Run `npm run build`

## CD
- Trigger: push to `main`
- Workflow: `.github/workflows/deploy.yml`
- Deployment target: Vercel production

## Required GitHub Secrets
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Notes
- `vercel.json` rewrites `/api` requests to the backend server.
- If the repository is already connected to Vercel Git integration, keep only one production deployment path to avoid duplicate deploys.
