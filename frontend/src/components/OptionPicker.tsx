interface Option<T extends string> {
  value: T;
  label: string;
}

interface OptionPickerProps<T extends string> {
  id: string;
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function OptionPicker<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
}: OptionPickerProps<T>) {
  return (
    <fieldset className="pf-fieldset" id={`${id}-fieldset`}>
      <legend className="pf-field-label">{label}</legend>
      <div className="pf-picker" role="radiogroup" aria-labelledby={`${id}-fieldset`}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`pf-chip${selected ? ' is-selected' : ''}`}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
