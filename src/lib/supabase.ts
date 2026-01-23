
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

// Validar que las credenciales existan
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan las credenciales de Supabase en el archivo .env');
  console.error('VITE_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Configurado' : '✗ Falta');
  console.error('VITE_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Configurado' : '✗ Falta');
}

console.log('🔧 Inicializando Supabase...');
console.log('URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Verificar conexión
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Error al conectar con Supabase:', error.message);
  } else {
    console.log('✅ Conexión con Supabase establecida');
  }
});
