import { CalendarClock, Coins, TriangleAlert } from 'lucide-react';
import { useI18n } from '@/i18n';

const AMOUNT = /(?:₹|Rs\.?|INR)\s*\d[\d,]*(?:\.\d+)?/i;

/** Splits "Penalty of ₹1,500" into a label and the amount so the amount can be set in big numerals. */
function splitAmount(text: string): { label: string; amount: string | null } {
  const found = AMOUNT.exec(text);
  if (!found) return { label: text, amount: null };
  const label = text.replace(found[0], '').replace(/^[\s:,–-]+|[\s:,–-]+$/g, '');
  return { label: label || text, amount: found[0].trim() };
}

function Empty() {
  const { t } = useI18n();
  return <p className="mt-2 text-muted">{t('docs.nothing')}</p>;
}

/** Highlighted block of dates, one calendar-style row each, every row with a text label. */
export function Deadlines({ items }: { items: string[] }) {
  const { t, language } = useI18n();
  return (
    <section className="rounded-2xl border-4 border-asphalt bg-signal-soft p-4 lg:p-5" aria-labelledby="docs-deadlines-title">
      <h3 id="docs-deadlines-title" className="flex items-center gap-2">
        <CalendarClock aria-hidden="true" size={24} />
        {t('docs.deadlines')}
      </h3>
      {items.length === 0 ? <Empty /> : (
        <ul lang={language} className="mt-3 space-y-2">
          {items.map((d, i) => (
            <li key={i} className="flex items-stretch overflow-hidden rounded-xl border-2 border-asphalt bg-paper">
              <span className="flex w-24 shrink-0 flex-col items-center justify-center bg-asphalt px-2 py-2 text-center text-sm font-bold text-white">
                <CalendarClock aria-hidden="true" size={20} />
                {t('docs.deadlineLabel')}
              </span>
              <span className="p-3 text-lg font-bold">{d}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Money mentioned in the paper: description left, amount right in `.money` numerals. */
export function MoneyList({ items }: { items: string[] }) {
  const { t, language } = useI18n();
  return (
    <section aria-labelledby="docs-money-title">
      <h3 id="docs-money-title" className="flex items-center gap-2">
        <Coins aria-hidden="true" size={24} />
        {t('docs.money')}
      </h3>
      {items.length === 0 ? <Empty /> : (
        <ul lang={language} className="mt-2 divide-y divide-line border-y border-line">
          {items.map((item, i) => {
            const { label, amount } = splitAmount(item);
            return (
              <li key={i} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-3">
                <span>{label}</span>
                {amount && <span className="money text-3xl">{amount}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Red flags: icon plus a visible "Be careful" label on every item. */
export function RedFlags({ items }: { items: string[] }) {
  const { t, language } = useI18n();
  return (
    <section aria-labelledby="docs-flags-title">
      <h3 id="docs-flags-title" className="flex items-center gap-2">
        <TriangleAlert aria-hidden="true" size={24} />
        {t('docs.flags')}
      </h3>
      {items.length === 0 ? <Empty /> : (
        <ul lang={language} className="mt-2 space-y-2">
          {items.map((f, i) => (
            <li key={i} className="flex gap-3 rounded-xl border-2 border-alert bg-alert-soft p-3">
              <TriangleAlert aria-hidden="true" size={22} className="mt-0.5 shrink-0 text-alert" />
              <p>
                <strong className="block text-alert">{t('docs.beCareful')}</strong>
                {f}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Next steps as a numbered checklist. */
export function NextSteps({ items }: { items: string[] }) {
  const { t, language } = useI18n();
  return (
    <section aria-labelledby="docs-steps-title">
      <h3 id="docs-steps-title">{t('docs.steps')}</h3>
      {items.length === 0 ? <Empty /> : (
        <ol lang={language} className="mt-3 space-y-3">
          {items.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden="true" className="money flex size-9 shrink-0 items-center justify-center rounded-lg border-2 border-asphalt bg-signal text-lg">{i + 1}</span>
              <span className="pt-1">{s}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
