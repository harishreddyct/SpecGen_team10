import { PollOption } from '../types';

interface Props {
  title: string;
  options: PollOption[];
}

export default function FinalResultsView({ title, options }: Props) {
  const sorted = [...options].sort((a, b) => b.voteCount - a.voteCount);
  const winner = sorted[0];
  const total = options.reduce((sum, option) => sum + option.voteCount, 0);
  const max = Math.max(1, ...options.map((option) => option.voteCount));

  return (
    <div className="final-results card" role="status">
      <h2>Final results</h2>
      {winner && winner.voteCount > 0 && (
        <p className="winner-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M8 21h8M12 17v4M6 4h12v3a6 6 0 0 1-12 0V4Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 6H3v1a4 4 0 0 0 4 4M18 6h3v1a4 4 0 0 1-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Winner: {winner.text}
        </p>
      )}
      <ul className="results-list" aria-label="Final results">
        {sorted.map((option) => (
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
        {total} vote{total === 1 ? '' : 's'} total
      </p>
      <p className="closed-note">This poll is closed for “{title}.” No further votes are being accepted.</p>
    </div>
  );
}
