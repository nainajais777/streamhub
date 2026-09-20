# StreamHub API (in progress)

A backend API for a hybrid video/live-streaming/creator-monetization platform —
built as a hands-on project to work through real authentication architecture,
database constraint design, and payment-gateway integration.

This is a learning-focused project: the sections below distinguish what's
actually implemented and tested from what's designed in the schema but not
yet built.

## Tech stack

- **Node.js / Express** — REST API
- **TypeScript**
- **PostgreSQL** — via **Drizzle ORM** (schema-as-code, type-safe queries)
- **Better Auth** — session-based authentication (database-backed sessions, not
  JWT — chosen specifically so platform bans/suspensions can revoke access
  immediately, rather than waiting for a token to expire)
- **Razorpay** — payment gateway integration (order creation + webhook-based
  confirmation)
- **Docker Compose** — local Postgres (Redis provisioned for future caching,
  not yet used by any route)

## What's implemented and tested

- **Auth** — signup/login via Better Auth, database-backed sessions,
  cookie-based session verification on every protected route.
- **Authorization** — two-layer model:
  - `role` (`user` / `admin`) on the `users` table for platform-operations access
  - "Is this user a creator?" is answered by the *existence* of a row in
    `creator_profiles`, not a role value — deliberately kept separate, since
    being a creator is a capability, not an access-control tier.
- **Videos** — cursor-paginated public listing (`GET /api/videos`), single-video
  fetch (`GET /api/videos/:id`), creator-only video record creation
  (`POST /api/videos`) with `creatorId` always taken from the authenticated
  session, never trusted from the request body. *(Actual file upload and
  transcoding are not yet implemented — this creates the metadata record only;
  `status` stays `processing` and `videoUrl` stays null until that's built.)*
- **Follows** — creator-only follow targets (`POST /api/follows`), public
  followers list, ownership-checked private following list, race-condition-safe
  duplicate handling (returns `409`, backed by a real Postgres `UNIQUE`
  constraint rather than an application-level check alone).
- **Subscriptions** — creation with duplicate protection via a database-level
  unique constraint (`subscriber_id`, `creator_id`).
- **Payments (Razorpay)** — order creation (`POST /api/subscriptions/checkout`),
  a `pending_checkouts` tracking table reconciling checkout attempts to
  subscriber/creator pairs, and a webhook handler
  (`POST /api/webhooks/razorpay`) verifying HMAC-SHA256 signatures against
  the raw request body before trusting any payload. On a verified event,
  subscription creation, payment recording, and the creator's earnings
  update all happen inside a single database transaction, so a partial
  failure can never leave the data inconsistent. Idempotency
  (`payments.gateway_event_id` unique) and duplicate-safe processing
  (missing/already-processed orders return `404`, never a false success)
  are both handled.
  - **Live streams** — creator-only stream creation (`POST /api/live-streams`)
  and ending (`PATCH /api/live-streams/:id/end`), with a Postgres partial
  unique index physically preventing a creator from having two simultaneous
  live streams, and an ownership check ensuring only the stream's own
  creator can end it.`live_streams.peakViewerCount` remains at its default (0) — 
  populating it requires real-time viewer tracking via Redis, which depends on 
  the WebSocket/chat feature (not yet built).
  - **Comments** — public listing per video (`GET /api/comments?videoId=`),
  authenticated creation, and soft-delete with ownership checks (deleted
  comments are hidden from listings but remain in the database for
  moderation history, not permanently purged).
- **Reactions** — one reaction per user per target (video or live stream),
  enforced via two separate database-level unique constraints rather than
  one combined constraint, since Postgres treats `NULL` as never equal
  to another `NULL` in uniqueness checks — reacting again replaces the
  existing reaction (upsert via `ON CONFLICT DO UPDATE`) instead of
  creating a duplicate.
- **Video upload** — creator-only, ownership-checked file upload
  (`POST /api/videos/:id/upload`) via multer, saving locally and linking
  the file path back to the video record. Cloud storage (S3/R2) and
  `ffmpeg` transcoding are not yet built — `status` stays `processing`
  until that pipeline exists, and files are currently written to local
  disk rather than durable cloud storage.
## Designed but not yet implemented

The full schema (`src/db/schema.ts`) includes `tags`, `video_tags`,
`categories`,`chat_messages`,
`moderation_reports`, and `platform_bans` — each with real constraints and
cascade-rule reasoning documented inline. These are designed but have no API
routes built yet. Actual video file upload/transcoding, live streaming, and
real-time chat (Socket.io) are also not implemented — the current API is
data/auth/payments-focused.

## Notable design decisions

- **`follows`/`subscriptions` uniqueness is enforced at the database level**,
  not just in application code — closes a real double-submit race condition
  that a server-side "check then insert" alone can't fully prevent.
- **Money is never trusted from the client.** Session-derived IDs
  (`creatorId`, `payerId`, etc.) are always taken from the authenticated
  session, never from request body fields, to prevent identity-forgery
  attacks.
- **Idempotency for payment webhooks** — `payments.gateway_event_id` is
  unique, so a retried webhook delivery (a documented, expected behavior of
  payment gateways) can never create a duplicate charge.
-- **The webhook handler bypasses Express's default JSON body parser** for
  this one route, since signature verification requires the exact raw
  request bytes — a re-serialized copy of the same JSON is not guaranteed
  to be byte-identical.
## Setup

```bash
git clone https://github.com/nainajais777/streamhub.git
cd streamhub
npm install
cp .env.example .env          # fill in your own DB/auth/Razorpay values
docker compose up -d          # Postgres + Redis
npx drizzle-kit migrate       # apply schema
npm run dev                   # http://localhost:4000
```

## Author

Built by [Naina Jaiswal](https://github.com/nainajais777) as a hands-on
backend project.