import type { DocumentAnalysis } from '@shared/api';
import { useI18n } from '@/i18n';
import { AiNotice, Chip } from '@/components/ui';
import { ReadAloud } from '@/components/ReadAloud';
import { Deadlines, MoneyList, NextSteps, RedFlags } from './AnalysisParts';

/** Reading-ordered explanation: type and summary lead, then dates, money, warnings and next steps. */
export function AnalysisView({ analysis }: { analysis: DocumentAnalysis }) {
  const { t, language } = useI18n();
  return (
    <article className="panel space-y-8 p-5 lg:p-8" aria-labelledby="docs-result-title">
      <header>
        <Chip tone="blue"><span lang={language}>{analysis.document_type}</span></Chip>
        <h2 id="docs-result-title" className="mt-3">{t('docs.resultTitle')}</h2>
        <p lang={language} className="mt-2 text-lg leading-relaxed lg:text-xl">{analysis.plain_summary}</p>
        <div className="mt-3">
          <ReadAloud text={`${analysis.document_type}. ${analysis.plain_summary}`} />
        </div>
      </header>

      {analysis.key_points.length > 0 && (
        <section aria-labelledby="docs-key-title">
          <h3 id="docs-key-title">{t('docs.keyPoints')}</h3>
          <ul lang={language} className="mt-2 list-disc space-y-2 pl-6">
            {analysis.key_points.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}

      <Deadlines items={analysis.deadlines} />
      <MoneyList items={analysis.money_involved} />
      <RedFlags items={analysis.red_flags} />
      <NextSteps items={analysis.next_steps} />
      <AiNotice />
    </article>
  );
}
