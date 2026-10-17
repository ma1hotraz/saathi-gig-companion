import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { summarizeEarnings } from '@shared/earnings';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useI18n } from '@/i18n';
import { AddEntry } from './AddEntry';
import { PlatformBars, WeekChart } from './Charts';
import { EntriesList } from './EntriesList';
import { Insights } from './Insights';
import { SummaryPanel } from './SummaryPanel';
import { useEarnings } from './useEarnings';

/** Earnings tracker: 30-day summary, ranked platforms, week chart, history, and a sticky add + AI column. */
export default function Earnings() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const { data, error, loading, reload, add, remove } = useEarnings();
  const summary = useMemo(() => (data ? summarizeEarnings(data.month) : null), [data]);

  // Values from the chat assistant's "log earning" action; sanitised to a plain number.
  const amount = Number(params.get('amount'));
  const initial = {
    platform: (params.get('platform') ?? '').slice(0, 40),
    amount: Number.isFinite(amount) && amount > 0 ? String(amount) : '',
  };
  const hasMonth = (data?.month.length ?? 0) > 0;

  return (
    <div>
      <PageHeader title={t('earnings.title')} intro={t('earnings.intro')} />
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {!error && loading && !data && <Skeleton lines={5} />}
      {summary && <SummaryPanel summary={summary} empty={!hasMonth} />}
      <div className="mt-8 gap-6 lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="order-2 mt-8 space-y-8 lg:order-1 lg:col-span-7 lg:mt-0">
          {summary && hasMonth && (
            <>
              <PlatformBars platforms={summary.byPlatform} />
              <WeekChart byDay={summary.byDay} />
            </>
          )}
          {data && <EntriesList entries={data.recent} onDelete={remove} />}
        </div>
        <div className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <AddEntry initial={initial} onSave={add} />
          <Insights hasEntries={(data?.recent.length ?? 0) > 0} />
        </div>
      </div>
    </div>
  );
}
