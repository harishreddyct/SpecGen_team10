# Technical Architecture

## Pattern

Thin client-server web app: a React frontend talking to an Express backend over HTTP for mutations and a Socket.IO channel for live updates. No mobile MVVM layer — this is a hackathon-scale web build, structured into standard Presentation, Domain, and Data layers below.

---

## Layer Diagram

```
┌───────────────────────────────────────────────────────────┐
│                        Frontend (React)                   │
│  CreatePollPage · PollPage · VotingForm                   │
│  LiveResultsList · FinalResultsView                       │
└───────────────┬─────────────────────────┬─────────────────┘
                │ HTTP (fetch)             │ WebSocket
┌───────────────▼─────────────┐   ┌────────▼───────────────┐
│      PollApiClient          │   │   PollRealtimeClient    │
└───────────────┬─────────────┘   └────────┬───────────────┘
                │                          │
┌───────────────▼──────────────────────────▼─────────────────┐
│                     Backend (Node, TypeScript)               │
│  PollController (HTTP routes)                                │
│  PollSocketGateway (WebSocket broadcast on vote and close)    │
│  PollService (create, vote, close, get)                       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                  ┌─────────▼──────────┐
                  │     PollStore      │
                  │ (in-memory or SQLite)│
                  └─────────────────────┘
```

---

## Presentation

The Presentation layer is the React frontend. Screens are thin — they call `PollApiClient` for mutations and `PollRealtimeClient` for live updates, and hold no business rules themselves.

Routing is provided by React Router v6 (`useParams` to read `:pollId`, `useNavigate` to move between pages).

### `CreatePollPage`
- Controlled form: title plus a dynamic list of 2 to 5 option inputs (rows can be added or removed, clamped to that range)
- On submit, calls `PollApiClient.createPoll()`; on success, navigates to `/polls/:pollId`

### `PollPage`
- Loads poll state via `PollApiClient.getPoll(pollId)` on mount
- Subscribes to `PollRealtimeClient` for the given `pollId` to receive live vote and close events
- Renders `VotingForm` plus `LiveResultsList` while the poll is open, or `FinalResultsView` once closed
- Shows the shareable link, and shows a "Close Poll" control only when `localStorage.getItem('organizerOf:' + pollId)` is present (see [navigation-flows.md](navigation-flows.md) for how that flag is set and why this is a client-side-only distinction, not real authorization)

### `VotingForm`
- Fields: display name (text, `maxLength=50`, matching the `voterName` limit in [api-contracts.md](api-contracts.md)), option (single-select, e.g. radio group)
- Disables submit until both fields are filled
- On submit, calls `PollApiClient.vote(pollId, { voterName, optionId })`
- On success, shows an inline confirmation and disables further submission for that session (see [error-handling.md](error-handling.md))

### `LiveResultsList` and `FinalResultsView`
- Pure render of a list of `{ optionId, text, voteCount }` entries (same field names as `PollOption` in [data-models.md](data-models.md))
- `LiveResultsList` re-renders on each WebSocket update; `FinalResultsView` renders once from the closed poll's final snapshot

### `CloseByOrganizerControl`
- Rendered by `PollPage` only when `localStorage.getItem('organizerOf:' + pollId)` is set in that browser (see [navigation-flows.md](navigation-flows.md))
- Props: `{ pollId: string, onClosed: (poll: Poll) => void }`
- On click, calls `PollApiClient.closePoll(pollId)`; on success, invokes `onClosed` with the returned closed `Poll` so `PollPage` can switch to `FinalResultsView` without waiting for its own WebSocket round-trip
- Shows a disabled, loading state between click and response; on failure, shows the generic error banner described in [error-handling.md](error-handling.md) and remains clickable to retry

---

## Domain

The Domain layer holds the poll business rules, independent of HTTP or storage details.

### `PollService`
- `createPoll(title, options): Poll` — validates 2 to 5 non-empty options and a non-empty title
- `getPoll(pollId): Poll`
- `castVote(pollId, voterName, optionId): Vote` — validates the poll is open and the option exists, persists the vote, then calls `PollSocketGateway.broadcastVote(pollId, poll)`
- `closePoll(pollId): Poll` — flips poll status to closed, then calls `PollSocketGateway.broadcastClose(pollId, poll)`

`PollSocketGateway` is constructor-injected into `PollService` (both instantiated once at server startup and wired together), so the Domain layer depends only on the small `PollSocketGateway` interface below, not on Socket.IO directly:

```typescript
interface PollSocketGateway {
  broadcastVote(pollId: string, poll: Poll): void;
  broadcastClose(pollId: string, poll: Poll): void;
}
```

### `PollSocketGateway`
- One Socket.IO room per `pollId`, named `poll:{pollId}`
- Client → server event `poll:join`, payload `{ pollId: string }` — server calls `socket.join('poll:' + pollId)`
- Client → server event `poll:leave`, payload `{ pollId: string }` — server calls `socket.leave('poll:' + pollId)`
- `PollPage` emits `poll:join` on mount and `poll:leave` on unmount, or when the socket disconnects and later reconnects, via `PollRealtimeClient`
- `broadcastVote` emits `vote:recorded` to room `poll:{pollId}` with the updated per-option counts
- `broadcastClose` emits `poll:closed` to room `poll:{pollId}` with the final results snapshot

### `PollController` (HTTP)

| Method | Path                          | Purpose                          |
|--------|-------------------------------|-----------------------------------|
| POST   | `/api/polls`                  | Create a poll                     |
| GET    | `/api/polls/{pollId}`         | Fetch poll state (options, counts, open or closed) |
| POST   | `/api/polls/{pollId}/votes`   | Cast a vote (source contract)     |
| POST   | `/api/polls/{pollId}/close`   | Close the poll                    |

See [api-contracts.md](api-contracts.md) for full request and response shapes.

---

## Data

The Data layer persists polls, options, and votes behind a single interface, so the Domain layer never depends on a specific storage technology.

### `PollStore` (interface)
```typescript
interface PollStore {
  create(poll: Poll): void;
  get(pollId: string): Poll | undefined;
  recordVote(pollId: string, vote: Vote): void;
  close(pollId: string): void;
}
```
- `InMemoryPollStore` is sufficient for the hackathon build (process-lifetime persistence, no durability requirement per [feature-overview.md](feature-overview.md))
- An embedded SQLite-backed implementation may be swapped in without changing `PollService` or the controller, since both depend only on the `PollStore` interface

---

## Real-Time Transport

- Socket.IO is used rather than plain polling, to satisfy the 3-second live-update requirement (AC-016) without repeated client polling overhead, and because its built-in room support maps directly onto one room per poll.
- Each poll has its own Socket.IO room keyed by `pollId`; broadcasts are scoped to that room so unrelated polls never cross-talk.

---

## Testing Strategy

| Layer              | Test Type   | Tools                                |
|---------------------|-------------|----------------------------------------|
| `PollService`        | Unit        | Jest, in-memory store                    |
| `PollController`      | Integration | Supertest against an in-memory server   |
| WebSocket broadcast   | Integration | Socket.IO client in test, assert events |
| React components      | Component   | React Testing Library                   |
| Happy-path flow       | End-to-end  | Create, vote, close, view results       |
