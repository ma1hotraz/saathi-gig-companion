import type { EarningsSummary } from '@shared/earnings';
import { useI18n } from '@/i18n';
import { formatRupees } from './dates';

/** The sign panel: last 30 days net income, per-hour rate, earned and spent. */
export function SummaryPanel({ summary }: { summary: EarningsSummary }) {
  const { t } = useI18n();
  return (
    <section className="sign sign-yellow" aria-labelledby="sum-h">
      <h2 id="sum-h" className="text-xl">{t('earnings.sum.title')}</h2>
      <p className="money text-6xl leading-tight">{formatRupees(summary.net)}</p>
      <p className="font-bold">{t('earnings.sum.net')}</p>
      <p className="mt-3 font-bold">
        {summary.netPerHour === null ? (
          t('earnings.sum.noHours')
        ) : (
          <>
            <span className="money text-3xl">{formatRupees(summary.netPerHour, true)}</span> {t('earnings.sum.perHour')}
          </>
        )}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t-2 border-asphalt pt-3">
        <div>
          <dt>{t('earnings.sum.earned')}</dt>
          <dd className="money text-2xl">{formatRupees(summary.totalIn)}</dd>
        </div>
        <div>
          <dt>{t('earnings.sum.spent')}</dt>
          <dd className="money text-2xl">{formatRupees(summary.totalExpenses)}</dd>
        </div>
      </dl>
    </section>
  );
}
