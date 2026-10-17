import { Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ErrorState } from '@/components/ui';

/** Two-step deletion of the worker's earnings, complaints and profile, then sign-out. */
export function DeleteDataSection() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function wipe() {
    if (!user) return;
    setBusy(true);
    setFailed(false);
    const results = await Promise.all([
      supabase.from('earnings').delete().eq('user_id', user.id),
      supabase.from('grievances').delete().eq('user_id', user.id),
    ]);
    // Profile goes last so a partial failure never leaves orphaned data with no profile.
    const profile = results.some((r) => r.error) ? null : await supabase.from('profiles').delete().eq('id', user.id);
    if (!profile || profile.error) {
      setFailed(true);
      setBusy(false);
      return;
    }
    await signOut();
  }

  return (
    <section aria-labelledby="set-delete" className="rounded-2xl border-2 border-alert bg-paper p-5 lg:p-6">
      <p className="inline-flex items-center gap-2 rounded-full bg-alert px-3 py-0.5 text-sm font-bold text-white">
        <TriangleAlert aria-hidden="true" size={16} /> {t('settings.danger.label')}
      </p>
      <h2 id="set-delete" className="mt-3 text-xl">{t('settings.delete.title')}</h2>
      <p className="mt-1">{t('settings.delete.body')}</p>
      {failed && <div className="mt-3"><ErrorState message={t('settings.delete.err')} /></div>}
      {!confirming ? (
        <button type="button" className="btn mt-4 w-full !border-alert !text-alert" onClick={() => setConfirming(true)}><Trash2 aria-hidden="true" size={20} /> {t('settings.delete.start')}</button>
      ) : (
        <div className="mt-3 rounded-xl border-2 border-alert bg-alert-soft p-3" role="group" aria-labelledby="set-delete-q">
          <p id="set-delete-q" className="font-bold">{t('settings.delete.sure')}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="btn" onClick={() => setConfirming(false)} disabled={busy}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-danger" onClick={() => void wipe()} disabled={busy}>{busy ? t('common.loading') : t('settings.delete.confirm')}</button>
          </div>
        </div>
      )}
    </section>
  );
}
