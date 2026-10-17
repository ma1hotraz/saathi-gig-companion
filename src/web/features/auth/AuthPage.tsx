import { useState, type SyntheticEvent } from 'react';
import { Navigate } from 'react-router';
import { Siren } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { TextField, ErrorState } from '@/components/ui';
import { DemoLogin } from './DemoLogin';
import { LANGUAGES, languageSchema } from '@shared/domain';

export default function AuthPage() {
  const { t, language, setLanguage } = useI18n();
  const { user, signIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setErrorKey(null);
    setErrorKey(await action());
    setBusy(false);
  }

  function submit(e: SyntheticEvent) {
    e.preventDefault();
    void run(() => (mode === 'signin' ? signIn(email.trim(), password) : signUp(email.trim(), password)));
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[640px] bg-chalk px-4 py-8">
      <div className="sign sign-yellow mb-6 p-5">
        <div className="flex items-center gap-2">
          <Siren aria-hidden="true" size={32} />
          <p className="text-3xl font-extrabold" style={{ fontStretch: '80%' }}>{t('app.name')}</p>
        </div>
        <p className="mt-1 font-bold">{t('app.tagline')}</p>
      </div>

      <main>
        <h1>{t('auth.title')}</h1>
        <p className="mb-5 mt-2 text-muted">{t('auth.intro')}</p>

        <DemoLogin
          onUse={(demoEmail, demoPassword) => {
            setMode('signin');
            setEmail(demoEmail);
            setPassword(demoPassword);
            setErrorKey(null);
            document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />

        <div className="mb-5">
          <label htmlFor="auth-lang" className="label">{t('lang.label')}</label>
          <select id="auth-lang" className="field" value={language} onChange={(e) => setLanguage(languageSchema.parse(e.target.value))}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} lang={l.code}>{l.native} ({l.name})</option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-primary mb-1 w-full" disabled={busy} onClick={() => void run(continueAsGuest)}>
          {t('auth.guest')}
        </button>
        <p className="hint mb-6">{t('auth.guestHint')}</p>

        <form id="auth-form" onSubmit={submit}>
          <TextField label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField
            label={t('auth.password')}
            hint={mode === 'signup' ? t('auth.passwordHint') : undefined}
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorKey && <div className="mb-4"><ErrorState message={t(errorKey)} /></div>}
          <button type="submit" className="btn w-full" disabled={busy}>
            {mode === 'signin' ? t('auth.signin') : t('auth.signup')}
          </button>
        </form>
        <button type="button" className="btn btn-quiet mt-3 w-full" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorKey(null); }}>
          {mode === 'signin' ? t('auth.toSignup') : t('auth.toSignin')}
        </button>
      </main>
    </div>
  );
}
