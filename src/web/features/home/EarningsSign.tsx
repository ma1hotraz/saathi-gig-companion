import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { useI18n } from '@/i18n';
import { ErrorState, Skeleton } from '@/components/ui';
import { WeekChart } from './WeekChart';
import { useWeekEarnings } from './useWeekEarnings';

const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function Amount({ value, label, big }: { value: number; label: string; big?: boolean }) {
  return (
    <div>
      <p className="text-lg font-bold">{label}</p>
      <p className={`money mt-1 leading-none ${big ? 'text-6xl sm:text-7xl lg:text-8xl' : 'text-5xl sm:text-6xl lg:text-7xl'}`}>
        {value < 0 ? '−' : ''}₹{rupees.format(Math.abs(value))}
      </p>
    </div>
  );
}

/** The one sign panel on Home: real net earnings for today and the last 7 days. */
export function EarningsSign() {
  const { t } = useI18n();
  const { state, reload } = useWeekEarnings();

  if (state.status === 'loading') return <div className="panel p-6"><Skeleton lines={4} /></div>;
  if (state.status === 'error') return <ErrorState message={t('home.err.earnings')} onRetry={reload} />;

  const { today, week } = state.data;
  if (week.byDay.length === 0) {
    return (
      <section className="sign sign-yellow rise flex h-full flex-col items-start justify-center gap-3 p-6 lg:p-10" aria-labelledby="home-net">
        <h2 id="home-net" className="text-3xl lg:text-4xl">{t('home.empty.title')}</h2>
        <p className="max-w-prose text-lg">{t('home.empty.body')}</p>
        <Link to="/earnings" className="btn mt-2 no-underline">
          <Plus aria-hidden="true" size={22} /> {t('home.empty.cta')}
        </Link>
      </section>
    );
  }

  return (
    <section className="sign sign-yellow rise p-6 lg:p-8" aria-labelledby="home-net">
      <h2 id="home-net" className="text-xl">{t('home.net.title')}</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Amount value={today.net} label={t('home.today')} />
        <Amount value={week.net} label={t('home.week')} big />
      </div>
      <div className="mt-6 border-t-2 border-asphalt pt-4">
        <WeekChart byDay={week.byDay} />
      </div>
      <p className="mt-3 text-sm">{t('home.net.note', { days: week.days })}</p>
    </section>
  );
}
