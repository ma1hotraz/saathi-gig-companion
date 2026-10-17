import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { LIMITS, type EarningsExtractResult } from '@shared/api';
import { TextArea } from '@/components/ui';
import { VoiceInput } from '@/components/VoiceInput';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useExtract } from './useExtract';

/** Speak or type a description of the day's work; the AI turns it into draft entries. */
export function SpeakTab({ onResult }: { onResult: (r: EarningsExtractResult) => void }) {
  const { t, language } = useI18n();
  const [text, setText] = useState('');
  const { busy, error, run } = useExtract(onResult);

  const append = (spoken: string) => setText((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken).slice(0, LIMITS.chatTextChars));

  return (
    <div>
      <TextArea
        label={t('earnings.speak.label')}
        hint={t('earnings.speak.hint')}
        value={text}
        maxLength={LIMITS.chatTextChars}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap items-start gap-3">
        <VoiceInput language={language} onText={append} disabled={busy} />
        <button type="button" className="btn" disabled={busy} onClick={() => setText(t('earnings.speak.sampleText'))}>
          <Sparkles aria-hidden="true" size={20} />
          {t('earnings.speak.sampleBtn')}
        </button>
        <button type="button" className="btn btn-primary" disabled={busy || !text.trim()} onClick={() => void run((signal) => api.extractEarningsText(text.trim(), language, signal))}>
          {busy ? t('earnings.reading') : t('earnings.speak.go')}
        </button>
      </div>
      <p role="alert" className="mt-3 font-bold text-alert">{error}</p>
    </div>
  );
}
