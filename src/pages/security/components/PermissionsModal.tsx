import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { writeAuditLog } from '@/lib/audit';
import type { Category, AppBox } from '@/types';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface PermissionsModalProps {
  profile: UserProfile;
  onClose: () => void;
}

interface PermissionState {
  allowedCategories: Set<string>;
  allowedApps: Set<string>;
}

export default function PermissionsModal({ profile, onClose }: PermissionsModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [apps, setApps] = useState<AppBox[]>([]);
  const [permissions, setPermissions] = useState<PermissionState>({
    allowedCategories: new Set(),
    allowedApps: new Set(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [successMsg, setSuccessMsg] = useState('');
  const [accessMode, setAccessMode] = useState<'all' | 'custom'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, appsRes, catPermRes, appPermRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('app_boxes').select('*, category:categories(*)').order('name'),
        supabase.from('user_category_permissions').select('category_id').eq('user_id', profile.id),
        supabase.from('user_app_permissions').select('app_id').eq('user_id', profile.id),
      ]);

      const cats = catRes.data ?? [];
      const appsList = appsRes.data ?? [];
      const catPerms = catPermRes.data ?? [];
      const appPerms = appPermRes.data ?? [];

      setCategories(cats);
      setApps(appsList.map(a => ({
        id: a.id,
        name: a.name,
        logo: a.logo,
        url: a.url,
        createdBy: a.created_by,
        createdAt: a.created_at,
        category_id: a.category_id,
        category: a.category,
      })));

      const allowedCats = new Set(catPerms.map((p: any) => p.category_id as string));
      const allowedApps = new Set(appPerms.map((p: any) => p.app_id as string));

      setPermissions({ allowedCategories: allowedCats, allowedApps: allowedApps });

      // Si no hay ningún permiso guardado, asumir modo "all" (acceso total)
      if (catPerms.length === 0 && appPerms.length === 0) {
        setAccessMode('all');
      } else {
        setAccessMode('custom');
      }

      // Expandir categorías que tienen permisos parciales
      const expanded = new Set<string>();
      cats.forEach((cat: Category) => {
        if (allowedCats.has(cat.id)) expanded.add(cat.id);
      });
      setExpandedCategories(expanded);
    } catch (err) {
      console.error('Error cargando permisos:', err);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCategoryExpanded = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const toggleCategory = (catId: string) => {
    const catApps = apps.filter(a => a.category_id === catId);
    const isAllowed = permissions.allowedCategories.has(catId);

    setPermissions(prev => {
      const newCats = new Set(prev.allowedCategories);
      const newApps = new Set(prev.allowedApps);

      if (isAllowed) {
        // Quitar categoría y todas sus apps
        newCats.delete(catId);
        catApps.forEach(a => newApps.delete(a.id));
      } else {
        // Agregar categoría y todas sus apps
        newCats.add(catId);
        catApps.forEach(a => newApps.add(a.id));
        // Auto-expandir
        setExpandedCategories(prev2 => new Set([...prev2, catId]));
      }
      return { allowedCategories: newCats, allowedApps: newApps };
    });
  };

  const toggleApp = (app: AppBox) => {
    const catId = app.category_id;
    const isAllowed = permissions.allowedApps.has(app.id);

    setPermissions(prev => {
      const newCats = new Set(prev.allowedCategories);
      const newApps = new Set(prev.allowedApps);

      if (isAllowed) {
        newApps.delete(app.id);
        // Si no queda ninguna app de esa cat, quitar la cat también
        const catApps = apps.filter(a => a.category_id === catId);
        const remainingAllowed = catApps.filter(a => a.id !== app.id && newApps.has(a.id));
        if (remainingAllowed.length === 0 && catId) {
          newCats.delete(catId);
        }
      } else {
        newApps.add(app.id);
        // Si esta cat no estaba, agregarla parcialmente
        if (catId && !newCats.has(catId)) {
          newCats.add(catId);
        }
      }
      return { allowedCategories: newCats, allowedApps: newApps };
    });
  };

  const handleSelectAllInCategory = (catId: string) => {
    const catApps = apps.filter(a => a.category_id === catId);
    const allSelected = catApps.every(a => permissions.allowedApps.has(a.id));

    setPermissions(prev => {
      const newCats = new Set(prev.allowedCategories);
      const newApps = new Set(prev.allowedApps);

      if (allSelected) {
        // Deseleccionar todo
        catApps.forEach(a => newApps.delete(a.id));
        newCats.delete(catId);
      } else {
        // Seleccionar todo
        catApps.forEach(a => newApps.add(a.id));
        newCats.add(catId);
      }
      return { allowedCategories: newCats, allowedApps: newApps };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (accessMode === 'all') {
        // Eliminar todos los permisos = acceso total
        await Promise.all([
          supabase.from('user_category_permissions').delete().eq('user_id', profile.id),
          supabase.from('user_app_permissions').delete().eq('user_id', profile.id),
        ]);
      } else {
        // Guardar permisos personalizados
        await Promise.all([
          supabase.from('user_category_permissions').delete().eq('user_id', profile.id),
          supabase.from('user_app_permissions').delete().eq('user_id', profile.id),
        ]);

        const catInserts = Array.from(permissions.allowedCategories).map(catId => ({
          user_id: profile.id,
          category_id: catId,
        }));
        const appInserts = Array.from(permissions.allowedApps).map(appId => ({
          user_id: profile.id,
          app_id: appId,
        }));

        if (catInserts.length > 0) {
          await supabase.from('user_category_permissions').insert(catInserts);
        }
        if (appInserts.length > 0) {
          await supabase.from('user_app_permissions').insert(appInserts);
        }
      }

      await writeAuditLog({
        action: accessMode === 'all' ? 'permissions_reset' : 'permissions_updated',
        target_user_id: profile.id,
        target_user_name: profile.name,
        target_user_email: profile.email,
        details: {
          access_mode: accessMode,
          categories_count: accessMode === 'custom' ? permissions.allowedCategories.size : 0,
          apps_count: accessMode === 'custom' ? permissions.allowedApps.size : 0,
        },
      });
      setSuccessMsg('Permisos guardados correctamente');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error guardando permisos:', err);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryAppStats = (catId: string) => {
    const catApps = apps.filter(a => a.category_id === catId);
    const allowedCount = catApps.filter(a => permissions.allowedApps.has(a.id)).length;
    return { total: catApps.length, allowed: allowedCount };
  };

  const uncategorizedApps = apps.filter(a => !a.category_id);

  const totalAllowed = permissions.allowedApps.size;
  const totalApps = apps.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
              <i className="ri-shield-check-line text-teal-600 text-lg w-5 h-5 flex items-center justify-center"></i>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Permisos de acceso</h2>
              <p className="text-xs text-slate-500">{profile.name} · {profile.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-slate-500 w-5 h-5 flex items-center justify-center"></i>
          </button>
        </div>

        {/* Access mode toggle */}
        <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <p className="text-xs font-medium text-slate-600 mb-3">Modo de acceso</p>
          <div className="flex gap-3">
            <button
              onClick={() => setAccessMode('all')}
              className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
                accessMode === 'all'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                accessMode === 'all' ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
              }`}>
                {accessMode === 'all' && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
              <div className="text-left">
                <p className={`text-xs font-semibold ${accessMode === 'all' ? 'text-teal-700' : 'text-slate-700'}`}>
                  Acceso completo
                </p>
                <p className="text-xs text-slate-400">Ve todas las categorías y apps</p>
              </div>
            </button>
            <button
              onClick={() => setAccessMode('custom')}
              className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
                accessMode === 'custom'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                accessMode === 'custom' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
              }`}>
                {accessMode === 'custom' && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
              <div className="text-left">
                <p className={`text-xs font-semibold ${accessMode === 'custom' ? 'text-amber-700' : 'text-slate-700'}`}>
                  Acceso personalizado
                </p>
                <p className="text-xs text-slate-400">Define qué puede ver</p>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : accessMode === 'all' ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
              <i className="ri-eye-line text-teal-500 text-2xl w-7 h-7 flex items-center justify-center"></i>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">Acceso completo activado</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Este usuario puede ver todas las categorías y aplicaciones disponibles en el sistema.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Stats bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{totalAllowed}</span> de {totalApps} apps permitidas
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newCats = new Set(categories.map(c => c.id));
                    const newApps = new Set(apps.map(a => a.id));
                    setPermissions({ allowedCategories: newCats, allowedApps: newApps });
                  }}
                  className="text-xs text-teal-600 hover:text-teal-700 cursor-pointer font-medium"
                >
                  Seleccionar todo
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setPermissions({ allowedCategories: new Set(), allowedApps: new Set() })}
                  className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Limpiar todo
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {categories.map(category => {
                const stats = getCategoryAppStats(category.id);
                const catApps = apps.filter(a => a.category_id === category.id);
                const isExpanded = expandedCategories.has(category.id);
                const isCatAllowed = permissions.allowedCategories.has(category.id);
                const isPartial = isCatAllowed && stats.allowed < stats.total;

                return (
                  <div key={category.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Category row */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                      {/* Checkbox categoría */}
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer ${
                          isCatAllowed
                            ? isPartial
                              ? 'bg-amber-500 border-amber-500'
                              : 'bg-teal-500 border-teal-500'
                            : 'border-slate-300 hover:border-teal-400'
                        }`}
                      >
                        {isCatAllowed && (
                          isPartial
                            ? <i className="ri-subtract-line text-white text-xs w-3 h-3 flex items-center justify-center"></i>
                            : <i className="ri-check-line text-white text-xs w-3 h-3 flex items-center justify-center"></i>
                        )}
                      </button>

                      {/* Color dot + name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }}></div>
                        <span className="text-sm font-medium text-slate-700 truncate">{category.name}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {stats.allowed}/{stats.total} apps
                        </span>
                      </div>

                      {/* Expand toggle */}
                      {catApps.length > 0 && (
                        <button
                          onClick={() => toggleCategoryExpanded(category.id)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0"
                        >
                          {isExpanded ? <i className="ri-arrow-up-s-line text-sm w-4 h-4 flex items-center justify-center"></i> : <i className="ri-arrow-down-s-line text-sm w-4 h-4 flex items-center justify-center"></i>}
                        </button>
                      )}
                    </div>

                    {/* Apps list */}
                    {isExpanded && catApps.length > 0 && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        {/* Select all in category */}
                        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-400">{catApps.length} aplicaciones</span>
                          <button
                            onClick={() => handleSelectAllInCategory(category.id)}
                            className="text-xs text-teal-600 hover:text-teal-700 cursor-pointer font-medium"
                          >
                            {catApps.every(a => permissions.allowedApps.has(a.id)) ? 'Quitar todas' : 'Seleccionar todas'}
                          </button>
                        </div>
                        {catApps.map(app => {
                          const isAppAllowed = permissions.allowedApps.has(app.id);
                          return (
                            <div
                              key={app.id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-0"
                            >
                              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 pl-3">
                                {/* indent */}
                              </div>
                              <button
                                onClick={() => toggleApp(app)}
                                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer ${
                                  isAppAllowed
                                    ? 'bg-teal-500 border-teal-500'
                                    : 'border-slate-300 hover:border-teal-400'
                                }`}
                              >
                                {isAppAllowed && (
                                  <i className="ri-check-line text-white text-xs w-3 h-3 flex items-center justify-center"></i>
                                )}
                              </button>

                              {/* App logo */}
                              <div className="w-7 h-7 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                                {app.logo ? (
                                  <img src={app.logo} alt={app.name} className="w-6 h-6 object-contain" />
                                ) : (
                                  <i className="ri-window-line text-slate-400 text-xs w-4 h-4 flex items-center justify-center"></i>
                                )}
                              </div>

                              <span className={`text-sm truncate flex-1 ${isAppAllowed ? 'text-slate-700' : 'text-slate-400'}`}>
                                {app.name}
                              </span>

                              {isAppAllowed && (
                                <span className="text-xs text-teal-500 flex-shrink-0 font-medium">Permitida</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Apps sin categoría */}
              {uncategorizedApps.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-white">
                    <button
                      onClick={() => {
                        const allSelected = uncategorizedApps.every(a => permissions.allowedApps.has(a.id));
                        setPermissions(prev => {
                          const newApps = new Set(prev.allowedApps);
                          if (allSelected) {
                            uncategorizedApps.forEach(a => newApps.delete(a.id));
                          } else {
                            uncategorizedApps.forEach(a => newApps.add(a.id));
                          }
                          return { ...prev, allowedApps: newApps };
                        });
                      }}
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer ${
                        uncategorizedApps.every(a => permissions.allowedApps.has(a.id))
                          ? 'bg-teal-500 border-teal-500'
                          : uncategorizedApps.some(a => permissions.allowedApps.has(a.id))
                            ? 'bg-amber-500 border-amber-500'
                            : 'border-slate-300'
                      }`}
                    >
                      {uncategorizedApps.every(a => permissions.allowedApps.has(a.id)) && (
                        <i className="ri-check-line text-white text-xs w-3 h-3 flex items-center justify-center"></i>
                      )}
                      {uncategorizedApps.some(a => permissions.allowedApps.has(a.id)) && !uncategorizedApps.every(a => permissions.allowedApps.has(a.id)) && (
                        <i className="ri-subtract-line text-white text-xs w-3 h-3 flex items-center justify-center"></i>
                      )}
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-3 h-3 rounded-full bg-slate-300 flex-shrink-0"></div>
                      <span className="text-sm font-medium text-slate-500">Sin categoría</span>
                      <span className="text-xs text-slate-400">
                        {uncategorizedApps.filter(a => permissions.allowedApps.has(a.id)).length}/{uncategorizedApps.length} apps
                      </span>
                    </div>
                    <button
                      onClick={() => toggleCategoryExpanded('__uncategorized__')}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {expandedCategories.has('__uncategorized__') ? <i className="ri-arrow-up-s-line text-sm w-4 h-4 flex items-center justify-center"></i> : <i className="ri-arrow-down-s-line text-sm w-4 h-4 flex items-center justify-center"></i>}
                    </button>
                  </div>
                  {expandedCategories.has('__uncategorized__') && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {uncategorizedApps.map(app => {
                        const isAppAllowed = permissions.allowedApps.has(app.id);
                        return (
                          <div key={app.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-0">
                            <div className="w-5 h-5 flex-shrink-0"></div>
                            <button
                              onClick={() => toggleApp(app)}
                              className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer ${
                                isAppAllowed ? 'bg-teal-500 border-teal-500' : 'border-slate-300 hover:border-teal-400'
                              }`}
                            >
                              {isAppAllowed && <i className="ri-check-line text-white text-xs w-3 h-3 flex items-center justify-center"></i>}
                            </button>
                            <div className="w-7 h-7 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                              {app.logo ? (
                                <img src={app.logo} alt={app.name} className="w-6 h-6 object-contain" />
                              ) : (
                                <i className="ri-window-line text-slate-400 text-xs w-4 h-4 flex items-center justify-center"></i>
                              )}
                            </div>
                            <span className={`text-sm truncate flex-1 ${isAppAllowed ? 'text-slate-700' : 'text-slate-400'}`}>{app.name}</span>
                            {isAppAllowed && <span className="text-xs text-teal-500 font-medium flex-shrink-0">Permitida</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {categories.length === 0 && uncategorizedApps.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-apps-line text-slate-400 text-xl w-6 h-6 flex items-center justify-center"></i>
                  </div>
                  <p className="text-sm text-slate-500">No hay aplicaciones creadas aún</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          {successMsg ? (
            <div className="flex items-center gap-2 text-teal-600">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-sm"></i>
              </div>
              <span className="text-xs font-medium">{successMsg}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              {accessMode === 'all' ? 'Acceso sin restricciones' : `${totalAllowed} apps permitidas`}
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="ri-save-line w-4 h-4 flex items-center justify-center"></i>
                  Guardar permisos
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}