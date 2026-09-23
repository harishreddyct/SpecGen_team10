export interface PollOption {
  optionId: string;
  text: string;
  voteCount: number;
}

export interface Poll {
  pollId: string; // unguessable ID; doubles as the share-link path segment
  title: string;
  status: 'open' | 'closed';
  options: PollOption[];
  createdAt: string; // ISO 8601
  closedAt: string | null; // ISO 8601, set when status transitions to 'closed'
}

export interface Vote {
  voteId: string;
  pollId: string;
  optionId: string;
  voterName: string; // free-text display name, not identity-verified
  createdAt: string; // ISO 8601
}
