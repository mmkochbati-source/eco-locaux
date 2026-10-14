import type { ReactNode } from 'react';
import { WarningIcon } from './icons';

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <WarningIcon className="h-6 w-6 text-amber-400" />
      <p className="text-sm text-slate-300">{message ?? 'Impossible de charger les données.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary">
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="text-sm text-slate-400">{children}</p>
      {action}
    </div>
  );
}
