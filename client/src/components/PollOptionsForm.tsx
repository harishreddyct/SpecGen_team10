interface Props {
  options: string[];
  errors: Record<number, string>;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  minOptions: number;
  maxOptions: number;
}

export default function PollOptionsForm({
  options,
  errors,
  onChange,
  onAdd,
  onRemove,
  minOptions,
  maxOptions,
}: Props) {
  return (
    <fieldset>
      <legend>
        Options ({minOptions}-{maxOptions})
      </legend>
      {options.map((option, index) => (
        <div key={index} className="option-row">
          <input
            aria-label={`Option ${index + 1}`}
            value={option}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
          />
          {options.length > minOptions && (
            <button type="button" onClick={() => onRemove(index)} aria-label={`Remove option ${index + 1}`}>
              Remove
            </button>
          )}
          {errors[index] && <div className="field-error">{errors[index]}</div>}
        </div>
      ))}
      {options.length < maxOptions && (
        <button type="button" onClick={onAdd}>
          Add option
        </button>
      )}
    </fieldset>
  );
}
