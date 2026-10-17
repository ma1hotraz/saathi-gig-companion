import type { SafetyResult } from '@shared/api';
import { useI18n } from '@/i18n';
import { AiNotice } from '@/components/ui';
import { ReadAloud } from '@/components/ReadAloud';
import { Sources } from '@/components/Sources';

function DoNow({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6" aria-label={title}>
      <h3 className="text-2xl">{title}</h3>
      <ol className="mt-3 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-4 rounded-xl border-2 border-asphalt bg-paper p-4">
            <span aria-hidden="true" className="money flex size-12 shrink-0 items-center justify-center rounded-full bg-signal text-3xl">{i + 1}</span>
            <span className="pt-2 text-lg font-bold leading-snug">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Quiet({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="panel p-5">
      <h3 className="text-lg">{title}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </section>
  );
}

/** Renders the model's safety guidance, most urgent steps first. */
export function SituationResult({ result }: { result: SafetyResult }) {
  const { t, language } = useI18n();
  const spoken = [result.summary, ...result.do_now, ...result.avoid, ...result.get_help].join('. ');
  return (
    <article lang={language} className="mt-8 border-t border-line pt-6">
      <p className="border-l-4 border-signal pl-4 text-xl">{result.summary}</p>
      <DoNow title={t('safety.doNow')} items={result.do_now} />
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Quiet title={t('safety.avoid')} items={result.avoid} />
        <Quiet title={t('safety.getHelp')} items={result.get_help} />
      </div>
      <Sources sources={result.sources} />
      <AiNotice />
      <div className="mt-3"><ReadAloud text={spoken} /></div>
    </article>
  );
}
