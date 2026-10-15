import { useState } from 'react';
import { DATA_CHANGED_EVENT, repository } from '../data/repository';
import { CATEGORIE_PLURIEL } from '../lib/format';
import { useProfil } from '../lib/ProfilContext';
import type { Categorie } from '../types';
import { Modal } from './Modal';

const CATEGORIES = Object.keys(CATEGORIE_PLURIEL) as Categorie[];

/** Import des commerces du secteur depuis Google Places (workflow n8n) : la liste se remplit ensuite en temps réel. */
export function ImportProspectsModal({ onClose }: { onClose: () => void }) {
  const profil = useProfil();
  const [selected, setSelected] = useState<Categorie[]>([]);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  function toggle(c: Categorie) {
    setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setError(null);
    try {
      await repository.importProspects(selected);
      setState('sent');
      // Filet de sécurité : Realtime peut perdre des événements lors d'une rafale d'insertions
      // (limite de messages par seconde). On rafraîchit donc aussi la liste pendant ~30 s.
      for (const ms of [4000, 10000, 20000, 30000]) {
        window.setTimeout(() => window.dispatchEvent(new Event(DATA_CHANGED_EVENT)), ms);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible');
      setState('idle');
    }
  }

  return (
    <Modal
      title="Importer des commerces"
      onClose={onClose}
      footer={
        state === 'sent' ? (
          <button type="button" onClick={onClose} className="btn-primary">
            Fermer
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" form="form-import" disabled={state === 'sending' || selected.length === 0} className="btn-primary">
              {state === 'sending' ? 'Envoi…' : 'Importer'}
            </button>
          </>
        )
      }
    >
      {state === 'sent' ? (
        <p className="text-sm text-slate-300" role="status">
          Import lancé. Les commerces apparaîtront dans la liste au fur et à mesure.
        </p>
      ) : (
        <form id="form-import" onSubmit={onSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">
            Commerces du secteur {profil?.secteur_nom ?? ''} trouvés sur Google Maps, pour les catégories choisies.
          </p>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="label">Catégories</legend>
            {CATEGORIES.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-[#0c131c] px-3 py-2 text-sm text-slate-200">
                <input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} className="accent-[#00d284]" />
                {CATEGORIE_PLURIEL[c]}
              </label>
            ))}
          </fieldset>
          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}
