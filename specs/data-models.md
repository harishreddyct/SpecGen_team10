# Data Models

## `Poll`

```typescript
interface Poll {
  pollId: string;          // unguessable ID (e.g. UUID); doubles as the share-link path segment
  title: string;
  status: 'open' | 'closed';
  options: PollOption[];
  createdAt: string;       // ISO 8601
  closedAt: string | null; // ISO 8601, set when status transitions to 'closed'
}
```

### Fields

| Field       | Type                   | Required | Notes                                                        |
|-------------|------------------------|----------|----------------------------------------------------------------|
| `pollId`    | string                 | yes      | Unguessable ID (e.g. UUID); doubles as the share-link path segment |
| `title`     | string                 | yes      | Non-empty poll title                                          |
| `status`    | `'open' \| 'closed'`   | yes      | Starts `'open'`; transitions once to `'closed'`                |
| `options`   | `PollOption[]`         | yes      | Always 2–5 entries                                             |
| `createdAt` | string (ISO 8601)      | yes      | Set at creation time                                           |
| `closedAt`  | string (ISO 8601) or null | yes   | `null` until `closePoll` succeeds, then set once               |

---

## `PollOption`

```typescript
interface PollOption {
  optionId: string;
  text: string;
  voteCount: number;       // derived: count of Vote records with this optionId
}
```

### Fields

| Field       | Type   | Required | Notes                                                 |
|-------------|--------|----------|----------------------------------------------------------|
| `optionId`  | string | yes      | Unique within the parent poll                            |
| `text`      | string | yes      | Non-empty option label supplied at poll creation          |
| `voteCount` | number | yes      | Derived count of `Vote` records referencing this `optionId` |

---

## `Vote`

```typescript
interface Vote {
  voteId: string;
  pollId: string;
  optionId: string;
  voterName: string;       // free-text display name, not identity-verified
  createdAt: string;       // ISO 8601
}
```

### Fields

| Field       | Type   | Required | Notes                                                    |
|-------------|--------|----------|--------------------------------------------------------------|
| `voteId`    | string | yes      | Unique identifier for this vote record                        |
| `pollId`    | string | yes      | The poll this vote belongs to                                 |
| `optionId`  | string | yes      | Must reference an existing `PollOption.optionId` on that poll |
| `voterName` | string | yes      | Free-text display name, 1–50 characters; not verified against any identity system |
| `createdAt` | string (ISO 8601) | yes | Set when the vote is recorded                            |

---

**Invariants:**

- `Poll.options.length` is always between 2 and 5 (enforced at creation; see `INVALID_OPTION_COUNT` in [api-contracts.md](api-contracts.md)).
- A `Vote` can only be recorded while `Poll.status === 'open'`; once `closed`, no further `Vote` records are created (AC-010).
- `PollOption.voteCount` is always the count of `Vote` records referencing that `optionId` — it is never stored independently and cannot drift from the underlying votes.
- `Poll.closedAt` is `null` until `closePoll` is called exactly once; closing is idempotent from the client's perspective (`POLL_ALREADY_CLOSED` on a second attempt).
