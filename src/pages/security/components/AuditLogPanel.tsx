import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface AuditLog {
  id: string;
  action: 'role_changed' | 'permissions_updated' | 'permissions_reset';
  performed_by: string | null;
  performed_by_profile: { name: string; email: string } | null;
  target_user_id: string;
  target_user_name: string;
  target_user_email: string;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  role_changed: {
    label: 'Rol cambiado',
    icon: 'ri-shield-star-line',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  permissions_updated: {
    label: 'Permisos actualizados',
    icon: 'ri-shield-check-line',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
  },
  permissions_reset: {
    label: 'Permisos restablecidos',
    icon: 'ri-shield-line',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHr < 24) return `hace ${diffHr}h`;
  if (diffDay < 7) return `hace ${diffDay}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RoleChangedDetails({ details }: { details: Record<string, unknown> }) {
  const fromRole = details.from_role as string;
  const toRole = details.to_role as string;
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fromRole === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
        {fromRole === 'admin' ? 'Administrador' : 'Usuario'}
      </span>
      <div className="w-4 h-4 flex items-center justify-center">
        <i className="ri-arrow-right-line text-slate-400 text-xs"></i>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${toRole === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
        {toRole === 'admin' ? 'Administrador' : 'Usuario'}
      </span>
    </div>
  );
}

function PermissionsDetails({ details }: { details: Record<string, unknown> }) {
  const mode = details.access_mode as string;
  const appsCount = details.apps_count as number;
  const categoriesCount = details.categories_count as number;
  return (
    <div className="flex items-center gap-2 mt-1 flex-wrap">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mode === 'all' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'}`}>
        {mode === 'all' ? 'Acceso completo' : 'Acceso personalizado'}
      </span>
      {mode === 'custom' && (
        <span className="text-xs text-slate-400">
          {categoriesCount} categorías · {appsCount} apps
        </span>
      )}
    </div>
  );
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<'all' | 'role_changed' | 'permissions_updated' | 'permissions_reset'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, performed_by_profile:profiles!audit_logs_performed_by_fkey(name, email)')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (!error && data) {
      setLogs(data as AuditLog[]);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = logs.filter(log => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesSearch =
      search === '' ||
      log.target_user_name.toLowerCase().includes(search.toLowerCase()) ||
      log.target_user_email.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-file-list-3-line text-slate-400"></i>
          </div>
          Log de auditoría
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm w-4 h-4 flex items-center justify-center"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar usuario..."
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none w-44"
            />
          </div>
          {/* Filter */}
          <div className="flex gap-1 bg-slate-50 rounded-lg p-1">
            {([
              { key: 'all', label: 'Todos' },
              { key: 'role_changed', label: 'Roles' },
              { key: 'permissions_updated', label: 'Permisos' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                onClick={() => setFilterAction(opt.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  filterAction === opt.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            onClick={loadLogs}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
            title="Recargar"
          >
            <i className="ri-refresh-line text-sm"></i>
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-file-list-3-line text-slate-400 text-xl w-6 h-6 flex items-center justify-center"></i>
          </div>
          <p className="text-sm text-slate-500">No hay registros de auditoría</p>
          <p className="text-xs text-slate-400 mt-1">
            Los cambios de roles y permisos aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const meta = ACTION_LABELS[log.action] ?? ACTION_LABELS.role_changed;
            const adminName = log.performed_by_profile?.name ?? 'Sistema';
            const adminEmail = log.performed_by_profile?.email ?? '';
            return (
              <div
                key={log.id}
                className="flex items-start gap-4 px-4 py-3 rounded-lg border border-slate-100 hover:bg-slate-50/60 transition-colors"
              >
                {/* Icon */}
                <div className={`w-8 h-8 ${meta.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <i className={`${meta.icon} ${meta.color} text-sm w-4 h-4 flex items-center justify-center`}></i>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-slate-500"> · </span>
                      <span className="text-xs text-slate-700 font-medium">{log.target_user_name}</span>
                      <span className="text-xs text-slate-400"> ({log.target_user_email})</span>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>

                  {/* Details */}
                  {log.action === 'role_changed' && <RoleChangedDetails details={log.details} />}
                  {(log.action === 'permissions_updated' || log.action === 'permissions_reset') && (
                    <PermissionsDetails details={log.details} />
                  )}

                  {/* Admin who made the change */}
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <i className="ri-user-settings-line w-3 h-3 flex items-center justify-center"></i>
                    Realizado por{' '}
                    <span className="font-medium text-slate-500">{adminName}</span>
                    {adminEmail && <span className="text-slate-400">· {adminEmail}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Página {page + 1} · mostrando {filtered.length} registros
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={filtered.length < PAGE_SIZE}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}