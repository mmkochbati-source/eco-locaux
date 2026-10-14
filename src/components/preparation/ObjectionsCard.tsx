import { useId, useState } from 'react';
import type { PreparationRdv } from '../../types';
import { ChevronDownIcon, WarningIcon } from '../icons';

export function ObjectionsCard({ objections }: { objections: PreparationRdv['objections'] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section className="card rounded-2xl p-7">
      <h2 className="mb-5 flex items-center gap-2.5 text-base font-semibold text-white">
        <WarningIcon className="h-5 w-5 text-amber-400" />
        Objections probables
      </h2>
      <div className="space-y-3">
        {objections.map((o, i) => {
          const isOpen = open === i;
          const panelId = `${baseId}-${i}`;
          return (
            <div key={i} className="rounded-xl border border-line bg-[#0f1620]">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm ${isOpen ? 'font-semibold text-white' : 'text-slate-200'}`}
                >
                  <span>« {o.objection} »</span>
                  <ChevronDownIcon className={`h-4 w-4 flex-shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </h3>
              <div id={panelId} hidden={!isOpen} className="px-5 pb-5 print:block">
                <div className="border-l-2 border-brand bg-[#0d1a1a] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand">Réponse suggérée</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{o.reponse}</p>
                  <p className="mt-2 text-right text-[11px] text-slate-500">
                    {o.source === 'reference' ? 'Réponse validée' : 'Suggestion IA'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
