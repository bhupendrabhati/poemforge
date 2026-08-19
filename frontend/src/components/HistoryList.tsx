import type { HistoryItem } from '../types';

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

function preview(item: HistoryItem): string {
  const first = item.poem.split('\n')[0].trim();
  return first.length > 42 ? `${first.slice(0, 42)}\u2026` : first;
}

export function HistoryList({ items, onSelect, onClear }: HistoryListProps) {
  if (items.length === 0) return null;

  return (
    <section className="pf-history" aria-label="Recent poems">
      <div className="pf-history-head">
        <h2 className="pf-history-title">Recently forged</h2>
        <button type="button" className="pf-history-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <ul className="pf-history-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="pf-history-item"
              onClick={() => onSelect(item)}
              title={item.title || preview(item)}
            >
              <span className="pf-history-mood">{item.mood}</span>
              <span className="pf-history-preview">{item.title || preview(item)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
