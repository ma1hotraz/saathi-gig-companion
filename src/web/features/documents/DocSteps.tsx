import { Check } from 'lucide-react';
import { useI18n } from '@/i18n';

export type DocStep = 1 | 2 | 3;

/** Numbered 3-step strip (add, read, decide); the current step is announced politely. */
export function DocSteps({ current }: { current: DocStep }) {
  const { t } = useI18n();
  const names = [t('docs.step.add'), t('docs.step.read'), t('docs.step.decide')];
  return (
    <div className="mb-6 lg:mb-8">
      <ol aria-label={t('docs.steps.label')} className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {names.map((name, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const tone = active ? 'border-asphalt bg-signal font-bold' : done ? 'border-money bg-money-soft' : 'border-line bg-paper text-muted';
          return (
            <li key={name} aria-current={active ? 'step' : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 py-2 ${tone}`}>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-current ${active ? 'bg-asphalt text-white' : ''}`}>
                {done ? <Check aria-hidden="true" size={18} /> : <span className="money text-base">{n}</span>}
              </span>
              <span>{name}</span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">{t('docs.steps.progress', { n: current, name: names[current - 1] ?? '' })}</p>
    </div>
  );
}
