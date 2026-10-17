import { useSearchParams } from 'react-router';
import { AlertTriangle, Check, CloudRain, Flame, HandHeart, Moon, Swords, ShieldAlert, Wrench, type LucideIcon } from 'lucide-react';
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <section className="sign sign-yellow rise p-5 lg:sticky lg:top-24 lg:col-span-5 lg:self-start lg:p-6 xl:col-span-4" aria-labelledby="safety-emergency">
          <h2 id="safety-emergency" className="mb-4 text-2xl">{t('safety.emergency')}</h2>
          <HelplineList />
          <div className="mt-5"><ShareLocation /></div>
        </section>

        <section className="lg:col-span-7 xl:col-span-8" aria-labelledby="safety-pick">
          <h2 id="safety-pick" className="text-2xl">{t('safety.pick')}</h2>
          <p className="mt-1 text-muted">{t('safety.pick.hint')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {SAFETY_SITUATIONS.map((id) => {
              const Icon = ICONS[id];
              const active = id === situation;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  className={`relative flex min-h-28 flex-col items-start justify-between gap-3 rounded-2xl border-2 p-4 text-left font-bold ${
                    active ? 'border-asphalt bg-signal shadow-[3px_3px_0_0_var(--color-asphalt)]' : 'border-line bg-paper hover:border-asphalt hover:bg-signal-soft'
                  }`}
                  onClick={() => setParams({ situation: id }, { replace: true })}
                >
                  <Icon aria-hidden="true" size={30} />
                  <span className="text-lg leading-tight">{t(`safety.situation.${id}`)}</span>
                  {active && <Check aria-hidden="true" size={22} className="absolute right-3 top-3 rounded-full bg-asphalt p-0.5 text-white" />}
                </button>
              );
            })}
          </div>
          <div aria-live="polite">
            {state.status === 'loading' && <div className="mt-6"><Skeleton lines={6} /></div>}
            {state.status === 'error' && <div className="mt-6"><ErrorState message={state.message} onRetry={retry} /></div>}
            {state.status === 'ready' && <SituationResult result={state.result} />}
          </div>
        </section>
      </div>
    </>
  );
}
