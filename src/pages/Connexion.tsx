import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { GlobeIcon } from '../components/icons';
import { useAuth } from '../lib/AuthContext';

type Mode = 'connexion' | 'inscription';

export default function Connexion() {
  const auth = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('connexion');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/recherche';
  if (!auth.enabled || auth.session) return <Navigate to={from} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'connexion') {
        await auth.signIn(email.trim(), password);
      } else {
        const { confirmationRequise } = await auth.signUp(email.trim(), password, nom.trim());
        if (confirmationRequise) {
          setInfo('Compte créé. Confirmez votre adresse via le lien reçu par e-mail, puis connectez-vous.');
          setMode('connexion');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInfo(null);
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-page shadow-[0_0_15px_rgba(0,210,132,0.35)]">
            <GlobeIcon className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-wide text-white">Eco-Locaux</span>
        </div>

        <div className="card p-6">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-[#0c131c] p-1 text-sm" role="tablist">
            {(['connexion', 'inscription'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-md py-1.5 font-medium transition ${mode === m ? 'bg-raised text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {m === 'connexion' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'inscription' && (
              <div>
                <label htmlFor="auth-nom" className="label">
                  Nom
                </label>
                <input id="auth-nom" required autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} className="field" />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="label">
                E-mail
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="label">
                Mot de passe
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-red-400">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="text-xs text-brand">
                {info}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 text-sm">
              {busy ? 'Patientez…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
