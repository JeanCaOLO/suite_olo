import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/feature/AppLayout';
import UserRoleCard from './components/UserRoleCard';
import AuditLogPanel from './components/AuditLogPanel';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export default function SecurityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadProfiles();
  }, [isAdmin]);

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data as UserProfile[]);
    }
    setLoading(false);
  };

  const handleRoleUpdate = (id: string, newRole: 'admin' | 'user') => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p));
  };

  const filtered = profiles.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || p.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const adminCount = profiles.filter(p => p.role === 'admin').length;
  const userCount = profiles.filter(p => p.role === 'user').length;

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <i className="ri-shield-keyhole-line text-amber-600 text-lg w-5 h-5 flex items-center justify-center"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Seguridad y Roles</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">
            Gestiona los roles y permisos de acceso de todos los usuarios
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <i className="ri-team-line text-slate-600 text-lg w-5 h-5 flex items-center justify-center"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{profiles.length}</p>
              <p className="text-xs text-slate-500">Total usuarios</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <i className="ri-shield-star-line text-amber-600 text-lg w-5 h-5 flex items-center justify-center"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{adminCount}</p>
              <p className="text-xs text-slate-500">Administradores</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-teal-600 text-lg w-5 h-5 flex items-center justify-center"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{userCount}</p>
              <p className="text-xs text-slate-500">Usuarios</p>
            </div>
          </div>
        </div>

        {/* Permissions Reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-information-line text-slate-400"></i>
            </div>
            Tabla de Permisos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-6 text-slate-600 font-medium">Permiso</th>
                  <th className="text-center py-2 px-4 text-amber-600 font-medium">
                    <div className="flex items-center justify-center gap-1.5">
                      <i className="ri-shield-star-line"></i>
                      Administrador
                    </div>
                  </th>
                  <th className="text-center py-2 px-4 text-teal-600 font-medium">
                    <div className="flex items-center justify-center gap-1.5">
                      <i className="ri-user-line"></i>
                      Usuario
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { action: 'Ver dashboard', admin: true, user: true },
                  { action: 'Ver aplicaciones', admin: true, user: true },
                  { action: 'Abrir aplicaciones', admin: true, user: true },
                  { action: 'Crear aplicaciones', admin: true, user: false },
                  { action: 'Editar aplicaciones', admin: true, user: false },
                  { action: 'Eliminar aplicaciones', admin: true, user: false },
                  { action: 'Gestionar categorías', admin: true, user: false },
                  { action: 'Ver módulo de seguridad', admin: true, user: false },
                  { action: 'Cambiar roles de usuarios', admin: true, user: false },
                  { action: 'Editar perfil propio', admin: true, user: true },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-6 text-slate-700">{row.action}</td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {row.admin ? (
                          <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center">
                            <i className="ri-check-line text-teal-600 text-xs"></i>
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-red-50 rounded-full flex items-center justify-center">
                            <i className="ri-close-line text-red-400 text-xs"></i>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {row.user ? (
                          <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center">
                            <i className="ri-check-line text-teal-600 text-xs"></i>
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-red-50 rounded-full flex items-center justify-center">
                            <i className="ri-close-line text-red-400 text-xs"></i>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users list */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-team-line text-slate-400"></i>
              </div>
              Usuarios del sistema
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
                  className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none w-48"
                />
              </div>
              {/* Filter */}
              <div className="flex gap-1 bg-slate-50 rounded-lg p-1">
                {(['all', 'admin', 'user'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      filterRole === role
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {role === 'all' ? 'Todos' : role === 'admin' ? 'Admin' : 'Usuario'}
                  </button>
                ))}
              </div>
              {/* Refresh */}
              <button
                onClick={loadProfiles}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                title="Recargar"
              >
                <i className="ri-refresh-line text-sm"></i>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-user-search-line text-slate-400 text-xl w-6 h-6 flex items-center justify-center"></i>
              </div>
              <p className="text-sm text-slate-600">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {filtered.map(profile => (
                <UserRoleCard
                  key={profile.id}
                  profile={profile}
                  currentUserId={user?.id ?? ''}
                  onUpdate={handleRoleUpdate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className="mt-6">
          <AuditLogPanel />
        </div>
      </div>
    </AppLayout>
  );
}