import { useEffect, useState } from 'react';
import type { GenerateResult } from '../types';

interface PoemCardProps {
  result: GenerateResult | null;
  loading: boolean;
  error: string | null;
}

function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export function PoemCard({ result, loading, error }: PoemCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [result]);

  if (loading) {
    return (
      <section className="pf-card pf-card--loading" aria-live="polite" aria-busy="true">
        <div className="pf-loader">
          <span />
          <span />
          <span />
        </div>
        <p className="pf-loading-note">Mixing syllables...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pf-card pf-card--error" role="alert">
        <p className="pf-error-title">The kiosk hiccuped.</p>
        <p className="pf-error-message">{error}</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="pf-card pf-card--empty" aria-live="polite">
        <p className="pf-empty-title">Your poem will appear here.</p>
        <p className="pf-empty-note">
          Pick a mood, a style, and press Generate. Add a topic to point the poem at something you love.
        </p>
      </section>
    );
  }

  const lines = result.poem.split('\n').filter((l) => l.trim().length > 0);
  const fullText = [result.title, result.poem].filter(Boolean).join('\n\n');

  const handleCopy = async () => {
    await copyText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = { title: result.title || 'PoemForge poem', text: fullText };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or share failed; fall through to clipboard
      }
    }
    await copyText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="pf-card pf-card--poem" aria-live="polite">
      {result.title && <h2 className="pf-poem-title">{result.title}</h2>}
      <div className="pf-poem">
        {lines.map((line, i) => (
          <span
            key={`${i}-${line}`}
            className="pf-poem-line"
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            {line}
          </span>
        ))}
      </div>
      <div className="pf-poem-meta">
        <span className={`pf-badge${result.usedAi ? ' pf-badge--ai' : ''}`}>
          {result.usedAi ? 'sparked by Nova' : 'crafted by hand'}
        </span>
        <div className="pf-poem-actions">
          <button type="button" className="pf-action" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="pf-action" onClick={handleShare}>
            Share
          </button>
        </div>
      </div>
    </section>
  );
}
