import { FileText, FolderCheck, MapPin } from 'lucide-react';
import { useI18n } from '@/i18n';

/** Shown before a letter exists: explains the three things Saathi will produce. */
export function ResultPreview() {
  const { t } = useI18n();
  const items = [
    { icon: FileText, title: t('complaint.preview.letter'), body: t('complaint.preview.letterBody') },
    { icon: MapPin, title: t('complaint.preview.where'), body: t('complaint.preview.whereBody') },
    { icon: FolderCheck, title: t('complaint.preview.evidence'), body: t('complaint.preview.evidenceBody') },
  ];
  return (
    <section className="rounded-2xl border-2 border-dashed border-asphalt/70 p-5 lg:p-8" aria-labelledby="complaint-preview-title">
      <h2 id="complaint-preview-title" className="text-xl">{t('complaint.preview.title')}</h2>
      <ul className="mt-4 divide-y divide-line">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <Icon aria-hidden="true" size={28} className="mt-1 shrink-0" />
            <div>
              <p className="font-bold">{title}</p>
              <p className="text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
