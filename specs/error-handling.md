# Error Handling

## Poll Creation

| Condition                        | Server Behavior                    | Client Behavior                                  |
|------------------------------------|---------------------------------------|------------------------------------------------------|
| Title empty                        | 400 `INVALID_TITLE`                  | Inline error under the title field                    |
| Fewer than 2 or more than 5 options| 400 `INVALID_OPTION_COUNT`           | Inline error near the options list                    |
| An option label is empty           | 400 `INVALID_OPTION`                 | Inline error on that option row                       |
| Server crash / unhandled exception | 5xx `SERVER_ERROR`                   | Generic error banner ("Something went wrong. Try again.") with a retry action |

## Voting

| Condition                                 | Server Behavior                                 | Client Behavior                                                |
|---------------------------------------------|------------------------------------------------|-------------------------------------------------------------------|
| `voterName` or `optionId` missing            | 400, `errors: ["... is required"]`             | Inline field error; form remains editable                          |
| `optionId` not part of this poll             | 200 `{ status: "error", errors: ["Unknown option"] }` | Generic error banner; form remains editable                 |
| Poll already closed at submit time           | 200 `{ status: "error", errors: ["Poll is closed"] }` | Redirect the viewer to the final results view (AC-010, Source AC-3) |
| `pollId` does not exist                      | 404 `POLL_NOT_FOUND`                            | "Poll not found" state                                              |
| Network failure / timeout                    | n/a (no response)                                | "Couldn't submit your vote. Try again." with a retry action        |
| Server crash / unhandled exception           | 5xx `SERVER_ERROR`                              | Generic error banner ("Something went wrong. Try again.") with a retry action |
| Duplicate submission in the same browser session | n/a (client-side guard)                     | Submit button disabled after a confirmed vote for that session (client-side only — see below) |

**Note on duplicate votes:** because there are no accounts, "one vote per person" is enforced only client-side (disabling the form after a confirmed submission for that browser session). The server does not deduplicate by name, since names are free text and not a reliable identity. This is a deliberate scope boundary, not a bug — see the out-of-scope list in [feature-overview.md](feature-overview.md).

## Closing the Poll

| Condition                        | Server Behavior                     | Client Behavior                                   |
|------------------------------------|----------------------------------------|--------------------------------------------------------|
| Poll already closed                | 409 `POLL_ALREADY_CLOSED`             | Treated as a no-op; view refreshes to final results (AC-015) |
| `pollId` does not exist            | 404 `POLL_NOT_FOUND`                  | "Poll not found" state                                  |
| Server crash / unhandled exception | 5xx `SERVER_ERROR`                    | Generic error banner ("Something went wrong. Try again.") with a retry action |

## Real-Time Channel

| Condition                          | Client Behavior                                                        |
|--------------------------------------|----------------------------------------------------------------------------|
| WebSocket connection drops           | Attempt reconnect with backoff; on reconnect, re-fetch `GET /api/polls/{pollId}` to resync state in case any events were missed |
| WebSocket never connects (blocked network) | Fall back to treating the page as static; a manual refresh still reflects the latest server state |

## General

- All server error responses follow the shape `{ status: "error", ... , errors: string[] }` or a 4xx/404/409 with a JSON error code, per [api-contracts.md](api-contracts.md).
- No error message ever includes another voter's name or any data beyond what the current user submitted.
