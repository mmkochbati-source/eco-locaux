import { useState } from 'react';
import { DATA_CHANGED_EVENT, repository } from '../data/repository';
import { Modal } from './Modal';

const EXEMPLES_VILLES = ['Paris', 'Marseille', 'Toulouse', 'Montpellier'];
const EXEMPLES_ACTIVITES = ['Boulangerie', 'Fleuriste', 'Restaurant', 'Pressing'];

/**
 * Import de commerces depuis Google Maps (workflow n8n WF1) : le commercial saisit librement
 * une ville et une activité. La liste se remplit ensuite en temps réel.
 */
export function ImportProspectsModal({ onClose }: { onClose: () => void }) {
  const [localisation, setLocalisation] = useState('');
  const [activite, setActivite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const valide = localisation.trim().length >= 2 && activite.trim().length >= 2;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valide) return;
    setState('sending');
    setError(null);
    try {
      await repository.importProspects({ activite: activite.trim(), localisation: localisation.trim() });
      setState('sent');
      // Filet de sécurité : Realtime peut perdre des événements lors d'une rafale d'insertions
      // (limite de messages par seconde). On rafraîchit donc aussi la liste pendant ~1 min,
      // le temps que WF1 visite le site de chaque commerce pour trouver son email.
      for (const ms of [5000, 15000, 30000, 45000, 60000]) {
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
            <button type="submit" form="form-import" disabled={state === 'sending' || !valide} className="btn-primary">
              {state === 'sending' ? 'Envoi…' : 'Importer'}
            </button>
          </>
        )
      }
    >
      {state === 'sent' ? (
        <p className="text-sm text-slate-300" role="status">
          Import lancé : {activite.trim()} à {localisation.trim()}. Les commerces apparaîtront dans la liste au fur et à mesure (jusqu'à
          une minute, le temps de chercher leurs emails).
        </p>
      ) : (
        <form id="form-import" onSubmit={onSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">
            Commerces trouvés sur Google Maps pour la ville et l'activité saisies (20 au maximum par import).
          </p>

          <div>
            <label htmlFor="import-localisation" className="label">
              Localisation
            </label>
            <input
              id="import-localisation"
              type="text"
              required
              autoFocus
              value={localisation}
              onChange={(e) => setLocalisation(e.target.value)}
              placeholder="Ex. : Paris, Marseille, Toulouse, Montpellier…"
              list="import-villes"
              autoComplete="off"
              className="field w-full"
            />
            <datalist id="import-villes">
              {EXEMPLES_VILLES.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="import-activite" className="label">
              Activité
            </label>
            <input
              id="import-activite"
              type="text"
              required
              value={activite}
              onChange={(e) => setActivite(e.target.value)}
              placeholder="Ex. : boulangerie, fleuriste, restaurant…"
              list="import-activites"
              autoComplete="off"
              className="field w-full"
            />
            <datalist id="import-activites">
              {EXEMPLES_ACTIVITES.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>

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
