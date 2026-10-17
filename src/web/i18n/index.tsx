import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANGUAGE_CODES, LANGUAGES, type LanguageCode } from '@shared/domain';
import * as common from './messages/common';
import * as home from './messages/home';
import * as earnings from './messages/earnings';
import * as chat from './messages/chat';
import * as documents from './messages/documents';
import * as grievance from './messages/grievance';
import * as rights from './messages/rights';
import * as safety from './messages/safety';

type Messages = Record<string, string>;

/**
 * Each feature owns its own message file exporting `en`, `hi` and `ta`. The UI is translated for
 * those three; for the other languages the AI answers in the worker's language and the interface
 * falls back to English (never to a raw key).
 */
const modules = [common, home, earnings, chat, documents, grievance, rights, safety];
const catalogs: Record<'en' | 'hi' | 'ta', Messages> = {
  en: Object.assign({}, ...modules.map((m) => m.en)),
  hi: Object.assign({}, ...modules.map((m) => m.hi)),
  ta: Object.assign({}, ...modules.map((m) => m.ta)),
};

const STORAGE_KEY = 'saathi.language';

function initialLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if ((LANGUAGE_CODES as string[]).includes(stored ?? '')) return stored as LanguageCode;
  } catch {
    /* storage blocked: fall through */
  }
  const browser = navigator.language.slice(0, 2);
  return (LANGUAGE_CODES as string[]).includes(browser) ? (browser as LanguageCode) : 'en';
}

interface I18nState {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  /** Translates a key, replacing `{name}` placeholders. Falls back to English, then the key. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** BCP-47 tag for speech and `lang` attributes. */
  bcp47: string;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage blocked: language still applies for this session */
    }
  }, []);

  const bcp47 = LANGUAGES.find((l) => l.code === language)?.bcp47 ?? 'en-IN';
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nState>(() => {
    const catalog = language === 'hi' || language === 'ta' ? catalogs[language] : catalogs.en;
    return {
      language,
      setLanguage,
      bcp47,
      t: (key, vars) => {
        const raw = catalog[key] ?? catalogs.en[key] ?? key;
        return vars ? raw.replace(/\{(\w+)\}/g, (_m, k: string) => String(vars[k] ?? '')) : raw;
      },
    };
  }, [language, setLanguage, bcp47]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
