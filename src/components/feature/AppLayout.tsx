import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      {/* Content shifts right to account for collapsed sidebar (w-16) */}
      <div className="flex-1 ml-16 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}