import { useSearchParams } from 'react-router';
import { AlertTriangle, CloudRain, Flame, HandHeart, Moon, Swords, ShieldAlert, Wrench, type LucideIcon } from 'lucide-react';
import { SAFETY_SITUATIONS, safetySituationSchema, type SafetySituation } from '@shared/domain';
import { useI18n } from '@/i18n';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { HelplineList } from './HelplineList';
import { ShareLocation } from './ShareLocation';
import { SituationResult } from './SituationResult';
import { useSafetyGuidance } from './useSafetyGuidance';

const ICONS: Record<SafetySituation, LucideIcon> = {
  night_shift: Moon,
  heat: Flame,
  rain_flood: CloudRain,
  accident: AlertTriangle,
  harassment: HandHeart,
  online_fraud: ShieldAlert,
  vehicle_breakdown: Wrench,
  customer_conflict: Swords,
};

/** Safety: emergency numbers, location sharing and AI guidance for common risky situations. */
export default function Safety() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const parsed = safetySituationSchema.safeParse(params.get('situation'));
  const situation = parsed.success ? parsed.data : null;
  const { state, retry } = useSafetyGuidance(situation);

  return (
    <>
      <PageHeader title={t('safety.title')} intro={t('safety.intro')} />
      <section className="sign sign-yellow p-4" aria-labelledby="safety-emergency">
        <h2 id="safety-emergency" className="mb-3 text-2xl">{t('safety.emergency')}</h2>
        <HelplineList />
        <div className="mt-4"><ShareLocation /></div>
      </section>

      <section className="mt-8" aria-labelledby="safety-pick">
        <h2 id="safety-pick" className="text-xl">{t('safety.pick')}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {SAFETY_SITUATIONS.map((id) => {
            const Icon = ICONS[id];
            const active = id === situation;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                className={`btn min-h-20 flex-col !items-start !justify-start text-left ${active ? 'btn-primary' : ''}`}
                onClick={() => setParams({ situation: id }, { replace: true })}
              >
                <Icon aria-hidden="true" size={28} />
                <span>{t(`safety.situation.${id}`)}</span>
              </button>
            );
          })}
        </div>
        <div aria-live="polite">
          {state.status === 'loading' && <div className="mt-4"><Skeleton lines={6} /></div>}
          {state.status === 'error' && <div className="mt-4"><ErrorState message={state.message} onRetry={retry} /></div>}
          {state.status === 'ready' && <SituationResult result={state.result} />}
        </div>
      </section>
    </>
  );
}
