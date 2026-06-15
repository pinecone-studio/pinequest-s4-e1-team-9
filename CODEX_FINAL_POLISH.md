# Final Product Polish, Events, User Names, and Stabilization Pass

You are the lead full-stack engineer responsible for completing and stabilizing the existing Pinequest AI hackathon product.

Repository:

`pinequest-s4-e1-team-9`

Runtime and package manager:

`Bun`

Read this complete specification before editing anything.

## Primary instruction

This is an implementation task, not a planning or review task.

You must:

1. Inspect the current repository and Git state.
2. Understand the existing frontend, backend, Prisma schema, Supabase Auth, storage, chat, document retrieval, PDF viewer, memberships, invitations, preferences, and routing.
3. Implement every required change below directly.
4. Preserve working functionality.
5. Fix bugs and regressions discovered during implementation.
6. Run migrations, tests, lint, type checking, and production builds.
7. Manually verify the critical product flows where automated testing is insufficient.
8. Finish with an exact implementation report and remaining limitations.

Do not stop after writing a plan.

Do not ask for confirmation unless a missing external credential makes further work literally impossible. Make conservative, practical decisions and continue.

The goal is a polished, stable, professional hackathon product that can remain usable even if no further Codex work is available.

---

# Repository safety

Before editing:

```bash
git status
git diff --stat
```

Rules:

* Do not reset or discard existing work.
* Do not use destructive Git commands.
* Do not delete users, documents, AIs, memberships, or conversations.
* Do not replace the application with a starter template.
* Do not switch away from Bun.
* Do not introduce another ORM, authentication provider, component framework, or state-management system.
* Reuse existing architecture and dependencies wherever reasonable.
* Do not expose Supabase service credentials to the browser.
* Update `.env.example` files but never commit real secrets.
* Make database migrations additive and safe for existing data.
* Do not spend significant time on the public presentation page.

---

# Current product

The current application is a chat-first platform where users can:

* Create private document-based AIs
* Upload and process PDFs
* Chat with documents
* Receive document citations
* Open cited PDFs
* Switch between owned and joined AIs
* Search and delete server-backed conversations
* Generate temporary invitation codes
* Join an AI as a member
* Manage documents, members, invitations, and AI settings
* Enforce owner/member permissions

The existing `Company` domain model currently represents an AI workspace. Preserve that mapping unless the codebase has already renamed it safely.

Roles remain:

* `owner`
* `member`

There is no platform administrator.

---

# Final scope and execution priority

Perform work in this order:

1. Inspect and stabilize the existing project
2. Improve the chat/PDF layout
3. Add required user names safely
4. Add structured AI events
5. Integrate events into chat
6. Polish all existing product flows
7. Complete security and AI-isolation verification
8. Run all tests and production builds
9. Prepare final demo-readiness documentation

Do not add unrelated features.

Specifically, do not build the conversational Action/leave-request workflow in this pass. Events are the only major new product feature.

---

# Part 1: Improve the chat, sidebar, and PDF viewer layout

## Current problem

When a citation PDF is open:

* The left conversation sidebar takes too much permanent width.
* The sidebar cannot be collapsed.
* The chat takes most of the remaining space.
* The PDF panel is too narrow.
* PDF pages appear very small and are difficult to read.
* The chat and PDF do not share the working area evenly.

The target is a professional document-research workspace.

## Desktop layout

When no PDF is open:

```text
┌──────────────────────┬──────────────────────────────────────────┐
│ Conversation sidebar │ Chat                                     │
└──────────────────────┴──────────────────────────────────────────┘
```

When a PDF source is open:

```text
┌──────────────┬────────────────────────┬────────────────────────┐
│ Sidebar      │ Chat                   │ PDF source             │
│ collapsible  │ approximately 50%      │ approximately 50%      │
└──────────────┴────────────────────────┴────────────────────────┘
```

The 50/50 split applies to the main working area after accounting for the sidebar.

## Collapsible conversation sidebar

Implement a clear sidebar-collapse control.

Required behavior:

* Expanded width should remain useful for conversation titles.
* Collapsed state should be narrow and icon-based.
* The collapse/expand control must remain discoverable.
* New conversation remains accessible while collapsed.
* Search may open the expanded sidebar or a compact overlay.
* Active conversation remains visually identifiable.
* The sidebar must not cover or break the chat composer.
* Persist the sidebar preference locally per browser.
* Do not make localStorage authoritative for conversations; use it only for this visual preference.
* Add keyboard-accessible labels and visible focus states.

On smaller desktop screens, automatically starting collapsed is acceptable.

## Chat and PDF split

When a source is open:

* Use approximately 50% chat and 50% PDF by default.
* Both columns must use `min-width: 0` or equivalent to prevent overflow.
* The chat composer must remain fully visible.
* The message area must remain independently scrollable.
* The PDF panel must remain independently scrollable.
* Long messages must not push the PDF off-screen.
* Long filenames must truncate gracefully.
* Avoid horizontal browser scrolling.

A draggable divider is optional only if it can be implemented reliably with minimal complexity. A stable 50/50 split is preferable to a fragile resizer.

## PDF viewer improvements

Improve the source viewer so documents are actually readable.

Required:

* Fit PDF width to the available source-panel width by default.
* Use a sensible minimum source-panel width on large screens.
* Add zoom controls if the current viewer supports them cleanly:

  * Zoom out
  * Zoom in
  * Fit width/reset
* Preserve:

  * Previous page
  * Next page
  * Current page indicator
  * Download
  * Close source panel
* Navigate to the cited page.
* Show the relevant excerpt near the viewer.
* Preserve best-effort highlighting if already working.
* Do not block completion on perfect coordinate-level PDF highlighting.
* Use a clear loading state.
* Use a useful error state with Retry and Download/Open actions where possible.
* Do not reload the complete PDF unnecessarily whenever unrelated chat state changes.

## Responsive behavior

Desktop/laptop is the main priority.

At medium widths:

* Collapse the conversation sidebar by default when the PDF panel opens.
* Preserve enough space for the chat and source.

At mobile widths:

* Do not attempt a tiny three-column layout.
* Open the PDF in a full-screen sheet, drawer, or dedicated view.
* Include a clear return-to-chat control.
* Keep page navigation and download accessible.

Test the layout at:

* 1920×1080
* 1440×900
* 1366×768
* Tablet width
* Mobile width
* Browser zoom at 100%, 110%, and 125%

---

# Part 2: Add required user names

## Goal

Every application user must have a real display name.

The system should use that name consistently instead of relying on email usernames such as `orgil19082007`.

Names should appear in:

* Profile menu
* AI owner information
* Member management
* Invitation preview where appropriate
* Recent joins
* Event creator information where appropriate
* Chat personalization
* Future operational records

## Inspect the current user model first

Determine how users are currently represented:

* Supabase Auth user metadata
* Prisma user/profile table
* Existing profile record
* Application-specific user table

Do not duplicate user/profile concepts unnecessarily.

Use one authoritative application profile source.

## Schema

Add a required name field using a clear name consistent with existing conventions, for example:

```text
name
```

or:

```text
display_name
```

Prefer `name` if the project already uses simple profile fields.

Requirements:

* Trim whitespace.
* Require a reasonable minimum such as 2 visible characters.
* Enforce a practical maximum such as 80 characters.
* Reject whitespace-only names.
* Support Unicode and Mongolian names.
* Do not force first-name/last-name separation.
* Do not expose private email addresses where the name is sufficient.

## Safe migration for existing users

Do not add a non-null database column in a way that breaks existing users.

Use a safe migration strategy:

1. Add the field in a migration.
2. Backfill existing profiles where possible using, in order:

   * Existing Supabase `full_name` or `name` metadata
   * Existing application profile name
   * A cleaned email local-part as a temporary fallback
3. Ensure existing application rows receive a valid value.
4. Enforce the required constraint safely after the backfill where supported.
5. Add application-level validation.

Do not mutate Supabase Auth internals directly unless the project already has a supported synchronization mechanism.

## Signup

Add a required Name field to sign-up.

Required fields:

* Name
* Email
* Password

On successful signup:

* Store the name in the authoritative application profile.
* Also store it in Supabase user metadata if this is already part of the project’s auth architecture.
* Continue immediately because email confirmation is disabled.

Handle partial failure safely. Do not leave authentication created while profile creation silently fails without recovery.

## Existing users without a valid name

If an existing authenticated user lacks a valid name:

* Show a small mandatory profile-completion screen or dialog.
* Require the user to enter their name before continuing into the product.
* Preserve their intended redirect, including pending invitation links.
* Do not create a redirect loop.

## Profile editing

Allow users to update their name from the profile menu or profile page.

Required:

* Current name
* Edit action
* Validation
* Save loading state
* Success/error feedback
* Immediate UI refresh after saving

## AI chat personalization

Provide the authenticated user’s verified name to the AI context.

The assistant may naturally address the user by name when useful, but it should not repeat the name excessively.

Use server-verified profile data, not a name supplied through a chat request body.

Do not let the user’s name override system instructions or become prompt injection content. Treat it as escaped contextual metadata.

---

# Part 3: Add structured Events

## Product goal

Owners should be able to add time-sensitive structured events to an AI.

Examples:

* Pinequest Hackathon opening
* Submission deadline
* Judging session
* Student orientation
* Academy exam
* Company meeting
* Holiday
* Training session

Members can ask the AI questions such as:

* When does the hackathon start?
* What is the next event?
* What events are happening this week?
* Where is the judging session?
* When is the submission deadline?
* Has the orientation already finished?

Events must belong to exactly one AI workspace.

## MVP boundaries

Implement:

* Owner event creation
* Owner event editing
* Owner event cancellation
* Owner event deletion
* Owner event listing
* Read-only member access
* Upcoming/past grouping
* Chat awareness
* Event source metadata

Do not implement:

* Google Calendar integration
* Outlook integration
* Recurring events
* RSVP
* Push notifications
* Email reminders
* Public events
* Cross-AI events
* Complex calendar month view
* Event attachments
* Event approval workflows

## Event schema

Adapt to current naming and ORM conventions.

Conceptual model:

```text
events
- id
- company_id / ai_id
- title
- description nullable
- starts_at
- ends_at nullable
- timezone
- location nullable
- meeting_url nullable
- status
- created_by
- created_at
- updated_at
```

Recommended status values:

```text
scheduled
cancelled
```

Past/upcoming should normally be derived from time rather than stored as separate mutable statuses.

Requirements:

* Store date/time values as UTC.
* Store the event’s IANA timezone separately.
* Default to an appropriate timezone such as the owner’s/application timezone.
* Support `Asia/Ulaanbaatar`.
* Validate `ends_at >= starts_at`.
* Require title.
* Trim textual fields.
* Validate meeting URLs.
* Use safe cascading behavior when an AI is deleted.
* Include indexes for AI/company ID and start time.
* Keep all queries scoped to the selected AI.

## Authorization

Owner can:

* Create
* Edit
* Cancel
* Delete
* View all events

Member can:

* View events
* Ask the AI about events

Member cannot:

* Create
* Edit
* Cancel
* Delete

Enforce authorization on the backend. Hiding frontend controls is not sufficient.

A user belonging to AI A must not read events belonging to AI B.

## Owner management interface

Add an `Events` section to the AI-management navigation.

Recommended order:

```text
Overview
Documents
Events
Members
Invitations
Settings
```

Create a clean operational events page.

Include:

* `Create event` button
* Upcoming events
* Past events
* Cancelled events, either filtered or visibly marked
* Empty state
* Loading state
* Error state

Each event card or row should show:

* Title
* Date
* Start and end time
* Timezone
* Location or meeting link
* Status
* Edit action
* Cancel action
* Delete action

Do not make every event an oversized decorative card. Use a compact professional list.

## Create/edit event experience

Use a dialog, drawer, or focused form consistent with the existing UI.

Fields:

* Title — required
* Description — optional
* Start date — required
* Start time — required
* End date — optional
* End time — optional
* Timezone — required
* Location — optional
* Meeting link — optional

Behavior:

* Sensible defaults
* Clear validation
* Prevent duplicate submission
* Loading state
* Success toast
* Error feedback attached to relevant fields
* Confirmation before deletion
* Confirmation or clear action for cancellation
* Allow restoring a cancelled event to scheduled if straightforward

## Member-facing access

Members should not need the owner management interface.

Provide read-only event visibility in one or both of these places, based on the current UI:

* A lightweight Upcoming Events entry accessible from chat
* A compact upcoming-events area in the empty/new-chat state
* A read-only Events view

Do not clutter the primary chat screen.

Suggested questions may include event-based prompts when events exist.

---

# Part 4: Integrate Events with chat

## Structured data, not vector embeddings

Events are structured time-sensitive records.

Do not depend on embedding event data into document chunks.

The backend should retrieve relevant events from the database during chat processing.

Use deterministic date filtering and sorting wherever possible.

Examples:

* “What is the next event?”:

  * Query the nearest scheduled event after now.
* “What events are this week?”:

  * Calculate the date range using the requested/user/event timezone.
* “When is the hackathon opening?”:

  * Retrieve likely matching events for the selected AI.
* “Has the judging session finished?”:

  * Compare its end/start time with the current time.

The language model may format and explain the result, but it must not invent event dates.

## Chat orchestration

Inspect the existing chat pipeline.

Implement a clean approach such as:

1. Authenticate the user.
2. Verify selected-AI membership.
3. Load the verified user profile/name.
4. Determine whether the request may involve event/schedule/date information.
5. Retrieve a small relevant set of scheduled/cancelled events for that AI.
6. Retrieve document chunks when appropriate.
7. Provide structured event context and document context separately.
8. Generate the answer.
9. Persist the message and source metadata.

Do not let event integration break ordinary document questions.

Avoid injecting every historical event into every prompt. Limit and filter context.

A hybrid implementation is acceptable:

* Include a concise list of upcoming events for general context.
* Run more targeted event retrieval for schedule-related queries.

Keep prompt/token usage controlled.

## Event source chips

When an answer relies on an event, return structured source metadata.

Example:

```text
Event · Pinequest Hackathon Opening
June 18, 2026 · 10:00 AM · Asia/Ulaanbaatar
```

Event sources must be visually distinct from document citations.

Clicking an event source may open an event details view or lightweight dialog.

Document citations should continue opening the PDF viewer.

A response may contain both:

* Document sources
* Event sources

Do not label an event as a PDF citation.

## Missing information behavior

If no matching event exists, the AI should say that it could not find a matching scheduled event.

It must not invent:

* Dates
* Times
* Locations
* Meeting links
* Event statuses

Cancelled events must be described as cancelled.

Use the actual current date and timezone in server-side date logic.

---

# Part 5: Stabilize all existing functionality

After implementing the requested changes, inspect and stabilize the full product.

Do not merely test the new code.

## Authentication

Verify:

* Signup with required name
* Sign in
* Sign out
* Session restoration
* Incorrect credentials
* Protected routes
* Existing user profile completion
* Pending invite preserved through authentication
* No email-confirmation interruption
* No auth redirect loops

## Chat entry behavior

Required:

* User with valid AIs opens the last selected accessible AI.
* Otherwise opens the most recently accessed/created/joined AI.
* User with no AI remains on `/chat`.
* No-AI state displays:

  * Create your AI
  * Join an AI
* No `/chat/undefined`
* No `/chat/null`
* No repeated `notice` query parameters
* No invalid workspace loop
* Missing/archived/inaccessible AI safely falls back

## Next.js route correctness

This project uses a modern Next.js version where dynamic `params` and `searchParams` may be Promises.

Inspect every App Router page/layout/route for synchronous dynamic API usage.

Search for patterns such as:

```bash
rg "params\." frontend/app
rg "searchParams\." frontend/app
```

Fix all affected route components safely.

Do not leave warnings such as:

```text
params is a Promise and must be unwrapped
```

## AI selector

Verify:

* Owned and joined sections
* Correct role badges
* Correct selected AI
* Last-selection persistence
* Owner-only management action
* Archived and inaccessible AIs removed
* Switching produces a new blank chat
* Queued switching during generation does not mix messages
* Long AI names do not break the layout

## Conversations

Verify:

* Server-backed history
* First message creates a conversation
* URL updates
* History reload after refresh
* Search
* Delete
* Correct conversation titles
* No duplicate messages
* No localStorage as source of truth
* One user cannot access another user’s conversations
* A conversation cannot be opened under the wrong AI

## Documents and retrieval

Verify:

* Owner upload
* Processing status
* Retry where supported
* Member read-only access
* View/download
* Owner delete
* Deleted chunks are no longer retrievable
* Every vector/retrieval query is scoped to AI/company ID
* No cross-AI document leakage
* Missing information response remains grounded
* Greetings do not receive unnecessary citations

## PDF sources

Verify:

* Correct file
* Correct cited page
* Relevant excerpt
* Download
* Loading/error states
* Membership authorization
* Private Supabase Storage
* Short-lived signed URLs
* Removed members cannot request fresh signed URLs
* Improved split layout and sidebar collapse

## Invitations

Verify:

* `INVITE_CODE_PEPPER` configuration handling
* 15-minute expiration
* Code and link
* One active invitation
* New invite revokes old invite
* Manual revocation
* Existing member behavior
* Invite survives authentication
* Member role is always created
* Expired/revoked/invalid handling
* Archived AI cannot be joined
* Rate limiting remains functional
* Raw invitation secret is not stored insecurely

## Owner/member permissions

Test both UI and backend APIs.

Owner can:

* Manage settings
* Upload/delete documents
* Manage events
* View/remove members
* Generate/revoke invitations
* Archive/delete the AI

Member can:

* Chat
* View own conversations
* View/download documents
* View events
* Leave AI
* Create an independent AI

Member cannot:

* Edit AI
* Upload/delete documents
* Create/edit/delete events
* List members
* Remove members
* Generate invitations
* Access owner routes

Do not retain a legacy `ADMIN` authorization bypass.

Search:

```bash
rg "ADMIN|admin" backend frontend
```

Legacy enum compatibility is acceptable only if it does not provide owner privileges.

## Membership removal and leave

Verify:

* Removed member loses access immediately
* Direct chat route is denied
* Conversation access is denied
* PDF signed URL generation is denied
* Event access is denied
* Chat request is denied
* The user falls back to another AI or `/chat`
* Member can leave
* Owner cannot leave their own AI

## Archive/delete

Verify:

* Archived AI disappears from active selector
* Archived AI cannot be joined
* Direct URLs recover safely
* Events and documents cannot be used by active chat
* Last-selected preference is repaired
* Delete confirmation is strong
* Deletion does not create orphaned cross-linked records

---

# Part 6: UI/UX polish

The authenticated product should look consistent, deliberate, and professional.

## Visual direction

Use the existing restrained dark SaaS visual language.

Improve consistency in:

* Typography
* Spacing
* Borders
* Radius scale
* Buttons
* Form controls
* Tabs
* Dropdowns
* Dialogs
* Empty states
* Loading states
* Error states
* Status badges
* Tooltips
* Toasts

Avoid:

* Excessive gradients
* Excessive glassmorphism
* Giant rounded cards
* Random shadows
* Random badge colors
* Decorative blobs
* Fake statistics
* Placeholder analytics
* Every area being placed inside another card
* Dense text without hierarchy
* Horizontal overflow in management tabs

The screenshot currently shows horizontal scrolling in management navigation. Fix that.

Management tabs should:

* Fit cleanly at normal desktop widths
* Wrap, scroll subtly, or collapse responsively
* Not display an ugly permanent browser-style horizontal scrollbar
* Keep active state obvious

## Product copy

Use consistent terminology.

Prefer user-facing terms:

* AI
* Assistant
* Owner
* Member
* Events
* Documents
* Invitations

Avoid exposing internal terminology such as:

* company ID
* vector chunks
* model provider
* Prisma
* workspace ID

Error messages should tell the user what happened and what they can do next.

## Accessibility

Verify:

* Visible focus states
* Keyboard-accessible dropdowns
* Keyboard-accessible sidebar toggle
* Accessible dialogs
* Escape closes modal/panel
* Buttons have labels
* Form errors are connected to fields
* Contrast is sufficient
* Icon-only buttons have accessible names
* Destructive actions require confirmation

---

# Part 7: Backend and schema architecture

Inspect current conventions and continue using them.

Create clear typed boundaries for events and profiles.

Potential event capabilities, adapted to existing routing conventions:

```text
GET    /api/ais/:aiId/events
POST   /api/ais/:aiId/events
GET    /api/ais/:aiId/events/:eventId
PATCH  /api/ais/:aiId/events/:eventId
DELETE /api/ais/:aiId/events/:eventId
POST   /api/ais/:aiId/events/:eventId/cancel
```

Do not create duplicate endpoints if equivalents exist.

Profile capabilities may include:

```text
GET   /api/me/profile
PATCH /api/me/profile
```

Use the project’s existing validation library.

Return consistent status codes:

* `400` malformed request
* `401` unauthenticated
* `403` unauthorized
* `404` inaccessible or missing resource where appropriate
* `409` conflict
* `422` validation if already used
* `500` unexpected server error without exposing internals

All event queries must include AI/company scope.

All profile updates must act only on the authenticated user.

---

# Part 8: Tests

Use the project’s configured test tools. The repository uses Jest-compatible tests through `bun run test`; do not treat bare `bun test` as authoritative if it remains incompatible.

Add focused tests for the new behavior and regressions.

## Profile/name tests

Test:

* Signup requires name
* Whitespace-only name rejected
* Unicode/Mongolian name accepted
* Maximum length enforced
* Name persists
* Existing missing-name user enters completion flow
* Profile name can be updated
* User cannot update another user’s profile
* Chat context uses server-verified name

## Event authorization tests

Test:

* Owner can create event
* Owner can edit event
* Owner can cancel event
* Owner can delete event
* Member can read events
* Member cannot create/edit/cancel/delete
* Unauthenticated user cannot access events
* AI A member cannot access AI B events
* Archived AI events are not available through normal active endpoints

## Event validation tests

Test:

* Title required
* Start date required
* Invalid timezone rejected
* End before start rejected
* Invalid meeting URL rejected
* UTC conversion and timezone preservation
* Cancelled event clearly retains status

## Event-chat tests

Test:

* Next-event query uses the selected AI’s event
* This-week query respects date ranges/timezone
* Cancelled event is identified as cancelled
* Missing event is not invented
* AI A chat never uses AI B events
* Event source metadata is returned
* Document and event sources can coexist

## Layout/component tests where practical

Test:

* Sidebar can collapse and expand
* State persists
* PDF source panel opens
* PDF/chat split class/state activates
* Mobile source view is accessible
* Sidebar collapse does not remove New Conversation access

## Existing regression tests

Ensure tests remain green for:

* Authentication
* AI selection
* Chat persistence
* Conversation isolation
* Retrieval isolation
* Invitations
* Documents
* Membership removal
* Owner/member permissions
* Invalid routes
* No-AI state

---

# Part 9: Validation commands

Determine actual workspace scripts first.

Run the appropriate Bun commands from the repository root and workspaces.

At minimum attempt:

```bash
bun install
bun run lint
bun run typecheck
bun run test
bun run build
```

Also run:

```bash
cd backend
bunx prisma validate
bunx prisma generate
```

Apply or validate the new migration against the intended development Supabase database if credentials and approval permit.

Do not run destructive reset commands.

If remote migration execution is blocked, leave the migration ready and report the exact command required.

Check for:

* TypeScript errors
* Broken imports
* Next.js dynamic API warnings
* React hydration errors
* Hook dependency issues that represent real bugs
* Duplicate network requests
* API loops
* `undefined` IDs
* Missing AI scope
* Missing event scope
* Exposed secrets
* Production build failures
* PDF worker failures
* Horizontal overflow

Search for secrets before completion:

```bash
git status --short
git diff --cached --name-only
rg "SUPABASE_SERVICE_ROLE|INVITE_CODE_PEPPER" .
```

Real secrets must not appear in tracked files.

---

# Part 10: Required manual verification

Manually verify these flows where possible.

## Flow A: new user

```text
Sign up with name
→ No AI
→ /chat no-AI state
→ Create AI or Join AI
```

## Flow B: existing owner

```text
Sign in
→ Last selected AI
→ New chat
→ Ask document question
→ Open citation
→ Sidebar collapses
→ Chat and PDF use balanced space
→ PDF is readable
```

## Flow C: user profile

```text
Open profile
→ Update name
→ Header updates
→ Member/owner displays update
→ Chat can use verified name appropriately
```

## Flow D: events

```text
Owner opens Events
→ Creates Pinequest Hackathon Opening
→ Edits event
→ Member can view it
→ Member asks when the hackathon starts
→ AI returns exact structured date/time
→ Event source chip appears
```

## Flow E: event permissions

```text
Member manually opens owner event-management route
→ Access denied

Member calls create/edit/delete event API
→ 403
```

## Flow F: multiple AIs

```text
AI A has Event A and Document A
AI B has Event B and Document B
→ Chat in AI A never exposes AI B data
→ Chat in AI B never exposes AI A data
```

## Flow G: invitations

```text
Owner generates invite
→ New account opens link
→ Signs up with required name
→ Invite survives authentication
→ Joins as member
→ Can view events and documents
→ Cannot manage them
```

## Flow H: responsive layout

```text
Desktop with PDF open
→ Sidebar collapsible
→ Chat/PDF approximately 50/50

Mobile with PDF open
→ Full-screen source view
→ Return to chat works
```

---

# Part 11: Demo data and presentation readiness

Do not hardcode demo entities.

The product should support stable demo data created through the UI.

Recommended demo AI:

```text
Pinequest Hackathon Rules
```

Recommended event:

```text
Title: Pinequest Hackathon Opening
Description: Official opening session and participant briefing.
Start: a known future date/time
Timezone: Asia/Ulaanbaatar
Location: Pinecone Academy
```

Recommended event questions:

* When does the Pinequest Hackathon begin?
* Where is the opening session?
* What is the next scheduled event?
* Are there any events this week?

The exact answers must come from structured event data.

Update `DEMO_CHECKLIST.md` with:

* Required environment variables
* Migration command
* Prepared accounts
* Demo AIs
* Processed PDFs
* Demo events
* Exact document questions
* Exact event questions
* Invitation test
* PDF layout test
* Build/start commands
* Fallback plan

---

# Explicit non-goals

Do not implement:

* Action/workflow builder
* Leave-request workflow
* Approval inbox
* Email notifications
* Push notifications
* Google Calendar integration
* Recurring events
* Public events
* RSVP
* Organization containers
* Platform administrators
* Multiple owners
* Billing
* Analytics dashboards
* AI marketplace
* Model selection
* Temporary chat uploads
* Conversation sharing
* AI cloning
* Major presentation-page redesign
* Perfect PDF coordinate highlighting

---

# Completion criteria

Do not consider the task complete until all of these are true:

## PDF workspace

* Conversation sidebar collapses.
* PDF opens at a readable size.
* Chat and PDF share the main working space approximately evenly.
* Mobile uses an appropriate full-screen source experience.
* Page navigation, excerpt, close, and download work.

## User names

* Signup requires name.
* Existing users have a safe migration/completion path.
* Name is editable.
* Name is consistently displayed.
* Server-verified name is available to chat.

## Events

* Owner can create, edit, cancel, and delete.
* Member can view but not manage.
* Events are AI-scoped.
* Dates use UTC plus IANA timezone.
* Chat answers event questions accurately.
* Event sources are structured and visually distinct.
* Events never leak across AIs.

## Existing product

* Authentication works.
* No-AI flow works.
* AI selection works.
* Chat persists.
* Conversations remain isolated.
* Document retrieval remains isolated.
* Invitations work.
* Owner/member security works.
* PDF authorization works.
* No redirect loops.
* No malformed routes.
* No major console errors.
* Tests pass.
* Type checking passes.
* Production build passes.

---

# Final response format

After implementation, report:

1. What was implemented
2. PDF/sidebar layout changes
3. User-profile/name changes
4. Event architecture and chat integration
5. Database migration details
6. Environment variables added or changed
7. Major files created or modified
8. Security and authorization changes
9. Tests, lint, typecheck, and build results
10. Manual flows verified
11. Remaining limitations
12. Exact migration commands
13. Exact local run commands
14. Exact demo preparation steps

Do not return a speculative roadmap.

Begin by inspecting Git state, package scripts, Prisma schema, authentication/profile handling, chat layout, PDF viewer, AI-management navigation, chat service, retrieval pipeline, and existing tests. Then implement the work in the priority order defined above.
