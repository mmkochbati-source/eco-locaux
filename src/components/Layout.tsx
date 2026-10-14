import { Outlet } from 'react-router-dom';
import { ProfilProvider } from '../lib/ProfilContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout() {
  return (
    <ProfilProvider>
      <div className="flex h-full w-full overflow-hidden print:block print:h-auto print:overflow-visible">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden print:h-auto print:overflow-visible">
          <Topbar />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin print:overflow-visible">
            <Outlet />
          </main>
        </div>
      </div>
    </ProfilProvider>
  );
}
