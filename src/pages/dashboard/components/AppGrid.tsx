import AppCard from './AppCard';
import type { AppBox } from '../../../types';

interface AppGridProps {
  apps: AppBox[];
  onDelete?: (id: string) => void;
  onEdit?: (app: AppBox) => void;
}

export default function AppGrid({ apps, onDelete, onEdit }: AppGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {apps.map((app) => (
        <AppCard 
          key={app.id} 
          app={app} 
          onDelete={onDelete} 
          onEdit={onEdit} 
        />
      ))}
    </div>
  );
}
