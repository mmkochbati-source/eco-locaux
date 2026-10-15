import type { SVGProps } from 'react';
import type { Categorie } from '../types';

// Tracés repris des maquettes (style Heroicons outline).
type IconProps = SVGProps<SVGSVGElement> & { strokeWidth?: number };

function make(paths: string[], defaultStroke = 2) {
  return function Icon({ strokeWidth = defaultStroke, className = 'w-4 h-4', ...rest }: IconProps) {
    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
        {...rest}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

export const SearchIcon = make(['M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z']);
export const BuildingIcon = make([
  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
]);
export const CalendarIcon = make([
  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
]);
export const BellIcon = make([
  'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
]);
export const PlusIcon = make(['M12 4v16m8-8H4'], 2.5);
export const GlobeIcon = make(
  [
    'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918',
  ],
  2.5,
);
export const ChevronRightIcon = make(['M9 5l7 7-7 7'], 2.5);
export const ChevronDownIcon = make(['M19 9l-7 7-7-7']);
export const ChevronUpIcon = make(['M5 15l7-7 7 7']);
export const ArrowRightIcon = make(['M14 5l7 7m0 0l-7 7m7-7H3']);
export const ArrowLeftIcon = make(['M10 19l-7-7m0 0l7-7m-7 7h18']);
export const PinIcon = make([
  'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
  'M15 11a3 3 0 11-6 0 3 3 0 016 0z',
]);
export const FlagIcon = make([
  'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
]);
export const NavigationIcon = make(['M12 19l9 2-9-18-9 18 9-2zm0 0v-8']);
export const SortIcon = make(['M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12']);
export const LocateIcon = make([
  'M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-5.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636M12 16a4 4 0 100-8 4 4 0 000 8z',
]);
export const PhoneIcon = make([
  'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
]);
export const MailIcon = make([
  'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
]);
export const RouteIcon = make(['M12 3l9 18H3L12 3z', 'M12 10v4', 'M12 17h.01']);
export const DownloadIcon = make(['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4']);
export const RefreshIcon = make([
  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
]);
export const CheckIcon = make(['M5 13l4 4L19 7'], 3);
export const WarningIcon = make([
  'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
]);
export const XIcon = make(['M6 18L18 6M6 6l12 12']);
export const PencilIcon = make([
  'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
]);
export const ClockIcon = make(['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z']);
export const BoltIcon = make(['M13 10V3L4 14h7v7l9-11h-7z']);
export const EuroIcon = make(['M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4']);
export const TargetIcon = make([
  'M12 21a9 9 0 100-18 9 9 0 000 18z',
  'M12 17a5 5 0 100-10 5 5 0 000 10z',
  'M12 13a1 1 0 100-2 1 1 0 000 2z',
]);
export const NoteIcon = make([
  'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
]);

// Icônes de catégorie, reprises de la maquette Recherche.
const CATEGORY_ICONS: Record<Categorie, ReturnType<typeof make>> = {
  pharmacie: make(['M12 4v16m8-8H4'], 2.5),
  epicerie: make(['M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z']),
  boulangerie: make([
    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  ]),
  cafe: make(['M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z']),
  coiffure: make([
    'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242L10.5 10.5m0 0l2.121 2.121',
  ]),
};

export function CategoryIcon({ categorie, className }: { categorie: Categorie; className?: string }) {
  const Icon = CATEGORY_ICONS[categorie];
  return <Icon className={className ?? 'w-5 h-5'} />;
}

export const LogoutIcon = make(['M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1']);
