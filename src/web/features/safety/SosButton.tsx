import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router';
import { Siren, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HelplineList } from './HelplineList';
import { ShareLocation } from './ShareLocation';

/** Header SOS button opening an accessible dialog with helplines, location sharing and guidance. */
export default function SosButton() {
  const { t } = useI18n();
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="btn btn-danger !min-h-11 !px-3">
          <Siren aria-hidden="true" size={20} /> {t('sos.label')}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="sign fixed inset-x-3 bottom-3 z-50 mx-auto max-h-[90dvh] max-w-[620px] overflow-y-auto p-4">
          <div className="flex items-start justify-between gap-2">
            <Dialog.Title className="text-2xl">{t('safety.sos.title')}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="btn !px-3" aria-label={t('common.close')}><X aria-hidden="true" size={22} /></button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-3 mt-1">{t('safety.sos.desc')}</Dialog.Description>
          <HelplineList />
          <div className="mt-4"><ShareLocation /></div>
          <Dialog.Close asChild>
            <Link to="/safety" className="btn mt-4 w-full no-underline">{t('safety.sos.guidance')}</Link>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
