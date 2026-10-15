import { useEffect, useState } from 'react';
import { N8nError } from '../../data/n8n';
import { repository } from '../../data/repository';
import { useAsync } from '../../lib/useAsync';
import type { Note, Prospect } from '../../types';

const RACCOURCIS = ["Préfère l'après-midi", 'Décideur présent'];

export function NotesCard({ prospect, onTagsChanged }: { prospect: Prospect; onTagsChanged: (tags: string[]) => void }) {
  const note = useAsync(() => repository.getNote(prospect.id), [prospect.id]);
  const [texte, setTexte] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState<Note['statut_analyse']>('aucune');

  useEffect(() => {
    if (note.data !== undefined) {
      setTexte(note.data?.texte ?? '');
      setSaved(note.data?.texte ?? '');
      setAnalyse(note.data?.statut_analyse ?? 'aucune');
    }
  }, [note.data]);

  // Analyse IA asynchrone : Realtime signale le changement de statut, puis on relit les tags du prospect.
  useEffect(
    () =>
      repository.subscribeNote(prospect.id, (n) => {
        setAnalyse(n.statut_analyse);
        if (n.statut_analyse === 'terminee') {
          repository
            .getProspect(prospect.id)
            .then((p) => onTagsChanged(p.tags))
            .catch(() => {});
        }
      }),
    [prospect.id, onTagsChanged],
  );

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const n = await repository.saveNote(prospect.id, texte);
      setSaved(n.texte);
      setAnalyse(n.statut_analyse);
    } catch (err) {
      if (err instanceof N8nError) {
        // La note est enregistrée ; seul le déclenchement de l'analyse a échoué.
        setSaved(texte);
        setAnalyse('erreur');
      }
      setError(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  function addShortcut(label: string) {
    setTexte((t) => (t.trim() ? `${t.replace(/\s+$/, '')}\n${label}` : label));
  }

  const dirty = texte !== saved;

  return (
    <section className="card flex flex-col rounded-2xl p-7">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          <label htmlFor="note-texte">Notes</label>
        </h2>
        <span aria-live="polite" className="text-sm">
          {saving ? (
            <span className="text-slate-400">Enregistrement…</span>
          ) : !dirty && saved ? (
            <span className="flex items-center gap-2 text-brand">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Enregistré
            </span>
          ) : null}
        </span>
      </div>

      {note.loading && note.data === undefined ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : note.error ? (
        <p className="text-sm text-red-400">Impossible de charger la note.</p>
      ) : (
        <textarea
          id="note-texte"
          rows={6}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          className="w-full resize-y rounded-xl border border-[#233246] bg-[#0c131c] p-4 text-sm leading-relaxed text-slate-200 placeholder-slate-500 transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          placeholder="Ajouter une note…"
        />
      )}

      <div className="mt-3 min-h-[1.75rem]" aria-live="polite">
        {analyse === 'en_cours' ? (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            Analyse en cours…
          </p>
        ) : analyse === 'erreur' ? (
          <p className="text-xs text-amber-400">L'analyse a échoué. La note est bien enregistrée.</p>
        ) : prospect.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {prospect.tags.map((t) => (
              <li key={t} className="rounded-full border border-status-rdv-bd bg-status-rdv-bg px-2.5 py-0.5 text-xs text-brand">
                {t}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        <div className="flex flex-wrap gap-2">
          {RACCOURCIS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => addShortcut(r)}
              className="rounded-md border border-[#233244] bg-[#16212e] px-2.5 py-1 text-sm font-medium text-slate-400 transition hover:bg-[#202e40] hover:text-slate-200"
            >
              + {r}
            </button>
          ))}
        </div>
        <button type="button" onClick={onSave} disabled={saving || !dirty} className="btn-primary px-6 py-2.5 text-sm">
          Enregistrer
        </button>
      </div>
    </section>
  );
}
