# Feature Overview

## Feature Name

TeamLunch Poll

## Problem Statement

Teams frequently need to agree on where to eat lunch, but coordinating that decision today means an ad-hoc thread in chat, informal head-counting, and no clear record of the result. There is no lightweight, account-free way for one person to propose a few options and let the team vote in real time.

## Goals

1. Let an organizer create a poll with a title and 2–5 lunch options in under a minute, with no account or setup.
2. Generate a shareable link the moment the poll is created.
3. Let any teammate holding the link vote by name and option, with no login.
4. Show vote counts updating in real time for everyone viewing the poll.
5. Let the organizer close the poll and lock in a final result.
6. Ship with a README clear enough that a reviewer can clone the repo and run the app locally with a single documented command, no undocumented steps.

## Non-Goals

- Multiple concurrent polls per organizer, or an organizer dashboard listing past polls.
- Editing poll options after the poll has been created.
- Notifications (email, Slack, push, etc.) when a poll closes.
- Accounts, authentication, or identity verification of any kind.
- Persisting data beyond the process lifetime (no durability guarantee required).

## Assumptions

- This is a hackathon deliverable: a single small web app (frontend + backend), not a native mobile app.
- "No account" means voter identity is a free-text display name, not verified against any identity system — trust is not a concern in scope for this feature.
- A single poll is viewed by a small number of concurrent teammates (team-lunch scale, not public-internet scale); no load/scale requirements are defined.
- The organizer is simply the first person to have the poll's link before closing it — there is no organizer authentication. Anyone with the link can close the poll. This is called out explicitly as an open point in [user-stories.md](user-stories.md).
- "Real time" (AC-016, Source AC-4) means all open viewers see vote count changes without manually refreshing the page, within 3 seconds of the server recording the change.
- Full assumptions list: see this section; no separate `assumptions.md` exists for this hackathon-scale spec.

## Business Goal

Give teams a zero-friction way to make a group lunch decision, replacing informal chat threads with a single link that shows a clear, live result. Success is a working, demoable flow: create → share → vote → close → see result — built end-to-end within the hackathon window by a two-model-constrained team (see Model & Harness Constraint below).

## User Story

As an organizer,
I want to create a poll with a few lunch options and share a link,
So that my team can vote and I can close the poll to lock in where we're eating.

As a voter,
I want to open the link, see the options, and cast my vote without creating an account,
So that voting takes seconds, not a sign-up flow.

## Supported Platforms

- Web (responsive — usable on both desktop and mobile browsers)

## Model & Harness Constraint

This feature is being generated under a hackathon hard rule: implementation must be produced using **Claude Haiku 4.5 or Claude Sonnet 5 only** (no other models permitted). Harness choice is flexible per team, as long as it calls one of the two allowed models. See the source spec's `execution` block for the formal record of model/harness selection.

## Architecture Standards

- Node.js + TypeScript backend (Express)
- React + TypeScript frontend
- WebSocket-based real-time updates (see [technical-architecture.md](technical-architecture.md))
- In-memory or embedded (e.g. SQLite) data store — no external database dependency required for a hackathon build
- Single documented local run command (e.g. `npm run dev`), captured in the project README

## Dependencies

| Dependency          | Purpose                                                        |
|---------------------|------------------------------------------------------------------|
| `PollService`       | Creates polls, records votes, closes polls (server-side)        |
| `PollStore`         | In-memory/embedded persistence for polls, options, and votes     |
| `PollSocketGateway`  | Broadcasts live vote-count updates to connected clients          |
| `PollApiClient`      | Frontend HTTP client for poll create/read/vote/close calls       |
| `PollRealtimeClient` | Frontend WebSocket client that subscribes to a poll's updates    |

## Navigation Flow

```
CreatePollPage
  └─ Submit (title + 2–5 options) → PollPage/{pollId} (organizer view, share link shown)

PollPage/{pollId} (shared link)
  ├─ Poll open   → Voting form (name + option) → submit → live-updating results on same page
  └─ Poll closed → Final results view (voting form not shown)

PollPage/{pollId} (organizer only)
  └─ "Close Poll" action → poll transitions to closed → all viewers see final results
```

See [navigation-flows.md](navigation-flows.md) for full detail.

## Security Requirements

- No PII beyond a free-text voter display name; never require or store email, phone, or any identity-verifying data.
- The voting endpoint is intentionally open to anyone holding the poll link — this is a documented, in-scope design decision, not an oversight (see [api-contracts.md](api-contracts.md)).
- All user-supplied strings — voter display names, the poll title, and option labels — are rendered as plain text and must be escaped/sanitized on output to prevent stored XSS. None of these fields may ever be passed through `dangerouslySetInnerHTML` or an equivalent raw-HTML sink.
- Poll IDs must be unguessable (e.g. a UUID or sufficiently random slug), since the link itself is the only access control.

## Generated Artifacts

### UI Layer (React)
- `CreatePollPage`
- `PollOptionsForm`
- `PollPage`
- `VotingForm`
- `LiveResultsList`
- `FinalResultsView`
- `CloseByOrganizerControl`

### Server Layer
- `PollController` (HTTP routes)
- `PollSocketGateway` (WebSocket broadcast)
- `PollService`
- `PollStore` (interface) / `InMemoryPollStore` (implementation)

### Models
- `Poll`
- `PollOption`
- `Vote`

See [data-models.md](data-models.md) for full shapes.

### Tests
- `PollService.test.ts`
- `PollController.test.ts`
- `PollPage.test.tsx`
- `VotingForm.test.tsx`
- End-to-end happy path: create → vote → close → view results

## Design

- Figma: N/A — no Figma designs exist for this story. Per the source spec, this is a functional-layout-only feature with no dedicated visual design required; UI code generation should follow the component structure in [technical-architecture.md](technical-architecture.md) rather than a design file.
