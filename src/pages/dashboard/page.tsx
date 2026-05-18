import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '@/components/feature/AppLayout';
import AppGrid from './components/AppGrid';
import CreateAppModal from './components/CreateAppModal';
import EditAppModal from './components/EditAppModal';
import ManageCategoriesModal from './components/ManageCategoriesModal';
import type { AppBox, Category } from '../../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppBox[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApp, setEditingApp] = useState<AppBox | null>(null);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowedAppIds, setAllowedAppIds] = useState<Set<string> | null>(null); // null = acceso total

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadApps(), loadCategories(), loadUserPermissions()]);
    setLoading(false);
  };

  const loadUserPermissions = async () => {
    if (!user || isAdmin) {
      setAllowedAppIds(null); // Admins ven todo
      return;
    }

    const { data, error } = await supabase
      .from('user_app_permissions')
      .select('app_id')
      .eq('user_id', user.id);

    if (error || !data) {
      setAllowedAppIds(null); // Error = acceso total por defecto
      return;
    }

    if (data.length === 0) {
      setAllowedAppIds(null); // Sin permisos guardados = acceso total
    } else {
      setAllowedAppIds(new Set(data.map(p => p.app_id)));
    }
  };

  const loadApps = async () => {
    console.log('🔄 Cargando aplicaciones...');
    const { data, error } = await supabase
      .from('app_boxes')
      .select(`
        *,
        category:categories(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al cargar aplicaciones:', error);
      return;
    }

    if (data) {
      console.log('✅ Aplicaciones cargadas:', data.length);
      setApps(data.map(app => ({
        id: app.id,
        name: app.name,
        logo: app.logo,
        url: app.url,
        createdBy: app.created_by,
        createdAt: app.created_at,
        category_id: app.category_id,
        category: app.category,
      })));
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleCreateApp = async (newApp: Omit<AppBox, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!isAdmin) {
      alert('No tienes permisos para crear aplicaciones');
      return;
    }

    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;

    console.log('📝 Intentando crear aplicación:', newApp);

    const { data, error } = await supabase
      .from('app_boxes')
      .insert([
        {
          name: newApp.name,
          logo: newApp.logo,
          url: newApp.url,
          created_by: currentUser.id,
          category_id: newApp.category_id || null,
        },
      ])
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error al crear aplicación:', error);
      alert(`Error al guardar la aplicación: ${error.message}`);
      return;
    }

    if (data) {
      console.log('✅ Aplicación creada exitosamente:', data);
      setApps([
        {
          id: data.id,
          name: data.name,
          logo: data.logo,
          url: data.url,
          createdBy: data.created_by,
          createdAt: data.created_at,
          category_id: data.category_id,
          category: data.category,
        },
        ...apps,
      ]);
      setShowCreateModal(false);
    }
  };

  const handleUpdateApp = (updatedApp: AppBox) => {
    setApps(apps.map(app => app.id === updatedApp.id ? updatedApp : app));
    setEditingApp(null);
  };

  const handleDeleteApp = async (id: string) => {
    if (!isAdmin) {
      alert('No tienes permisos para eliminar aplicaciones');
      return;
    }

    const { error } = await supabase.from('app_boxes').delete().eq('id', id);

    if (!error) {
      setApps(apps.filter((app) => app.id !== id));
    }
  };

  const filteredApps = apps
    .filter(app => allowedAppIds === null || allowedAppIds.has(app.id))
    .filter(app => selectedCategory === 'all' || app.category_id === selectedCategory)
    .filter(app => app.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Solo mostrar categorías que tienen apps permitidas
  const visibleCategories = isAdmin
    ? categories
    : categories.filter(cat => {
        const catApps = apps.filter(a => a.category_id === cat.id);
        return catApps.some(a => allowedAppIds === null || allowedAppIds.has(a.id));
      });

  return (
    <AppLayout>
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isAdmin ? 'Mis Aplicaciones' : 'Aplicaciones Disponibles'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isAdmin
                ? 'Gestiona todas tus aplicaciones en un solo lugar'
                : 'Explora todas las aplicaciones disponibles'}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowManageCategories(true)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap text-sm"
              >
                <i className="ri-folder-settings-line text-lg w-5 h-5 flex items-center justify-center"></i>
                Categorías
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap text-sm"
              >
                <i className="ri-add-line text-lg w-5 h-5 flex items-center justify-center"></i>
                Nueva Aplicación
              </button>
            </div>
          )}
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg w-5 h-5 flex items-center justify-center"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aplicaciones..."
              className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm bg-white"
            />
          </div>

          {visibleCategories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todas ({filteredApps.length})
              </button>
              {visibleCategories.map((category) => {
                const count = apps
                  .filter(app => app.category_id === category.id)
                  .filter(app => allowedAppIds === null || allowedAppIds.has(app.id)).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id ? category.color : undefined,
                    }}
                  >
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-apps-line text-4xl text-slate-400 w-10 h-10 flex items-center justify-center"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {searchQuery ? 'No se encontraron aplicaciones' : selectedCategory === 'all' ? 'No hay aplicaciones' : 'No hay aplicaciones en esta categoría'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : selectedCategory === 'all'
                  ? isAdmin ? 'Comienza creando tu primera aplicación' : 'Aún no hay aplicaciones disponibles'
                  : 'No hay aplicaciones en esta categoría'}
            </p>
            {!searchQuery && isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap text-sm"
              >
                <i className="ri-add-line text-lg w-5 h-5 flex items-center justify-center"></i>
                Crear Primera Aplicación
              </button>
            )}
          </div>
        ) : (
          <AppGrid
            apps={filteredApps}
            onDelete={isAdmin ? handleDeleteApp : undefined}
            onEdit={isAdmin ? setEditingApp : undefined}
          />
        )}
      </main>

      {isAdmin && showCreateModal && (
        <CreateAppModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateApp}
        />
      )}

      {isAdmin && editingApp && (
        <EditAppModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onUpdate={handleUpdateApp}
        />
      )}

      {isAdmin && showManageCategories && (
        <ManageCategoriesModal
          onClose={() => setShowManageCategories(false)}
          onUpdate={loadData}
        />
      )}
    </AppLayout>
  );
}
