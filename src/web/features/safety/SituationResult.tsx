import type { SafetyResult } from '@shared/api';
import { useI18n } from '@/i18n';
import { AiNotice } from '@/components/ui';
import { ReadAloud } from '@/components/ReadAloud';
import { Sources } from '@/components/Sources';

function Bullets({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  if (items.length === 0) return null;
  const List = ordered ? 'ol' : 'ul';
  return (
    <section className="mt-4">
      <h3 className="text-lg">{title}</h3>
      <List className={`mt-1 space-y-1 pl-6 ${ordered ? 'list-decimal font-bold' : 'list-disc'}`}>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </List>
    </section>
  );
}

/** Renders the model's safety guidance, most urgent steps first. */
export function SituationResult({ result }: { result: SafetyResult }) {
  const { t, language } = useI18n();
  const spoken = [result.summary, ...result.do_now, ...result.avoid, ...result.get_help].join('. ');
  return (
    <article lang={language} className="mt-4">
      <p className="text-lg">{result.summary}</p>
      <Bullets title={t('safety.doNow')} items={result.do_now} ordered />
      <Bullets title={t('safety.avoid')} items={result.avoid} />
      <Bullets title={t('safety.getHelp')} items={result.get_help} />
      <Sources sources={result.sources} />
      <AiNotice />
      <div className="mt-3"><ReadAloud text={spoken} /></div>
    </article>
  );
}
