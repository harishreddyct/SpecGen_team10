# API Contracts

## Authentication

None. All endpoints are unauthenticated by design — a poll's link (its `pollId`) is the only access control, and the voting endpoint is intentionally open to anyone holding it (per the source spec's "Authorization requirements: N/A").

| Header          | Value                        |
|-----------------|------------------------------|
| `Content-Type`  | `application/json`           |
| `Accept`        | `application/json`           |

---

## Create Poll

**Method:** `POST`
**Path:** `/api/polls`

#### Request Body

```json
{
  "title": "Where should we eat Friday?",
  "options": ["Tacos", "Pizza", "Ramen"]
}
```

| Field     | Type       | Required | Notes                                   |
|-----------|------------|----------|------------------------------------------|
| `title`   | string     | yes      | Non-empty poll title                     |
| `options` | string[]   | yes      | 2–5 non-empty option labels              |

#### Success Response — 201 Created

```json
{
  "pollId": "plz_9f2c1a",
  "shareUrl": "https://teamlunch.example.com/polls/plz_9f2c1a",
  "title": "Where should we eat Friday?",
  "status": "open",
  "options": [
    { "optionId": "opt_1", "text": "Tacos", "voteCount": 0 },
    { "optionId": "opt_2", "text": "Pizza", "voteCount": 0 },
    { "optionId": "opt_3", "text": "Ramen", "voteCount": 0 }
  ]
}
```

#### Error Responses

Every 4xx and 5xx response from this endpoint uses the same body shape:

```json
{
  "code": "INVALID_TITLE",
  "message": "Title is required."
}
```

| HTTP Status | Error Code          | Client Action                                   |
|-------------|----------------------|--------------------------------------------------|
| 400         | `INVALID_TITLE`      | Show inline error: title is required             |
| 400         | `INVALID_OPTION_COUNT` | Show inline error: 2–5 options required        |
| 400         | `INVALID_OPTION`     | Show inline error: an option is empty            |
| 5xx         | `SERVER_ERROR`       | Show a generic error banner ("Something went wrong. Try again.") with a retry action |

---

## Get Poll

**Method:** `GET`
**Path:** `/api/polls/{pollId}`

#### Success Response — 200 OK

```json
{
  "pollId": "plz_9f2c1a",
  "shareUrl": "https://teamlunch.example.com/polls/plz_9f2c1a",
  "title": "Where should we eat Friday?",
  "status": "open",
  "options": [
    { "optionId": "opt_1", "text": "Tacos", "voteCount": 3 },
    { "optionId": "opt_2", "text": "Pizza", "voteCount": 1 },
    { "optionId": "opt_3", "text": "Ramen", "voteCount": 0 }
  ]
}
```

`status` is `"open"` or `"closed"`. When `"closed"`, the client renders `FinalResultsView` instead of `VotingForm` (see [navigation-flows.md](navigation-flows.md)). `shareUrl` is always included, identical in shape to the one returned by `POST /api/polls`, so a fresh page load (e.g. the organizer reopening the poll in a new tab) can display the share link without the client reconstructing it from `window.location`.

#### Error Responses

Both use the same `{ code, message }` body shape as [Create Poll](#create-poll):

| HTTP Status | Error Code      | Client Action                    |
|-------------|------------------|------------------------------------|
| 404         | `POLL_NOT_FOUND` | Show "Poll not found" state (AC-006) |
| 5xx         | `SERVER_ERROR`   | Show a generic error banner ("Something went wrong. Try again.") with a retry action |

---

## Cast Vote (source contract)

**Method:** `POST`
**Path:** `/api/polls/{pollId}/votes`

#### Request Body

| Field       | Type   | Required | Notes                                                              |
|-------------|--------|----------|----------------------------------------------------------------------|
| `voterName` | string | yes      | Display name shown next to the vote; 1–50 characters; not verified against any identity system |
| `optionId`  | string | yes      | Must match one of the poll's existing option IDs                    |

```json
{
  "voterName": "Priya",
  "optionId": "opt_1"
}
```

#### Success Response — 200 OK

```json
{
  "status": "ok",
  "voteId": "vote_7a1e",
  "errors": []
}
```

#### Error Responses

There are two distinct error shapes on this endpoint, by design: business-rule failures (invalid option, closed poll) stay within the source contract's `{ status, voteId, errors }` shape so the client can distinguish "your vote wasn't counted" from "your request was malformed," while malformed requests and infrastructure failures use the same `{ code, message }` shape as every other endpoint.

**Business-rule failure — 200 OK, `status: "error"`:**

```json
{
  "status": "error",
  "voteId": null,
  "errors": ["Poll is closed"]
}
```

**Malformed request or server failure — 400/404/5xx:**

```json
{
  "code": "VOTER_NAME_REQUIRED",
  "message": "voterName is required."
}
```

| Condition                          | Response Shape                                   | HTTP Status |
|-------------------------------------|-----------------------------------------------------|-------------|
| Missing `voterName`                 | `{ code: "VOTER_NAME_REQUIRED", message }`          | 400 |
| Missing `optionId`                  | `{ code: "OPTION_ID_REQUIRED", message }`           | 400 |
| `voterName` longer than 50 characters | `{ code: "VOTER_NAME_TOO_LONG", message }`        | 400 |
| `optionId` not part of this poll    | `{ status: "error", voteId: null, errors: ["Unknown option"] }` | 200 |
| Poll already closed                 | `{ status: "error", voteId: null, errors: ["Poll is closed"] }` | 200 |
| `pollId` does not exist             | `{ code: "POLL_NOT_FOUND", message }`               | 404 |
| Unhandled server error              | `{ code: "SERVER_ERROR", message }`                 | 5xx — client shows a generic error banner with a retry action |

**Authorization requirements:** N/A — endpoint is intentionally open to anyone holding the poll link, no auth required (verbatim from source spec).

---

## Close Poll

**Method:** `POST`
**Path:** `/api/polls/{pollId}/close`

#### Request Body

None. `pollId` is taken from the path; no body is required.

#### Success Response — 200 OK

```json
{
  "pollId": "plz_9f2c1a",
  "title": "Where should we eat Friday?",
  "status": "closed",
  "options": [
    { "optionId": "opt_1", "text": "Tacos", "voteCount": 3 },
    { "optionId": "opt_2", "text": "Pizza", "voteCount": 1 },
    { "optionId": "opt_3", "text": "Ramen", "voteCount": 0 }
  ]
}
```

`title` is always included so `FinalResultsView` can render the poll heading without depending on previously cached state.

#### Error Responses

| HTTP Status | Error Code          | Client Action                          |
|-------------|----------------------|-------------------------------------------|
| 404         | `POLL_NOT_FOUND`     | Show "Poll not found" state               |
| 409         | `POLL_ALREADY_CLOSED`| No-op; refresh to show final results view |
| 5xx         | `SERVER_ERROR`       | Show a generic error banner ("Something went wrong. Try again.") with a retry action |

**Authorization requirements:** N/A — same open-link model as voting. There is no organizer identity check; anyone with the link can close the poll. This is a known, open design point — see [user-stories.md](user-stories.md) and the "Open questions & decisions" table in the source spec.

---

## Real-Time Events (WebSocket)

Not part of the REST contract, but delivered over the same `pollId`-scoped channel described in [technical-architecture.md](technical-architecture.md).

| Event            | Direction        | Payload                                                | Trigger                     |
|-------------------|------------------|---------------------------------------------------------|-------------------------------|
| `poll:join`       | client → server  | `{ pollId }`                                             | `PollPage` mounts             |
| `poll:leave`      | client → server  | `{ pollId }`                                             | `PollPage` unmounts, or the socket disconnects |
| `vote:recorded`   | server → client  | `{ pollId, options: [{ optionId, text, voteCount }] }`   | A vote is successfully cast   |
| `poll:closed`     | server → client  | `{ pollId, title, status: "closed", options: [{ optionId, text, voteCount }] }` | The poll is closed |

Server-to-client events carry the full option list with `text` included, matching `PollOption` in [data-models.md](data-models.md), so `LiveResultsList` and `FinalResultsView` can render directly from the event payload without an extra fetch.

---

## Error Code Reference

| Code                    | Trigger                                       | Client Action                         |
|--------------------------|-----------------------------------------------|-----------------------------------------|
| `INVALID_TITLE`          | Poll title missing or empty                   | Inline field error                      |
| `INVALID_OPTION_COUNT`   | Fewer than 2 or more than 5 options submitted | Inline error near option list           |
| `INVALID_OPTION`         | An option label is empty                      | Inline field error                      |
| `VOTER_NAME_REQUIRED`    | Vote submitted without `voterName`            | Inline field error                      |
| `OPTION_ID_REQUIRED`     | Vote submitted without `optionId`             | Inline field error                      |
| `VOTER_NAME_TOO_LONG`    | `voterName` exceeds 50 characters             | Inline field error                      |
| `POLL_NOT_FOUND`         | `pollId` does not match any known poll        | "Poll not found" page state             |
| `POLL_ALREADY_CLOSED`    | Close requested on an already-closed poll     | No-op / refresh to results              |
| `"Unknown option"`       | `optionId` not part of this poll's options    | Generic vote error banner               |
| `"Poll is closed"`       | Vote submitted after organizer closed the poll| Redirect to final results view          |
| `SERVER_ERROR`           | Unhandled exception on the server (any endpoint) | Generic error banner with retry      |
