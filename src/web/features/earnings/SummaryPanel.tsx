import type { EarningsSummary } from '@shared/earnings';
import { useI18n } from '@/i18n';
import { formatRupees } from './dates';

/** The screen's one loud plate: 30-day net, net per hour, earned and spent; an invitation when empty. */
export function SummaryPanel({ summary, empty }: { summary: EarningsSummary; empty: boolean }) {
  const { t } = useI18n();
  if (empty) {
    return (
      <section className="sign sign-yellow rise p-5 lg:p-8" aria-labelledby="sum-h">
        <h2 id="sum-h" className="text-2xl">{t('earnings.sum.emptyTitle')}</h2>
        <p className="mt-2 max-w-prose text-lg font-bold">{t('earnings.sum.emptyBody')}</p>
      </section>
    );
  }
  return (
    <section className="sign sign-yellow rise p-5 lg:p-8" aria-labelledby="sum-h">
      <h2 id="sum-h" className="text-xl">{t('earnings.sum.title')}</h2>
      <div className="mt-3 gap-8 lg:grid lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-6">
          <p className="money text-6xl leading-none lg:text-8xl">{formatRupees(summary.net)}</p>
          <p className="mt-2 font-bold">{t('earnings.sum.net')}</p>
        </div>
        <div className="mt-6 border-t-2 border-asphalt pt-4 lg:col-span-3 lg:mt-0 lg:border-l-2 lg:border-t-0 lg:pl-6 lg:pt-0">
          {summary.netPerHour === null ? (
            <p className="font-bold">{t('earnings.sum.noHours')}</p>
          ) : (
            <>
              <p className="money text-4xl lg:text-5xl">{formatRupees(summary.netPerHour, true)}</p>
              <p className="mt-1 font-bold">{t('earnings.sum.perHour')}</p>
            </>
          )}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t-2 border-asphalt pt-4 lg:col-span-3 lg:mt-0 lg:grid-cols-1 lg:border-l-2 lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <dt className="font-bold">{t('earnings.sum.earned')}</dt>
            <dd className="money text-2xl">{formatRupees(summary.totalIn)}</dd>
          </div>
          <div>
            <dt className="font-bold">{t('earnings.sum.spent')}</dt>
            <dd className="money text-2xl">{formatRupees(summary.totalExpenses)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
