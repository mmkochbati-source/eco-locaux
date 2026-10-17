import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, DownloadIcon, PinIcon, RefreshIcon, RouteIcon, WarningIcon } from '../components/icons';
import { Modal } from '../components/Modal';
import { ChecklistCard } from '../components/preparation/ChecklistCard';
import { ObjectionsCard } from '../components/preparation/ObjectionsCard';
import { PointsClesCard } from '../components/preparation/PointsClesCard';
import { ErrorState } from '../components/StateViews';
import { repository } from '../data/repository';
import { CATEGORIE_PUBLIC, activiteLabel, RDV_STATUT_LABEL, formatRdvDate, formatRelativeDays } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import type { PreparationRdv as Preparation } from '../types';

export default function PreparationRdv() {
  const { id = '' } = useParams();
  const rdv = useAsync(() => repository.getRendezVous(id), [id]);
  const prep = useAsync(() => repository.getPreparation(id), [id]);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Realtime : la préparation passe de « en_cours » à « pret » ou « erreur ».
  const { setData: setPrep } = prep;
  useEffect(() => repository.subscribePreparation(id, (p) => setPrep(p)), [id, setPrep]);

  async function regenerate() {
    setConfirmRegen(false);
    setActionError(null);
    setPrep((p) => ({ ...p!, statut: 'en_cours', erreur_detail: null }));
    try {
      await repository.regeneratePreparation(id);
    } catch (err) {
      setPrep((p) => ({ ...p!, statut: 'erreur', erreur_detail: err instanceof Error ? err.message : null }));
    }
  }

  function onRegenerateClick() {
    if (prep.data?.modifie_par_commercial) setConfirmRegen(true);
    else void regenerate();
  }

  async function onExport() {
    setExporting(true);
    setActionError(null);
    try {
      const { pdf_url } = await repository.exportPreparationPdf(id);
      if (pdf_url) window.open(pdf_url, '_blank', 'noopener');
      else window.print();
    } catch {
      setActionError("L'export PDF a échoué.");
    } finally {
      setExporting(false);
    }
  }

  async function updateChecklist(checklist: Preparation['checklist']) {
    const previous = prep.data;
    setPrep((p) => ({ ...p!, checklist }));
    try {
      await repository.updatePreparation(id, { checklist });
    } catch {
      if (previous) setPrep(previous);
      setActionError("La case n'a pas pu être enregistrée.");
    }
  }

  if (rdv.loading && !rdv.data) return <HeaderSkeleton />;
  if (rdv.error || !rdv.data) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger ce rendez-vous." onRetry={rdv.reload} />
      </div>
    );
  }

  const { prospect: p } = rdv.data;
  const statut = prep.data?.statut;
  const allItems = prep.data ? Object.values(prep.data.checklist).flat() : [];
  const done = allItems.filter((i) => i.coche).length;
  const [rue, ...ville] = p.adresse.split(',').map((s) => s.trim());

  return (
    <div className="space-y-6 px-6 pb-8 pt-6 xl:px-10">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-slate-400 print:hidden">
        <Link to={`/prospects/${p.id}`} className="flex items-center gap-1.5 transition hover:text-slate-200">
          <ArrowLeftIcon className="h-4 w-4" />
          Fiche prospect
        </Link>
        <span className="text-slate-600">/</span>
        <span className="font-medium text-slate-200">Préparation du rendez-vous</span>
      </nav>

      {/* En-tête */}
      <section className="card rounded-2xl p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{p.nom}</h1>
              <span className="rounded-full border border-status-rdv-bd bg-status-rdv-bg px-3 py-1 text-sm font-semibold text-brand">
                {RDV_STATUT_LABEL[rdv.data.statut]}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {p.gerant && <>Avec {p.gerant}, gérant · </>}
              {activiteLabel(p)} · potentiel <span className="font-semibold text-brand">{p.score_potentiel}</span>/100
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <InfoBlock icon={<CalendarIcon className="h-4 w-4 text-brand" />} title="Date et heure">
              <p className="font-semibold text-white">{formatRdvDate(rdv.data.date_heure)}</p>
              <p className="text-amber-400">
                {formatRelativeDays(rdv.data.date_heure)} · {rdv.data.duree_min} min
              </p>
            </InfoBlock>
            <InfoBlock icon={<PinIcon className="h-4 w-4 text-brand" />} title="Adresse">
              <p className="font-semibold text-white">{rue}</p>
              {ville.length > 0 && <p className="text-slate-400">{ville.join(', ')}</p>}
            </InfoBlock>
            <InfoBlock icon={<RouteIcon className="h-4 w-4 text-brand" />} title="Trajet">
              {prep.data?.trajet ? (
                <>
                  <p className="font-semibold text-white">{prep.data.trajet.voiture_min} min</p>
                  <p className="text-slate-400">en voiture · {prep.data.trajet.velo_min} min à vélo</p>
                </>
              ) : statut === 'en_cours' || prep.loading ? (
                <div className="space-y-1.5 pt-0.5">
                  <div className="skeleton h-3.5 w-14" />
                  <div className="skeleton h-3 w-32" />
                </div>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </InfoBlock>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300">
              <span className="font-semibold text-white">
                {done}/{allItems.length}
              </span>{' '}
              prêts
            </span>
            <span className="h-1.5 w-60 overflow-hidden rounded-full bg-[#1d2a38]">
              <span
                className="block h-full rounded-full bg-brand transition-all"
                style={{ width: allItems.length ? `${(done / allItems.length) * 100}%` : '0%' }}
              />
            </span>
          </div>
          <div className="flex gap-3 print:hidden">
            <button
              type="button"
              onClick={onRegenerateClick}
              disabled={statut === 'en_cours' || !prep.data}
              className="btn-secondary px-4 py-2.5 text-sm"
            >
              <RefreshIcon className="h-4 w-4" />
              Régénérer
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={statut !== 'pret' || exporting}
              className="btn-secondary px-4 py-2.5 text-sm"
            >
              <DownloadIcon className="h-4 w-4" />
              Exporter en PDF
            </button>
          </div>
        </div>
        {actionError && (
          <p role="alert" className="mt-3 text-right text-xs text-red-400">
            {actionError}
          </p>
        )}
      </section>

      {/* Contenu généré */}
      {prep.error ? (
        <ErrorState message="Impossible de charger la préparation." onRetry={prep.reload} />
      ) : statut === 'erreur' ? (
        <div role="alert" className="card flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
          <WarningIcon className="h-7 w-7 text-amber-400" />
          <p className="text-base font-semibold text-white">La génération a échoué</p>
          {prep.data?.erreur_detail && <p className="text-sm text-amber-300">{prep.data.erreur_detail}</p>}
          <p className="text-sm text-slate-400">Les informations du rendez-vous sont conservées. Vous pouvez relancer la préparation.</p>
          <button type="button" onClick={onRegenerateClick} className="btn-primary mt-2 px-5 py-2.5 text-sm">
            <RefreshIcon className="h-4 w-4" />
            Régénérer
          </button>
        </div>
      ) : statut === 'pret' && prep.data ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <ChecklistCard checklist={prep.data.checklist} onChange={updateChecklist} />
          <div className="space-y-6">
            <PointsClesCard points={prep.data.points_cles} publicCible={CATEGORIE_PUBLIC[p.famille]} />
            <ObjectionsCard objections={prep.data.objections} />
          </div>
        </div>
      ) : (
        <BodySkeleton />
      )}

      {confirmRegen && (
        <Modal
          title="Régénérer la préparation ?"
          onClose={() => setConfirmRegen(false)}
          footer={
            <>
              <button type="button" onClick={() => setConfirmRegen(false)} className="btn-secondary">
                Annuler
              </button>
              <button type="button" onClick={regenerate} className="btn-primary">
                Régénérer
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-300">Vous avez modifié cette préparation. Vos modifications seront remplacées.</p>
        </Modal>
      )}
    </div>
  );
}

function InfoBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-[12.5rem] rounded-xl border border-line bg-[#0f1620] px-5 py-4 text-sm">
      <p className="mb-1.5 flex items-center gap-2 text-slate-400">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="space-y-6 px-6 pb-8 pt-6 xl:px-10" aria-busy="true">
      <div className="skeleton h-4 w-72" />
      <div className="card h-56 rounded-2xl p-7">
        <div className="skeleton h-8 w-1/3" />
        <div className="skeleton mt-3 h-4 w-1/4" />
      </div>
      <BodySkeleton />
    </div>
  );
}

function BodySkeleton() {
  return (
    <div aria-busy="true">
      <p className="mb-4 flex items-center gap-2 text-sm text-slate-400" aria-live="polite">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        Préparation en cours…
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card space-y-4 rounded-2xl p-7">
          <div className="skeleton h-5 w-48" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-4" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
          ))}
        </div>
        <div className="space-y-6">
          <div className="card space-y-3 rounded-2xl p-7">
            <div className="skeleton h-5 w-44" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
          <div className="card space-y-3 rounded-2xl p-7">
            <div className="skeleton h-5 w-44" />
            <div className="skeleton h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
