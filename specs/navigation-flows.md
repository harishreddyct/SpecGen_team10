# Navigation Flows

## Route Map

| Route              | Page              | Notes                                                   |
|---------------------|-------------------|-----------------------------------------------------------|
| `/`                  | `CreatePollPage`  | Landing page; organizer starts here                       |
| `/polls/:pollId`     | `PollPage`        | Shared link destination; renders differently by poll state and viewer role |

There is no separate route for voters vs. the organizer — both land on `/polls/:pollId`. There is no server-side organizer identity: the API accepts a close request from anyone (see [api-contracts.md](api-contracts.md)). The client narrows *who sees the button* as follows:

- When `CreatePollPage` successfully creates a poll, it writes `localStorage.setItem('organizerOf:' + pollId, '1')` in the browser that created it, then navigates to `/polls/:pollId`.
- `PollPage` shows the "Close Poll" control only when `localStorage.getItem('organizerOf:' + pollId)` is set in that browser.
- This is a client-side convenience only, not access control — anyone who has the link can still call `POST /api/polls/{pollId}/close` directly. This is a documented, in-scope limitation (see the open question on organizer identity in [user-stories.md](user-stories.md)).
- If `localStorage` is unavailable (e.g. private-browsing mode, or a browser blocking storage access) the `setItem`/`getItem` calls are wrapped in a try/catch and treated as "not the organizer" on failure — the "Close Poll" control simply does not render in that browser, with no error shown, since the poll itself is unaffected and the link still works normally for voting.

## Flow: Create → Share

```
CreatePollPage
  └─ Fill title + 2–5 options, tap "Create Poll"
       └─ POST /api/polls succeeds
            └─ localStorage: set organizerOf:{pollId} = '1' in this browser
            └─ Navigate to /polls/{pollId}
                 └─ Share link + "Close Poll" control shown (this browser only)
```

## Flow: Vote (poll open)

```
/polls/{pollId} (poll status: open)
  └─ VotingForm shown alongside LiveResultsList
       └─ Enter name + select option, submit
            └─ POST /api/polls/{pollId}/votes succeeds
                 └─ On-screen confirmation shown
                 └─ VotingForm disabled for this session (see error-handling.md)
                 └─ LiveResultsList updates for this viewer and all others via WebSocket
```

## Flow: Close → Final Results

```
/polls/{pollId} (poll status: open)
  └─ "Close Poll" tapped
       └─ POST /api/polls/{pollId}/close succeeds
            └─ poll:closed WebSocket event broadcast
                 └─ All connected viewers transition to FinalResultsView
                 └─ VotingForm is unmounted for anyone still viewing

/polls/{pollId} (poll status: closed, fresh page load)
  └─ GET /api/polls/{pollId} returns status: "closed"
       └─ FinalResultsView rendered directly; VotingForm never mounts
```

## Flow: Poll Not Found

```
/polls/{pollId} (unknown pollId)
  └─ GET /api/polls/{pollId} returns 404 POLL_NOT_FOUND
       └─ "Poll not found" state rendered; no form, no results
```
