import { PollOption } from '../types';

interface Props {
  options: PollOption[];
}

export default function LiveResultsList({ options }: Props) {
  return (
    <ul className="results-list" aria-label="Live results">
      {options.map((option) => (
        <li key={option.optionId}>
          <span className="option-text">{option.text}</span>
          <span className="vote-count">
            {option.voteCount} vote{option.voteCount === 1 ? '' : 's'}
          </span>
        </li>
      ))}
    </ul>
  );
}
