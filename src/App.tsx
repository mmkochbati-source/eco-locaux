import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Connexion from './pages/Connexion';
import FicheProspect from './pages/FicheProspect';
import PreparationRdv from './pages/PreparationRdv';
import Recherche from './pages/Recherche';
import RendezVous from './pages/RendezVous';

/** Garde de routes : sans session Supabase, renvoie vers /connexion (sans effet en mode démo). */
function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.enabled) return <>{children}</>;
  if (!auth.ready) return null;
  if (!auth.session) return <Navigate to="/connexion" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="connexion" element={<Connexion />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/recherche" replace />} />
          <Route path="recherche" element={<Recherche mode="recherche" />} />
          <Route path="prospects" element={<Recherche mode="prospects" />} />
          <Route path="prospects/:id" element={<FicheProspect />} />
          <Route path="rendez-vous" element={<RendezVous />} />
          <Route path="rendez-vous/:id" element={<PreparationRdv />} />
          <Route path="*" element={<Navigate to="/recherche" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
