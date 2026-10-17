import { Siren } from 'lucide-react';

/** The Saathi mark: a signal-yellow roundel with a siren, plus the wordmark. */
export function Brand({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-full border-2 border-asphalt bg-signal text-asphalt" aria-hidden="true">
        <Siren size={22} />
      </span>
      <span className={`stretch-wide text-2xl font-extrabold tracking-tight ${compact ? 'max-[439px]:hidden' : ''} ${dark ? 'text-white' : 'text-asphalt'}`}>
        Saathi
      </span>
    </span>
  );
}
