import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BellIcon, DownloadIcon, PlusIcon, SearchIcon } from './icons';
import { ImportProspectsModal } from './ImportProspectsModal';
import { NewProspectModal } from './NewProspectModal';

export const SHORTCUT_LABEL = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

/** Pages dont la liste est filtrée par le paramètre ?q= (la topbar et la barre large partagent ce paramètre). */
function isListPage(pathname: string) {
  return pathname === '/recherche' || pathname === '/prospects';
}

export function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const onList = isListPage(pathname);
  const [draft, setDraft] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const value = onList ? (params.get('q') ?? '') : draft;

  function onChange(v: string) {
    if (onList) {
      const next = new URLSearchParams(params);
      if (v) next.set('q', v);
      else next.delete('q');
      setParams(next, { replace: true });
    } else {
      setDraft(v);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onList && draft.trim()) {
      navigate(`/recherche?q=${encodeURIComponent(draft.trim())}`);
      setDraft('');
    }
  }

  // Ctrl/⌘K : focalise la recherche large si elle existe, sinon celle de la topbar.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const big = document.getElementById('recherche-principale') as HTMLInputElement | null;
        (big ?? inputRef.current)?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="z-10 flex h-16 flex-shrink-0 items-center justify-between gap-4 border-b border-line-side bg-chrome px-6 print:hidden">
      <form role="search" onSubmit={onSubmit} className="relative w-full max-w-md">
        <label htmlFor="recherche-globale" className="sr-only">
          Rechercher
        </label>
        <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="recherche-globale"
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rechercher un commerce, une ville, une rue…"
          className="w-full rounded-lg border border-line bg-card py-2 pl-10 pr-14 text-sm text-slate-200 placeholder-slate-500 transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#2d3a4d] bg-[#1a2432] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          {SHORTCUT_LABEL}
        </kbd>
      </form>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-[#151f2b] hover:text-white"
        >
          <BellIcon className="h-5 w-5" />
        </button>
        {onList && (
          <button type="button" onClick={() => setImporting(true)} className="btn-secondary px-3.5">
            <DownloadIcon className="h-4 w-4" />
            <span>Importer</span>
          </button>
        )}
        {onList && (
          <button type="button" onClick={() => setCreating(true)} className="btn-primary px-3.5">
            <PlusIcon className="h-4 w-4" />
            <span>Nouveau prospect</span>
          </button>
        )}
      </div>
      {creating && <NewProspectModal onClose={() => setCreating(false)} />}
      {importing && <ImportProspectsModal onClose={() => setImporting(false)} />}
    </header>
  );
}
