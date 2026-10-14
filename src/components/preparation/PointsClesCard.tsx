import type { PreparationRdv } from '../../types';

export function PointsClesCard({ points, publicCible }: { points: PreparationRdv['points_cles']; publicCible: string }) {
  return (
    <section className="card rounded-2xl p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Points clés à aborder</h2>
        <span className="text-sm text-slate-400">Adaptés aux {publicCible}</span>
      </div>
      <ol className="space-y-3">
        {points.map((pt, i) => (
          <li key={i} className="flex gap-4 rounded-xl border border-line bg-[#0f1620] p-4">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-brand/40 bg-status-rdv-bg text-sm font-semibold text-brand">
              {i + 1}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">{pt.titre}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{pt.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
