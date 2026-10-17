import { useEffect, useRef, useState } from 'react';
import { MessagesSquare, RotateCcw } from 'lucide-react';
import { ErrorState, PageHeader } from '@/components/ui';
import { useI18n } from '@/i18n';
import { Composer } from './Composer';
import { MessageView } from './MessageView';
import { Starters } from './Starters';
import { useChat } from './useChat';

function nearBottom(): boolean {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
}

/** "Ask Saathi": streaming, multilingual chat grounded in the worker's own context. */
export default function Chat() {
  const { t } = useI18n();
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

  const lastIndex = messages.length - 1;

  return (
    <div>
      <PageHeader title={t('chat.title')} intro={t('chat.intro')} />

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-asphalt bg-white lg:col-span-8 lg:h-[max(34rem,calc(100dvh-20rem))]">
          <div className="min-h-64 flex-1 overflow-y-auto p-4 lg:p-6">
            <div role="log" aria-live="polite" aria-busy={streaming} aria-label={t('chat.log')}>
              {messages.length === 0 ? (
                <div className="py-6 text-center lg:py-16">
                  <MessagesSquare aria-hidden="true" size={40} className="mx-auto text-signal-deep" />
                  <p className="mx-auto mt-3 max-w-md text-lg font-bold">{t('chat.empty')}</p>
                  <p className="mx-auto mt-1 max-w-md text-muted">{t('chat.emptyHint')}</p>
                </div>
              ) : (
                <ul className="space-y-5">
                  {messages.map((m, i) => (
                    <MessageView key={m.id} message={m} pending={streaming && i === lastIndex} />
                  ))}
                </ul>
              )}
            </div>
            {messages.length === 0 && (
              <Starters headingId="chat-starters-m" className="mt-4 lg:hidden" onPick={submit} disabled={streaming} />
            )}
            {error && (
              <div className="mt-4">
                <ErrorState message={error} onRetry={retry} />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <Composer
            draft={draft}
            setDraft={(fn) => setDraft(fn)}
            streaming={streaming}
            onSubmit={() => submit(draft)}
            onStop={stop}
          />
        </div>

        <aside className="mt-6 space-y-5 lg:sticky lg:top-24 lg:col-span-4 lg:mt-0 lg:self-start" aria-label={t('chat.aside')}>
          <Starters headingId="chat-starters" className="hidden lg:block" onPick={submit} disabled={streaming} />
          <div className="panel flex items-start gap-3 p-4">
            <input
              id="chat-earnings"
              type="checkbox"
              className="mt-1 h-6 w-6 shrink-0"
              checked={useEarnings}
              onChange={(e) => setUseEarnings(e.target.checked)}
              aria-describedby="chat-earnings-hint"
            />
            <div>
              <label htmlFor="chat-earnings" className="font-bold">{t('chat.useEarnings')}</label>
              <p id="chat-earnings-hint" className="hint">{t('chat.useEarningsHint')}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button type="button" className="btn w-full" onClick={reset}>
              <RotateCcw aria-hidden="true" size={18} /> {t('chat.new')}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
