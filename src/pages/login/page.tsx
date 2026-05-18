import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type View = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const resetForm = () => {
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const switchView = (v: View) => {
    resetForm();
    setView(v);
  };

  const handleLoginSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (view === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else {
        const { user } = await signup(email, password, name);
        if (user) {
          setSuccessMessage('¡Cuenta creada! Por favor revisa tu correo para confirmar tu cuenta.');
          setTimeout(() => {
            switchView('login');
          }, 3000);
        }
      }
    } catch (err: any) {
      const msg: string = err.message || '';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Correo o contraseña incorrectos. Verifica tus datos o usa "Olvidé mi contraseña" para recuperar el acceso.');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Por favor confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
      } else {
        setError(msg || 'Ocurrió un error. Por favor intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw new Error(resetError.message);

      setSuccessMessage('¡Listo! Te enviamos un correo con el enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al enviar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = view === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className={`text-3xl text-white ${view === 'forgot' ? 'ri-key-2-line' : 'ri-apps-2-line'}`}></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {view === 'login' && 'Bienvenido'}
              {view === 'signup' && 'Crear Cuenta'}
              {view === 'forgot' && 'Recuperar Acceso'}
            </h1>
            <p className="text-gray-600">
              {view === 'login' && 'Inicia sesión para continuar'}
              {view === 'signup' && 'Regístrate para comenzar'}
              {view === 'forgot' && 'Te enviaremos un enlace para restablecer tu contraseña'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <i className="ri-error-warning-line text-red-500 text-xl flex-shrink-0"></i>
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <i className="ri-checkbox-circle-line text-green-500 text-xl flex-shrink-0"></i>
              <p className="text-sm text-green-700 flex-1">{successMessage}</p>
            </div>
          )}

          {/* Forgot Password Form */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label htmlFor="email-forgot" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-gray-400"></i>
                  </div>
                  <input
                    id="email-forgot"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </span>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </button>

              <button
                type="button"
                onClick={() => switchView('login')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-arrow-left-line"></i>
                Volver al inicio de sesión
              </button>
            </form>
          )}

          {/* Login / Signup Form */}
          {view !== 'forgot' && (
            <form onSubmit={handleLoginSignup} className="space-y-5">
              {view === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-user-line text-gray-400"></i>
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                      placeholder="Tu nombre"
                      required={view === 'signup'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-gray-400"></i>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer whitespace-nowrap"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-gray-400"></i>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                {view === 'signup' && (
                  <p className="mt-2 text-xs text-gray-500">Mínimo 6 caracteres</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </span>
                ) : (
                  <span>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                )}
              </button>
            </form>
          )}

          {/* Switch login/signup */}
          {view !== 'forgot' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => switchView(isLogin ? 'signup' : 'login')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap cursor-pointer"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  );
}