import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'ri-apps-2-line', path: '/dashboard' },
  { label: 'Seguridad', icon: 'ri-shield-keyhole-line', path: '/security', adminOnly: true },
  { label: 'Mi Perfil', icon: 'ri-user-line', path: '/profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-slate-200 ${
        expanded ? 'w-56' : 'w-16'
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-3 border-b border-slate-100 overflow-hidden">
        {expanded ? (
          <img
            src="https://public.readdy.ai/ai/img_res/517e223c-4a13-467a-982f-e9334695d6aa.png"
            alt="Logo"
            className="h-9 w-auto object-contain cursor-pointer"
            onClick={() => navigate('/dashboard')}
          />
        ) : (
          <div
            className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            <i className="ri-apps-2-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-hidden">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  title={!expanded ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <i className={`${item.icon} text-lg`}></i>
                  </div>
                  {expanded && (
                    <span className="text-sm font-medium transition-opacity duration-200">
                      {item.label}
                    </span>
                  )}
                  {isActive && expanded && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-600 flex-shrink-0"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 p-2 overflow-hidden">
        {/* Role badge */}
        {expanded && (
          <div className={`mx-1 mb-2 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 ${
            isAdmin ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
          }`}>
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <i className={isAdmin ? 'ri-shield-star-line' : 'ri-user-line'}></i>
            </div>
            {isAdmin ? 'Administrador' : 'Usuario'}
          </div>
        )}

        {/* User info */}
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${expanded ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={!expanded ? 'Cerrar Sesión' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-200 cursor-pointer whitespace-nowrap mt-1"
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <i className="ri-logout-box-line text-lg"></i>
          </div>
          {expanded && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}