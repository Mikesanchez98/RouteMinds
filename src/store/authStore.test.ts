```typescript
import { act, renderHook } from '@testing-library/react';
import useAuthStore from './authStore';

// Mock del cliente de Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('Pruebas del Store de Autenticación', () => {
  beforeEach(() => {
    // Limpiar el estado antes de cada prueba
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
    jest.clearAllMocks();
  });

  test('inicializa con valores por defecto', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBeFalse();
    expect(result.current.isLoading).toBeFalse();
    expect(result.current.error).toBeNull();
  });

  test('maneja inicio de sesión exitoso', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Mock de respuesta exitosa de Supabase
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: { username: 'testuser', role: 'user' }
    };

    require('../lib/supabase').supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBeTrue();
    expect(result.current.user).toBeTruthy();
    expect(result.current.error).toBeNull();
  });

  test('maneja errores de inicio de sesión', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Mock de error de Supabase
    require('../lib/supabase').supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Credenciales inválidas')
    });

    await act(async () => {
      await result.current.login('wrong@email.com', 'wrongpass');
    });

    expect(result.current.isAuthenticated).toBeFalse();
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  test('maneja registro exitoso', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Mock de respuesta exitosa de Supabase
    const mockUser = {
      id: '1',
      email: 'new@example.com',
      user_metadata: { username: 'newuser', role: 'user' }
    };

    require('../lib/supabase').supabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    await act(async () => {
      await result.current.register('newuser', 'new@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBeTrue();
    expect(result.current.user).toBeTruthy();
    expect(result.current.error).toBeNull();
  });

  test('maneja cierre de sesión', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    require('../lib/supabase').supabase.auth.signOut.mockResolvedValue({
      error: null
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBeFalse();
    expect(result.current.user).toBeNull();
  });

  test('limpia errores correctamente', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      // Primero establecemos un error
      result.current.login('wrong@email.com', 'wrongpass');
      // Luego lo limpiamos
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
```