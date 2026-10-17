import type { EarningsSummary } from '@shared/earnings';
import { useI18n } from '@/i18n';
import { formatRupees, isoDaysAgo } from './dates';

/** Net income per platform as labelled horizontal bars. */
export function PlatformBars({ platforms }: { platforms: EarningsSummary['byPlatform'] }) {
  const { t } = useI18n();
  const max = Math.max(1, ...platforms.map((p) => Math.abs(p.net)));
  return (
    <section aria-labelledby="plat-h" className="mt-8">
      <h2 id="plat-h" className="mb-3 text-2xl">{t('earnings.plat.title')}</h2>
      <ul className="space-y-3">
        {platforms.map((p) => (
          <li key={p.platform}>
            <div className="flex justify-between gap-3 font-bold">
              <span className="break-words">{p.platform}</span>
              <span className="money shrink-0">{formatRupees(p.net)}</span>
            </div>
            <div className="mt-1 h-4 rounded border-2 border-asphalt bg-paper" aria-hidden="true">
              <div className="h-full bg-money" style={{ width: `${Math.max(2, (Math.max(0, p.net) / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Last 7 days of net income as a bar chart, with a table for screen readers. */
export function WeekChart({ byDay }: { byDay: EarningsSummary['byDay'] }) {
  const { t, bcp47 } = useI18n();
  const netByDate = new Map(byDay.map((d) => [d.date, d.net]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = isoDaysAgo(6 - i);
    return { date, net: netByDate.get(date) ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => Math.abs(d.net)));
  const label = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(bcp47, { weekday: 'short' });

  return (
    <section aria-labelledby="week-h" className="mt-8">
      <h2 id="week-h" className="mb-3 text-2xl">{t('earnings.week.title')}</h2>
      <div className="flex h-44 items-end gap-1.5" aria-hidden="true">
        {days.map((d) => (
          <div key={d.date} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
            <span className="money text-sm">{formatRupees(d.net)}</span>
            <div
              className={`mx-auto w-full border-2 border-asphalt ${d.net < 0 ? 'bg-alert' : 'bg-money'}`}
              style={{ height: `${Math.max(2, (Math.abs(d.net) / max) * 100 * 0.75)}%` }}
            />
            <span className="mt-1 text-sm font-bold">{label(d.date)}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
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
    </section>
  );
}
