export const TEXT_SCALES = [
  { id: 'small', value: 0.9 },
  { id: 'normal', value: 1 },
  { id: 'large', value: 1.2 },
] as const;

const KEY = 'saathi.textScale';

/** Reads the stored scale; falls back to 1 when storage is blocked or the value is unknown. */
export function readTextScale(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return TEXT_SCALES.some((s) => s.value === n) ? n : 1;
  } catch {
    return 1;
  }
}

/** Sets --text-scale on the root element and remembers it. */
export function setTextScale(value: number): void {
  document.documentElement.style.setProperty('--text-scale', String(value));
  try {
    localStorage.setItem(KEY, String(value));
  } catch {
    /* storage blocked: applies for this session only */
  }
}

/** Applies the stored text size; call once at app start. */
export function applyStoredTextScale(): void {
  document.documentElement.style.setProperty('--text-scale', String(readTextScale()));
}
