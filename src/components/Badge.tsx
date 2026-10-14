import { STATUT_LABEL } from '../lib/format';
import type { StatutProspect } from '../types';
import { FlagIcon } from './icons';

const STATUT_CLASSES: Record<StatutProspect, string> = {
  nouveau: 'bg-status-nouveau-bg text-status-nouveau-fg border-status-nouveau-bd',
  contacte: 'bg-status-contacte-bg text-slate-300 border-status-contacte-bd',
  rdv_planifie: 'bg-status-rdv-bg text-status-rdv-fg border-status-rdv-bd',
  client: 'bg-status-client-bg text-status-client-fg border-status-client-bd',
  perdu: 'bg-[#161c25] text-slate-500 border-[#232c39]',
};

export function StatutBadge({ statut, size = 'sm' }: { statut: StatutProspect; size?: 'sm' | 'md' }) {
  const sizing = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';
  return <span className={`rounded border font-medium ${sizing} ${STATUT_CLASSES[statut]}`}>{STATUT_LABEL[statut]}</span>;
}

export function PrioriteHauteBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const sizing = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded border border-prio-bd bg-prio-bg font-medium text-amber-400 ${sizing}`}>
      <FlagIcon className="h-3 w-3" />
      Priorité haute
    </span>
  );
}
