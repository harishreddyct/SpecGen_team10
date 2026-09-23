import { randomBytes } from 'crypto';

function randomToken(byteLength: number): string {
  return randomBytes(byteLength).toString('hex');
}

/** Unguessable poll ID — doubles as the share-link path segment. */
export function generatePollId(): string {
  return `plz_${randomToken(6)}`;
}

/** Stable, ordinal option ID scoped to the poll it belongs to. */
export function generateOptionId(index: number): string {
  return `opt_${index + 1}`;
}

export function generateVoteId(): string {
  return `vote_${randomToken(6)}`;
}
