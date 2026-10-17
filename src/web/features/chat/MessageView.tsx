import { AiNotice } from '@/components/ui';
import { Markdown } from '@/components/Markdown';
import { ReadAloud } from '@/components/ReadAloud';
import { Sources } from '@/components/Sources';
import { Skeleton } from '@/components/ui';
import { useI18n } from '@/i18n';
import { ActionCard } from './ActionCard';
import type { ChatMessage } from './useChat';

interface Props {
  message: ChatMessage;
  /** True while this message is still being written. */
  pending: boolean;
}

/** One chat turn: labelled "You" or "Saathi", with sources and next-step cards for answers. */
export function MessageView({ message, pending }: Props) {
  const { t, language } = useI18n();
  if (message.role === 'user') {
    return (
      <li className="ml-8 rounded-xl border-2 border-asphalt bg-paper p-3">
        <p className="font-bold">{t('chat.you')}</p>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </li>
    );
  }
  return (
    <li className="mr-4 rounded-xl border-l-8 border-asphalt bg-signal-soft p-3">
      <p className="font-bold">{t('chat.saathi')}</p>
      {message.text ? (
        <div lang={language} className="mt-1 break-words">
          <Markdown>{message.text}</Markdown>
        </div>
      ) : (
        pending && <div className="mt-2"><Skeleton lines={3} /></div>
      )}
      {!pending && message.text && (
        <>
          <Sources sources={message.sources ?? []} />
          <AiNotice />
          <div className="mt-2">
            <ReadAloud text={message.text} />
          </div>
        </>
      )}
      {!pending && message.actions?.map((a, i) => <ActionCard key={`${a.name}-${i}`} action={a} />)}
    </li>
  );
}
