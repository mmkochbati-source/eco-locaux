import { createContext, useContext, type ReactNode } from 'react';
import { repository } from '../data/repository';
import type { Profil } from '../types';
import { distanceMeters } from './format';
import { useAsync } from './useAsync';

const ProfilContext = createContext<Profil | null>(null);

export function ProfilProvider({ children }: { children: ReactNode }) {
  const { data } = useAsync(() => repository.getProfil(), []);
  return <ProfilContext.Provider value={data ?? null}>{children}</ProfilContext.Provider>;
}

export function useProfil(): Profil | null {
  return useContext(ProfilContext);
}

/** Distance depuis le centre du secteur (position du commercial non utilisée pour la démo). */
export function useDistance() {
  const profil = useProfil();
  return (p: { lat: number | null; lng: number | null }) =>
    profil && p.lat !== null && p.lng !== null ? distanceMeters(profil.centre, { lat: p.lat, lng: p.lng }) : null;
}
