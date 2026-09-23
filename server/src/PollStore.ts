import { Poll, Vote } from './models';

export interface PollStore {
  create(poll: Poll): void;
  get(pollId: string): Poll | undefined;
  recordVote(pollId: string, vote: Vote): void;
  close(pollId: string): void;
}

/**
 * Process-lifetime, in-memory implementation. Sufficient for the hackathon
 * build per feature-overview.md (no durability requirement).
 *
 * `voteCount` is never stored — it is recomputed from the underlying `Vote`
 * records on every read, so it can never drift from the votes that produced
 * it (see the invariant in data-models.md).
 */
export class InMemoryPollStore implements PollStore {
  private polls = new Map<string, Poll>();
  private votesByPoll = new Map<string, Vote[]>();

  create(poll: Poll): void {
    this.polls.set(poll.pollId, poll);
    this.votesByPoll.set(poll.pollId, []);
  }

  get(pollId: string): Poll | undefined {
    const poll = this.polls.get(pollId);
    if (!poll) return undefined;

    const votes = this.votesByPoll.get(pollId) ?? [];
    const counts = new Map<string, number>();
    for (const vote of votes) {
      counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1);
    }

    return {
      ...poll,
      options: poll.options.map((option) => ({
        ...option,
        voteCount: counts.get(option.optionId) ?? 0,
      })),
    };
  }

  recordVote(pollId: string, vote: Vote): void {
    if (!this.polls.has(pollId)) return;
    const votes = this.votesByPoll.get(pollId) ?? [];
    votes.push(vote);
    this.votesByPoll.set(pollId, votes);
  }

  close(pollId: string): void {
    const poll = this.polls.get(pollId);
    if (!poll) return;
    poll.status = 'closed';
    poll.closedAt = new Date().toISOString();
  }
}
