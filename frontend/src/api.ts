import type { GenerateRequest, GenerateResult } from './types';

const REQUEST_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function generatePoem(req: GenerateRequest): Promise<GenerateResult> {
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // non-JSON response; fall through to generic error below
    }

    if (!res.ok) {
      const message =
        data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status);
    }

    if (!data || typeof data !== 'object' || !('poem' in data) || typeof data.poem !== 'string') {
      throw new ApiError('The poetry kiosk returned something unexpected.', 502);
    }

    const result = data as Partial<GenerateResult>;
    return {
      poem: result.poem as string,
      title: typeof result.title === 'string' ? result.title : undefined,
      usedAi: result.usedAi === true,
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('The poetry kiosk is taking too long. Please try again.', 504);
    }
    throw new ApiError('Could not reach the poetry kiosk. Is the backend running?', 0);
  } finally {
    clearTimeout(timer);
  }
}
