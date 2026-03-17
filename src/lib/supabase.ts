import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan las credenciales de Supabase en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Limpiar sesión inválida cuando falla el refresh del token
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token renovado correctamente');
  }
  if (event === 'SIGNED_OUT') {
    console.log('🚪 Sesión cerrada');
  }
});

// Verificar conexión inicial con manejo de error de red
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    const isNetworkError = error.message?.toLowerCase().includes('fetch') ||
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('failed');

    if (isNetworkError) {
      console.warn('⚠️ Error de red al verificar sesión. Limpiando sesión local...');
      // Limpiar localStorage para eliminar tokens inválidos
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } else {
      console.error('❌ Error al conectar con Supabase:', error.message);
    }
  } else {
    console.log('✅ Conexión con Supabase establecida', data.session ? '(sesión activa)' : '(sin sesión)');
  }
});
