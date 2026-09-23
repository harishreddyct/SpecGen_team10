import { Poll, Vote } from './models';
import { PollStore } from './PollStore';
import { PollSocketGateway } from './PollSocketGateway';
import { generatePollId, generateOptionId, generateVoteId } from './ids';
import { ApiError } from './errors';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;
const VOTER_NAME_MAX_LENGTH = 50;

export type VoteResult =
  | { status: 'ok'; voteId: string; errors: [] }
  | { status: 'error'; voteId: null; errors: string[] };

/**
 * Poll business rules, independent of HTTP or storage details
 * (technical-architecture.md: Domain layer).
 */
export class PollService {
  constructor(
    private store: PollStore,
    private gateway: PollSocketGateway
  ) {}

  createPoll(title: unknown, options: unknown): Poll {
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    if (!trimmedTitle) {
      throw new ApiError(400, 'INVALID_TITLE', 'Title is required.');
    }

    if (!Array.isArray(options) || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
      throw new ApiError(400, 'INVALID_OPTION_COUNT', `${MIN_OPTIONS}-${MAX_OPTIONS} options are required.`);
    }

    const trimmedOptions = options.map((option) => (typeof option === 'string' ? option.trim() : ''));
    if (trimmedOptions.some((option) => !option)) {
      throw new ApiError(400, 'INVALID_OPTION', 'Each option must be non-empty.');
    }

    const poll: Poll = {
      pollId: generatePollId(),
      title: trimmedTitle,
      status: 'open',
      options: trimmedOptions.map((text, index) => ({
        optionId: generateOptionId(index),
        text,
        voteCount: 0,
      })),
      createdAt: new Date().toISOString(),
      closedAt: null,
    };

    this.store.create(poll);
    return this.getPoll(poll.pollId);
  }

  getPoll(pollId: string): Poll {
    const poll = this.store.get(pollId);
    if (!poll) {
      throw new ApiError(404, 'POLL_NOT_FOUND', 'Poll not found.');
    }
    return poll;
  }

  castVote(pollId: string, voterName: unknown, optionId: unknown): VoteResult {
    if (typeof voterName !== 'string' || !voterName.trim()) {
      throw new ApiError(400, 'VOTER_NAME_REQUIRED', 'voterName is required.');
    }
    if (typeof optionId !== 'string' || !optionId) {
      throw new ApiError(400, 'OPTION_ID_REQUIRED', 'optionId is required.');
    }
    if (voterName.length > VOTER_NAME_MAX_LENGTH) {
      throw new ApiError(400, 'VOTER_NAME_TOO_LONG', `voterName must be ${VOTER_NAME_MAX_LENGTH} characters or fewer.`);
    }

    const poll = this.store.get(pollId);
    if (!poll) {
      throw new ApiError(404, 'POLL_NOT_FOUND', 'Poll not found.');
    }

    if (poll.status === 'closed') {
      return { status: 'error', voteId: null, errors: ['Poll is closed'] };
    }

    const option = poll.options.find((candidate) => candidate.optionId === optionId);
    if (!option) {
      return { status: 'error', voteId: null, errors: ['Unknown option'] };
    }

    const vote: Vote = {
      voteId: generateVoteId(),
      pollId,
      optionId,
      voterName: voterName.trim(),
      createdAt: new Date().toISOString(),
    };
    this.store.recordVote(pollId, vote);

    const updated = this.getPoll(pollId);
    this.gateway.broadcastVote(pollId, updated);

    return { status: 'ok', voteId: vote.voteId, errors: [] };
  }

  closePoll(pollId: string): Poll {
    const poll = this.store.get(pollId);
    if (!poll) {
      throw new ApiError(404, 'POLL_NOT_FOUND', 'Poll not found.');
    }
    if (poll.status === 'closed') {
      throw new ApiError(409, 'POLL_ALREADY_CLOSED', 'Poll is already closed.');
    }

    this.store.close(pollId);
    const updated = this.getPoll(pollId);
    this.gateway.broadcastClose(pollId, updated);
    return updated;
  }
}
