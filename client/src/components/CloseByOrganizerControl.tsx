import { useState } from 'react';
import { PollApiClient, HttpError } from '../api/PollApiClient';
import { Poll } from '../types';

interface Props {
  pollId: string;
  onClosed: (poll: Poll) => void;
}

export default function CloseByOrganizerControl({ pollId, onClosed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const poll = await PollApiClient.closePoll(pollId);
      onClosed(poll);
    } catch (err) {
      if (err instanceof HttpError && err.code === 'POLL_ALREADY_CLOSED') {
        // Treated as a no-op — refresh to the final results view (AC-015).
        const poll = await PollApiClient.getPoll(pollId);
        onClosed(poll);
        return;
      }
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="close-poll-control">
      {error && (
        <div role="alert" className="banner banner-error">
          {error}
        </div>
      )}
      <button type="button" onClick={handleClick} disabled={loading}>
        {loading ? 'Closing...' : 'Close Poll'}
      </button>
    </div>
  );
}
