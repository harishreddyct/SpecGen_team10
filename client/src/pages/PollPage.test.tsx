import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PollPage from './PollPage';
import { PollApiClient, HttpError } from '../api/PollApiClient';

vi.mock('../api/PollApiClient', () => {
  class HttpError extends Error {
    code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    PollApiClient: { getPoll: vi.fn(), vote: vi.fn(), closePoll: vi.fn() },
    HttpError,
  };
});

vi.mock('../realtime/PollRealtimeClient', () => ({
  PollRealtimeClient: {
    join: vi.fn(),
    leave: vi.fn(),
    onVoteRecorded: vi.fn(() => () => {}),
    onPollClosed: vi.fn(() => () => {}),
    onReconnect: vi.fn(() => () => {}),
  },
}));

function renderPollPage(pollId = 'poll_1') {
  return render(
    <MemoryRouter initialEntries={[`/polls/${pollId}`]}>
      <Routes>
        <Route path="/polls/:pollId" element={<PollPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PollPage', () => {
  beforeEach(() => {
    vi.mocked(PollApiClient.getPoll).mockReset();
  });

  it('shows the title, options, and voting form while the poll is open (AC-005)', async () => {
    vi.mocked(PollApiClient.getPoll).mockResolvedValue({
      pollId: 'poll_1',
      shareUrl: 'http://localhost/polls/poll_1',
      title: 'Where to eat?',
      status: 'open',
      options: [
        { optionId: 'opt_1', text: 'Tacos', voteCount: 0 },
        { optionId: 'opt_2', text: 'Pizza', voteCount: 0 },
      ],
    });

    renderPollPage();

    await waitFor(() => expect(screen.getByText('Where to eat?')).toBeInTheDocument());
    expect(screen.getByText('Tacos')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit vote/i })).toBeInTheDocument();
  });

  it('shows final results instead of the voting form once closed (AC-013, AC-014)', async () => {
    vi.mocked(PollApiClient.getPoll).mockResolvedValue({
      pollId: 'poll_1',
      shareUrl: 'http://localhost/polls/poll_1',
      title: 'Where to eat?',
      status: 'closed',
      options: [
        { optionId: 'opt_1', text: 'Tacos', voteCount: 3 },
        { optionId: 'opt_2', text: 'Pizza', voteCount: 1 },
      ],
    });

    renderPollPage();

    await waitFor(() => expect(screen.getByText(/final results/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /submit vote/i })).not.toBeInTheDocument();
  });

  it('shows a not-found state for an unknown poll (AC-006)', async () => {
    vi.mocked(PollApiClient.getPoll).mockRejectedValue(new HttpError(404, 'POLL_NOT_FOUND', 'Poll not found.'));

    renderPollPage();

    await waitFor(() => expect(screen.getByText(/poll not found/i)).toBeInTheDocument());
  });

  it('does not show the Close Poll control unless this browser created the poll (AC-012)', async () => {
    vi.mocked(PollApiClient.getPoll).mockResolvedValue({
      pollId: 'poll_1',
      shareUrl: 'http://localhost/polls/poll_1',
      title: 'Where to eat?',
      status: 'open',
      options: [{ optionId: 'opt_1', text: 'Tacos', voteCount: 0 }],
    });

    renderPollPage();

    await waitFor(() => expect(screen.getByText('Where to eat?')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /close poll/i })).not.toBeInTheDocument();
  });
});
