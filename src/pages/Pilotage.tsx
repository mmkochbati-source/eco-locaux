import { ErrorState } from '../components/StateViews';
import { repository } from '../data/repository';
import { STATUT_LABEL, categorieLabel, formatDateShort, formatNumber } from '../lib/format';
import { useProfil } from '../lib/ProfilContext';
import { useAsync } from '../lib/useAsync';
import type { Pilotage as PilotageData } from '../types';

// Écran de la direction : tous les chiffres sont agrégés en base (eco_pilotage), le front ne fait que les afficher.

function pct(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)} %` : '–';
}

const STATUT_BARRE: Record<string, string> = {
  nouveau: 'bg-status-nouveau-fg',
  contacte: 'bg-slate-400',
  rdv_planifie: 'bg-brand',
  client: 'bg-status-client-fg',
  perdu: 'bg-slate-600',
};

export default function Pilotage() {
  const profil = useProfil();
  const data = useAsync(() => repository.getPilotage(), []);

  if (profil && profil.role !== 'admin') {
    return (
      <div className="p-6 xl:px-10">
        <ErrorState message="Cet écran est réservé à la direction." />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 pb-8 pt-6 xl:px-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Pilotage</h1>
          <p className="mt-1 text-sm text-slate-400">Activité commerciale de l'équipe, tous secteurs confondus.</p>
        </div>
        <button type="button" onClick={data.reload} className="btn-secondary">
          Actualiser
        </button>
      </div>

      {data.loading && !data.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-24 p-5">
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      ) : data.error || !data.data ? (
        <ErrorState message={data.error?.message ?? 'Impossible de charger le pilotage.'} onRetry={data.reload} />
      ) : (
        <Contenu d={data.data} />
      )}
    </div>
  );
}

function Contenu({ d }: { d: PilotageData }) {
  const t = d.totaux;
  const kpis = [
    { label: 'Commerces suivis', value: formatNumber(t.prospects), sub: `${t.priorite_haute} en priorité haute` },
    { label: 'Contactés', value: formatNumber(t.contactes), sub: `${pct(t.contactes, t.prospects)} des commerces` },
    { label: 'Emails envoyés', value: formatNumber(d.emails.envoyes), sub: `${d.emails.brouillons} brouillon(s) en attente` },
    { label: 'Rendez-vous obtenus', value: formatNumber(t.rdv_planifies), sub: `${pct(t.rdv_planifies, t.contactes)} des contactés` },
    { label: 'RDV à venir', value: formatNumber(d.rdv.a_venir), sub: `${d.rdv.realises} réalisé(s)` },
    { label: 'Clients signés', value: formatNumber(t.clients), sub: `${pct(t.clients, t.rdv_planifies)} des RDV` },
    {
      label: 'Économies potentielles',
      value: `${formatNumber(t.economies_potentielles_eur)} €`,
      sub: 'par an, commerces non perdus',
      accent: true,
    },
    { label: 'Score moyen', value: `${t.score_moyen}/100`, sub: 'potentiel des commerces' },
  ];
  const maxStatut = Math.max(1, ...d.par_statut.map((s) => s.nb));

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicateurs clés">
        {kpis.map((k) => (
          <li key={k.label} className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{k.label}</p>
            <p className={`mt-2 text-2xl font-bold ${k.accent ? 'text-brand' : 'text-white'}`}>{k.value}</p>
            <p className="mt-1 text-xs text-slate-400">{k.sub}</p>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card rounded-2xl p-7" aria-labelledby="entonnoir">
          <h2 id="entonnoir" className="mb-5 text-base font-semibold text-white">
            Entonnoir de prospection
          </h2>
          <ul className="space-y-3">
            {d.par_statut.map((s) => (
              <li key={s.statut} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="text-slate-300">{STATUT_LABEL[s.statut]}</span>
                <span className="h-3 overflow-hidden rounded-full bg-[#16212e]" aria-hidden="true">
                  <span className={`block h-full rounded-full ${STATUT_BARRE[s.statut] ?? 'bg-slate-500'}`} style={{ width: `${(s.nb / maxStatut) * 100}%` }} />
                </span>
                <span className="text-right font-semibold text-white">{s.nb}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card rounded-2xl p-7" aria-labelledby="par-categorie">
          <h2 id="par-categorie" className="mb-5 text-base font-semibold text-white">
            Par type de commerce
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="pb-3 font-semibold">Catégorie</th>
                  <th scope="col" className="pb-3 text-right font-semibold">Commerces</th>
                  <th scope="col" className="pb-3 text-right font-semibold">RDV</th>
                  <th scope="col" className="pb-3 text-right font-semibold">Score moyen</th>
                  <th scope="col" className="pb-3 text-right font-semibold">Économies / an</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {d.par_categorie.map((c) => (
                  <tr key={c.categorie}>
                    <th scope="row" className="py-2.5 font-medium text-slate-200">{categorieLabel(c.categorie)}</th>
                    <td className="py-2.5 text-right text-slate-300">{c.prospects}</td>
                    <td className="py-2.5 text-right text-slate-300">{c.rdv}</td>
                    <td className="py-2.5 text-right text-slate-300">{c.score_moyen}</td>
                    <td className="py-2.5 text-right font-semibold text-brand">{formatNumber(c.economies_eur)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card rounded-2xl p-7" aria-labelledby="par-commercial">
        <h2 id="par-commercial" className="mb-5 text-base font-semibold text-white">
          Par commercial
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="pb-3 font-semibold">Commercial</th>
                <th scope="col" className="pb-3 font-semibold">Secteur</th>
                <th scope="col" className="pb-3 text-right font-semibold">Commerces</th>
                <th scope="col" className="pb-3 text-right font-semibold">Contactés</th>
                <th scope="col" className="pb-3 text-right font-semibold">Emails</th>
                <th scope="col" className="pb-3 text-right font-semibold">RDV</th>
                <th scope="col" className="pb-3 text-right font-semibold">Clients</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {d.par_commercial.map((c) => (
                <tr key={c.nom}>
                  <th scope="row" className="py-2.5 font-medium text-slate-200">{c.nom}</th>
                  <td className="py-2.5 text-slate-400">{c.secteur ?? '–'}</td>
                  <td className="py-2.5 text-right text-slate-300">{c.prospects}</td>
                  <td className="py-2.5 text-right text-slate-300">{c.contactes}</td>
                  <td className="py-2.5 text-right text-slate-300">{c.emails_envoyes}</td>
                  <td className="py-2.5 text-right text-slate-300">{c.rdv}</td>
                  <td className="py-2.5 text-right font-semibold text-white">{c.clients}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Chiffres calculés en base le {formatDateShort(d.genere_le)}. Les économies sont des estimations à partir des ratios par type de
        commerce.
      </p>
    </>
  );
}
