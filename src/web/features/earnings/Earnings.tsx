import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { summarizeEarnings } from '@shared/earnings';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useI18n } from '@/i18n';
import { AddEntry } from './AddEntry';
import { PlatformBars, WeekChart } from './Charts';
import { EntriesList } from './EntriesList';
import { Insights } from './Insights';
import { SummaryPanel } from './SummaryPanel';
import { useEarnings } from './useEarnings';

/** Earnings tracker: 30-day summary, three ways to add income, history and AI insights. */
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

  return (
    <div>
      <PageHeader title={t('earnings.title')} intro={t('earnings.intro')} />
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {!error && loading && !data && <Skeleton lines={5} />}
      {summary && data && (
        data.month.length === 0 ? (
          <EmptyState title={t('earnings.sum.emptyTitle')} body={t('earnings.sum.emptyBody')} />
        ) : (
          <>
            <SummaryPanel summary={summary} />
            <PlatformBars platforms={summary.byPlatform} />
            <WeekChart byDay={summary.byDay} />
          </>
        )
      )}
      <AddEntry initial={initial} onSave={add} />
      {data && <EntriesList entries={data.recent} onDelete={remove} />}
      <Insights hasEntries={(data?.recent.length ?? 0) > 0} />
    </div>
  );
}
