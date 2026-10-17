import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DATA_CHANGED_EVENT, repository } from '../data/repository';
import { isUpcoming } from '../lib/format';
import { useProfil } from '../lib/ProfilContext';
import { useAsync } from '../lib/useAsync';
import { BuildingIcon, CalendarIcon, ChartIcon, GlobeIcon, LogoutIcon, SearchIcon } from './icons';
import { useAuth } from '../lib/AuthContext';

export function Sidebar() {
  const { pathname } = useLocation();
  const profil = useProfil();
  const auth = useAuth();
  const counts = useAsync(async () => {
    const [prospects, rdvs] = await Promise.all([repository.listProspects(), repository.listRendezVous()]);
    return {
      // Même règle que l'écran « Mes prospects » : tous les commerces attribués.
      prospects: prospects.length,
      rdvAVenir: rdvs.filter((r) => r.statut === 'planifie' && isUpcoming(r.date_heure)).length,
    };
  }, []);

  const { reload } = counts;
  useEffect(() => {
    window.addEventListener(DATA_CHANGED_EVENT, reload);
    const unsubscribe = repository.subscribeProspects(reload);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, reload);
      unsubscribe();
    };
  }, [reload]);

  const items = [
    { to: '/recherche', label: 'Recherche', Icon: SearchIcon, active: pathname.startsWith('/recherche'), badge: null },
    {
      to: '/prospects',
      label: 'Mes prospects',
      Icon: BuildingIcon,
      active: pathname.startsWith('/prospects'),
      badge: counts.data ? { value: counts.data.prospects, accent: false } : null,
    },
    {
      to: '/rendez-vous',
      label: 'Rendez-vous',
      Icon: CalendarIcon,
      active: pathname.startsWith('/rendez-vous'),
      badge: counts.data && counts.data.rdvAVenir > 0 ? { value: counts.data.rdvAVenir, accent: true } : null,
    },
    // Écran de la direction, visible seulement pour le rôle admin.
    ...(profil?.role === 'admin'
      ? [{ to: '/pilotage', label: 'Pilotage', Icon: ChartIcon, active: pathname.startsWith('/pilotage'), badge: null }]
      : []),
  ];

  return (
    <aside className="z-20 flex w-64 flex-shrink-0 flex-col justify-between border-r border-line-side bg-chrome print:hidden">
      <div>
        <div className="flex h-16 items-center gap-3 border-b border-line-side/60 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-page shadow-[0_0_15px_rgba(0,210,132,0.35)]">
            <GlobeIcon className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-wide text-white">Eco-Locaux</span>
        </div>
        <nav className="space-y-1.5 p-3" aria-label="Navigation principale">
          {items.map(({ to, label, Icon, active, badge }) => (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'flex items-center justify-between rounded-lg border border-brand/30 bg-brand-soft px-3 py-2.5 font-medium text-brand shadow-sm transition'
                  : 'group flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-slate-400 transition hover:bg-[#151f2b] hover:text-slate-200'
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </span>
              {badge &&
                (badge.accent ? (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-page">{badge.value}</span>
                ) : (
                  <span className="rounded bg-[#16212e] px-2 py-0.5 text-xs font-semibold text-slate-400">{badge.value}</span>
                ))}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-line-side/80 p-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#1e2a3a] bg-[#141d28] p-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b3d36] text-xs font-bold text-brand ring-1 ring-brand/40">
            {profil?.initiales ?? '··'}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-white">{profil?.nom ?? ' '}</span>
            <span className="truncate text-[11px] text-slate-400">{profil ? `Secteur ${profil.secteur_nom}` : ' '}</span>
          </div>
          {auth.enabled && (
            <button
              type="button"
              onClick={() => void auth.signOut()}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-raised hover:text-white"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
