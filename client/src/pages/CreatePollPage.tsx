import { FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PollApiClient, HttpError } from '../api/PollApiClient';
import { markAsOrganizer } from '../lib/organizerStorage';
import PollOptionsForm from '../components/PollOptionsForm';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [optionErrors, setOptionErrors] = useState<Record<number, string>>({});
  const [optionCountError, setOptionCountError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    title.trim().length > 0 &&
    options.filter((option) => option.trim().length > 0).length >= MIN_OPTIONS &&
    !submitting;

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function addOption() {
    setOptions((prev) => (prev.length < MAX_OPTIONS ? [...prev, ''] : prev));
  }

  function removeOption(index: number) {
    setOptions((prev) => (prev.length > MIN_OPTIONS ? prev.filter((_, i) => i !== index) : prev));
  }

  function validate(): boolean {
    let ok = true;
    let firstInvalidId: string | null = null;
    setTitleError(null);
    setOptionErrors({});
    setOptionCountError(null);
    setBanner(null);

    if (!title.trim()) {
      setTitleError('Title is required.');
      firstInvalidId = 'title';
      ok = false;
    }

    if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
      setOptionCountError(`${MIN_OPTIONS}-${MAX_OPTIONS} options are required.`);
      ok = false;
    }

    const errors: Record<number, string> = {};
    options.forEach((option, index) => {
      if (!option.trim()) {
        errors[index] = 'This option cannot be empty.';
        if (!firstInvalidId) firstInvalidId = `option-input-${index}`;
      }
    });
    if (Object.keys(errors).length > 0) {
      setOptionErrors(errors);
      ok = false;
    }

    if (!ok && firstInvalidId) {
      // Move focus to the first invalid field so keyboard/screen-reader users land right on it.
      const targetId = firstInvalidId;
      requestAnimationFrame(() => document.getElementById(targetId)?.focus());
    }

    return ok;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const poll = await PollApiClient.createPoll(
        title.trim(),
        options.map((option) => option.trim())
      );
      markAsOrganizer(poll.pollId);
      navigate(`/polls/${poll.pollId}`);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.code === 'INVALID_TITLE') {
          setTitleError(err.message);
          titleInputRef.current?.focus();
        } else if (err.code === 'INVALID_OPTION_COUNT' || err.code === 'INVALID_OPTION') {
          setOptionCountError(err.message);
        } else {
          setBanner('Something went wrong. Try again.');
        }
      } else {
        setBanner('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page create-poll-page">
      <h1>TeamLunch Poll</h1>
      <p className="lede">Propose a few lunch options and share the link with your team — no account needed.</p>

      {banner && (
        <div role="alert" className="banner banner-error">
          {banner}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="card" aria-label="Create a poll">
        <div>
          <label htmlFor="title">Poll title</label>
          <input
            id="title"
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Where should we eat Friday?"
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'title-error' : undefined}
          />
          {titleError && (
            <div id="title-error" className="field-error" role="alert">
              {titleError}
            </div>
          )}
        </div>

        <PollOptionsForm
          options={options}
          errors={optionErrors}
          onChange={updateOption}
          onAdd={addOption}
          onRemove={removeOption}
          minOptions={MIN_OPTIONS}
          maxOptions={MAX_OPTIONS}
          countError={optionCountError}
        />

        <button type="submit" className="btn btn-primary" disabled={!canSubmit} aria-busy={submitting}>
          {submitting ? 'Creating…' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
}
