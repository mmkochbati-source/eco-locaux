import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Link, useLocation } from 'react-router-dom';
import { CATEGORIE_LABEL, formatDistance } from '../lib/format';
import type { Profil, Prospect } from '../types';
import { LocateIcon } from './icons';

const ZOOM = 15;
// Tuiles OpenStreetMap (sans clé), assombries en CSS (.map-tiles-dark). L'attribution OpenStreetMap est obligatoire.
// En production, prévoir un fournisseur de tuiles dédié : la politique d'usage d'OSM exclut le trafic important.
const TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILES_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface ProspectMapProps {
  profil: Profil;
  prospects: Prospect[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  distanceOf: (p: Prospect) => number | null;
}

export function ProspectMap({ profil, prospects, selectedId, onSelect, distanceOf }: ProspectMapProps) {
  const location = useLocation();
  const selected = prospects.find((p) => p.id === selectedId) ?? null;
  const distance = selected ? distanceOf(selected) : null;

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-[#1e2a3a] bg-[#0c131a]">
      <MapContainer
        center={profil.centre}
        zoom={ZOOM}
        zoomControl={false}
        className="absolute inset-0 h-full w-full bg-[#0b1219]"
      >
        <TileLayer url={TILES_URL} attribution={TILES_ATTRIBUTION} maxZoom={19} className="map-tiles-dark" />
        <Circle
          center={profil.centre}
          radius={profil.rayon_km * 1000}
          interactive={false}
          pathOptions={{ color: '#00d284', weight: 1.5, opacity: 0.5, dashArray: '4 4', fillColor: '#00d284', fillOpacity: 0.03 }}
        />
        <CircleMarker
          center={profil.centre}
          radius={6}
          interactive={false}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 }}
        />
        {prospects.map((p) => {
          const isSelected = p.id === selectedId;
          return (
            <CircleMarker
              key={`${p.id}-${isSelected}`}
              center={{ lat: p.lat, lng: p.lng }}
              radius={isSelected ? 8 : 5}
              eventHandlers={{ click: () => onSelect(p.id) }}
              pathOptions={{
                color: '#ffffff',
                weight: isSelected ? 2 : 0,
                fillColor: '#00d284',
                fillOpacity: isSelected ? 1 : 0.85,
                className: isSelected ? 'drop-shadow-[0_0_8px_rgba(0,210,132,0.8)]' : undefined,
              }}
            />
          );
        })}
        <Controls center={profil.centre} />
        <PanToSelected target={selected} />
      </MapContainer>

      {selected && (
        <div className="absolute left-5 top-5 z-[500] w-64 rounded-xl border border-line bg-card/95 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-bold leading-snug text-white">{selected.nom}</h4>
              <p className="mt-1 text-[11px] text-slate-400">
                {CATEGORIE_LABEL[selected.categorie]}
                {distance !== null && ` · ${formatDistance(distance)}`}
              </p>
            </div>
            <span className="text-base font-black leading-none text-brand">{selected.score_potentiel}</span>
          </div>
          <Link
            to={`/prospects/${selected.id}`}
            state={{ from: location.pathname + location.search }}
            className="mt-3 block w-full rounded-lg bg-brand px-3 py-2 text-center text-xs font-bold text-page transition hover:bg-brand-hover"
          >
            Voir la fiche
          </Link>
        </div>
      )}
      <Legend rayonKm={profil.rayon_km} />
    </div>
  );
}

function PanToSelected({ target }: { target: Prospect | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.panTo({ lat: target.lat, lng: target.lng });
  }, [map, target]);
  return null;
}

function Controls({ center }: { center: Profil['centre'] }) {
  const map = useMap();
  const btn = 'flex h-8 w-8 items-center justify-center text-sm font-bold text-slate-300 transition hover:bg-[#1a2533] hover:text-white';
  return (
    <div className="absolute right-4 top-4 z-[500] flex flex-col gap-1.5">
      <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-card">
        <button type="button" aria-label="Zoom avant" className={`${btn} border-b border-line`} onClick={() => map.zoomIn()}>
          +
        </button>
        <button type="button" aria-label="Zoom arrière" className={btn} onClick={() => map.zoomOut()}>
          −
        </button>
      </div>
      <button
        type="button"
        title="Recentrer"
        aria-label="Recentrer"
        onClick={() => map.setView(center, ZOOM)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-brand shadow-sm transition hover:bg-[#1a2533]"
      >
        <LocateIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function Legend({ rayonKm }: { rayonKm: number }) {
  return (
    <div className="absolute bottom-4 left-4 z-[500] flex items-center gap-4 rounded-lg border border-line bg-card/90 px-3.5 py-2 text-[11px] text-slate-300 shadow-md backdrop-blur-md">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
        Prospect
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
        Vous
      </span>
      <span className="flex items-center gap-1.5 text-slate-400">
        <span className="h-2.5 w-2.5 rounded-full border border-dashed border-brand" />
        Rayon {rayonKm.toLocaleString('fr-FR')} km
      </span>
    </div>
  );
}
