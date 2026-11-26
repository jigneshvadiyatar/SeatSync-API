# SeatSync API

SeatSync is a Node.js and Express API for discovering events, scheduling shows, and reserving seats. Modules 0 through 7 cover the local infrastructure, email/password sessions and profiles, venue layouts, event and show management, and temporary seat holds, and pending bookings.

## Local setup

Run these commands from the repository root with Node 22, Docker Engine, and Docker Compose. The project uses Ubuntu on WSL for Docker on Windows.

```bash
cp .env.example .env
# Set local database and RabbitMQ passwords, and a strong JWT signing secret.
# DB_PASSWORD must match POSTGRES_PASSWORD for a new Compose database.
docker compose up -d
npm ci
npm run db:migrate
npm run dev
```

The default API URL is `http://localhost:5000/api/v1`. Use `GET /health/live` to check the HTTP process and `GET /health/ready` to check PostgreSQL. DBeaver can connect to `127.0.0.1:5432` with the configured database and user.

Register your first user through `POST /auth/register`. From a trusted local shell, grant that account admin access with:

```bash
npm run admin:promote -- admin@example.com
```

## Seat reservation flow

1. Browse `GET /events` and `GET /events/:id/shows`.
2. Read the priced layout at `GET /shows/:showId/seats` and current seat status at `GET /shows/:showId/availability`.
3. Send `POST /shows/:showId/holds` with a bearer access token and a JSON body containing `seatIds`, an array of 1 to 10 seat UUIDs. A successful response includes a hold ID and expiry. A competing claim returns HTTP 409 and leaves the entire requested group unchanged.
4. Read or release your hold at `GET /holds/:holdId` or `DELETE /holds/:holdId`. Releasing an already cancelled or expired hold succeeds.

PostgreSQL determines availability. Hold creation locks the show row and checks the event, venue, hall, booking window, prices, existing holds, and sold allocations in one transaction. The default TTL is 300 seconds and is capped at the booking close or show start. Expired holds become reclaimable immediately. A periodic sweep records their expired status, and Redis stores best-effort TTL metadata after commit.

Admin catalog operations use `/venues/:venueId/halls`, `/halls/:hallId/seat-categories`, `/halls/:hallId/seats/bulk`, `/events`, and `/shows`. Publish an event before scheduling it. A hall with scheduled shows keeps its existing category set so the show-specific prices remain complete.

## Booking from a hold

Send `POST /bookings` with a bearer token, an `Idempotency-Key` header, and a JSON body containing just `holdId`. The API returns HTTP 201 for a new pending booking. Retry with the same key and hold to retrieve the current booking with HTTP 200. A key reused for another hold returns HTTP 409. A hold can be converted once.

The response contains a server-side price snapshot. `total_minor` and each `unit_price_minor` are integer strings in paise, and the currency is INR. Use `GET /bookings/:id` for details, `GET /users/me/bookings?page=1&limit=20` for history, and `POST /bookings/:id/cancel` to cancel a pending booking. Repeating a successful cancellation returns the same cancelled booking.

Conversion and new holds serialize on the PostgreSQL show row. A pending booking keeps its seats reserved until cancellation or its deadline. The default deadline is 600 seconds after conversion, configurable via `BOOKING_TTL_SECONDS` and capped at booking close or show start. Availability and new holds respect the deadline immediately. A periodic sweep persists the expired status for history.

The pending booking is the checkout recovery point. A retry with the same key resumes the same booking, and abandoned bookings expire automatically. After expiry or cancellation, start with a fresh hold and key. Payment integration must coordinate provider-session expiry with the reservation deadline and explicitly reconcile late success before enabling payment confirmation. Confirmed inventory uses the existing unique show/seat allocation table.

## Verification

```bash
npm test
SEATSYNC_INTEGRATION=1 npm test
```

In PowerShell, set `$env:SEATSYNC_INTEGRATION='1'` before running `npm test`. Set `SEATSYNC_REDIS_TEST=1` as well to verify Redis TTL metadata and release. The integration suite creates and removes a disposable PostgreSQL database. Use local test credentials with permission to create a database. It checks migrations, auth, the catalog, 50 simultaneous requests for the same seat, and concurrent booking retries, cancellation, and expiry.

The roadmap continues with payments, tickets, workers, real-time updates, reporting, and deployment hardening. Google OAuth is scheduled separately as Phase 1B.
