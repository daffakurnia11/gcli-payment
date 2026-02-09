# gcli-payment

Express + TypeScript backend service that wraps DOKU payment APIs and handles DOKU webhooks.

## Features

- Payment wrapper endpoints (create, modify, cancel, status)
- Scheduled cancellation endpoint
- DOKU non-SNAP request signing and webhook signature validation
- MariaDB pooled singleton connection and audit logging for:
  - Outbound payment API calls
  - Webhook callbacks
- Input validation with Zod
- Security middlewares (`helmet`, `cors`, rate limiting)

## API Endpoints

- `GET /api/health`
- `GET /api/docs`
- `GET /api/docs.json`
- `POST /api/payments`
- `PATCH /api/payments/:invoiceNumber`
- `POST /api/payments/cancel`
- `POST /api/payments/cancel/schedule`
- `GET /api/payments/:invoiceNumber/status`
- `POST /api/webhooks/doku`

## Setup

1. Install deps:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

3. Run migration:

```bash
npm run db:migrate
```

4. Start service:

```bash
npm run dev
```

## Notes for DOKU Integration

- `DOKU_MODIFY_PAYMENT_PATH` and `DOKU_CANCEL_PAYMENT_PATH` are optional and channel-specific.
- If `DOKU_MODIFY_PAYMENT_PATH` is empty, modify uses create endpoint fallback.
- If `DOKU_CANCEL_PAYMENT_PATH` is empty, cancel endpoint returns error.
- Ensure `DOKU_WEBHOOK_PATH` matches the exact path used by DOKU notifications.
- Set `SWAGGER_SERVER_URL` if your public base URL is not `http://localhost:<PORT>`.
