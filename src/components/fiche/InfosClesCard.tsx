import { useState, type ReactNode } from 'react';
import { repository } from '../../data/repository';
import { formatMonthYear, formatMonthYearLower } from '../../lib/format';
import type { Prospect } from '../../types';
import { PencilIcon } from '../icons';

type EditableFields = Pick<Prospect, 'gerant' | 'email' | 'surface_m2' | 'surface_production_m2' | 'employes' | 'echeance_contrat'>;

export function InfosClesCard({ prospect: p, onSaved }: { prospect: Prospect; onSaved: (p: Prospect) => void }) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="card rounded-2xl p-7">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Informations clés</h2>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="btn-secondary px-3 py-1.5">
            <PencilIcon className="h-3.5 w-3.5" />
            Modifier
          </button>
        )}
      </div>
      {editing ? (
        <EditForm
          prospect={p}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            onSaved(updated);
            setEditing(false);
          }}
        />
      ) : (
        <ReadView prospect={p} />
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className="mt-1.5 font-semibold text-slate-100">{children ?? <span className="font-normal text-slate-500">—</span>}</dd>
    </div>
  );
}

function ReadView({ prospect: p }: { prospect: Prospect }) {
  const horaires = p.horaires ? Object.entries(p.horaires) : [];
  const [first, ...rest] = horaires;
  const labelProduction = p.famille === 'boulangerie' ? 'fournil' : 'production';

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-7">
      <Field label="Gérant">{p.gerant}</Field>
      <Field label="Téléphone">{p.telephone}</Field>
      <Field label="E-mail">
        {p.email ? (
          <a href={`mailto:${p.email}`} className="text-sm transition hover:text-brand">
            {p.email}
          </a>
        ) : (
          <span className="text-sm text-slate-500">Pas d'email</span>
        )}
      </Field>
      <Field label="Horaires">
        {first && (
          <>
            <span className="text-sm">
              {first[0]} {first[1]}
            </span>
            {rest.length > 0 && (
              <span className="mt-0.5 block text-xs font-normal text-slate-400">
                {rest.map(([k, v]) => `${k} ${v}`).join(' · ')}
              </span>
            )}
          </>
        )}
      </Field>
      <Field label="Surface">
        {p.surface_m2 !== null && (
          <>
            {p.surface_m2} m²
            {p.surface_production_m2 !== null && (
              <span className="text-sm font-normal text-slate-300">
                {' '}
                dont {labelProduction} {p.surface_production_m2} m²
              </span>
            )}
          </>
        )}
      </Field>
      <Field label="Employés">{p.employes}</Field>
      <Field label="Ouverture">{p.date_ouverture && formatMonthYear(p.date_ouverture)}</Field>
      <Field label="Contrat actuel">{p.echeance_contrat && `Échéance ${formatMonthYearLower(p.echeance_contrat)}`}</Field>
    </dl>
  );
}

function toNumber(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function EditForm({ prospect: p, onCancel, onSaved }: { prospect: Prospect; onCancel: () => void; onSaved: (p: Prospect) => void }) {
  const [form, setForm] = useState({
    gerant: p.gerant ?? '',
    email: p.email ?? '',
    surface_m2: p.surface_m2?.toString() ?? '',
    surface_production_m2: p.surface_production_m2?.toString() ?? '',
    employes: p.employes?.toString() ?? '',
    echeance_contrat: p.echeance_contrat?.slice(0, 7) ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const patch: EditableFields = {
      gerant: form.gerant.trim() || null,
      email: form.email.trim() || null,
      surface_m2: toNumber(form.surface_m2),
      surface_production_m2: toNumber(form.surface_production_m2),
      employes: toNumber(form.employes),
      echeance_contrat: form.echeance_contrat ? `${form.echeance_contrat}-01` : null,
    };
    try {
      onSaved(await repository.updateProspect(p.id, patch));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label htmlFor="ic-gerant" className="label">Gérant</label>
          <input id="ic-gerant" value={form.gerant} onChange={set('gerant')} className="field" />
        </div>
        <div>
          <label htmlFor="ic-email" className="label">E-mail</label>
          <input id="ic-email" type="email" value={form.email} onChange={set('email')} className="field" />
        </div>
        <div>
          <label htmlFor="ic-surface" className="label">Surface (m²)</label>
          <input id="ic-surface" inputMode="numeric" value={form.surface_m2} onChange={set('surface_m2')} className="field" />
        </div>
        <div>
          <label htmlFor="ic-production" className="label">Surface de production (m²)</label>
          <input id="ic-production" inputMode="numeric" value={form.surface_production_m2} onChange={set('surface_production_m2')} className="field" />
        </div>
        <div>
          <label htmlFor="ic-employes" className="label">Employés</label>
          <input id="ic-employes" inputMode="numeric" value={form.employes} onChange={set('employes')} className="field" />
        </div>
        <div>
          <label htmlFor="ic-echeance" className="label">Échéance du contrat</label>
          <input id="ic-echeance" type="month" value={form.echeance_contrat} onChange={set('echeance_contrat')} className="field [color-scheme:dark]" />
        </div>
      </div>
      <p className="text-[11px] text-slate-500">Téléphone et horaires proviennent de Google et ne sont pas modifiables.</p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
  );
}
