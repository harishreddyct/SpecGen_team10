export interface PollOption {
  optionId: string;
  text: string;
  voteCount: number;
}

export interface Poll {
  pollId: string;
  shareUrl: string;
  title: string;
  status: 'open' | 'closed';
  options: PollOption[];
}

export interface VoteResponse {
  status: 'ok' | 'error';
  voteId: string | null;
  errors: string[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
}
