import type { LanguageCode } from '@shared/domain';

/** "Saathi" (companion) written in each script the app supports. */
export const SCRIPT_NAMES: ReadonlyArray<{ code: LanguageCode; word: string }> = [
  { code: 'hi', word: 'साथी' },
  { code: 'bn', word: 'সাথী' },
  { code: 'ta', word: 'சாத்தி' },
  { code: 'te', word: 'సాథి' },
  { code: 'mr', word: 'साथी' },
  { code: 'kn', word: 'ಸಾಥಿ' },
  { code: 'gu', word: 'સાથી' },
  { code: 'ml', word: 'സാഥി' },
  { code: 'pa', word: 'ਸਾਥੀ' },
  { code: 'or', word: 'ସାଥୀ' },
];
