// Client-side-only convenience, not access control. If localStorage is
// unavailable (private browsing, storage-blocking browsers), fail silently
// and treat the viewer as "not the organizer" — see navigation-flows.md.

function key(pollId: string): string {
  return `organizerOf:${pollId}`;
}

export function markAsOrganizer(pollId: string): void {
  try {
    localStorage.setItem(key(pollId), '1');
  } catch {
    // Storage unavailable — the "Close Poll" control simply won't render.
  }
}

export function isOrganizer(pollId: string): boolean {
  try {
    return localStorage.getItem(key(pollId)) === '1';
  } catch {
    return false;
  }
}
