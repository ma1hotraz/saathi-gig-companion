import { useId, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { Siren, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HelplineList } from './HelplineList';
import { ShareLocation } from './ShareLocation';

/**
 * Header SOS button opening the browser's native modal <dialog>: focus is trapped and restored, Esc
 * closes it, and it needs no script-injected styles (which a strict CSP would block).
 */
export default function SosButton() {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const close = () => dialog.current?.close();
  // A click on the backdrop targets the <dialog> element itself, outside its content box.
  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <>
      <button type="button" className="btn btn-danger !min-h-11 !px-3" onClick={() => dialog.current?.showModal()}>
        <Siren aria-hidden="true" size={20} /> {t('sos.label')}
      </button>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click is a mouse convenience; Esc and the close button are the keyboard paths */}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={onBackdrop}
        className="sign m-auto w-[calc(100%-1.5rem)] max-w-[28rem] border-alert p-5 backdrop:bg-black/60 max-sm:mb-3 max-sm:mt-auto"
      >
        <div className="max-h-[85dvh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2">
            <h2 id={titleId} className="flex items-center gap-2 text-3xl text-alert">
              <Siren aria-hidden="true" size={30} className="shrink-0" /> {t('safety.sos.title')}
            </h2>
            <button type="button" className="btn !px-3" aria-label={t('common.close')} onClick={close}>
              <X aria-hidden="true" size={22} />
            </button>
          </div>
          <p id={descId} className="mb-4 mt-2 text-lg">{t('safety.sos.desc')}</p>
          <HelplineList />
          <div className="mt-5"><ShareLocation /></div>
          <Link to="/safety" className="btn mt-4 w-full no-underline" onClick={close}>{t('safety.sos.guidance')}</Link>
        </div>
      </dialog>
    </>
  );
}
