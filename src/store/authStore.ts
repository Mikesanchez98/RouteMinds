// Store de autenticación usando Zustand
import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

// Interfaz que define el estado y las acciones de autenticación
interface AuthState {
  user: User | null;          // Usuario actual
  isAuthenticated: boolean;   // Estado de autenticación
  isLoading: boolean;        // Indicador de carga
  error: string | null;      // Mensaje de error
  login: (email: string, password: string) => Promise<void>;      // Función de inicio de sesión
  register: (username: string, email: string, password: string) => Promise<void>;  // Función de registro
  logout: () => Promise<void>;  // Función de cierre de sesión
  clearError: () => void;    // Función para limpiar errores
}

// Crear el store con Zustand
const useAuthStore = create<AuthState>((set) => ({
  // Estado inicial
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  // Función de inicio de sesión
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Intentar autenticar con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Si la autenticación es exitosa, actualizar el estado
      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          username: data.user.user_metadata.username || data.user.email!,
          role: data.user.user_metadata.role || 'user'
        };
        set({ user, isAuthenticated: true, isLoading: false, error: null });
      }
    } catch (error) {
      // Manejar errores de autenticación
      set({ 
        error: 'Email o contraseña inválidos. Por favor intente nuevamente.', 
        isLoading: false,
        isAuthenticated: false,
        user: null 
      });
    }
  },
  
  // Función de registro
  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Ya existe una cuenta con este email. Por favor inicie sesión.');
      }

      // Registrar nuevo usuario en Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: 'user'
          }
        }
      });

      if (error) {
        throw error;
      }

      // Si el registro es exitoso, actualizar el estado
      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          username: username,
          role: 'user'
        };
        set({ user, isAuthenticated: true, isLoading: false, error: null });
      }
    } catch (error) {
      // Manejar errores de registro
      set({ 
        error: (error as Error).message, 
        isLoading: false,
        isAuthenticated: false,
        user: null 
      });
    }
  },
  
  // Función de cierre de sesión
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Limpiar el estado al cerrar sesión
      set({ user: null, isAuthenticated: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Función para limpiar mensajes de error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;