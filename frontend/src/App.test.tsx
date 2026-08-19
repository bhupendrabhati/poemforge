import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

function mockFetch(result: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => result,
  });
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the header and all pickers', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('PoemForge');
    expect(screen.getByRole('radiogroup', { name: /Mood/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Style/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Length/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Topic/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
  });

  it('shows the empty state before any generation', () => {
    render(<App />);
    expect(screen.getByText(/Your poem will appear here/i)).toBeInTheDocument();
  });

  it('generates a poem and shows the usedAi badge', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ poem: 'First test line\nSecond test line', title: 'Test Title', usedAi: false })
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

    await waitFor(() => expect(screen.getAllByText('Test Title').length).toBeGreaterThan(0));
    expect(screen.getByText('First test line')).toBeInTheDocument();
    expect(screen.getByText('Second test line')).toBeInTheDocument();
    expect(screen.getByText(/crafted by hand/i)).toBeInTheDocument();
    expect(screen.getByText(/Recently forged/i)).toBeInTheDocument();
  });

  it('marks AI-generated poems with the Nova badge', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ poem: 'A Nova line', title: undefined, usedAi: true })
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

    await waitFor(() => expect(screen.getByText(/sparked by Nova/i)).toBeInTheDocument());
  });

  it('shows a friendly error when the request fails', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Boom' }, false, 500));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

    await waitFor(() => expect(screen.getByText(/Boom/i)).toBeInTheDocument());
  });
});
