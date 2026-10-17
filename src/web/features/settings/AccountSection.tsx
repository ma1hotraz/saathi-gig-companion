import { useState, type SubmitEvent } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ErrorState, TextField } from '@/components/ui';

function failureKey(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already') || m.includes('registered')) return 'auth.err.exists';
  if (m.includes('password')) return 'auth.err.password';
  return 'settings.account.err';
}

/** Shows who is signed in; lets a guest upgrade to a real account; signs out. */
export function AccountSection() {
  const { t } = useI18n();
  const { user, isGuest, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function upgrade(e: SubmitEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorKey(null);
    const { error } = await supabase.auth.updateUser({ email: email.trim(), password });
    if (error) setErrorKey(failureKey(error.message));
    else setDone(true);
    setBusy(false);
  }

  return (
    <section aria-labelledby="set-account" className="mt-8">
      <h2 id="set-account" className="text-xl">{t('settings.account.title')}</h2>
      <p className="mt-1">{isGuest ? t('settings.account.guest') : (user?.email ?? t('settings.account.guest'))}</p>
      {isGuest && !done && (
        <form onSubmit={(e) => void upgrade(e)} className="mt-4">
          <h3 className="mb-2 text-lg">{t('settings.upgrade.title')}</h3>
          <TextField label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label={t('auth.password')} hint={t('auth.passwordHint')} type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
          {errorKey && <div className="mb-4"><ErrorState message={t(errorKey)} /></div>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? t('common.loading') : t('settings.upgrade.cta')}</button>
        </form>
      )}
      {done && <p role="status" className="mt-4 rounded-xl border-2 border-money bg-money-soft p-3">{t('settings.upgrade.done')}</p>}
      <button type="button" className="btn mt-4 w-full" onClick={() => void signOut()}>{t('settings.signout')}</button>
    </section>
  );
}
