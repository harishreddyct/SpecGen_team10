import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PollApiClient, HttpError } from '../api/PollApiClient';
import { PollRealtimeClient } from '../realtime/PollRealtimeClient';
import { Poll } from '../types';
import { isOrganizer } from '../lib/organizerStorage';
import VotingForm from '../components/VotingForm';
import LiveResultsList from '../components/LiveResultsList';
import FinalResultsView from '../components/FinalResultsView';
import CloseByOrganizerControl from '../components/CloseByOrganizerControl';
import CopyLinkButton from '../components/CopyLinkButton';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

export default function PollPage() {
  const { pollId } = useParams<{ pollId: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [announcement, setAnnouncement] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const refetch = useCallback(async () => {
    if (!pollId) return;
    try {
      const data = await PollApiClient.getPoll(pollId);
      setPoll(data);
      setState('ready');
    } catch (err) {
      if (err instanceof HttpError && err.code === 'POLL_NOT_FOUND') {
        setState('not-found');
      } else {
        setState('error');
      }
    }
  }, [pollId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Move keyboard/screen-reader focus to the page heading once content loads,
  // so a voter arriving from a shared link lands somewhere meaningful.
  useEffect(() => {
    if (state === 'ready' || state === 'not-found') {
      headingRef.current?.focus();
    }
  }, [state]);

  useEffect(() => {
    if (!pollId) return;

    PollRealtimeClient.join(pollId);

    const unsubVote = PollRealtimeClient.onVoteRecorded((payload) => {
      if (payload.pollId !== pollId) return;
      setPoll((prev) => (prev ? { ...prev, options: payload.options } : prev));
    });

    const unsubClose = PollRealtimeClient.onPollClosed((payload) => {
      if (payload.pollId !== pollId) return;
      setPoll((prev) => (prev ? { ...prev, status: 'closed', options: payload.options } : prev));
      setAnnouncement('The organizer closed this poll. Showing final results.');
    });

    // Reconnect could have missed events — resync from the server.
    const unsubReconnect = PollRealtimeClient.onReconnect(() => {
      refetch();
    });

    return () => {
      PollRealtimeClient.leave(pollId);
      unsubVote();
      unsubClose();
      unsubReconnect();
    };
  }, [pollId, refetch]);

  if (state === 'loading') {
    return (
      <div className="page" role="status" aria-live="polite">
        Loading poll…
      </div>
    );
  }

  if (state === 'not-found') {
    return (
      <div className="page">
        <h1 tabIndex={-1} ref={headingRef}>
          Poll not found
        </h1>
        <p>This link doesn't match a known poll. Double-check the URL, or ask the organizer for a fresh link.</p>
      </div>
    );
  }

  if (state === 'error' || !poll) {
    return (
      <div className="page">
        <div role="alert" className="banner banner-error">
          Something went wrong. Try again.
        </div>
      </div>
    );
  }

  return (
    <div className="page poll-page">
      <span className="visually-hidden" aria-live="polite">
        {announcement}
      </span>
      <h1 tabIndex={-1} ref={headingRef}>
        {poll.title}
      </h1>
      <CopyLinkButton link={poll.shareUrl} />

      {isOrganizer(poll.pollId) && poll.status === 'open' && (
        <CloseByOrganizerControl
          pollId={poll.pollId}
          onClosed={(closed) =>
            setPoll((prev) => (prev ? { ...prev, status: closed.status, options: closed.options } : prev))
          }
        />
      )}

      {poll.status === 'open' ? (
        <>
          <VotingForm pollId={poll.pollId} options={poll.options} onVoted={refetch} />
          <LiveResultsList options={poll.options} />
        </>
      ) : (
        <FinalResultsView title={poll.title} options={poll.options} />
      )}
    </div>
  );
}
