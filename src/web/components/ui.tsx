import { useId, type ElementType, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useI18n } from '@/i18n';

/** Page title band: one h1 per page, optional intro and right-aligned actions (desktop). */
export function PageHeader({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <header className="title-rule mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div>
        <h1>{title}</h1>
        {intro && <p className="mt-2 text-muted lg:text-lg">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

type Tone = 'plain' | 'sign' | 'yellow' | 'ink';
const TONE: Record<Tone, string> = {
  plain: 'panel',
  sign: 'sign',
  yellow: 'sign sign-yellow',
  ink: 'sign sign-ink',
};

interface PanelProps {
  children: ReactNode;
  /** Visible heading; also labels the region for screen readers. */
  title?: string;
  tone?: Tone;
  as?: ElementType;
  className?: string;
}

/** Container. `plain` is the default; use `sign`/`yellow`/`ink` for the one important thing on a screen. */
export function Panel({ children, title, tone = 'plain', as: Tag = 'section', className = '' }: PanelProps) {
  const id = useId();
  return (
    <Tag className={`${TONE[tone]} p-5 lg:p-6 ${className}`} aria-labelledby={title ? id : undefined}>
      {title && <h2 id={id} className="mb-3 text-xl">{title}</h2>}
      {children}
    </Tag>
  );
}

/** A figure with a label: big condensed numerals for money. */
export function Stat({ label, value, hint, tone = 'default' }: { label: string; value: string; hint?: string; tone?: 'default' | 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-money' : tone === 'bad' ? 'text-alert' : '';
  return (
    <div>
      <p className="kicker text-sm">{label}</p>
      <p className={`money mt-1 text-4xl lg:text-5xl ${color}`}>{value}</p>
      {hint && <p className="hint mt-1">{hint}</p>}
    </div>
  );
}

/** Small text pill; never relies on colour alone (always carries text). */
export function Chip({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'yellow' | 'green' | 'blue' | 'red' }) {
  const colors = {
    plain: 'bg-chalk border-line',
    yellow: 'bg-signal-soft border-signal-deep',
    green: 'bg-money-soft border-money',
    blue: 'bg-lane-soft border-lane',
    red: 'bg-alert-soft border-alert',
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-sm font-bold ${colors}`}>{children}</span>;
}

/**
 * Horizontal progress bar drawn with SVG attributes (no inline styles, so a strict CSP works).
 * `value` and `max` are numbers; the caller prints the accessible text label next to it.
 */
export function BarMeter({ value, max, tone = 'green' }: { value: number; max: number; tone?: 'green' | 'yellow' | 'red' }) {
  const pct = max > 0 ? Math.min(100, Math.max(value > 0 ? 3 : 0, (value / max) * 100)) : 0;
  const fill = tone === 'green' ? 'fill-money' : tone === 'red' ? 'fill-alert' : 'fill-signal-deep';
  return (
    <svg className="block h-3 w-full" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect width="100" height="12" rx="6" className="fill-line" />
      <rect width={pct} height="12" rx="6" className={fill} />
    </svg>
  );
}

interface FieldShellProps {
  label: string;
  hint?: string;
  optional?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

function FieldShell({ label, hint, optional, children }: FieldShellProps) {
  const { t } = useI18n();
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="hint font-normal"> ({t('common.optional')})</span>}
      </label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="hint mt-1">
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, hint, optional, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & { label: string; hint?: string; optional?: boolean }) {
  return <FieldShell label={label} hint={hint} optional={optional}>{(id, d) => <input id={id} aria-describedby={d} className="field" {...props} />}</FieldShell>;
}

export function TextArea({ label, hint, optional, ...props }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { label: string; hint?: string; optional?: boolean }) {
  return <FieldShell label={label} hint={hint} optional={optional}>{(id, d) => <textarea id={id} aria-describedby={d} className="field" {...props} />}</FieldShell>;
}

export function SelectField({ label, hint, optional, children, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & { label: string; hint?: string; optional?: boolean }) {
  return <FieldShell label={label} hint={hint} optional={optional}>{(id, d) => <select id={id} aria-describedby={d} className="field" {...props}>{children}</select>}</FieldShell>;
}

const SKELETON_WIDTHS = ['w-[96%]', 'w-[82%]', 'w-[90%]', 'w-[64%]', 'w-[86%]', 'w-[72%]'];

/** Skeleton lines shown while the model is working. */
export function Skeleton({ lines = 4 }: { lines?: number }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" aria-label={t('common.loading')} className="space-y-3">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`skeleton h-5 ${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}`} />
      ))}
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="rounded-2xl border-2 border-alert bg-alert-soft p-4">
      <p className="font-bold text-alert">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-sm mt-3" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

/** Invitation to act: a dashed road-marking frame, never a dead end. */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-asphalt/70 p-6 text-center lg:p-8">
      <p className="text-lg font-bold">{title}</p>
      <p className="mx-auto mt-1 text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Honest AI labelling used under every generated answer. */
export function AiNotice() {
  const { t } = useI18n();
  return <p className="hint mt-3">{t('common.ai')}</p>;
}
