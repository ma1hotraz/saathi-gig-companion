import { ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/i18n';

/** The real starter prompts. */
export const STARTERS = ['unpaid', 'accident', 'schemes', 'notice'] as const;

interface Props {
  onPick: (text: string) => void;
  disabled?: boolean;
  /** Heading element id, so the list is labelled. */
  headingId: string;
  className?: string;
}

/** Vertical list of tappable starter questions. */
export function Starters({ onPick, disabled, headingId, className = '' }: Props) {
  const { t } = useI18n();
  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="text-lg">{t('chat.starters')}</h2>
      <ul className="mt-3 divide-y divide-line rounded-xl border-2 border-line bg-white">
        {STARTERS.map((k) => (
          <li key={k}>
            <button
              type="button"
              disabled={disabled}
              className="flex min-h-12 w-full items-start justify-between gap-3 px-4 py-3 text-left font-semibold hover:bg-signal-soft disabled:opacity-60"
              onClick={() => onPick(t(`chat.starter.${k}`))}
            >
              <span>{t(`chat.starter.${k}`)}</span>
              <ArrowUpRight aria-hidden="true" size={18} className="mt-1 shrink-0 text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
