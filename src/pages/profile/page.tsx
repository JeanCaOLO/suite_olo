import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../dashboard/components/Navbar';
import { supabase } from '../../lib/supabase';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setMessage('¡Perfil actualizado exitosamente!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600 mt-1">Gestiona tu información personal</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <i className="ri-checkbox-circle-line text-green-500 text-xl"></i>
              <p className="text-sm text-green-700 flex-1">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <i className="ri-error-warning-line text-red-500 text-xl"></i>
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
              />
              <p className="mt-2 text-xs text-gray-500">El correo electrónico no se puede cambiar</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Rol</p>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{user?.role}</p>
                </div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <i className="ri-shield-user-line text-teal-600 text-xl"></i>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </span>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
