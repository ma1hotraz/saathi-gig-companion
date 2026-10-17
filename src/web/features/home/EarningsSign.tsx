import { Link } from 'react-router';
import { useI18n } from '@/i18n';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useWeekEarnings } from './useWeekEarnings';

const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function Amount({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-bold">{label}</p>
      <p className="money text-[3.5rem] leading-none">
        {value < 0 ? '−' : ''}₹{rupees.format(Math.abs(value))}
      </p>
    </div>
  );
}

/** The one sign panel on Home: real net earnings for today and the last 7 days. */
export function EarningsSign() {
  const { t } = useI18n();
  const { state, reload } = useWeekEarnings();

  if (state.status === 'loading') return <Skeleton lines={3} />;
  if (state.status === 'error') return <ErrorState message={t('home.err.earnings')} onRetry={reload} />;

  const { today, week } = state.data;
  if (week.byDay.length === 0) {
    return (
      <EmptyState
        title={t('home.empty.title')}
        body={t('home.empty.body')}
        action={<Link to="/earnings" className="btn btn-primary">{t('home.empty.cta')}</Link>}
      />
    );
  }

  return (
    <section className="sign sign-yellow p-4" aria-labelledby="home-net">
      <h2 id="home-net" className="text-base font-bold">{t('home.net.title')}</h2>
      <div className="mt-2 grid gap-4">
        <Amount value={today.net} label={t('home.today')} />
        <Amount value={week.net} label={t('home.week')} />
      </div>
      <p className="mt-3 text-sm">{t('home.net.note', { days: week.days })}</p>
    </section>
  );
}
