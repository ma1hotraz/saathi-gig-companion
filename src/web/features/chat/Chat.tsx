import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { RotateCcw, Send, Square } from 'lucide-react';
import { LIMITS } from '@shared/api';
import { ErrorState, PageHeader } from '@/components/ui';
import { VoiceInput } from '@/components/VoiceInput';
import { useI18n } from '@/i18n';
import { MessageView } from './MessageView';
import { useChat } from './useChat';

const STARTERS = ['unpaid', 'accident', 'schemes', 'notice'] as const;

function nearBottom(): boolean {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
}

/** "Ask Saathi": streaming, multilingual chat grounded in the worker's own context. */
export default function Chat() {
  const { t, language } = useI18n();
  const [useEarnings, setUseEarnings] = useState(true);
  const [draft, setDraft] = useState('');
  const { messages, streaming, error, send, retry, stop, reset } = useChat(useEarnings);
  const endRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    const onScroll = () => {
      stick.current = nearBottom();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (stick.current) endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, error]);

  function submit(text: string) {
    if (!text.trim() || streaming) return;
    stick.current = true;
    send(text);
    setDraft('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(draft);
    }
  }

  const lastIndex = messages.length - 1;

  return (
    <div>
      <PageHeader title={t('chat.title')} intro={t('chat.intro')} />

      {messages.length === 0 ? (
        <section aria-labelledby="chat-starters" className="mb-5">
          <h2 id="chat-starters" className="text-xl">{t('chat.starters')}</h2>
          <ul className="mt-2 space-y-2">
            {STARTERS.map((k) => (
              <li key={k}>
                <button type="button" className="btn w-full text-left" onClick={() => submit(t(`chat.starter.${k}`))}>
                  {t(`chat.starter.${k}`)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="mb-3 flex justify-end">
          <button type="button" className="btn" onClick={reset}>
            <RotateCcw aria-hidden="true" size={18} /> {t('chat.new')}
          </button>
        </div>
      )}

      <div role="log" aria-live="polite" aria-busy={streaming} aria-label={t('chat.log')} className="mb-4">
        <ul className="space-y-3">
          {messages.map((m, i) => (
            <MessageView key={m.id} message={m} pending={streaming && i === lastIndex} />
          ))}
        </ul>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={retry} />
        </div>
      )}
      <div ref={endRef} />

      <form
        className="sign p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
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
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          aria-describedby="chat-input-hint"
        />
        <p id="chat-input-hint" className="hint mt-1">
          {t('chat.inputHint', { count: draft.length, max: LIMITS.chatTextChars })}
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <VoiceInput language={language} disabled={streaming} onText={(text) => setDraft((d) => `${d}${d ? ' ' : ''}${text}`.slice(0, LIMITS.chatTextChars))} />
          {streaming ? (
            <button type="button" className="btn btn-danger" onClick={stop}>
              <Square aria-hidden="true" size={18} fill="currentColor" /> {t('chat.stop')}
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
              <Send aria-hidden="true" size={18} /> {t('chat.send')}
            </button>
          )}
        </div>
        <div className="mt-3 flex items-start gap-3">
          <input id="chat-earnings" type="checkbox" className="mt-1 h-6 w-6 shrink-0" checked={useEarnings} onChange={(e) => setUseEarnings(e.target.checked)} aria-describedby="chat-earnings-hint" />
          <div>
            <label htmlFor="chat-earnings" className="font-bold">{t('chat.useEarnings')}</label>
            <p id="chat-earnings-hint" className="hint">{t('chat.useEarningsHint')}</p>
          </div>
        </div>
      </form>
    </div>
  );
}
