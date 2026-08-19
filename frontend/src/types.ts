export type Mood = 'happy' | 'calm' | 'curious' | 'whimsical' | 'melancholy' | 'epic';

export type Style = 'haiku' | 'free-verse' | 'rhyming' | 'limerick' | 'micro-story';

export type Length = 'short' | 'medium' | 'long';

export interface GenerateRequest {
  mood: Mood;
  style: Style;
  length: Length;
  topic?: string;
}

export interface GenerateResult {
  poem: string;
  title?: string;
  usedAi: boolean;
}

export interface HistoryItem extends GenerateResult {
  id: string;
  timestamp: number;
  mood: Mood;
  style: Style;
  length: Length;
  topic?: string;
}

export const MOODS: { value: Mood; label: string }[] = [
  { value: 'happy', label: 'Happy' },
  { value: 'calm', label: 'Calm' },
  { value: 'curious', label: 'Curious' },
  { value: 'whimsical', label: 'Whimsical' },
  { value: 'melancholy', label: 'Melancholy' },
  { value: 'epic', label: 'Epic' },
];

export const STYLES: { value: Style; label: string }[] = [
  { value: 'haiku', label: 'Haiku' },
  { value: 'free-verse', label: 'Free verse' },
  { value: 'rhyming', label: 'Rhyming' },
  { value: 'limerick', label: 'Limerick' },
  { value: 'micro-story', label: 'Micro-story' },
];

export const LENGTHS: { value: Length; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];
