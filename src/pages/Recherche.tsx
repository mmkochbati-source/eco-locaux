import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PrioriteHauteBadge, StatutBadge } from '../components/Badge';
import {
  ArrowRightIcon,
  CategoryIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FlagIcon,
  MailIcon,
  NavigationIcon,
  PinIcon,
  SearchIcon,
  SortIcon,
} from '../components/icons';
import { ProspectMap } from '../components/ProspectMap';
import { EmptyState, ErrorState } from '../components/StateViews';
import { SHORTCUT_LABEL } from '../components/Topbar';
import { DATA_CHANGED_EVENT, repository } from '../data/repository';
import {
  CATEGORIE_LABEL,
  CATEGORIE_PLURIEL,
  PRIORITE_LABEL,
  STATUT_LABEL,
  formatDistance,
  isThisWeek,
  isUpcoming,
} from '../lib/format';
import { useDistance, useProfil } from '../lib/ProfilContext';
import { useAsync } from '../lib/useAsync';
import type { Categorie, Priorite, Prospect, StatutProspect } from '../types';

type Mode = 'recherche' | 'prospects';
type Tri = 'potentiel' | 'distance';

const CATEGORIES = Object.keys(CATEGORIE_LABEL) as Categorie[];
const STATUTS = Object.keys(STATUT_LABEL) as StatutProspect[];
const PRIORITES = Object.keys(PRIORITE_LABEL) as Priorite[];

export default function Recherche({ mode }: { mode: Mode }) {
  const profil = useProfil();
  const distanceOf = useDistance();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';

  const [categorie, setCategorie] = useState<Categorie | undefined>();
  const [statut, setStatut] = useState<StatutProspect | undefined>();
  const [priorite, setPriorite] = useState<Priorite | undefined>();
  const [tri, setTri] = useState<Tri>('potentiel');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // « Mes prospects » affiche tous les commerces attribués au commercial, y compris ceux juste importés.

  const list = useAsync(
    () => repository.listProspects({ categorie, statut, priorite, q: q || undefined }),
    [categorie, statut, priorite, q],
  );
  const totals = useAsync(async () => {
    const [all, rdvs] = await Promise.all([repository.listProspects(), repository.listRendezVous()]);
    return {
      prospects: all.length,
      rdvSemaine: rdvs.filter((r) => r.statut === 'planifie' && isUpcoming(r.date_heure) && isThisWeek(r.date_heure)).length,
    };
  }, [mode]);

  const results = useMemo(() => {
    const items = list.data ?? [];
    return [...items].sort((a, b) =>
      tri === 'potentiel' ? b.score_potentiel - a.score_potentiel : (distanceOf(a) ?? 1e9) - (distanceOf(b) ?? 1e9),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.data, tri, mode, profil]);

  // Nouveaux prospects (import Google Places, création) : Realtime en Supabase, événement local en démo.
  const { reload: reloadList } = list;
  const { reload: reloadTotals } = totals;
  useEffect(() => {
    const refresh = () => {
      reloadList();
      reloadTotals();
    };
    window.addEventListener(DATA_CHANGED_EVENT, refresh);
    const unsubscribe = repository.subscribeProspects(refresh);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, refresh);
      unsubscribe();
    };
  }, [reloadList, reloadTotals]);

  // Changement de page Recherche ↔ Mes prospects : on repart de filtres vides.
  useEffect(() => {
    setStatut(undefined);
    setSelectedId(null);
  }, [mode]);

  function setQuery(v: string) {
    const next = new URLSearchParams(params);
    if (v) next.set('q', v);
    else next.delete('q');
    setParams(next, { replace: true });
  }

  function resetFilters() {
    setCategorie(undefined);
    setStatut(undefined);
    setPriorite(undefined);
    setQuery('');
  }

  const statutsDisponibles = STATUTS;

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      {/* En-tête */}
      <div className="flex flex-shrink-0 items-center justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'recherche' ? 'Recherche de prospects' : 'Mes prospects'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {totals.data && profil ? (
              mode === 'recherche' ? (
                <>
                  {totals.data.prospects} commerces dans votre secteur · {profil.secteur_nom}
                </>
              ) : (
                <>
                  {totals.data.prospects} commerces suivis · {profil.secteur_nom}
                </>
              )
            ) : (
              ' '
            )}
          </p>
        </div>
        {totals.data && (
          <Link
            to="/rendez-vous"
            className="flex flex-shrink-0 items-center gap-2 rounded-full border border-brand/30 bg-[#11241f] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand/60"
          >
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span>
              {totals.data.rdvSemaine} rendez-vous cette semaine
            </span>
            <ChevronRightIcon className="h-3.5 w-3.5 text-brand" />
          </Link>
        )}
      </div>

      {/* Recherche et filtres */}
      <div className="flex-shrink-0 space-y-3.5 pb-5">
        <div className="relative w-full">
          <label htmlFor="recherche-principale" className="sr-only">
            Rechercher un commerce, une ville, une rue
          </label>
          <SearchIcon strokeWidth={2.5} className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
          <input
            id="recherche-principale"
            type="search"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un commerce, une ville, une rue…"
            className="w-full rounded-xl border border-line bg-card py-3 pl-10 pr-16 text-sm text-slate-200 placeholder-slate-500 transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded border border-[#2d3a4d] bg-[#1a2432] px-2 py-0.5 font-mono text-[10px] text-slate-400">
            {SHORTCUT_LABEL}
          </kbd>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Catégorie">
            <CategoryPill active={!categorie} onClick={() => setCategorie(undefined)}>
              Tous
            </CategoryPill>
            {CATEGORIES.map((c) => (
              <CategoryPill key={c} active={categorie === c} onClick={() => setCategorie(c)}>
                {CATEGORIE_PLURIEL[c]}
              </CategoryPill>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profil && (
              <span className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-slate-300">
                <PinIcon className="h-3.5 w-3.5 text-slate-400" />
                <span>{profil.secteur_nom}</span>
              </span>
            )}
            <SelectPill
              label="Statut"
              value={statut ?? ''}
              onChange={(v) => setStatut((v || undefined) as StatutProspect | undefined)}
              options={[
                { value: '', label: 'Statut : tous' },
                ...statutsDisponibles.map((s) => ({ value: s, label: STATUT_LABEL[s] })),
              ]}
            />
            <SelectPill
              label="Priorité"
              icon={<FlagIcon className="h-3.5 w-3.5 text-amber-500" />}
              value={priorite ?? ''}
              onChange={(v) => setPriorite((v || undefined) as Priorite | undefined)}
              options={[
                { value: '', label: 'Priorité' },
                ...PRIORITES.map((p) => ({ value: p, label: `Priorité ${PRIORITE_LABEL[p].toLowerCase()}` })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Liste + carte */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-5">
        <div className="col-span-7 flex min-h-0 flex-col xl:col-span-6">
          <div className="flex flex-shrink-0 items-center justify-between pb-3 text-xs text-slate-400">
            <span className="font-medium text-slate-300">
              {list.data ? (
                <>
                  <span className="font-bold text-white">{results.length}</span> résultat{results.length > 1 ? 's' : ''} · triés
                  par {tri}
                </>
              ) : (
                ' '
              )}
            </span>
            <SortMenu value={tri} onChange={setTri} />
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin">
            {list.loading && !list.data ? (
              <ListSkeleton />
            ) : list.error ? (
              <ErrorState message="Impossible de charger les commerces." onRetry={list.reload} />
            ) : results.length === 0 ? (
              <EmptyState
                action={
                  <button type="button" onClick={resetFilters} className="btn-secondary">
                    Réinitialiser les filtres
                  </button>
                }
              >
                Aucun commerce ne correspond à ces filtres
              </EmptyState>
            ) : (
              results.map((p) => (
                <ProspectCard
                  key={p.id}
                  prospect={p}
                  distance={distanceOf(p)}
                  selected={p.id === selectedId}
                  onSelect={() => setSelectedId(p.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="col-span-5 min-h-0 xl:col-span-6">
          {profil ? (
            <ProspectMap
              profil={profil}
              prospects={results}
              selectedId={selectedId}
              onSelect={setSelectedId}
              distanceOf={distanceOf}
            />
          ) : (
            <div className="skeleton h-full rounded-2xl" />
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-brand px-3 py-1.5 font-semibold text-page transition'
          : 'rounded-full border border-line bg-card px-3 py-1.5 text-slate-300 transition hover:border-slate-500'
      }
    >
      {children}
    </button>
  );
}

function SelectPill({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <span className="relative flex items-center rounded-lg border border-line bg-card text-slate-300 transition focus-within:border-brand hover:border-slate-500">
      {icon && <span className="pointer-events-none absolute left-3">{icon}</span>}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer appearance-none bg-transparent py-1.5 pr-7 focus:outline-none ${icon ? 'pl-8' : 'pl-3'}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 h-3 w-3 text-slate-400" />
    </span>
  );
}

function SortMenu({ value, onChange }: { value: Tri; onChange: (t: Tri) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 transition hover:text-white"
      >
        <SortIcon className="h-3.5 w-3.5" />
        <span>Trier</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-lg border border-line bg-card py-1 shadow-xl">
          {(['potentiel', 'distance'] as Tri[]).map((t) => (
            <button
              key={t}
              type="button"
              role="menuitemradio"
              aria-checked={value === t}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-xs transition hover:bg-raised ${value === t ? 'text-brand' : 'text-slate-300'}`}
            >
              Par {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProspectCard({
  prospect: p,
  distance,
  selected,
  onSelect,
}: {
  prospect: Prospect;
  distance: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const location = useLocation();
  return (
    <div
      onClick={onSelect}
      className={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl p-4 transition ${
        selected
          ? 'border-2 border-brand bg-[#0f1d1f] shadow-[0_0_20px_rgba(0,210,132,0.15)]'
          : 'border-2 border-transparent bg-card outline outline-1 -outline-offset-2 outline-line hover:outline-slate-600'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <div
          className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-brand ${
            selected ? 'border-brand/40 bg-[#142e2a]' : 'border-brand/20 bg-brand-tint'
          }`}
        >
          <CategoryIcon categorie={p.categorie} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              aria-pressed={selected}
              className={`text-left font-semibold transition ${selected ? 'text-brand' : 'text-white group-hover:text-brand'}`}
            >
              {p.nom}
            </button>
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {CATEGORIE_LABEL[p.categorie]} · {p.adresse}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatutBadge statut={p.statut} />
            {p.priorite === 'haute' && <PrioriteHauteBadge />}
            {distance !== null && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <NavigationIcon className="h-3 w-3 rotate-45" />
                {formatDistance(distance)}
              </span>
            )}
            {p.email ? (
              <span className="flex min-w-0 items-center gap-1 text-[11px] text-slate-300" title={p.email}>
                <MailIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{p.email}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <MailIcon className="h-3 w-3" />
                Pas d'email
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end justify-between gap-3 self-stretch">
        <div className="text-right">
          <div className={`text-xl font-black leading-none ${p.score_potentiel >= 80 ? 'text-brand' : 'text-slate-200'}`}>
            {p.score_potentiel}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">Potentiel</div>
        </div>
        <Link
          to={`/prospects/${p.id}`}
          state={{ from: location.pathname + location.search }}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-raised px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-[#202f42]"
        >
          <span>Voir la fiche</span>
          <ArrowRightIcon className={`h-3 w-3 ${selected ? 'text-brand' : 'text-slate-400'}`} />
        </Link>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3.5 p-4">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/2" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-4 w-1/3" />
          </div>
          <div className="skeleton h-8 w-14" />
        </div>
      ))}
    </>
  );
}
