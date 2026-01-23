import { useState } from 'react';
import type { AppBox } from '../../../types';

interface AppCardProps {
  app: AppBox;
  onDelete?: (id: string) => void;
  onEdit?: (app: AppBox) => void;
}

export default function AppCard({ app, onDelete, onEdit }: AppCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(app.id);
    }
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(app);
    }
    setShowMenu(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Si se hace clic en el menú o sus elementos, no abrir la URL
    if ((e.target as HTMLElement).closest('.app-menu')) {
      return;
    }
    window.open(app.url, '_blank');
  };

  // Mostrar botones de acción solo si onDelete o onEdit están definidos
  const showActions = onDelete || onEdit;

  return (
    <>
      <div 
        className="bg-white rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer relative"
        onClick={handleCardClick}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
              {app.logo ? (
                <img 
                  src={app.logo} 
                  alt={app.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="ri-apps-line text-2xl text-teal-600 w-8 h-8 flex items-center justify-center"></i>
              )}
            </div>
            
            {showActions && (
              <div className="app-menu relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  <i className="ri-more-2-fill text-slate-400 text-lg w-5 h-5 flex items-center justify-center"></i>
                </button>

                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                      }}
                    ></div>
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="ri-edit-line text-lg w-5 h-5 flex items-center justify-center"></i>
                          Editar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-lg w-5 h-5 flex items-center justify-center"></i>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors duration-200">
            {app.name}
          </h3>
          
          {app.category && (
            <div className="flex items-center gap-2 mb-3">
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: app.category.color }}
              >
                {app.category.name}
              </span>
            </div>
          )}

          <p className="text-sm text-slate-500 truncate">{app.url}</p>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Creada {new Date(app.createdAt).toLocaleDateString('es-ES')}</span>
            <i className="ri-external-link-line text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-lg w-4 h-4 flex items-center justify-center"></i>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-error-warning-line text-2xl text-red-600 w-6 h-6 flex items-center justify-center"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Confirmar eliminación</h3>
                <p className="text-sm text-slate-600">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-slate-700 mb-6">
              ¿Estás seguro de que deseas eliminar <strong>{app.name}</strong>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 font-medium cursor-pointer whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium cursor-pointer whitespace-nowrap"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
