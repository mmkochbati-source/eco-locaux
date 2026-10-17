import type { ReactNode } from 'react';
import { formatNumber } from '../../lib/format';
import type { Prospect } from '../../types';
import { BoltIcon, EuroIcon, TargetIcon } from '../icons';

// Tous les chiffres viennent des champs du prospect (calculés côté back-end) ; ici, affichage seulement.

// Score de potentiel (0–100) calculé en base par calculer_potentiel() : consommation estimée (50 pts),
// échéance du contrat (30 pts), proximité du secteur (20 pts). Un segment = 20 points.
function scoreLabel(score: number): string {
  if (score >= 80) return 'Très bon';
  if (score >= 65) return 'Bon';
  if (score >= 40) return 'Moyen';
  return 'Faible';
}

const REPARTITION = [
  { key: 'fours', label: 'Fours', color: 'bg-brand' },
  { key: 'froid', label: 'Froid', color: 'bg-[#0f8f63]' },
  { key: 'eclairage', label: 'Éclairage', color: 'bg-amber-400' },
  { key: 'autres', label: 'Autres', color: 'bg-[#4b5a6e]' },
] as const;

function Tile({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-[#0f1620] p-4">
      <div className="flex items-start gap-2 text-sm text-slate-400">
        <span className="mt-0.5">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const Dash = () => <p className="text-2xl font-bold text-slate-500">—</p>;

function signed(n: number) {
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;
}

export function PotentielCard({ prospect: p }: { prospect: Prospect }) {
  const segments = Math.round(p.score_potentiel / 20);
  const repartition = REPARTITION.filter((r) => (p.repartition_conso?.[r.key] ?? 0) > 0);

  return (
    <section className="card rounded-2xl p-7">
      <h2 className="mb-6 text-base font-semibold text-white">Potentiel</h2>
      <div className="grid grid-cols-3 gap-3">
        <Tile icon={<BoltIcon className="h-4 w-4 text-amber-400" />} title="Consommation">
          {p.conso_estimee_mwh !== null ? (
            <>
              <p className="text-2xl font-bold text-white">
                {formatNumber(p.conso_estimee_mwh)} <span className="text-sm font-normal text-slate-400">MWh/an</span>
              </p>
              {p.conso_vs_moyenne_pct !== null && (
                <p className={`mt-1.5 text-sm font-medium ${p.conso_vs_moyenne_pct > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {signed(p.conso_vs_moyenne_pct)} % vs moyenne
                </p>
              )}
            </>
          ) : (
            <Dash />
          )}
        </Tile>
        <Tile icon={<EuroIcon className="h-4 w-4 text-brand" />} title="Économies possibles">
          {p.economies_estimees_eur !== null ? (
            <>
              <p className="text-2xl font-bold text-brand">
                {formatNumber(p.economies_estimees_eur)} € <span className="text-sm font-normal text-slate-400">/an</span>
              </p>
              {p.economies_pct !== null && <p className="mt-1.5 text-sm text-slate-400">soit −{p.economies_pct} % sur la facture</p>}
            </>
          ) : (
            <Dash />
          )}
        </Tile>
        <Tile icon={<TargetIcon className="h-4 w-4 text-red-400" />} title="Score">
          <p className="text-2xl font-bold text-white">
            {p.score_potentiel} <span className="text-sm font-normal text-slate-400">/100</span>
          </p>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < segments ? 'bg-brand' : 'bg-[#243244]'}`} />
            ))}
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            {scoreLabel(p.score_potentiel)}
            {p.percentile_secteur !== null && ` · top ${p.percentile_secteur} %`}
          </p>
        </Tile>
      </div>

      {repartition.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm text-slate-400">Répartition estimée de la consommation</p>
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            {repartition.map((r) => (
              <span key={r.key} className={r.color} style={{ width: `${p.repartition_conso![r.key]}%` }} />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
            {repartition.map((r) => (
              <li key={r.key} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${r.color}`} />
                {r.label} <span className="font-semibold text-slate-200">{p.repartition_conso![r.key]} %</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
