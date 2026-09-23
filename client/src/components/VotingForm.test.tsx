import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import VotingForm from './VotingForm';
import { PollApiClient } from '../api/PollApiClient';

vi.mock('../api/PollApiClient', () => {
  class HttpError extends Error {
    code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    PollApiClient: { vote: vi.fn() },
    HttpError,
  };
});

const options = [
  { optionId: 'opt_1', text: 'Tacos', voteCount: 0 },
  { optionId: 'opt_2', text: 'Pizza', voteCount: 0 },
];

describe('VotingForm', () => {
  beforeEach(() => {
    vi.mocked(PollApiClient.vote).mockReset();
  });

  it('disables submit until both name and an option are provided', () => {
    render(<VotingForm pollId="p1" options={options} onVoted={() => {}} />);
    expect(screen.getByRole('button', { name: /submit vote/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Priya' } });
    expect(screen.getByRole('button', { name: /submit vote/i })).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Tacos'));
    expect(screen.getByRole('button', { name: /submit vote/i })).toBeEnabled();
  });

  it('shows a confirmation and removes the submit control after a successful vote (AC-007, AC-011)', async () => {
    vi.mocked(PollApiClient.vote).mockResolvedValue({ status: 'ok', voteId: 'vote_1', errors: [] });
    const onVoted = vi.fn();
    render(<VotingForm pollId="p1" options={options} onVoted={onVoted} />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Priya' } });
    fireEvent.click(screen.getByLabelText('Tacos'));
    fireEvent.click(screen.getByRole('button', { name: /submit vote/i }));

    await waitFor(() => expect(screen.getByText(/vote has been recorded/i)).toBeInTheDocument());
    expect(onVoted).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /submit vote/i })).not.toBeInTheDocument();
    expect(PollApiClient.vote).toHaveBeenCalledTimes(1);
  });

  it('shows a generic error banner for an unknown-option business error (AC-009)', async () => {
    vi.mocked(PollApiClient.vote).mockResolvedValue({ status: 'error', voteId: null, errors: ['Unknown option'] });
    render(<VotingForm pollId="p1" options={options} onVoted={() => {}} />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Priya' } });
    fireEvent.click(screen.getByLabelText('Tacos'));
    fireEvent.click(screen.getByRole('button', { name: /submit vote/i }));

    await waitFor(() => expect(screen.getByText('Unknown option')).toBeInTheDocument());
  });

  it('treats a "Poll is closed" business error as a redirect via onVoted (AC-010)', async () => {
    vi.mocked(PollApiClient.vote).mockResolvedValue({ status: 'error', voteId: null, errors: ['Poll is closed'] });
    const onVoted = vi.fn();
    render(<VotingForm pollId="p1" options={options} onVoted={onVoted} />);

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Priya' } });
    fireEvent.click(screen.getByLabelText('Tacos'));
    fireEvent.click(screen.getByRole('button', { name: /submit vote/i }));

    await waitFor(() => expect(onVoted).toHaveBeenCalledTimes(1));
  });
});
