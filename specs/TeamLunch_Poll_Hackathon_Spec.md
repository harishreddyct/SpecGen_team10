# Story: TeamLunch Poll

```yaml
id: S-1
ref: STORY::TEAM-TOOLS::[1]::S1
tier: 2
sequence: 1
status: APPROVED
owner: @SaulAryehKohn
last_updated: 2026-09-17T09:00
blocked_by: []
figma_refs: []
slug: teamlunch-poll
parent_slug: team-tools
qa_required: false
```

## Summary

A lightweight poll so an organizer can propose lunch options and teammates
can vote on one, without accounts or setup. Organizer creates a poll, shares
a link, teammates vote, organizer closes the poll to lock in results.

## User story

- As an **organizer**, I want to create a poll with a few lunch options so
  my team can vote on where to eat.
- As a **voter**, I want to open the link, see the options, and cast my
  vote without creating an account.
- As an **organizer**, I want to close the poll when it's time to decide.

## Scope

**In scope:**
- Creating a poll with a title and 2–5 options
- Generating a shareable link on creation
- Voting by name + option selection, no account
- Organizer-initiated poll closing and final results view
- Local setup via a single documented command, with a README clear enough
  to run without asking the author for help

**Out of scope:**
- Multiple concurrent polls per organizer / organizer dashboard
- Editing poll options after creation
- Notifications (email, Slack, etc.) when a poll closes

## Designs

No Figma designs for this story — functional layout only, no dedicated
visual design required.

## Acceptance criteria

1. Given a poll has been created with 2–5 options, when a teammate opens
   the shareable link, then they see the poll title and all options listed.
2. Given a teammate has entered their name and selected one option, when
   they submit, then the vote count for that option increases by exactly
   one and the submission is confirmed on screen.
3. Given the organizer has clicked "Close Poll," when any user visits the
   link afterward, then they see the final results instead of the voting
   form.
4. Vote counts update in real time for all viewers.
5. Given a fresh clone of the repository, when a reviewer follows the
   README's setup instructions, then the app is running locally and
   reachable at the documented URL, with no undocumented steps required.

## API contract

**Endpoint:** `POST /api/polls/{pollId}/votes`

**Request:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `voterName` | string | yes | Display name shown next to the vote; not verified against any identity system |
| `optionId` | string | yes | Must match one of the poll's existing option IDs |

**Response:** `{ status: "ok" | "error", voteId: string | null, errors: string[] }`

**Authorization requirements:** N/A — endpoint is intentionally open to
anyone holding the poll link, no auth required.

## Model & harness selection

```yaml
execution:
  model: null
  allowed_models: [Claude Haiku 4.5, Claude Sonnet 5]
  harness: null
  selected_at: null
  confirmed_at: null
```

| Field | Value |
|---|---|
| Model | **Claude Haiku 4.5 or Claude Sonnet 5 — hackathon hard rule, no other models permitted** |
| Harness | Flexible — each team selects at kickoff, configured to call one of the two allowed models |
| Selected at creation | — (team selects at time of kickoff) |
| Confirmed at `IN_PROGRESS` | — |

## Implementation reference

| File | Function |
|---|---|
| _(empty — populates once implementation starts)_ | |

**Linked PR:** _(not yet opened)_

## Testing notes

_(empty — populates during/after implementation; every acceptance
criterion must map to at least one Testing Notes entry before `DONE`)_

## Open questions & decisions

| Question | Status | Decision | Resolved |
|---|---|---|---|
| Should vote counts be visible to a voter before they cast their own vote, or hidden until after voting? | Open | — | — |

## Refs

- **Epic:** 
- **Relates to:** 
- **Blocked by:** none

## Status history

| Status | Timestamp | By | Note |
|---|---|---|---|
| `DRAFT` | 2026-09-10 | @SaulAryehKohn | opened |
| `APPROVED` | 2026-09-22 | @SaulAryehKohn | approved for build |
