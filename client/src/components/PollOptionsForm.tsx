interface Props {
  options: string[];
  errors: Record<number, string>;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  minOptions: number;
  maxOptions: number;
  countError?: string | null;
}

export default function PollOptionsForm({
  options,
  errors,
  onChange,
  onAdd,
  onRemove,
  minOptions,
  maxOptions,
  countError,
}: Props) {
  return (
    <fieldset aria-describedby={countError ? 'option-count-error' : undefined}>
      <legend>
        Options ({minOptions}-{maxOptions})
      </legend>
      {options.map((option, index) => {
        const inputId = `option-input-${index}`;
        const errorId = `option-error-${index}`;
        const error = errors[index];
        return (
          <div key={index} className="option-row">
            <label htmlFor={inputId} className="visually-hidden">
              Option {index + 1}
            </label>
            <input
              id={inputId}
              value={option}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
            {options.length > minOptions && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onRemove(index)}
                aria-label={`Remove option ${index + 1}`}
              >
                Remove
              </button>
            )}
            {error && (
              <div id={errorId} className="field-error" role="alert">
                {error}
              </div>
            )}
          </div>
        );
      })}
      {options.length < maxOptions && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>
          + Add option
        </button>
      )}
      {countError && (
        <div id="option-count-error" className="field-error" role="alert">
          {countError}
        </div>
      )}
    </fieldset>
  );
}
