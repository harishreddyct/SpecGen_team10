import { PollOption } from '../types';

interface Props {
  options: PollOption[];
}

export default function LiveResultsList({ options }: Props) {
  const total = options.reduce((sum, option) => sum + option.voteCount, 0);
  const max = Math.max(1, ...options.map((option) => option.voteCount));

  return (
    <div className="card">
      <ul className="results-list" aria-label="Live results" aria-live="polite">
        {options.map((option) => (
          <li key={option.optionId}>
            <div className="result-row-top">
              <span className="option-text">{option.text}</span>
              <span className="vote-count">
                {option.voteCount} vote{option.voteCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${(option.voteCount / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="results-summary">
        {total} vote{total === 1 ? '' : 's'} so far
      </p>
    </div>
  );
}
