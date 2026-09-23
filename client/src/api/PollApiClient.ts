import { ApiErrorBody, Poll, VoteResponse } from '../types';
import { API_BASE_URL } from '../config';

const API_BASE = `${API_BASE_URL}/api`;

/** Malformed-request / infrastructure failure — the { code, message } shape from api-contracts.md. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body as ApiErrorBody;
    throw new HttpError(res.status, err.code ?? 'SERVER_ERROR', err.message ?? 'Something went wrong.');
  }
  return body as T;
}

export const PollApiClient = {
  async createPoll(title: string, options: string[]): Promise<Poll> {
    const res = await fetch(`${API_BASE}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, options }),
    });
    return parseJsonOrThrow<Poll>(res);
  },

  async getPoll(pollId: string): Promise<Poll> {
    const res = await fetch(`${API_BASE}/polls/${pollId}`);
    return parseJsonOrThrow<Poll>(res);
  },

  async vote(pollId: string, voterName: string, optionId: string): Promise<VoteResponse> {
    const res = await fetch(`${API_BASE}/polls/${pollId}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterName, optionId }),
    });
    return parseJsonOrThrow<VoteResponse>(res);
  },

  async closePoll(pollId: string): Promise<Poll> {
    const res = await fetch(`${API_BASE}/polls/${pollId}/close`, { method: 'POST' });
    return parseJsonOrThrow<Poll>(res);
  },
};
