import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <img 
              src="https://public.readdy.ai/ai/img_res/517e223c-4a13-467a-982f-e9334695d6aa.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
                </div>
                <i className="ri-arrow-down-s-line text-slate-400 text-lg w-5 h-5 flex items-center justify-center"></i>
              </button>

              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <i className="ri-user-line text-lg w-5 h-5 flex items-center justify-center"></i>
                      Mi Perfil
                    </button>
                    <hr className="my-2 border-slate-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <i className="ri-logout-box-line text-lg w-5 h-5 flex items-center justify-center"></i>
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
