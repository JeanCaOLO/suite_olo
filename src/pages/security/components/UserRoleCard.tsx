import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { writeAuditLog } from '@/lib/audit';
import PermissionsModal from './PermissionsModal';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface UserRoleCardProps {
  profile: UserProfile;
  currentUserId: string;
  onUpdate: (id: string, newRole: 'admin' | 'user') => void;
}

export default function UserRoleCard({ profile, currentUserId, onUpdate }: UserRoleCardProps) {
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<'admin' | 'user' | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const isSelf = profile.id === currentUserId;

  const handleRoleChange = (newRole: 'admin' | 'user') => {
    if (newRole === profile.role) return;
    setPendingRole(newRole);
    setShowConfirm(true);
  };

  const confirmChange = async () => {
    if (!pendingRole) return;
    setSaving(true);
    setShowConfirm(false);

    const { error } = await supabase
      .from('profiles')
      .update({ role: pendingRole })
      .eq('id', profile.id);

    if (!error) {
      onUpdate(profile.id, pendingRole);
      await writeAuditLog({
        action: 'role_changed',
        target_user_id: profile.id,
        target_user_name: profile.name,
        target_user_email: profile.email,
        details: {
          from_role: profile.role,
          to_role: pendingRole,
        },
      });
    } else {
      console.error('Error al actualizar rol:', error);
    }

    setSaving(false);
    setPendingRole(null);
  };

  const cancelChange = () => {
    setShowConfirm(false);
    setPendingRole(null);
  };

  const initials = profile.name
    .split(' ')
    .map(n => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const joinedDate = new Date(profile.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 relative">
      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center z-10 p-4">
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-3">
            <i className="ri-error-warning-line text-amber-500 text-xl w-6 h-6 flex items-center justify-center"></i>
          </div>
          <p className="text-sm font-semibold text-slate-800 text-center mb-1">
            ¿Cambiar rol de {profile.name}?
          </p>
          <p className="text-xs text-slate-500 text-center mb-4">
            Nuevo rol:{' '}
            <span className={`font-medium ${pendingRole === 'admin' ? 'text-amber-600' : 'text-slate-700'}`}>
              {pendingRole === 'admin' ? 'Administrador' : 'Usuario'}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={cancelChange}
              className="px-4 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              onClick={confirmChange}
              className="px-4 py-1.5 text-xs rounded-lg bg-teal-600 text-white hover:bg-teal-700 cursor-pointer whitespace-nowrap"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          profile.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
        }`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800 truncate">{profile.name}</p>
            {isSelf && (
              <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium">Tú</span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{profile.email}</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <i className="ri-calendar-line w-3 h-3 flex items-center justify-center"></i>
            Miembro desde {joinedDate}
          </p>
        </div>

        {/* Role selector */}
        <div className="flex-shrink-0">
          {saving ? (
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={() => handleRoleChange('admin')}
                disabled={isSelf}
                title={isSelf ? 'No puedes cambiar tu propio rol' : 'Asignar Administrador'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  profile.role === 'admin'
                    ? 'bg-amber-100 text-amber-700 cursor-default'
                    : isSelf
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'bg-slate-50 text-slate-500 hover:bg-amber-50 hover:text-amber-600 cursor-pointer'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-shield-star-line"></i>
                </div>
                Admin
                {profile.role === 'admin' && (
                  <div className="w-3 h-3 flex items-center justify-center">
                    <i className="ri-check-line"></i>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRoleChange('user')}
                disabled={isSelf}
                title={isSelf ? 'No puedes cambiar tu propio rol' : 'Asignar Usuario'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  profile.role === 'user'
                    ? 'bg-teal-100 text-teal-700 cursor-default'
                    : isSelf
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'bg-slate-50 text-slate-500 hover:bg-teal-50 hover:text-teal-600 cursor-pointer'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-user-line"></i>
                </div>
                Usuario
                {profile.role === 'user' && (
                  <div className="w-3 h-3 flex items-center justify-center">
                    <i className="ri-check-line"></i>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Permissions button */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => setShowPermissions(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-shield-check-line text-sm"></i>
            </div>
            <span className="text-xs font-medium">Configurar permisos de acceso</span>
          </div>
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-arrow-right-s-line text-sm group-hover:translate-x-0.5 transition-transform"></i>
          </div>
        </button>
      </div>

      {/* Permissions Modal */}
      {showPermissions && (
        <PermissionsModal
          profile={profile}
          onClose={() => setShowPermissions(false)}
        />
      )}
    </div>
  );
}