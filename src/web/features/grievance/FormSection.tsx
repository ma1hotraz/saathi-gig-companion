import type { ReactNode } from 'react';

/** Numbered group of fields inside the complaint form panel. */
export function FormSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6 first:border-t-0 first:pt-0" aria-labelledby={`complaint-section-${n}`}>
      <h2 id={`complaint-section-${n}`} className="mb-4 flex items-center gap-3 text-xl">
        <span aria-hidden="true" className="money flex size-9 shrink-0 items-center justify-center rounded-lg border-2 border-asphalt bg-signal text-lg">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
