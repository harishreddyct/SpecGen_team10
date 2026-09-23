# Acceptance Criteria

## Poll Creation

### AC-001 — Successful Poll Creation

**Given** an organizer fills in a title and 2–5 non-empty options
**When** they submit the create-poll form
**Then** a poll is created
**And** a shareable link is generated and displayed
**And** the organizer is taken to that poll's page

### AC-002 — Copy Link Affordance

**Given** the organizer is on the poll page after creation
**When** they click the "Copy Link" control next to the shareable link
**Then** the poll's shareable URL is copied to the clipboard
**And** a brief on-screen confirmation (e.g. "Link copied") is shown

### AC-003 — Option Count Validation

**Given** an organizer attempts to submit a poll with fewer than 2 or more than 5 options
**When** they submit the form
**Then** submission is blocked
**And** an inline message states the allowed range (2–5 options)

### AC-004 — Required Field Validation

**Given** an organizer leaves the title blank or leaves an option field blank
**When** they attempt to submit
**Then** submission is blocked
**And** the relevant field shows an inline error

---

## Viewing a Poll (Source AC-1)

### AC-005 — Poll Link Shows Title and Options

**Given** a poll has been created with 2–5 options
**When** a teammate opens the shareable link
**Then** they see the poll title and all options listed

### AC-006 — Poll Not Found

**Given** a link references a poll ID that does not exist
**When** a user opens that link
**Then** a "Poll not found" state is shown instead of a voting form or results

---

## Voting (Source AC-2)

### AC-007 — Successful Vote

**Given** a teammate has entered their name and selected one option
**When** they submit
**Then** the vote count for that option increases by exactly one
**And** the submission is confirmed on screen

### AC-008 — Vote Missing Name or Option

**Given** a teammate submits the voting form without a name or without selecting an option
**When** they attempt to submit
**Then** submission is blocked
**And** an inline error identifies the missing field

### AC-009 — Vote on Invalid Option

**Given** a vote request references an `optionId` that does not belong to the poll
**When** the request is submitted
**Then** the vote is rejected
**And** the response has `status: "error"` with a descriptive entry in `errors`

### AC-010 — Vote After Poll Closed

**Given** the poll has already been closed
**When** a vote request is submitted for that poll
**Then** the vote is rejected
**And** the response has `status: "error"` with a descriptive entry in `errors`

### AC-011 — Duplicate Vote Blocked Client-Side

**Given** a voter has cast a confirmed vote in this browser session
**When** they attempt to submit the voting form again without reloading the page
**Then** the submit control is disabled
**And** no second vote request is sent to the server

---

## Closing the Poll (Source AC-3)

### AC-012 — Close Poll Control Visibility

**Given** a poll has just been created
**When** the "Close Poll" control's visibility is checked
**Then** it is shown only in the browser that created the poll (the one holding the `organizerOf:{pollId}` localStorage flag, per [navigation-flows.md](navigation-flows.md))
**And** it is not shown to any other browser that opens the same link

### AC-013 — Organizer Closes Poll

**Given** the organizer clicks "Close Poll"
**When** the close action completes
**Then** the poll's state becomes closed
**And** any user who visits the link afterward sees the final results instead of the voting form

### AC-014 — Results Are Final After Close

**Given** the poll is closed
**When** any viewer loads the poll page
**Then** the vote counts shown match the counts at the moment of closing
**And** no voting form is rendered

### AC-015 — Close Requested on an Already-Closed Poll

**Given** the poll has already been closed
**When** a close request is submitted for that poll again
**Then** the server returns `409 POLL_ALREADY_CLOSED`
**And** the client treats it as a no-op and shows the final results view

---

## Real-Time Updates (Source AC-4)

### AC-016 — Live Vote Count Propagation

**Given** two or more viewers have the poll page open at the same time
**When** one of them casts a vote
**Then** the other viewers' vote counts update without a manual page refresh
**And** the update is visible within 3 seconds of the vote being recorded on the server

### AC-017 — Live Close Propagation

**Given** two or more viewers have the poll page open while the poll is still open
**When** the organizer closes the poll
**Then** all open viewers transition to the final results view without a manual page refresh
**And** the transition is visible within 3 seconds of the close being recorded on the server

---

## Local Setup (Source AC-5)

### AC-018 — Fresh Clone Runs Locally

**Given** a fresh clone of the repository
**When** a reviewer follows the README's setup instructions
**Then** the app is running locally and reachable at the documented URL
**And** no undocumented steps are required
