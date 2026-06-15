# Pinequest AI

Turn private documents into secure, shareable AI assistants that teams can use instantly.

This Bun monorepo contains a chat-first MVP for creating private document AIs, uploading PDF knowledge, chatting with isolated retrieval, and inviting members with short-lived codes.

## Architecture

- `frontend`: Next.js app router UI for public landing, auth, chat, AI creation, joining, and owner management.
- `backend`: Bun HTTP API for Supabase-authenticated chat, PDF upload/ingestion, retrieval, membership, preferences, and invitations.
- `backend/prisma`: Prisma schema and Supabase/Postgres migrations.
- Supabase Auth provides email/password sessions. The browser only uses the anon key.
- Supabase Storage keeps original PDFs in a private bucket. Backend routes verify membership before creating signed PDF URLs.
- Retrieval is AI-scoped by `company_id` in `document_chunks`; the existing `companies` table is used as the AI workspace table.

## Local Setup

```bash
bun install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in Supabase, database, Google embedding, and Groq chat values in `backend/.env`. Fill in the public Supabase anon values in `frontend/.env.local`.

Required server-only variables include:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `DATABASE_URL`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `INVITE_CODE_PEPPER`
- `PUBLIC_APP_URL`

Frontend public variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CHAT_API_URL`
- `NEXT_PUBLIC_UPLOAD_API_URL`
- `NEXT_PUBLIC_DOCUMENTS_API_URL`
- `NEXT_PUBLIC_COMPANIES_API_URL`
- `NEXT_PUBLIC_INVITES_API_URL`
- `NEXT_PUBLIC_PREFERENCES_API_URL`
- `NEXT_PUBLIC_PROFILE_API_URL`
- `NEXT_PUBLIC_EVENTS_API_BASE_URL`
- `NEXT_PUBLIC_ADMIN_COMPANIES_API_URL`

`NEXT_PUBLIC_API_URL` is the preferred production setting and must be the
public HTTPS origin of the deployed backend, such as
`https://api.your-domain.com`. The frontend derives `/api/me/profile`, `/chat`,
`/upload`, `/documents`, `/api/companies`, `/api/invites`,
`/api/me/preferences`, `/api/ais`, and `/admin/companies` from that origin.
The per-resource `NEXT_PUBLIC_*_API_URL` values are supported for legacy or
split-backend deployments; when used in production, each one must also point to
the deployed HTTPS backend endpoint. A deployed browser app must never use
`http://localhost:4000`.

## Supabase Requirements

- Email/password auth enabled; email confirmation may be disabled for demos.
- Production Site URL set to the deployed Vercel frontend URL.
- Redirect URLs include the deployed Vercel frontend URL and local development
  URLs such as `http://localhost:3000/**`.
- Private storage bucket, default `user-documents`.
- `pgvector` available for `document_chunks.embedding`.
- Migrations applied from `backend/prisma/migrations`.
- Backend service-role key must stay server-side only.

Apply migrations when intentionally updating the configured database:

```bash
bun run db:migrate
```

The new secure invitation migration adds `invite_codes`, `invite_redemptions`, `user_preferences`, `company_members.invitation_id`, and `companies.archived_at`.

## Run Locally

```bash
bun run dev
```

Or run separately:

```bash
bun run dev:backend
bun run dev:frontend
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Production Deployment

Deploy the frontend and backend separately. Vercel should host the Next.js
frontend. The Bun backend should run on a Bun-compatible host such as Railway,
Render, Fly.io, or a container platform.

Frontend variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL=https://<deployed-backend-domain>`

If you keep the legacy per-resource frontend variables, configure all of them
with HTTPS production endpoints and keep them consistent with the same backend:

- `NEXT_PUBLIC_CHAT_API_URL=https://<deployed-backend-domain>/chat`
- `NEXT_PUBLIC_UPLOAD_API_URL=https://<deployed-backend-domain>/upload`
- `NEXT_PUBLIC_DOCUMENTS_API_URL=https://<deployed-backend-domain>/documents`
- `NEXT_PUBLIC_COMPANIES_API_URL=https://<deployed-backend-domain>/api/companies`
- `NEXT_PUBLIC_INVITES_API_URL=https://<deployed-backend-domain>/api/invites`
- `NEXT_PUBLIC_PREFERENCES_API_URL=https://<deployed-backend-domain>/api/me/preferences`
- `NEXT_PUBLIC_PROFILE_API_URL=https://<deployed-backend-domain>/api/me/profile`
- `NEXT_PUBLIC_EVENTS_API_BASE_URL=https://<deployed-backend-domain>/api/ais`
- `NEXT_PUBLIC_ADMIN_COMPANIES_API_URL=https://<deployed-backend-domain>/admin/companies`

Changing any `NEXT_PUBLIC_*` value requires a new Vercel build/deployment.

Backend host variables:

- `PORT` from the hosting provider, or `4000` locally.
- `HOST=0.0.0.0`
- `FRONTEND_ORIGIN=https://<vercel-frontend-domain>`
- `PUBLIC_APP_URL=https://<vercel-frontend-domain>`
- The server-only Supabase, database, embedding, Groq, storage, and invite
  variables listed in Local Setup.

Backend build/start commands:

```bash
bun install
bun run --cwd backend build
bun run --cwd backend start
```

Run migrations during deployment when the database schema changes:

```bash
bun run --cwd backend db:migrate
```

The backend exposes `GET /health` and `GET /` as simple health checks.

## Core Routes

- `/` public presentation page
- `/auth/sign-in`, `/auth/sign-up`
- `/chat`
- `/chat/[companyId]`
- `/chat/[companyId]/[conversationId]`
- `/create-ai`
- `/join`
- `/join/[code]`
- `/ai/[companyId]/manage`
- `/ai/[companyId]/documents`
- `/ai/[companyId]/members`
- `/ai/[companyId]/invites`
- `/ai/[companyId]/settings`

Legacy dashboard routes redirect or remain as compatibility aliases.

## Role Model

Roles are scoped per AI:

- `OWNER`: chat, edit AI settings/behavior, upload/delete documents, view members, remove members, generate/revoke invitations, archive AI.
- `MEMBER`: chat, view/download documents and cited PDFs, manage only their own conversations, leave joined AIs.

Legacy `ADMIN` rows are treated as members by the current permission helpers.

## Security Assumptions

- Every AI-scoped backend route authenticates the user and verifies membership.
- Owner mutations additionally verify owner permissions.
- Conversation history is server-backed in `chat_messages` and scoped by `user_id`, `company_id`, and `conversation_id`.
- Retrieval passes an explicit `company_id` filter to Supabase vector search.
- Invitation codes are HMAC-SHA256 hashed with `INVITE_CODE_PEPPER`; raw codes are shown only immediately after generation.
- Invitation expiration is fixed at 15 minutes.

## Checks

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

`bun test` invokes Bun’s separate test runner. The repo’s backend tests are Jest tests that use `jest.doMock`, so use `bun run test` for the configured test suite.

## Demo Setup

Create two Supabase Auth users manually or through your existing demo process:

- Owner account
- Member account

As the owner:

1. Sign in.
2. Create an AI from `/create-ai`.
3. Configure identity, behavior, and suggested questions.
4. Upload PDFs or leave it documentless for a generic private assistant.
5. Open `/ai/[companyId]/invites` and generate a 15-minute invitation.
6. Share the raw code/link immediately.

As the member:

1. Open `/join/[code]`.
2. Sign in or sign up.
3. Join the AI.
4. Open chat and verify management routes are denied.
