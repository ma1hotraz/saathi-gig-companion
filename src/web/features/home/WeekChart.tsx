import { useI18n } from '@/i18n';
import { localDate } from './useWeekEarnings';

const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const DAYS = 7;
const BASE_TOP = 36;
const BASE_MID = 20;
const MAX_BAR = 34;

function parseLocal(date: string): Date {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Seven small bars of daily net money, drawn from the rows already fetched (no second query). */
export function WeekChart({ byDay }: { byDay: ReadonlyArray<{ date: string; net: number }> }) {
  const { t, language } = useI18n();
  const nets = new Map(byDay.map((d) => [d.date, d.net]));
  const days = Array.from({ length: DAYS }, (_, i) => {
    const date = localDate(i - (DAYS - 1));
    return {
      date,
      label: parseLocal(date).toLocaleDateString(language, { weekday: 'short' }),
      net: nets.get(date) ?? null,
    };
  });
  const hasNegative = days.some((d) => (d.net ?? 0) < 0);
  const base = hasNegative ? BASE_MID : BASE_TOP;
  const room = hasNegative ? 17 : MAX_BAR;
  const peak = Math.max(1, ...days.map((d) => Math.abs(d.net ?? 0)));
  const values = days.map((d) => `${d.label} ${d.net === null ? '–' : `${d.net < 0 ? '−' : ''}₹${rupees.format(Math.abs(d.net))}`}`).join(', ');

  return (
    <figure className="m-0">
      <figcaption className="text-base font-bold">{t('home.chart.title')}</figcaption>
      <svg className="mt-2 block h-24 w-full" viewBox="0 0 70 40" preserveAspectRatio="none" role="img" aria-label={t('home.chart.alt', { values })}>
        <line x1="0" x2="70" y1={base} y2={base} strokeWidth="0.6" className="stroke-asphalt" vectorEffect="non-scaling-stroke" />
        {days.map((d, i) => {
          const h = d.net === null ? 0.8 : Math.max(1.2, (Math.abs(d.net) / peak) * room);
          const down = (d.net ?? 0) < 0;
          return (
            <rect
              key={d.date}
              x={i * 10 + 1.5}
              y={down ? base : base - h}
              width="7"
              height={h}
              rx="1"
              className={d.net === null ? 'fill-asphalt/30' : down ? 'fill-alert' : 'fill-asphalt'}
            />
          );
        })}
      </svg>
      <div className="mt-1 grid grid-cols-7 text-center text-sm font-bold" aria-hidden="true">
        {days.map((d) => <span key={d.date}>{d.label}</span>)}
      </div>
    </figure>
  );
}
