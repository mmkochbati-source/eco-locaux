import { useState } from 'react';
import { repository } from '../../data/repository';
import { HISTORIQUE_LABEL, formatDateShort } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';
import type { TypeHistorique } from '../../types';
import { CalendarIcon, MailIcon, NoteIcon, PhoneIcon, PinIcon, PlusIcon } from '../icons';
import { ErrorState } from '../StateViews';

const TYPE_ICON: Record<TypeHistorique, typeof PhoneIcon> = {
  appel: PhoneIcon,
  visite: PinIcon,
  email: MailIcon,
  note: NoteIcon,
  rdv: CalendarIcon,
  ajout: PlusIcon,
};

// Types proposés à l'ajout manuel (« ajout » et « rdv » sont créés par le système).
const TYPES_AJOUT: TypeHistorique[] = ['appel', 'visite', 'email', 'note'];

export function HistoriqueCard({ prospectId }: { prospectId: string }) {
  const historique = useAsync(() => repository.listHistorique(prospectId), [prospectId]);
  const [adding, setAdding] = useState(false);

  return (
    <section className="card rounded-2xl p-7">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Historique</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="btn-secondary px-3 py-1.5">
            + Ajouter
          </button>
        )}
      </div>

      {adding && (
        <AddForm
          prospectId={prospectId}
          onCancel={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            historique.reload();
          }}
        />
      )}

      {historique.loading && !historique.data ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-3.5 w-1/3" />
              <div className="skeleton h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : historique.error ? (
        <ErrorState message="Impossible de charger l'historique." onRetry={historique.reload} />
      ) : historique.data && historique.data.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun échange pour le moment.</p>
      ) : (
        <ol className="relative space-y-6">
          <span aria-hidden="true" className="absolute bottom-3 left-[15px] top-3 w-px bg-line" />
          {historique.data?.map((h) => {
            const Icon = TYPE_ICON[h.type];
            return (
              <li key={h.id} className="relative flex gap-3">
                <span
                  className={`relative z-10 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border bg-card ${
                    h.type === 'appel' ? 'border-brand/40 text-brand' : 'border-line-strong text-slate-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-100">{HISTORIQUE_LABEL[h.type]}</h3>
                    <time dateTime={h.date} className="flex-shrink-0 text-xs text-slate-500">
                      {formatDateShort(h.date)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{h.resume}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function AddForm({ prospectId, onCancel, onAdded }: { prospectId: string; onCancel: () => void; onAdded: () => void }) {
  const [type, setType] = useState<TypeHistorique>('appel');
  const [resume, setResume] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await repository.addHistorique(prospectId, { type, resume: resume.trim() });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ajout impossible');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 space-y-3 rounded-xl border border-line bg-[#0c131c] p-4">
      <div>
        <label htmlFor="hist-type" className="label">Type</label>
        <select id="hist-type" value={type} onChange={(e) => setType(e.target.value as TypeHistorique)} className="field">
          {TYPES_AJOUT.map((t) => (
            <option key={t} value={t}>
              {HISTORIQUE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="hist-resume" className="label">Résumé</label>
        <textarea id="hist-resume" required rows={2} value={resume} onChange={(e) => setResume(e.target.value)} className="field resize-none" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Ajout…' : 'Ajouter'}</button>
      </div>
    </form>
  );
}
