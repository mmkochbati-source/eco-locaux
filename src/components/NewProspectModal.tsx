import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repository } from '../data/repository';
import { CATEGORIE_LABEL } from '../lib/format';
import type { Categorie } from '../types';
import { Modal } from './Modal';

const CATEGORIES = Object.keys(CATEGORIE_LABEL) as Categorie[];

export function NewProspectModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState<Categorie>('boulangerie');
  const [adresse, setAdresse] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const p = await repository.createProspect({ nom: nom.trim(), categorie, adresse: adresse.trim() });
      onClose();
      navigate(`/prospects/${p.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible');
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Nouveau prospect"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" form="form-nouveau-prospect" disabled={saving} className="btn-primary">
            {saving ? 'Création…' : 'Créer'}
          </button>
        </>
      }
    >
      <form id="form-nouveau-prospect" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="np-nom" className="label">
            Nom du commerce
          </label>
          <input id="np-nom" required value={nom} onChange={(e) => setNom(e.target.value)} className="field" />
        </div>
        <div>
          <label htmlFor="np-categorie" className="label">
            Catégorie
          </label>
          <select
            id="np-categorie"
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as Categorie)}
            className="field"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORIE_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="np-adresse" className="label">
            Adresse
          </label>
          <input id="np-adresse" required value={adresse} onChange={(e) => setAdresse(e.target.value)} className="field" />
        </div>
        <p className="text-[11px] text-slate-500">Les autres informations sont complétées automatiquement.</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
