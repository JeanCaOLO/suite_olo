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
  const { login, signup, loginWithGoogle } = useAuth();

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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // El redirect lo maneja Supabase OAuth, no necesitamos navigate aquí
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión con Google. Intenta de nuevo.');
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

          {/* Google OAuth Button */}
          {view !== 'forgot' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-all font-medium text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </span>
                Continuar con Google
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400">o continúa con correo</span>
                </div>
              </div>
            </div>
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