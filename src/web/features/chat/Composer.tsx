import type { KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { LIMITS } from '@shared/api';
import { VoiceInput } from '@/components/VoiceInput';
import { useI18n } from '@/i18n';

interface Props {
  draft: string;
  setDraft: (updater: (d: string) => string) => void;
  streaming: boolean;
  onSubmit: () => void;
  onStop: () => void;
}

/** Question box pinned to the bottom of the conversation panel. */
export function Composer({ draft, setDraft, streaming, onSubmit, onStop }: Props) {
  const { t, language } = useI18n();

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <form
      className="border-t-2 border-line bg-chalk p-3 lg:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="chat-input" className="label">{t('chat.input')}</label>
      <textarea
        id="chat-input"
        className="field"
        rows={3}
        lang={language}
        maxLength={LIMITS.chatTextChars}
        value={draft}
        onChange={(e) => setDraft(() => e.target.value)}
        onKeyDown={onKeyDown}
        aria-describedby="chat-input-hint"
      />
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <p id="chat-input-hint" className="hint max-w-md">
          {t('chat.inputHint', { count: draft.length, max: LIMITS.chatTextChars })}
        </p>
        <div className="flex flex-wrap items-start gap-3">
          <VoiceInput
            language={language}
            disabled={streaming}
            onText={(text) => setDraft((d) => `${d}${d ? ' ' : ''}${text}`.slice(0, LIMITS.chatTextChars))}
          />
          {streaming ? (
            <button type="button" className="btn btn-danger" onClick={onStop}>
              <Square aria-hidden="true" size={18} fill="currentColor" /> {t('chat.stop')}
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
              <Send aria-hidden="true" size={18} /> {t('chat.send')}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
