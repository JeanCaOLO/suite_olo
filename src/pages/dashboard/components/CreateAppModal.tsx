import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { AppBox, Category } from '../../../types';

interface CreateAppModalProps {
  onClose: () => void;
  onSubmit: (app: Omit<AppBox, 'id' | 'createdAt' | 'createdBy'>) => void;
}

export default function CreateAppModal({ onClose, onSubmit }: CreateAppModalProps) {
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#14B8A6');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; logo?: string; url?: string }>({});

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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, logo: 'El archivo debe ser menor a 2MB' });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, logo: 'Solo se permiten imágenes' });
        return;
      }

      setLogoFile(file);
      setErrors({ ...errors, logo: undefined });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) throw new Error('No hay archivo para subir');

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('app-logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError);
      throw new Error(`Error al subir el logo: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('app-logos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name: newCategoryName,
          color: newCategoryColor,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setCategories([...categories, data]);
      setCategoryId(data.id);
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; logo?: string; url?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!logoFile && !logoPreview) {
      newErrors.logo = 'El logo es requerido';
    }

    if (!url.trim()) {
      newErrors.url = 'La URL es requerida';
    } else if (!url.startsWith('http')) {
      newErrors.url = 'Debe ser una URL válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setUploading(true);
      const logoUrl = await uploadLogo();
      
      await onSubmit({ 
        name, 
        logo: logoUrl, 
        url,
        category_id: categoryId || undefined,
      });
      
      // Cerrar modal después de crear exitosamente
      onClose();
    } catch (error: any) {
      console.error('Error completo:', error);
      setErrors({ ...errors, logo: error.message || 'Error al crear la aplicación' });
      alert(`Error: ${error.message || 'No se pudo crear la aplicación. Verifica que el bucket "app-logos" existe en Supabase Storage.'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Crear Nueva Aplicación</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors duration-200 cursor-pointer"
          >
            <i className="ri-close-line text-xl text-slate-600 w-5 h-5 flex items-center justify-center"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Nombre de la aplicación *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 border ${errors.name ? 'border-red-300' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm`}
              placeholder="Ej: Analytics Dashboard"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-slate-700 mb-2">
              Logo de la aplicación *
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer text-sm text-slate-700 flex items-center justify-center gap-2">
                  <i className="ri-upload-cloud-line text-lg w-5 h-5 flex items-center justify-center"></i>
                  <span>{logoFile ? logoFile.name : 'Seleccionar imagen'}</span>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              {errors.logo && <p className="text-xs text-red-600">{errors.logo}</p>}
              {logoPreview && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-2">Vista previa:</p>
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                    <img src={logoPreview} alt="Preview" className="w-16 h-16 object-contain" />
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">Tamaño máximo: 2MB. Formatos: JPG, PNG, SVG</p>
            </div>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-2">
              URL de la aplicación *
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`w-full px-4 py-3 border ${errors.url ? 'border-red-300' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm`}
              placeholder="https://app.ejemplo.com"
            />
            {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
              Categoría (opcional)
            </label>
            {!showNewCategory ? (
              <div className="space-y-2">
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm cursor-pointer"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <i className="ri-add-line w-4 h-4 flex items-center justify-center"></i>
                  Crear nueva categoría
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de la categoría"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                />
                <div>
                  <p className="text-xs text-slate-600 mb-2">Color:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewCategoryColor(color.value)}
                        className={`w-full h-10 rounded-lg transition-all duration-200 cursor-pointer ${
                          newCategoryColor === color.value
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
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="flex-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="flex-1 px-3 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
                  >
                    Crear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Subiendo...' : 'Crear Aplicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
