# Demo Checklist

## Environment

- Backend: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `INVITE_CODE_PEPPER`, `GOOGLE_API_KEY`, `GROQ_API_KEY`
- Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, API URLs from `frontend/.env.example`
- Event default: `DEFAULT_EVENT_TIMEZONE=Asia/Ulaanbaatar`

## Migration

- From repo root: `bun run db:migrate`
- Prisma checks: `cd backend && bunx prisma validate && bunx prisma generate`
- Applied migration: `20260615120000_add_user_profiles_and_events`

## Demo Accounts

- Owner account with a real profile name
- Member account with a real profile name
- New invite-test account for signup with Name, Email, Password

## Demo AI

- Name: `Pinequest Hackathon Rules`
- Owner: demo owner profile name
- Members: at least one member joined through invitation
- Documents: at least one processed PDF with status `ready`

## Demo Event

- Title: `Pinequest Hackathon Opening`
- Description: `Official opening session and participant briefing.`
- Start: choose a known future date/time
- Timezone: `Asia/Ulaanbaatar`
- Location: `Pinecone Academy`

## Document Questions

- `What are the submission rules?`
- `What does the PDF say about judging?`
- `Summarize the eligibility requirements.`

## Event Questions

- `When does the Pinequest Hackathon begin?`
- `Where is the opening session?`
- `What is the next scheduled event?`
- `Are there any events this week?`

## Invitation Test

- Owner generates invitation.
- New account opens `/join/<code>`.
- Sign up with Name, Email, Password.
- Invite survives authentication.
- User joins as Member.
- Member can chat, view documents, and view events.
- Member cannot manage documents, members, invitations, settings, or events.

## PDF Layout Test

- Ask a document question that returns citations.
- Open a source.
- Collapse and expand the conversation sidebar.
- Confirm chat and PDF split the desktop workspace approximately evenly.
- Confirm PDF starts at fit-width and zoom/page/download/close work.
- On mobile width, confirm the source opens full-screen and Close returns to chat.

## Build And Start

- Install: `bun install`
- Validate: `bun run lint && bun run typecheck && bun run test && bun run build`
- Backend dev: `bun run dev:backend`
- Frontend dev: `bun run dev:frontend`

## Fallback Plan

- If AI provider quota is unavailable, show uploaded documents, citations, PDF viewer, events CRUD, and invitation flow.
- If a PDF is not ready, use the Events flow and profile-name flow first while processing completes.
- If remote migration access is unavailable, run `bun run db:migrate` from a network-enabled machine with the same backend `.env`.
