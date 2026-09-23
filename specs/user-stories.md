# User Stories

## US-001 — Create a Poll

**As an** organizer,
**I want to** create a poll with a title and 2–5 lunch options,
**So that** my team has something concrete to vote on.

### Acceptance Criteria
- Create form requires a title and between 2 and 5 non-empty options
- Submit is disabled until the title and at least 2 options are filled in
- On successful creation, a shareable link is generated and shown immediately
- The organizer is taken to the poll page for the newly created poll

---

## US-002 — Share the Poll

**As an** organizer,
**I want to** get a shareable link as soon as the poll is created,
**So that** I can send it to my team without any extra steps.

### Acceptance Criteria
- The link is displayed prominently on the poll page right after creation
- The link resolves to the same poll page any teammate can open directly
- A copy-to-clipboard affordance is available next to the link (AC-002)

---

## US-003 — Vote on a Poll

**As a** voter,
**I want to** open the link, see the options, and cast my vote without creating an account,
**So that** voting takes seconds.

### Acceptance Criteria
- Opening the link shows the poll title and all configured options (AC-005, Source AC-1)
- The voting form asks for a display name and a single option selection
- Submitting a valid vote increases that option's count by exactly one and shows an on-screen confirmation (AC-007, Source AC-2)
- A voter can submit only one vote per visit to the form (re-submission from the same session is prevented client-side; see [error-handling.md](error-handling.md) for the "already voted" case)
- If the poll has already been closed, the voting form is not shown — the final results view is shown instead (AC-013, Source AC-3)

---

## US-004 — Watch Results Update Live

**As a** voter or organizer,
**I want to** see vote counts change as other people vote,
**So that** I don't have to keep refreshing the page to see where things stand.

### Acceptance Criteria
- Vote counts update for all open viewers of the poll page without a manual refresh, within 3 seconds (AC-016, Source AC-4)
- The update is reflected within a couple of seconds of the vote being recorded

---

## US-005 — Close the Poll

**As an** organizer,
**I want to** close the poll when it's time to decide,
**So that** the result is locked in and no more votes can change it.

### Acceptance Criteria
- A "Close Poll" action is available on the poll page, but only in the browser that created the poll (AC-012)
- Clicking "Close Poll" immediately transitions the poll to a closed state for all viewers
- After closing, anyone who visits the link sees the final results instead of the voting form (AC-013, Source AC-3)
- Once closed, further vote submissions are rejected

---

## US-006 — Run the App Locally From a Fresh Clone

**As a** reviewer,
**I want to** follow the README's setup instructions on a fresh clone,
**So that** I can get the app running locally without asking the author for help.

### Acceptance Criteria
- A single documented command starts the app locally (AC-018, Source AC-5)
- The README states the exact URL where the running app is reachable
- No undocumented steps (manual config edits, seed scripts, etc.) are required to reach a working app
