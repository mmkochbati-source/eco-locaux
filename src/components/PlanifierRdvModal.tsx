import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repository } from '../data/repository';
import { Modal } from './Modal';

const DUREE_PAR_DEFAUT_MIN = 45;

function defaultDateTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PlanifierRdvModal({ prospectId, prospectNom, onClose }: { prospectId: string; prospectNom: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [dateHeure, setDateHeure] = useState(defaultDateTime);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const rdv = await repository.createRendezVous(prospectId, new Date(dateHeure).toISOString());
      onClose();
      navigate(`/rendez-vous/${rdv.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Planification impossible');
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Planifier un RDV"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" form="form-planifier-rdv" disabled={saving} className="btn-primary">
            {saving ? 'Planification…' : 'Planifier'}
          </button>
        </>
      }
    >
      <form id="form-planifier-rdv" onSubmit={onSubmit} className="space-y-4">
        <p className="text-xs text-slate-400">{prospectNom}</p>
        <div>
          <label htmlFor="rdv-date" className="label">
            Date et heure
          </label>
          <input
            id="rdv-date"
            type="datetime-local"
            required
            value={dateHeure}
            onChange={(e) => setDateHeure(e.target.value)}
            className="field [color-scheme:dark]"
          />
        </div>
        <p className="text-xs text-slate-400">
          Durée : <span className="text-slate-200">{DUREE_PAR_DEFAUT_MIN} min</span>
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
