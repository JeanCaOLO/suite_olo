import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '@/components/feature/AppLayout';
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

  const isAdmin = user?.role === 'admin';

  return (
    <AppLayout>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>Mi Perfil</h1>
          <p className="text-slate-500 text-sm mt-1">Administra tu información personal y configuración de cuenta</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left panel — user card */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Avatar & name card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center mb-4 relative"
                style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)' }}
              >
                <span className="text-4xl font-bold text-white select-none">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
                <div
                  className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: isAdmin ? '#0d9488' : '#64748b' }}
                >
                  <i className={`${isAdmin ? 'ri-shield-star-fill' : 'ri-user-3-fill'} text-white text-xs`}></i>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-800 mt-2">{user?.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5 truncate w-full">{user?.email}</p>

              <div
                className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: isAdmin ? 'rgba(13,148,136,0.1)' : 'rgba(100,116,139,0.1)',
                  color: isAdmin ? '#0d9488' : '#64748b'
                }}
              >
                {isAdmin ? 'Administrador' : 'Usuario'}
              </div>
            </div>

            {/* Info tiles */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Información de cuenta</p>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <i className="ri-mail-line text-teal-600 text-base"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Correo electrónico</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <i className="ri-shield-user-line text-teal-600 text-base"></i>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Rol asignado</p>
                  <p className="text-sm font-medium text-slate-700 capitalize">{isAdmin ? 'Administrador' : 'Usuario'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <i className="ri-user-line text-teal-600 text-base"></i>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Nombre de usuario</p>
                  <p className="text-sm font-medium text-slate-700">{user?.name || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-8">

              <div className="mb-6 pb-5 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-800">Editar información</h3>
                <p className="text-sm text-slate-400 mt-1">Actualiza los datos que se mostrarán en tu cuenta</p>
              </div>

              {message && (
                <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(13,148,136,0.07)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <i className="ri-checkbox-circle-line text-teal-600 text-base"></i>
                  </div>
                  <p className="text-sm text-teal-700 font-medium">{message}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <i className="ri-error-warning-line text-red-500 text-base"></i>
                  </div>
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="ri-user-line text-slate-400 text-base"></i>
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all text-sm text-slate-800 bg-slate-50/50"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="ri-mail-line text-slate-300 text-base"></i>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-400 bg-slate-50 cursor-not-allowed text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <i className="ri-lock-2-line text-slate-300 text-sm"></i>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <i className="ri-information-line text-xs"></i>
                    El correo electrónico no puede ser modificado
                  </p>
                </div>

                {/* Role display (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: isAdmin ? 'rgba(13,148,136,0.1)' : 'rgba(100,116,139,0.1)' }}
                    >
                      <i
                        className={`${isAdmin ? 'ri-shield-star-line' : 'ri-user-3-line'} text-base`}
                        style={{ color: isAdmin ? '#0d9488' : '#64748b' }}
                      ></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{isAdmin ? 'Administrador' : 'Usuario'}</p>
                      <p className="text-xs text-slate-400">{isAdmin ? 'Acceso total al sistema' : 'Acceso de solo lectura'}</p>
                    </div>
                    <div className="ml-auto">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: isAdmin ? 'rgba(13,148,136,0.1)' : 'rgba(100,116,139,0.1)',
                          color: isAdmin ? '#0d9488' : '#64748b'
                        }}
                      >
                        {isAdmin ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <i className="ri-information-line text-xs"></i>
                    El rol es asignado por el administrador del sistema
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)' }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando cambios...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-save-line text-base"></i>
                        Guardar Cambios
                      </span>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </main>
    </AppLayout>
  );
}
