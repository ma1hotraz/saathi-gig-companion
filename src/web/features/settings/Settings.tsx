import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useProfile } from '@/lib/profile';
import { PageHeader, Panel, Skeleton } from '@/components/ui';
import { ProfileForm } from '@/features/onboarding/ProfileForm';
import type { Profile } from '@shared/domain';
import { AccountSection } from './AccountSection';
import { DeleteDataSection } from './DeleteDataSection';
import { TextSizeControl } from './TextSizeControl';
import { applyStoredTextScale } from './textScale';

/** Settings: profile, text size, account and data deletion. */
export default function Settings() {
  const { t } = useI18n();
  const { profile, loading, save } = useProfile();
  const [saved, setSaved] = useState(false);

  useEffect(() => applyStoredTextScale(), []);

  async function onSave(next: Profile): Promise<string | null> {
    setSaved(false);
    const err = await save(next);
    setSaved(err === null);
    return err;
  }

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <Panel title={t('settings.profile.title')}>
            {loading ? <Skeleton lines={5} /> : <ProfileForm initial={profile} submitLabel={t('common.save')} onSave={onSave} />}
            <div role="status">
              {saved && <p className="mt-3 rounded-xl border-2 border-money bg-money-soft p-3 font-bold">{t('settings.saved')}</p>}
            </div>
          </Panel>
        </div>
        <div className="space-y-6 lg:col-span-5">
          <AccountSection />
          <TextSizeControl />
          <DeleteDataSection />
        </div>
      </div>
    </>
  );
}
