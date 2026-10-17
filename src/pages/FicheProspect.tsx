import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PrioriteHauteBadge, StatutBadge } from '../components/Badge';
import { EmailCard } from '../components/fiche/EmailCard';
import { HistoriqueCard } from '../components/fiche/HistoriqueCard';
import { InfosClesCard } from '../components/fiche/InfosClesCard';
import { NotesCard } from '../components/fiche/NotesCard';
import { PotentielCard } from '../components/fiche/PotentielCard';
import { ArrowLeftIcon, CalendarIcon, CategoryIcon, PhoneIcon, PinIcon, RouteIcon } from '../components/icons';
import { PlanifierRdvModal } from '../components/PlanifierRdvModal';
import { ScoreRing } from '../components/ScoreRing';
import { ErrorState } from '../components/StateViews';
import { repository } from '../data/repository';
import { CATEGORIE_LABEL, formatDistance } from '../lib/format';
import { useDistance } from '../lib/ProfilContext';
import { useAsync } from '../lib/useAsync';

function scoreLabel(score: number) {
  if (score >= 80) return 'Très bon';
  if (score >= 65) return 'Bon';
  return 'Moyen';
}

export default function FicheProspect() {
  const { id = '' } = useParams();
  const location = useLocation();
  const distanceOf = useDistance();
  const prospect = useAsync(() => repository.getProspect(id), [id]);
  const [planning, setPlanning] = useState(false);
  const { setData } = prospect;
  const onTagsChanged = useCallback((tags: string[]) => setData((prev) => ({ ...prev!, tags })), [setData]);
  // Après l'envoi d'un email : le statut passe à « contacté » et l'historique gagne une ligne.
  const [historiqueVersion, setHistoriqueVersion] = useState(0);
  const onEmailSent = useCallback(() => {
    setHistoriqueVersion((v) => v + 1);
    repository
      .getProspect(id)
      .then((p) => setData(p))
      .catch(() => {});
  }, [id, setData]);

  // Realtime : tags ajoutés par l'IA, chiffres recalculés en base après une modification.
  useEffect(
    () =>
      repository.subscribeProspects(() => {
        repository
          .getProspect(id)
          .then((p) => setData(p))
          .catch(() => {});
      }),
    [id, setData],
  );

  // « ← Résultats » ramène à la liste d'origine (Recherche ou Mes prospects).
  const from = (location.state as { from?: string } | null)?.from ?? '/prospects';

  if (prospect.loading && !prospect.data) return <FicheSkeleton />;
  if (prospect.error || !prospect.data) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger la fiche de ce commerce." onRetry={prospect.reload} />
      </div>
    );
  }

  const p = prospect.data;
  const distance = distanceOf(p);
  const itineraire = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.adresse)}`;

  return (
    <div className="space-y-6 px-6 pb-8 pt-6 xl:px-10">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-slate-400">
        <Link to={from} className="flex items-center gap-1.5 transition hover:text-slate-200">
          <ArrowLeftIcon className="h-4 w-4" />
          Résultats
        </Link>
        <span className="text-slate-600">/</span>
        <span className="font-medium text-slate-200">{p.nom}</span>
      </nav>

      {/* En-tête */}
      <section className="card flex flex-wrap items-center justify-between gap-6 rounded-2xl p-7">
        <div className="flex min-w-0 items-start gap-6">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-line bg-[#152029] text-brand">
            <CategoryIcon categorie={p.categorie} className="h-9 w-9" />
          </div>
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{p.nom}</h1>
              <StatutBadge statut={p.statut} size="md" />
            </div>
            {p.priorite === 'haute' && <PrioriteHauteBadge size="md" />}
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
              <span>{CATEGORIE_LABEL[p.categorie]}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <PinIcon className="h-4 w-4" />
                {p.adresse}
              </span>
              {distance !== null && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>{formatDistance(distance)}</span>
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {p.telephone && (
                <a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="btn-secondary px-4 py-2.5 text-sm">
                  <PhoneIcon className="h-4 w-4" />
                  Appeler
                </a>
              )}
              <a href={itineraire} target="_blank" rel="noreferrer" className="btn-secondary px-4 py-2.5 text-sm">
                <RouteIcon className="h-4 w-4" />
                Itinéraire
              </a>
              <button type="button" onClick={() => setPlanning(true)} className="btn-primary px-5 py-2.5 text-sm shadow-lg shadow-brand/20">
                <CalendarIcon className="h-4 w-4" />
                Planifier un RDV
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 rounded-xl border border-line bg-[#0f1620] px-7 py-5">
          <ScoreRing score={p.score_potentiel} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Potentiel</p>
            <p className="mt-1 text-xl font-bold text-brand">{scoreLabel(p.score_potentiel)}</p>
            {p.percentile_secteur !== null && (
              <p className="mt-1 max-w-[9rem] text-sm text-slate-400">Top {p.percentile_secteur} % du secteur</p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfosClesCard prospect={p} onSaved={(updated) => prospect.setData(updated)} />
        <HistoriqueCard key={historiqueVersion} prospectId={p.id} />
        <PotentielCard prospect={p} />
        <NotesCard prospect={p} onTagsChanged={onTagsChanged} />
        <EmailCard prospect={p} onSent={onEmailSent} />
      </div>

      {planning && <PlanifierRdvModal prospectId={p.id} prospectNom={p.nom} onClose={() => setPlanning(false)} />}
    </div>
  );
}

function FicheSkeleton() {
  return (
    <div className="space-y-6 px-6 pb-8 pt-6 xl:px-10" aria-busy="true">
      <div className="skeleton h-4 w-64" />
      <div className="card flex items-center gap-6 rounded-2xl p-7">
        <div className="skeleton h-20 w-20 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-7 w-1/2" />
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-9 w-2/3" />
        </div>
        <div className="skeleton h-28 w-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-72 rounded-2xl p-7">
            <div className="skeleton h-5 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
