import { FormEvent, useState } from 'react';
import { PollApiClient, HttpError } from '../api/PollApiClient';
import { PollOption } from '../types';

const NAME_MAX_LENGTH = 50;

interface Props {
  pollId: string;
  options: PollOption[];
  onVoted: () => void;
}

export default function VotingForm({ pollId, options, onVoted }: Props) {
  const [voterName, setVoterName] = useState('');
  const [optionId, setOptionId] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [optionError, setOptionError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const canSubmit = voterName.trim().length > 0 && optionId.length > 0 && !submitting && !confirmed;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNameError(null);
    setOptionError(null);
    setBanner(null);

    if (!voterName.trim()) {
      setNameError('Your name is required.');
      return;
    }
    if (!optionId) {
      setOptionError('Please select an option.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await PollApiClient.vote(pollId, voterName.trim(), optionId);
      if (result.status === 'ok') {
        setConfirmed(true);
        onVoted();
      } else if (result.errors.includes('Poll is closed')) {
        // Redirect the viewer to the final results view (error-handling.md).
        onVoted();
      } else {
        setBanner(result.errors[0] ?? 'Your vote was not counted.');
      }
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.code === 'VOTER_NAME_REQUIRED') setNameError(err.message);
        else if (err.code === 'OPTION_ID_REQUIRED') setOptionError(err.message);
        else if (err.code === 'VOTER_NAME_TOO_LONG') setNameError(err.message);
        else setBanner("Couldn't submit your vote. Try again.");
      } else {
        setBanner("Couldn't submit your vote. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return <div className="vote-confirmation">Thanks — your vote has been recorded!</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="voting-form" noValidate>
      {banner && (
        <div role="alert" className="banner banner-error">
          {banner}
        </div>
      )}

      <label htmlFor="voterName">Your name</label>
      <input
        id="voterName"
        value={voterName}
        maxLength={NAME_MAX_LENGTH}
        onChange={(e) => setVoterName(e.target.value)}
        placeholder="Your name"
      />
      {nameError && <div className="field-error">{nameError}</div>}

      <fieldset>
        <legend>Pick an option</legend>
        {options.map((option) => (
          <label key={option.optionId} className="option-choice">
            <input
              type="radio"
              name="option"
              value={option.optionId}
              checked={optionId === option.optionId}
              onChange={() => setOptionId(option.optionId)}
            />
            {option.text}
          </label>
        ))}
      </fieldset>
      {optionError && <div className="field-error">{optionError}</div>}

      <button type="submit" disabled={!canSubmit}>
        {submitting ? 'Submitting...' : 'Submit Vote'}
      </button>
    </form>
  );
}
