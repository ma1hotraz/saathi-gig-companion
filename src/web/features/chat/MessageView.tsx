import { Siren } from 'lucide-react';
import { AiNotice, Skeleton } from '@/components/ui';
import { Markdown } from '@/components/Markdown';
import { ReadAloud } from '@/components/ReadAloud';
import { Sources } from '@/components/Sources';
import { useI18n } from '@/i18n';
import { ActionCard } from './ActionCard';
import type { ChatMessage } from './useChat';

interface Props {
  message: ChatMessage;
  /** True while this message is still being written. */
  pending: boolean;
}

/** One chat turn: right-aligned bubble for "You", avatar plus panel for "Saathi". */
export function MessageView({ message, pending }: Props) {
  const { t, language } = useI18n();
  if (message.role === 'user') {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-asphalt px-4 py-3 text-white">
          <p className="sr-only">{t('chat.you')}</p>
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-asphalt bg-signal text-asphalt" aria-hidden="true">
        <Siren size={18} />
      </span>
      <div className="min-w-0 max-w-[92%] flex-1">
        <p className="text-sm font-bold">{t('chat.saathi')}</p>
        <div className="mt-1 rounded-2xl rounded-tl-sm border-2 border-line bg-white px-4 py-3">
          {message.text ? (
            <div lang={language} className="break-words">
              <Markdown>{message.text}</Markdown>
            </div>
          ) : (
            pending && <Skeleton lines={3} />
          )}
          {!pending && message.text && (
            <div className="mt-2">
              <ReadAloud text={message.text} />
            </div>
          )}
        </div>
        {!pending && message.text && (
          <div className="mt-1 text-sm text-muted">
            <Sources sources={message.sources ?? []} />
            <AiNotice />
          </div>
        )}
        {!pending && message.actions?.map((a, i) => <ActionCard key={`${a.name}-${i}`} action={a} />)}
      </div>
    </li>
  );
}
