import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { FileText, Image, Mic } from 'lucide-react';
import type { EarningsExtractResult } from '@shared/api';
import type { EarningInput } from '@shared/domain';
import { useI18n } from '@/i18n';
import { AddForm } from './AddForm';
import { ReviewEntries } from './ReviewEntries';
import { ScreenshotTab } from './ScreenshotTab';
import { SpeakTab } from './SpeakTab';
import { draftFromEntry, type Draft } from './draft';

interface Props {
  initial: { platform: string; amount: string };
  onSave: (rows: EarningInput[]) => Promise<string | null>;
}

const triggerClass =
  'flex min-h-12 flex-1 items-center justify-center gap-2 border-2 border-asphalt bg-paper px-2 font-bold data-[state=active]:bg-signal first:rounded-l-xl last:rounded-r-xl -ml-0.5 first:ml-0';

/** The three ways to add earnings: form, speak/type, payout screenshot. AI results are reviewed before saving. */
export function AddEntry({ initial, onSave }: Props) {
  const { t } = useI18n();
  const [result, setResult] = useState<{ transcript: string | null; drafts: Draft[] } | null>(null);
  const [notice, setNotice] = useState('');

  function extracted(r: EarningsExtractResult) {
    setNotice('');
    setResult({ transcript: r.transcript, drafts: r.entries.map(draftFromEntry) });
  }

  async function saveReviewed(rows: EarningInput[]): Promise<string | null> {
    const failure = await onSave(rows);
    if (!failure) {
      setResult(null);
      setNotice(t('earnings.saved', { count: rows.length }));
    }
    return failure;
  }

  return (
    <section aria-labelledby="add-h" className="mt-8">
      <h2 id="add-h" className="mb-3 text-3xl">{t('earnings.add.title')}</h2>
      <Tabs.Root defaultValue="form" onValueChange={() => setNotice('')}>
        <Tabs.List aria-label={t('earnings.add.title')} className="mb-4 flex">
          <Tabs.Trigger value="form" className={triggerClass}>
            <FileText aria-hidden="true" size={18} /> {t('earnings.tab.form')}
          </Tabs.Trigger>
          <Tabs.Trigger value="speak" className={triggerClass}>
            <Mic aria-hidden="true" size={18} /> {t('earnings.tab.speak')}
          </Tabs.Trigger>
          <Tabs.Trigger value="shot" className={triggerClass}>
            <Image aria-hidden="true" size={18} /> {t('earnings.tab.shot')}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="form"><AddForm initial={initial} onSave={onSave} /></Tabs.Content>
        <Tabs.Content value="speak"><SpeakTab onResult={extracted} /></Tabs.Content>
        <Tabs.Content value="shot"><ScreenshotTab onResult={extracted} /></Tabs.Content>
      </Tabs.Root>
      <p role="status" className="mt-3 font-bold text-money">{notice}</p>
      {result && (
        <ReviewEntries
          transcript={result.transcript}
          drafts={result.drafts}
          onChange={(drafts) => setResult({ ...result, drafts })}
          onDiscard={() => setResult(null)}
          onSave={saveReviewed}
        />
      )}
    </section>
  );
}
