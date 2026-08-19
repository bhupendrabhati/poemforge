import { useState } from 'react';

interface TopicInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function TopicInput({ value, onChange, onClear }: TopicInputProps) {
  const [focused, setFocused] = useState(false);
  const showClear = value.length > 0;

  return (
    <div className={`pf-topic${focused ? ' is-focused' : ''}`}>
      <label className="pf-field-label" htmlFor="topic">
        Topic
      </label>
      <div className="pf-topic-row">
        <input
          id="topic"
          type="text"
          maxLength={40}
          value={value}
          placeholder="A word, a place, a feeling... (optional)"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const form = e.currentTarget.form;
              if (form) form.requestSubmit();
            }
          }}
        />
        {showClear && (
          <button type="button" className="pf-topic-clear" onClick={onClear} aria-label="Clear topic">
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
