import { useId, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useI18n } from '@/i18n';

export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="mb-5">
      <h1>{title}</h1>
      {intro && <p className="mt-1 text-muted">{intro}</p>}
    </header>
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

/** Skeleton lines shown while the model is working. */
export function Skeleton({ lines = 4 }: { lines?: number }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" aria-label={t('common.loading')} className="space-y-3">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-5" style={{ width: `${95 - ((i * 17) % 45)}%` }} />
      ))}
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="rounded-xl border-2 border-alert bg-alert-soft p-4">
      <p className="font-bold text-alert">{message}</p>
      {onRetry && (
        <button type="button" className="btn mt-3" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-asphalt p-6 text-center">
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
