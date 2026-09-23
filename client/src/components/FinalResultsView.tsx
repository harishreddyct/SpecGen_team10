import { PollOption } from '../types';

interface Props {
  title: string;
  options: PollOption[];
}

export default function FinalResultsView({ title, options }: Props) {
  const sorted = [...options].sort((a, b) => b.voteCount - a.voteCount);
  const winner = sorted[0];

  return (
    <div className="final-results">
      <h2>Final results</h2>
      {winner && winner.voteCount > 0 && <p className="winner-banner">Winner: {winner.text}</p>}
      <ul className="results-list" aria-label="Final results">
        {sorted.map((option) => (
          <li key={option.optionId}>
            <span className="option-text">{option.text}</span>
            <span className="vote-count">
              {option.voteCount} vote{option.voteCount === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
      <p className="closed-note">This poll is closed for “{title}.” No further votes are being accepted.</p>
    </div>
  );
}
