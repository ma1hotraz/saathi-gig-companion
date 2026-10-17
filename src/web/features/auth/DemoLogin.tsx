import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '@/i18n';
import { DEMO_ACCOUNT } from './demoAccount';

function CopyField({ label, value, id }: { label: string; value: string; id: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the value stays selectable in the field.
      (document.getElementById(id) as HTMLInputElement | null)?.select();
    }
  }

  return (
    <div className="mb-3">
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {/* Inline size: the global .field rule (font: inherit) would override a utility class. */}
        <input id={id} className="field basis-full" style={{ fontSize: '0.85rem' }} readOnly value={value} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn" onClick={() => void copy()} aria-label={`${t('common.copy')}: ${label}`}>
          {copied ? <Check aria-hidden="true" size={20} /> : <Copy aria-hidden="true" size={20} />}
          <span>{copied ? t('common.copied') : t('common.copy')}</span>
        </button>
      </div>
    </div>
  );
}

/** Copy-paste demo credentials, with a one-tap button that fills the sign-in form. */
export function DemoLogin({ onUse }: { onUse: (email: string, password: string) => void }) {
  const { t } = useI18n();
  return (
    <section className="sign sign-yellow mb-6 p-4" aria-labelledby="demo-h">
      <h2 id="demo-h" className="text-xl">{t('auth.demo.title')}</h2>
      <p className="mb-3 mt-1">{t('auth.demo.body')}</p>
      <CopyField id="demo-email" label={t('auth.email')} value={DEMO_ACCOUNT.email} />
      <CopyField id="demo-password" label={t('auth.password')} value={DEMO_ACCOUNT.password} />
      <button type="button" className="btn w-full" onClick={() => onUse(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password)}>
        {t('auth.demo.use')}
      </button>
    </section>
  );
}
