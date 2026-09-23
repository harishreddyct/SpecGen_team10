import { FormEvent, useRef, useState } from 'react';
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
  const nameInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = voterName.trim().length > 0 && optionId.length > 0 && !submitting && !confirmed;
  const remaining = NAME_MAX_LENGTH - voterName.length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNameError(null);
    setOptionError(null);
    setBanner(null);

    if (!voterName.trim()) {
      setNameError('Your name is required.');
      nameInputRef.current?.focus();
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
    return (
      <div className="vote-confirmation card" role="status">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Thanks — your vote has been recorded!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="voting-form card" noValidate aria-label="Cast your vote">
      {banner && (
        <div role="alert" className="banner banner-error">
          {banner}
        </div>
      )}

      <div>
        <label htmlFor="voterName">Your name</label>
        <input
          id="voterName"
          ref={nameInputRef}
          value={voterName}
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => setVoterName(e.target.value)}
          placeholder="Your name"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={[nameError ? 'voterName-error' : null, 'voterName-count'].filter(Boolean).join(' ')}
        />
        <div className="hint" id="voterName-count" aria-live="polite">
          {remaining} character{remaining === 1 ? '' : 's'} left
        </div>
        {nameError && (
          <div id="voterName-error" className="field-error" role="alert">
            {nameError}
          </div>
        )}
      </div>

      <fieldset aria-describedby={optionError ? 'option-select-error' : undefined}>
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
      {optionError && (
        <div id="option-select-error" className="field-error" role="alert">
          {optionError}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={!canSubmit} aria-busy={submitting}>
        {submitting ? 'Submitting…' : 'Submit Vote'}
      </button>
    </form>
  );
}
