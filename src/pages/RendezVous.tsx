import { Link } from 'react-router-dom';
import { CategoryIcon, ChevronRightIcon } from '../components/icons';
import { EmptyState, ErrorState } from '../components/StateViews';
import { repository } from '../data/repository';
import { RDV_STATUT_LABEL, categorieLabel, formatRdvDate, formatRelativeDays } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import type { RendezVous as Rdv } from '../types';

const STATUT_CLASSES: Record<Rdv['statut'], string> = {
  planifie: 'bg-status-rdv-bg text-status-rdv-fg border-status-rdv-bd',
  realise: 'bg-status-contacte-bg text-slate-300 border-status-contacte-bd',
  annule: 'bg-[#161c25] text-slate-500 border-[#232c39]',
};

export default function RendezVous() {
  const rdvs = useAsync(() => repository.listRendezVous(), []);

  return (
    <div className="space-y-5 p-6 xl:px-10">
      <h1 className="text-2xl font-bold tracking-tight text-white">Rendez-vous</h1>

      {rdvs.loading && !rdvs.data ? (
        <div className="card divide-y divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton ml-auto h-4 w-40" />
            </div>
          ))}
        </div>
      ) : rdvs.error ? (
        <ErrorState message="Impossible de charger les rendez-vous." onRetry={rdvs.reload} />
      ) : !rdvs.data || rdvs.data.length === 0 ? (
        <EmptyState>Aucun rendez-vous planifié. Planifiez-en un depuis la fiche d'un commerce.</EmptyState>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rdvs.data.map((r) => (
            <li key={r.id}>
              <Link
                to={`/rendez-vous/${r.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[#151f2b] focus-visible:ring-inset"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand-tint text-brand">
                  <CategoryIcon categorie={r.prospect.famille} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white group-hover:text-brand">{r.prospect.nom}</span>
                  <span className="text-xs text-slate-400">{categorieLabel(r.prospect.categorie)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-medium text-slate-200">{formatRdvDate(r.date_heure)}</span>
                  <span className="text-xs text-slate-400">
                    {formatRelativeDays(r.date_heure)} · {r.duree_min} min
                  </span>
                </span>
                <span className={`w-28 rounded border px-2 py-0.5 text-center text-[11px] font-medium ${STATUT_CLASSES[r.statut]}`}>
                  {RDV_STATUT_LABEL[r.statut]}
                </span>
                <ChevronRightIcon className="h-4 w-4 text-slate-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
