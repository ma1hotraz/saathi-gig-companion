import type { EarningsSummary } from '@shared/earnings';
import { BarMeter } from '@/components/ui';
import { useI18n } from '@/i18n';
import { formatRupees, isoDaysAgo } from './dates';

/** Platforms ranked by net income, each with a text value and an SVG meter. */
export function PlatformBars({ platforms }: { platforms: EarningsSummary['byPlatform'] }) {
  const { t } = useI18n();
  const max = Math.max(1, ...platforms.map((p) => Math.abs(p.net)));
  return (
    <section aria-labelledby="plat-h" className="panel p-5 lg:p-6">
      <h2 id="plat-h" className="mb-4 text-2xl">
        {t('earnings.plat.title')}
      </h2>
      <ol className="space-y-4">
        {platforms.map((p, i) => (
          <li key={p.platform} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
            <span className="money text-xl text-muted" aria-hidden="true">
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="flex justify-between gap-3 font-bold">
                <span className="break-words">{p.platform}</span>
                <span className="money shrink-0 text-xl">{formatRupees(p.net)}</span>
              </div>
              <div className="mt-1">
                <BarMeter value={Math.max(0, p.net)} max={max} tone={p.net < 0 ? 'red' : 'green'} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const COL = 48;
const CHART_H = 190;
const BASE = 150;
const MAX_BAR = 110;

/** Last 7 days of net income as an SVG bar chart, with a table for screen readers. */
export function WeekChart({ byDay }: { byDay: EarningsSummary['byDay'] }) {
  const { t, bcp47 } = useI18n();
  const netByDate = new Map(byDay.map((d) => [d.date, d.net]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = isoDaysAgo(6 - i);
    return { date, net: netByDate.get(date) ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => Math.abs(d.net)));
  const label = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(bcp47, { weekday: 'short' });

  return (
    <section aria-labelledby="week-h" className="panel p-5 lg:p-6">
      <h2 id="week-h" className="mb-4 text-2xl">
        {t('earnings.week.title')}
      </h2>
      <svg
        className="block h-auto w-full"
        viewBox={`0 0 ${COL * 7} ${CHART_H}`}
        aria-hidden="true"
        focusable="false"
      >
        <line x1="0" x2={COL * 7} y1={BASE} y2={BASE} className="stroke-line" strokeWidth="2" />
        {days.map((d, i) => {
          const h = d.net === 0 ? 2 : Math.max(3, (Math.abs(d.net) / max) * MAX_BAR);
          const cx = i * COL + COL / 2;
          return (
            <g key={d.date}>
              <rect
                x={cx - 15}
                y={BASE - h}
                width="30"
                height={h}
                rx="3"
                className={d.net < 0 ? 'fill-alert' : 'fill-money'}
              />
              <text
                x={cx}
                y={BASE - h - 6}
                textAnchor="middle"
                className="fill-asphalt text-[11px] font-bold"
              >
                {formatRupees(d.net)}
              </text>
              <text
                x={cx}
                y={BASE + 22}
                textAnchor="middle"
                className="fill-ink-2 text-[12px] font-bold"
              >
                {label(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
      {/* The clipped wrapper (not the table) is sr-only: a table cannot shrink below its content width and would widen the page. */}
      <div className="sr-only">
        <table>
          <caption>{t('earnings.week.title')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('earnings.f.entry_date')}</th>
              <th scope="col">{t('earnings.sum.net')}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <th scope="row">{d.date}</th>
                <td>{formatRupees(d.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
