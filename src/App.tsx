import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import FicheProspect from './pages/FicheProspect';
import PreparationRdv from './pages/PreparationRdv';
import Recherche from './pages/Recherche';
import RendezVous from './pages/RendezVous';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/recherche" replace />} />
        <Route path="recherche" element={<Recherche mode="recherche" />} />
        <Route path="prospects" element={<Recherche mode="prospects" />} />
        <Route path="prospects/:id" element={<FicheProspect />} />
        <Route path="rendez-vous" element={<RendezVous />} />
        <Route path="rendez-vous/:id" element={<PreparationRdv />} />
        <Route path="*" element={<Navigate to="/recherche" replace />} />
      </Route>
    </Routes>
  );
}
