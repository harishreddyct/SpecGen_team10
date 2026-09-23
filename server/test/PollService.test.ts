import { PollService } from '../src/PollService';
import { InMemoryPollStore } from '../src/PollStore';
import { PollSocketGateway } from '../src/PollSocketGateway';
import { ApiError } from '../src/errors';
import { Poll } from '../src/models';

function makeGateway() {
  return {
    votes: [] as Array<{ pollId: string; poll: Poll }>,
    closes: [] as Array<{ pollId: string; poll: Poll }>,
    broadcastVote(pollId: string, poll: Poll) {
      this.votes.push({ pollId, poll });
    },
    broadcastClose(pollId: string, poll: Poll) {
      this.closes.push({ pollId, poll });
    },
  } satisfies PollSocketGateway & { votes: unknown[]; closes: unknown[] };
}

describe('PollService.createPoll', () => {
  it('creates a poll with 2-5 non-empty options, all starting at zero votes', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    const poll = service.createPoll('Lunch?', ['Tacos', 'Pizza']);

    expect(poll.status).toBe('open');
    expect(poll.closedAt).toBeNull();
    expect(poll.options).toHaveLength(2);
    expect(poll.options.every((option) => option.voteCount === 0)).toBe(true);
  });

  it('rejects an empty title with INVALID_TITLE', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    expect(() => service.createPoll('   ', ['Tacos', 'Pizza'])).toThrow(ApiError);
    expect(() => service.createPoll('   ', ['Tacos', 'Pizza'])).toThrow(
      expect.objectContaining({ code: 'INVALID_TITLE' })
    );
  });

  it('rejects fewer than 2 or more than 5 options with INVALID_OPTION_COUNT', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    expect(() => service.createPoll('Lunch', ['Tacos'])).toThrow(
      expect.objectContaining({ code: 'INVALID_OPTION_COUNT' })
    );
    expect(() => service.createPoll('Lunch', ['A', 'B', 'C', 'D', 'E', 'F'])).toThrow(
      expect.objectContaining({ code: 'INVALID_OPTION_COUNT' })
    );
  });

  it('rejects a blank option label with INVALID_OPTION', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    expect(() => service.createPoll('Lunch', ['Tacos', '   '])).toThrow(
      expect.objectContaining({ code: 'INVALID_OPTION' })
    );
  });
});

describe('PollService.castVote', () => {
  it('records a vote and increases that option count by exactly one', () => {
    const gateway = makeGateway();
    const service = new PollService(new InMemoryPollStore(), gateway);
    const poll = service.createPoll('Lunch', ['Tacos', 'Pizza']);

    const result = service.castVote(poll.pollId, 'Priya', poll.options[0].optionId);

    expect(result.status).toBe('ok');
    expect(result.voteId).toBeTruthy();
    const updated = service.getPoll(poll.pollId);
    expect(updated.options[0].voteCount).toBe(1);
    expect(updated.options[1].voteCount).toBe(0);
    expect(gateway.votes).toHaveLength(1);
  });

  it('requires a non-empty voterName', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    const poll = service.createPoll('Lunch', ['Tacos', 'Pizza']);
    expect(() => service.castVote(poll.pollId, '', poll.options[0].optionId)).toThrow(
      expect.objectContaining({ code: 'VOTER_NAME_REQUIRED' })
    );
  });

  it('requires an optionId', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    const poll = service.createPoll('Lunch', ['Tacos', 'Pizza']);
    expect(() => service.castVote(poll.pollId, 'Priya', '')).toThrow(
      expect.objectContaining({ code: 'OPTION_ID_REQUIRED' })
    );
  });

  it('rejects a voterName over 50 characters', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    const poll = service.createPoll('Lunch', ['Tacos', 'Pizza']);
    expect(() => service.castVote(poll.pollId, 'x'.repeat(51), poll.options[0].optionId)).toThrow(
      expect.objectContaining({ code: 'VOTER_NAME_TOO_LONG' })
    );
  });

  it('rejects a vote for an optionId that does not belong to the poll', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    const poll = service.createPoll('Lunch', ['Tacos', 'Pizza']);
    const result = service.castVote(poll.pollId, 'Priya', 'opt_999');
    expect(result).toEqual({ status: 'error', voteId: null, errors: ['Unknown option'] });
  });

  it('rejects a vote once the poll is closed', () => {
    const gateway = makeGateway();
    const service = new PollService(new InMemoryPollStore(), gateway);
    const poll = service.createPoll('Lunch', ['Tacos', 'Pizza']);
    service.closePoll(poll.pollId);

    const result = service.castVote(poll.pollId, 'Priya', poll.options[0].optionId);
    expect(result).toEqual({ status: 'error', voteId: null, errors: ['Poll is closed'] });
  });

  it('throws POLL_NOT_FOUND for an unknown pollId', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    expect(() => service.castVote('nope', 'Priya', 'opt_1')).toThrow(
      expect.objectContaining({ code: 'POLL_NOT_FOUND' })
    );
  });
});

describe('PollService.closePoll', () => {
  it('flips status to closed, sets closedAt, and broadcasts once', () => {
    const gateway = makeGateway();
    const service = new PollService(new InMemoryPollStore(), gateway);
    const poll = service.createPoll('Lunch', ['Tacos', 'Pizza']);

    const closed = service.closePoll(poll.pollId);

    expect(closed.status).toBe('closed');
    expect(closed.closedAt).not.toBeNull();
    expect(gateway.closes).toHaveLength(1);
  });

  it('rejects a second close with POLL_ALREADY_CLOSED', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    const poll = service.createPoll('Lunch', ['Tacos', 'Pizza']);
    service.closePoll(poll.pollId);

    expect(() => service.closePoll(poll.pollId)).toThrow(
      expect.objectContaining({ code: 'POLL_ALREADY_CLOSED', status: 409 })
    );
  });

  it('throws POLL_NOT_FOUND for an unknown pollId', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    expect(() => service.closePoll('nope')).toThrow(expect.objectContaining({ code: 'POLL_NOT_FOUND' }));
  });
});

describe('PollService.getPoll', () => {
  it('throws POLL_NOT_FOUND for an unknown pollId', () => {
    const service = new PollService(new InMemoryPollStore(), makeGateway());
    expect(() => service.getPoll('nope')).toThrow(expect.objectContaining({ code: 'POLL_NOT_FOUND' }));
  });
});
