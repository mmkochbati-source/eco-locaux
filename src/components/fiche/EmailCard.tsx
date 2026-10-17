import { useEffect, useState } from 'react';
import { N8nError } from '../../data/n8n';
import { repository } from '../../data/repository';
import { formatDateShort } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';
import type { EmailProspection, Prospect } from '../../types';
import { CheckIcon, MailIcon, RefreshIcon } from '../icons';

const EMAIL_VALIDE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Premier contact par email : l'IA rédige un brouillon (WF4), le commercial le relit, le modifie
 * et décide seul de l'envoyer (WF5). Rien ne part sans son clic.
 */
export function EmailCard({ prospect, onSent }: { prospect: Prospect; onSent: () => void }) {
  const dernier = useAsync(() => repository.getDernierEmail(prospect.id), [prospect.id]);
  const [email, setEmail] = useState<EmailProspection | null>(null);
  const [destinataire, setDestinataire] = useState('');
  const [objet, setObjet] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load(e: EmailProspection | null) {
    setEmail(e);
    setDestinataire(e?.destinataire ?? prospect.email ?? '');
    setObjet(e?.objet ?? '');
    setMessage(e?.message ?? '');
  }

  useEffect(() => {
    if (dernier.data !== undefined) load(dernier.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dernier.data]);

  // Realtime : le brouillon arrive (generation → brouillon) puis l'envoi se confirme (envoi → envoye).
  useEffect(
    () =>
      repository.subscribeEmail(prospect.id, (e) => {
        load(e);
        if (e.statut === 'envoye') onSent();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prospect.id, onSent],
  );

  const modifie = !!email && (objet !== (email.objet ?? '') || message !== (email.message ?? ''));

  async function preparer() {
    if (modifie && !window.confirm('Vos modifications seront remplacées par un nouveau brouillon. Continuer ?')) return;
    setBusy(true);
    setError(null);
    try {
      load(await repository.preparerEmail(prospect.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rédaction impossible');
      dernier.reload();
    } finally {
      setBusy(false);
    }
  }

  async function envoyer() {
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      await repository.updateEmail(email.id, { destinataire: destinataire.trim(), objet: objet.trim(), message: message.trim() });
      await repository.envoyerEmail(email.id);
      setEmail({ ...email, statut: 'envoi' });
    } catch (err) {
      setError(err instanceof N8nError || err instanceof Error ? err.message : 'Envoi impossible');
    } finally {
      setBusy(false);
    }
  }

  const statut = email?.statut;
  const editable = statut === 'brouillon' || statut === 'erreur';
  const pretAEnvoyer = editable && EMAIL_VALIDE.test(destinataire.trim()) && objet.trim() !== '' && message.trim() !== '';

  return (
    <section className="card flex flex-col rounded-2xl p-7 lg:col-span-2" aria-labelledby="email-titre">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="email-titre" className="flex items-center gap-2 text-base font-semibold text-white">
          <MailIcon className="h-4 w-4 text-brand" />
          Email de prise de rendez-vous
        </h2>
        {(statut === undefined || statut === 'envoye' || editable) && !dernier.loading && (
          <button type="button" onClick={preparer} disabled={busy} className="btn-secondary px-3.5 py-2">
            <RefreshIcon className="h-4 w-4" />
            {email ? 'Nouveau brouillon' : "Préparer l'email"}
          </button>
        )}
      </div>

      <div aria-live="polite">
        {dernier.loading && dernier.data === undefined ? (
          <div className="skeleton h-24 rounded-xl" />
        ) : !email ? (
          <p className="text-sm text-slate-400">
            L'IA rédige un premier email personnalisé pour proposer un rendez-vous de 15 minutes. Vous le relisez et le modifiez avant tout
            envoi.
            {!prospect.email && (
              <span className="mt-2 block text-amber-400">
                Aucune adresse email trouvée sur le site de ce commerce : vous pourrez la saisir, ou passer par le téléphone.
              </span>
            )}
          </p>
        ) : statut === 'generation' ? (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            Rédaction du brouillon en cours…
          </p>
        ) : statut === 'envoi' ? (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            Envoi en cours…
          </p>
        ) : statut === 'envoye' ? (
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 font-medium text-brand">
              <CheckIcon className="h-4 w-4" />
              Envoyé à {email.destinataire}
              {email.envoye_le && <span className="font-normal text-slate-400">le {formatDateShort(email.envoye_le)}</span>}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-500">Objet : </span>
              {email.objet}
            </p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void envoyer();
            }}
          >
            {statut === 'erreur' && (
              <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                {email.erreur_detail ?? 'Le traitement a échoué.'} Vous pouvez corriger puis renvoyer, ou générer un nouveau brouillon.
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-xs font-medium text-slate-400">
                Destinataire
                <input
                  type="email"
                  required
                  value={destinataire}
                  onChange={(e) => setDestinataire(e.target.value)}
                  placeholder="contact@commerce.fr"
                  className="field mt-1.5 w-full"
                  aria-invalid={destinataire !== '' && !EMAIL_VALIDE.test(destinataire.trim())}
                />
              </label>
              <label className="block text-xs font-medium text-slate-400">
                Objet
                <input type="text" required value={objet} onChange={(e) => setObjet(e.target.value)} className="field mt-1.5 w-full" />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-400">
              Message
              <textarea
                rows={10}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1.5 w-full resize-y rounded-xl border border-[#233246] bg-[#0c131c] p-4 text-sm leading-relaxed text-slate-200 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Brouillon rédigé par l'IA : relisez-le, il part seulement quand vous cliquez sur Envoyer.</p>
              <button type="submit" disabled={busy || !pretAEnvoyer} className="btn-primary px-6 py-2.5 text-sm">
                <MailIcon className="h-4 w-4" />
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
