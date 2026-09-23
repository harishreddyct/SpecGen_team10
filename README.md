# TeamLunch Poll

A lightweight, account-free poll so an organizer can propose a few lunch
options and the team can vote on one in real time. Create a poll, share the
link, vote, close it to lock in the result — no sign-up, no setup.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer (this project uses npm workspaces)

## Run it locally

From the repository root:

```
npm install
npm run dev
```

Open **http://localhost:5173** — that's the whole app.

The backend API runs at `http://localhost:4000`, but you don't need to touch
it directly: the Vite dev server proxies `/api` and the WebSocket connection
to it automatically.

No other setup, environment variables, or seed data are required.

## Run the tests

```
npm test
```

This runs the backend Jest suite (`PollService`, `PollController`, and the
Socket.IO broadcast) followed by the frontend Vitest + React Testing Library
suite.

## How it works

1. **Create** — an organizer fills in a title and 2–5 lunch options at `/`.
2. **Share** — on creation, a shareable link (`/polls/:pollId`) is generated
   and shown immediately, with a copy-to-clipboard button.
3. **Vote** — anyone with the link opens it, enters their name, picks an
   option, and submits. No account required.
4. **Watch live** — vote counts update for every open viewer within seconds,
   over a Socket.IO connection scoped to that poll.
5. **Close** — the organizer (the browser that created the poll) clicks
   "Close Poll." Every viewer immediately switches to a final, locked
   results view; further votes are rejected.

The "Close Poll" button is shown only in the browser that created the poll
(tracked via a `localStorage` flag) — this is a client-side convenience, not
real authorization. Anyone holding the link can still vote or close the poll
directly through the API. This is a deliberate, documented scope boundary
for this build (see `specs/`), not an oversight.

## Project layout

```
server/   Express + TypeScript + Socket.IO backend (in-memory data store)
client/   React + TypeScript frontend (Vite)
specs/    Source specification this implementation was built from
```

### Backend

| File | Responsibility |
|---|---|
| `server/src/PollService.ts` | Poll business rules: create, vote, close |
| `server/src/PollStore.ts` | In-memory storage; vote counts are always derived, never stored |
| `server/src/PollSocketGateway.ts` | Socket.IO room-per-poll broadcasts |
| `server/src/PollController.ts` | HTTP routes (`/api/polls...`) |

### Frontend

| File | Responsibility |
|---|---|
| `client/src/pages/CreatePollPage.tsx` | Poll creation form |
| `client/src/pages/PollPage.tsx` | Shared-link destination: voting, live results, or final results |
| `client/src/components/VotingForm.tsx` | Name + option submission |
| `client/src/components/LiveResultsList.tsx` / `FinalResultsView.tsx` | Result rendering, open vs. closed |
| `client/src/components/CloseByOrganizerControl.tsx` | Organizer-only close action |
| `client/src/api/PollApiClient.ts` | HTTP client |
| `client/src/realtime/PollRealtimeClient.ts` | WebSocket client |

## Out of scope (by design)

- Multiple concurrent polls per organizer / an organizer dashboard
- Editing poll options after creation
- Notifications when a poll closes
- Accounts, authentication, or verified voter identity
- Durable storage beyond the running process's lifetime

See `specs/feature-overview.md` for the full rationale.
