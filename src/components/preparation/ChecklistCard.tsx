import type { ChecklistItem, PreparationRdv } from '../../types';
import { CheckIcon } from '../icons';

type Checklist = PreparationRdv['checklist'];

const GROUPES: { key: keyof Checklist; titre: string }[] = [
  { key: 'objectifs', titre: 'Objectifs du RDV' },
  { key: 'documents', titre: 'Documents à apporter' },
  { key: 'questions', titre: 'Questions à poser' },
];

export function ChecklistCard({ checklist, onChange }: { checklist: Checklist; onChange: (c: Checklist) => void }) {
  function toggle(group: keyof Checklist, item: ChecklistItem) {
    onChange({
      ...checklist,
      [group]: checklist[group].map((i) => (i.id === item.id ? { ...i, coche: !i.coche } : i)),
    });
  }

  return (
    <section className="card rounded-2xl p-7">
      <h2 className="mb-6 text-base font-semibold text-white">Checklist de préparation</h2>
      <div className="space-y-8">
        {GROUPES.map(({ key, titre }) => {
          const items = checklist[key];
          return (
            <fieldset key={key}>
              <legend className="mb-3 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
                <span>{titre}</span>
                <span className="font-medium normal-case tracking-normal text-slate-500">
                  {items.filter((i) => i.coche).length}/{items.length}
                </span>
              </legend>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-3 text-sm">
                      <input type="checkbox" checked={item.coche} onChange={() => toggle(key, item)} className="peer sr-only" />
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand ${
                          item.coche ? 'border-white bg-white text-page' : 'border-line-strong bg-[#152030]'
                        }`}
                      >
                        {item.coche && <CheckIcon className="h-3 w-3" />}
                      </span>
                      <span className={item.coche ? 'text-slate-500 line-through' : 'text-slate-200'}>{item.libelle}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
