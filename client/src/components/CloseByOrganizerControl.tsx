import { useState } from 'react';
import { PollApiClient, HttpError } from '../api/PollApiClient';
import { Poll } from '../types';

interface Props {
  pollId: string;
  onClosed: (poll: Poll) => void;
}

export default function CloseByOrganizerControl({ pollId, onClosed }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
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
      setConfirming(false);
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

      {confirming ? (
        <div className="confirm-inline">
          <span id="close-confirm-label">Close the poll for everyone? This can't be undone.</span>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={loading}
            aria-describedby="close-confirm-label"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" /> Closing…
              </>
            ) : (
              'Yes, close it'
            )}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)} disabled={loading}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>
          Close Poll
        </button>
      )}
    </div>
  );
}
