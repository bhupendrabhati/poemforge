import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, generatePoem } from './api';
import { OptionPicker } from './components/OptionPicker';
import { TopicInput } from './components/TopicInput';
import { PoemCard } from './components/PoemCard';
import { HistoryList } from './components/HistoryList';
import {
  MOODS,
  STYLES,
  LENGTHS,
  type Mood,
  type Style,
  type Length,
  type GenerateResult,
  type HistoryItem,
} from './types';

const HISTORY_KEY = 'poemforge:history';
const HISTORY_MAX = 12;

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_MAX)));
  } catch {
    // storage unavailable (private mode / quota); history is best-effort
  }
}

export default function App() {
  const [mood, setMood] = useState<Mood>('whimsical');
  const [style, setStyle] = useState<Style>('free-verse');
  const [length, setLength] = useState<Length>('medium');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const requestIdRef = useRef(0);

  const runGeneration = useCallback(
    async (payload: { mood: Mood; style: Style; length: Length; topic?: string }) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const poem = await generatePoem(payload);
        if (requestId !== requestIdRef.current) return;

        setResult(poem);
        setHistory((prev) => {
          const item: HistoryItem = {
            ...poem,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
            mood: payload.mood,
            style: payload.style,
            length: payload.length,
            topic: payload.topic,
          };
          const next = [item, ...prev.filter((p) => p.poem !== poem.poem)].slice(0, HISTORY_MAX);
          saveHistory(next);
          return next;
        });
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        const message =
          err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
        setError(message);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runGeneration({ mood, style, length, topic: topic.trim() || undefined });
  };

  const surprise = () => {
    const m = MOODS[Math.floor(Math.random() * MOODS.length)].value;
    const s = STYLES[Math.floor(Math.random() * STYLES.length)].value;
    const l = LENGTHS[Math.floor(Math.random() * LENGTHS.length)].value;
    setMood(m);
    setStyle(s);
    setLength(l);
  };

  const selectHistory = (item: HistoryItem) => {
    setResult({ poem: item.poem, title: item.title, usedAi: item.usedAi });
    if (item.mood) setMood(item.mood);
    if (item.style) setStyle(item.style);
    if (item.length) setLength(item.length);
    setTopic(item.topic || '');
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="pf-shell">
      <div className="pf-blob pf-blob--one" aria-hidden="true" />
      <div className="pf-blob pf-blob--two" aria-hidden="true" />

      <header className="pf-header">
        <h1 className="pf-logo">
          Poem<span className="pf-logo-accent">Forge</span>
        </h1>
        <p className="pf-tagline">a tiny poetry kiosk — pick a mood, press generate, smile.</p>
      </header>

      <main className="pf-main">
        <form className="pf-controls" onSubmit={handleSubmit}>
          <OptionPicker id="mood" label="Mood" options={MOODS} value={mood} onChange={setMood} />
          <OptionPicker id="style" label="Style" options={STYLES} value={style} onChange={setStyle} />
          <OptionPicker
            id="length"
            label="Length"
            options={LENGTHS}
            value={length}
            onChange={setLength}
          />
          <TopicInput value={topic} onChange={setTopic} onClear={() => setTopic('')} />
          <div className="pf-actions">
            <button type="submit" className="pf-generate" disabled={loading}>
              {loading ? 'Forging...' : 'Generate'}
            </button>
            <button
              type="button"
              className="pf-surprise"
              onClick={surprise}
              disabled={loading}
              aria-label="Surprise me with random settings"
            >
              Surprise me
            </button>
          </div>
        </form>

        <PoemCard result={result} loading={loading} error={error} />

        <HistoryList items={history} onSelect={selectHistory} onClear={clearHistory} />
      </main>

      <footer className="pf-footer">
        Runs on AWS Bedrock Nova + Lambda — Free Tier friendly.
      </footer>
    </div>
  );
}
