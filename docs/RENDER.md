# Deploying React-PMS on Render

This guide assumes you're deploying the **server** (Node/Express + Mongoose) to Render. The client (Vite + React) deploys separately as a Static Site or to another host.

## 1. Provision MongoDB

Render does not include managed Mongo on free tier. Use **MongoDB Atlas M0 (free, 512MB)**:

1. Create an Atlas project + cluster (M0 Shared).
2. **Network access:** allow `0.0.0.0/0` (Render's egress IPs are dynamic).
3. **Database user:** create one with `readWrite` on your DB. Copy the `mongodb+srv://...` connection string.
4. Save the connection string — it becomes `MONGO_URL`.

## 2. Create the Render Web Service

1. Render Dashboard → New → Web Service → connect your GitHub repo.
2. Runtime: **Node**. Build: `cd server && npm install`. Start: `cd server && npm start`.
3. Plan: **Free** works for testing; **Starter ($7/mo)** removes the 15-min spin-down.
4. Region: pick one close to your Atlas region for lower latency.

## 3. Environment variables

Set every variable below in Render's service settings → Environment.

**Core:** `MONGO_URL`, `PORT` (Render injects automatically), `JWT_SECRET`, `API_KEY`, `FRONTEND_URL`.

**Email (Nodemailer):** `EMAIL`, `PASS`.

**Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (from step 4 below).

**DocuSign:** `DS_ACCOUNT_ID`, `DS_BASE_PATH`, `DS_INTEGRATION_KEY`, `DS_OAUTH_BASE`, `DS_USER_ID`, `DS_PRIVATE_KEY_B64`, `DS_LEASE_TEMPLATE_ID`, `DS_CONNECT_HMAC_KEY` (from step 5 below).

**OpenTech gate:** `OPENTECH_CLIENT_ID`, `OPENTECH_CLIENT_SECRET`, `OPENTECH_ENV` (`prod` or `dev`), `GATE_ACCESS_CODE_LENGTH` (default 8), `GATE_RETRY_BACKOFF_MS` (default "1000,2000,4000").

**Background jobs:** `ORPHAN_TENANT_AGE_DAYS` (default 7).

## 4. Configure Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**.
2. URL: `https://<your-render-service>.onrender.com/webhooks/stripe`.
3. Events: select **`checkout.session.completed`** only.
4. Copy the signing secret (`whsec_...`) → paste into Render's `STRIPE_WEBHOOK_SECRET` env var.
5. Test with the "Send test webhook" button in Stripe.

## 5. Configure DocuSign Connect

1. DocuSign Admin → Integrations → Connect → Configurations → **Add Configuration**.
2. URL: `https://<your-render-service>.onrender.com/webhooks/docusign`.
3. Format: **JSON (Aggregate)**.
4. Events: Envelope → Envelope Completed/Declined/Voided.
5. Require HMAC: paste the same secret you set as `DS_CONNECT_HMAC_KEY`.

(For the OpenTech setup, see `server/CLAUDE.md` → "Gate provider (OpenTech)" — it's done in OpenTech's own UI plus a per-Company Mongo update.)

## 6. Schedule the background jobs

`POST /admin/cron/:job` accepts `delinquency`, `monthly`, `orphan-cleanup`. API-key auth via `x-api-key` header.

### Option A — Render Cron Jobs (paid, $1/mo each)

Render Dashboard → New → Cron Job. For each:

- **Command:** `curl -fsS -X POST -H "x-api-key: $API_KEY" https://<your-render-service>.onrender.com/admin/cron/<job>`
- **Schedule:** `0 6 * * *` (daily 06:00 UTC) for delinquency and orphan-cleanup; `0 7 1 * *` (07:00 UTC on the 1st) for monthly.

Set `API_KEY` in the cron job's env (same value as the web service).

### Option B — GitHub Actions cron (free for public repos)

Add `.github/workflows/cron.yml`:

```yaml
name: cron-jobs
on:
  schedule:
    - cron: "0 6 * * *"
    - cron: "0 7 1 * *"
jobs:
  daily:
    if: github.event.schedule == '0 6 * * *'
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST \
            -H "x-api-key: ${{ secrets.RENDER_API_KEY }}" \
            https://${{ secrets.RENDER_HOST }}/admin/cron/delinquency
      - run: |
          curl -fsS -X POST \
            -H "x-api-key: ${{ secrets.RENDER_API_KEY }}" \
            https://${{ secrets.RENDER_HOST }}/admin/cron/orphan-cleanup
  monthly:
    if: github.event.schedule == '0 7 1 * *'
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST \
            -H "x-api-key: ${{ secrets.RENDER_API_KEY }}" \
            https://${{ secrets.RENDER_HOST }}/admin/cron/monthly
```

Add two GitHub secrets:

- `RENDER_API_KEY` — same value as the Render web service's `API_KEY`.
- `RENDER_HOST` — e.g. `react-pms.onrender.com` (no `https://`, no path).

GitHub Actions cron is best-effort and may run up to 30 minutes late. Acceptable for these jobs.

## 7. Free-tier gotchas

- **Spin-down:** after 15 min of inactivity, the web service sleeps. The first request takes 30–60s. Stripe and DocuSign Connect both retry on non-2xx, so webhooks eventually land. To keep the instance warm, point UptimeRobot (free) at `GET /docusign/ping` every 5 min.
- **No persistent disk:** the codebase doesn't write to local disk by design (signed PDFs are fetched on demand from DocuSign).
- **No Mongo:** use Atlas M0 (see step 1).

## 8. Health check

Set Render's Health Check Path to `/docusign/ping` (returns 200 with `{ ok: true, accountId }` if DocuSign auth is working).

## 9. Verify end-to-end

After deploying, smoke-test the happy path:

1. Through the client UI, start a rental → tenant lands on Stripe checkout.
2. Use Stripe's test card `4242 4242 4242 4242` (any future expiry + CVC).
3. Stripe redirects back to `FRONTEND_URL`. Within seconds, `Rental.status` should be `paid` (check Mongo or your dashboard).
4. The client requests the lease envelope → tenant signs in DocuSign.
5. DocuSign Connect fires → `Rental.signingStatus` becomes `signed`, `Tenant.status` → `Active`.
6. If a gate provider is configured on the facility, the tenant's access code is provisioned in OpenTech.

If step 3 doesn't transition: check Stripe Dashboard → Webhooks → your endpoint → "Recent deliveries". Look for 200 responses. 400 = wrong secret. 503 = env var not set in Render.
