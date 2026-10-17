import type { ReactNode } from 'react';
import { CalendarClock, Coins, TriangleAlert } from 'lucide-react';
import type { DocumentAnalysis } from '@shared/api';
import { useI18n } from '@/i18n';
import { AiNotice } from '@/components/ui';
import { ReadAloud } from '@/components/ReadAloud';

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function BulletList({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const { t, language } = useI18n();
  if (items.length === 0) return <p className="mt-2 text-muted">{t('docs.nothing')}</p>;
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag lang={language} className={`mt-2 space-y-2 pl-6 ${ordered ? 'list-decimal' : 'list-disc'}`}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}

/** Reading-ordered view of a DocumentAnalysis: what it is, key points, deadlines, money, red flags, next steps. */
export function AnalysisView({ analysis }: { analysis: DocumentAnalysis }) {
  const { t, language } = useI18n();
  return (
    <article aria-labelledby="docs-result-title">
      <h2 id="docs-result-title">{t('docs.resultTitle')}</h2>
      <section className="sign mt-3 p-4">
        <h3>{t('docs.what')}</h3>
        <p lang={language} className="mt-1 text-lg font-bold">{analysis.document_type}</p>
        <p lang={language} className="mt-2 max-w-prose">{analysis.plain_summary}</p>
        <div className="mt-3">
          <ReadAloud text={`${analysis.document_type}. ${analysis.plain_summary}`} />
        </div>
      </section>

      <Section title={t('docs.keyPoints')}>
        <BulletList items={analysis.key_points} />
      </Section>

      <Section title={t('docs.deadlines')} icon={<CalendarClock aria-hidden="true" size={24} />}>
        {analysis.deadlines.length === 0 ? (
          <p className="mt-2 text-muted">{t('docs.nothing')}</p>
        ) : (
          <ul lang={language} className="mt-2 space-y-2">
            {analysis.deadlines.map((d, i) => (
              <li key={i} className="rounded-xl border-2 border-asphalt bg-signal-soft p-3 text-lg font-bold">{d}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('docs.money')} icon={<Coins aria-hidden="true" size={24} />}>
        <BulletList items={analysis.money_involved} />
      </Section>

      <Section title={t('docs.flags')} icon={<TriangleAlert aria-hidden="true" size={24} />}>
        {analysis.red_flags.length === 0 ? (
          <p className="mt-2 text-muted">{t('docs.nothing')}</p>
        ) : (
          <ul lang={language} className="mt-2 space-y-2">
            {analysis.red_flags.map((f, i) => (
              <li key={i} className="rounded-xl border-2 border-alert bg-alert-soft p-3">
                <strong className="text-alert">{t('docs.flagLabel')}</strong> {f}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('docs.steps')}>
        <BulletList items={analysis.next_steps} ordered />
      </Section>
      <AiNotice />
    </article>
  );
}
