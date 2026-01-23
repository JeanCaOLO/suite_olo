import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Category } from '../../../types';

interface ManageCategoriesModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

export default function ManageCategoriesModal({ onClose, onUpdate }: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const colorOptions = [
    { value: '#14B8A6', label: 'Turquesa' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#8B5CF6', label: 'Morado' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#F59E0B', label: 'Naranja' },
    { value: '#10B981', label: 'Verde' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#6366F1', label: 'Índigo' },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    const { error } = await supabase
      .from('categories')
      .update({
        name: editName,
        color: editColor,
      })
      .eq('id', editingId);

    if (!error) {
      setCategories(categories.map(cat => 
        cat.id === editingId 
          ? { ...cat, name: editName, color: editColor }
          : cat
      ));
      setEditingId(null);
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (!error) {
      setCategories(categories.filter(cat => cat.id !== id));
      setDeleteConfirmId(null);
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Gestionar Categorías</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors duration-200 cursor-pointer"
          >
            <i className="ri-close-line text-xl text-slate-600 w-5 h-5 flex items-center justify-center"></i>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-folder-line text-3xl text-slate-400 w-8 h-8 flex items-center justify-center"></i>
              </div>
              <p className="text-slate-600">No hay categorías creadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id}>
                  {editingId === category.id ? (
                    <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                        placeholder="Nombre de la categoría"
                      />
                      <div>
                        <p className="text-xs text-slate-600 mb-2">Color:</p>
                        <div className="grid grid-cols-8 gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setEditColor(color.value)}
                              className={`w-full h-10 rounded-lg transition-all duration-200 cursor-pointer ${
                                editColor === color.value
                                  ? 'ring-2 ring-offset-2 ring-slate-400'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-3 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-slate-800">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors duration-200 cursor-pointer"
                        >
                          <i className="ri-edit-line text-slate-600 w-5 h-5 flex items-center justify-center"></i>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(category.id)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-red-600 w-5 h-5 flex items-center justify-center"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-alert-line text-2xl text-red-600 w-6 h-6 flex items-center justify-center"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Confirmar eliminación</h3>
                <p className="text-sm text-slate-600">¿Estás seguro de eliminar esta categoría?</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              Las aplicaciones asociadas no se eliminarán, solo perderán su categoría.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-sm font-medium whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium whitespace-nowrap cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
