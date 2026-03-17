import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // Refs para evitar cargas duplicadas
  const isLoadingProfileRef = useRef(false);
  const lastProfileUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Verificar sesión inicial
    checkSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔐 AUTH_STATE_CHANGE:', { event: _event, hasSession: !!session });

      if (_event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token renovado correctamente');
        if (session?.user) {
          await loadUserProfile(session.user);
        }
        return;
      }

      if (_event === 'TOKEN_REFRESH_FAILED' || _event === 'SIGNED_OUT') {
        console.warn('⚠️ Token refresh fallido o sesión cerrada. Limpiando sesión local...');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
        setUser(null);
        lastProfileUserIdRef.current = null;
        setAuthReady(true);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setAuthReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      console.log('🔍 SESSION_CHECK_START');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        const isNetworkError = error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('network') ||
          error.message?.toLowerCase().includes('failed');

        if (isNetworkError) {
          console.warn('⚠️ Error de red al verificar sesión. Limpiando sesión...');
          // Limpiar tokens locales inválidos
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) localStorage.removeItem(key);
          });
          await supabase.auth.signOut();
        } else {
          console.error('❌ SESSION_CHECK_ERROR:', error);
        }
        setUser(null);
        setAuthReady(true);
        return;
      }
      
      if (session?.user) {
        console.log('✅ SESSION_FOUND:', { userId: session.user.id, email: session.user.email });
        await loadUserProfile(session.user);
      } else {
        console.log('ℹ️ SESSION_NOT_FOUND: No hay sesión activa');
        setUser(null);
        setAuthReady(true);
      }
    } catch (error: any) {
      const isNetworkError = error?.message?.toLowerCase().includes('fetch') ||
        error?.message?.toLowerCase().includes('failed to fetch');

      if (isNetworkError) {
        console.warn('⚠️ Error de red al iniciar sesión. Limpiando sesión local...');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
      } else {
        console.error('❌ SESSION_CHECK_EXCEPTION:', error);
      }
      setUser(null);
      setAuthReady(true);
    } finally {
      console.log('🏁 SESSION_CHECK_COMPLETE: Finalizando carga');
      setLoading(false);
    }
  };

  const loadUserProfile = async (supabaseUser: SupabaseUser, isRetry = false) => {
    // 1) Evitar cargas duplicadas
    if (isLoadingProfileRef.current) {
      console.log('⏭️ PROFILE_LOAD_SKIPPED_ALREADY_LOADING:', { userId: supabaseUser.id });
      return;
    }

    if (lastProfileUserIdRef.current === supabaseUser.id && user !== null && !isRetry) {
      console.log('⏭️ PROFILE_LOAD_SKIPPED_ALREADY_LOADED:', { userId: supabaseUser.id });
      setAuthReady(true);
      setLoading(false);
      return;
    }

    isLoadingProfileRef.current = true;

    try {
      console.log('👤 PROFILE_LOAD_START:', { userId: supabaseUser.id, isRetry });
      
      // Crear timeout de 8 segundos para la consulta
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 8000);
      });

      console.log('🔍 PROFILE_QUERY_START: Iniciando consulta a Supabase');

      // Race entre la consulta y el timeout
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      const { data: profile, error } = await Promise.race([
        profileQuery,
        timeoutPromise
      ]) as any;

      console.log('📊 PROFILE_QUERY_RESULT:', { 
        hasData: !!profile, 
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message 
      });

      if (error && error.code === 'PGRST116') {
        console.log('📝 PROFILE_NOT_FOUND: Creando perfil nuevo');
        
        // Perfil no existe, crear uno nuevo
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
          role: 'user' as const,
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (!insertError) {
          console.log('✅ PROFILE_CREATED:', { userId: newProfile.id, name: newProfile.name });
          console.log('✅ PROFILE_LOAD_SUCCESS: Perfil creado y cargado');
          setUser(newProfile);
          lastProfileUserIdRef.current = supabaseUser.id;
          setAuthReady(true);
        } else {
          console.error('❌ PROFILE_CREATE_ERROR:', insertError);
          console.error('❌ PROFILE_LOAD_ERROR:', { error: insertError });
          setAuthReady(true);
        }
      } else if (profile) {
        console.log('✅ PROFILE_LOADED:', {
          userId: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          avatar_url: profile.avatar_url || null,
          avatar_path: profile.avatar_path || null,
        });

        console.log('✅ PROFILE_LOAD_SUCCESS: Perfil cargado correctamente');

        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as 'admin' | 'user',
        });
        lastProfileUserIdRef.current = supabaseUser.id;
        setAuthReady(true);
      } else if (error) {
        console.error('❌ PROFILE_LOAD_ERROR:', { 
          error, 
          code: error.code, 
          message: error.message,
          details: error.details,
          hint: error.hint 
        });
        setAuthReady(true);
      }
    } catch (error: any) {
      if (error?.message === 'TIMEOUT') {
        console.warn('⏱️ PROFILE_QUERY_TIMEOUT: La consulta tardó más de 8 segundos');
        
        // 2) Reintentar 1 vez después de timeout
        if (!isRetry) {
          console.log('🔄 PROFILE_RETRYING_AFTER_TIMEOUT: Reintentando en 400ms...');
          await new Promise(resolve => setTimeout(resolve, 400));
          isLoadingProfileRef.current = false;
          await loadUserProfile(supabaseUser, true);
          return;
        } else {
          console.warn('⚠️ PROFILE_LOAD_DEGRADED: Timeout después de retry, continuando con perfil por defecto');
          
          // Continuar con perfil por defecto después del retry fallido
          const defaultProfile = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
            role: 'user' as const,
          };
          setUser(defaultProfile);
          lastProfileUserIdRef.current = supabaseUser.id;
          setAuthReady(true);
        }
      } else {
        console.error('❌ PROFILE_LOAD_EXCEPTION:', error);
        console.error('❌ PROFILE_LOAD_ERROR:', { 
          error: error?.message || 'Error desconocido',
          stack: error?.stack 
        });
        setAuthReady(true);
      }
    } finally {
      console.log('🏁 PROFILE_LOAD_FINALLY_LOADING_OFF: Apagando loading');
      isLoadingProfileRef.current = false;
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 LOGIN_ATTEMPT:', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ LOGIN_ERROR:', error);
      throw new Error(error.message);
    }

    console.log('✅ LOGIN_SUCCESS:', { userId: data.user?.id });

    if (data.user) {
      await loadUserProfile(data.user);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    console.log('📝 SIGNUP_ATTEMPT:', { email, name });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      console.error('❌ SIGNUP_ERROR:', error);
      throw new Error(error.message);
    }

    console.log('✅ SIGNUP_SUCCESS:', { userId: data.user?.id });

    return data;
  };

  const logout = async () => {
    console.log('🚪 LOGOUT_ATTEMPT');
    await supabase.auth.signOut();
    setUser(null);
    lastProfileUserIdRef.current = null;
    setAuthReady(true);
    console.log('✅ LOGOUT_SUCCESS');
  };

  // 3) Mostrar loading solo si NO está listo (authReady)
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
