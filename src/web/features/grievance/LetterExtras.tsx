import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { GrievanceResult } from '@shared/api';
import { useI18n } from '@/i18n';

/** "Where to send it": each place with the reason, as a divided list. */
export function WhereToFile({ items }: { items: GrievanceResult['where_to_file'] }) {
  const { t, language } = useI18n();
  if (items.length === 0) return null;
  return (
    <section className="panel p-5 lg:p-6" aria-labelledby="complaint-where-title">
      <h3 id="complaint-where-title">{t('complaint.where')}</h3>
      <ul lang={language} className="mt-2 divide-y divide-line">
        {items.map((w, i) => (
          <li key={i} className="flex gap-3 py-3">
            <MapPin aria-hidden="true" size={22} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">{w.place}</p>
              <p>{w.why}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Keep this as evidence": tickable checklist with a running count. */
export function EvidenceList({ items }: { items: string[] }) {
  const { t, language } = useI18n();
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  if (items.length === 0) return null;
  const toggle = (i: number) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  return (
    <fieldset className="panel p-5 lg:p-6">
      <legend className="float-left mb-2 w-full text-[22px] font-bold">{t('complaint.evidence')}</legend>
      <p className="hint clear-both">{t('complaint.evidenceHint')} <span aria-live="polite">{t('complaint.evidenceCount', { done: ticked.size, total: items.length })}</span></p>
      <ul lang={language} className="mt-2 divide-y divide-line">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex min-h-12 cursor-pointer items-start gap-3 py-3">
              <input type="checkbox" className="mt-1 size-6 shrink-0" checked={ticked.has(i)} onChange={() => toggle(i)} />
              <span className={ticked.has(i) ? 'text-muted line-through' : ''}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
