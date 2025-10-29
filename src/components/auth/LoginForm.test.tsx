```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from './LoginForm';

// Mock del store de autenticación
jest.mock('../../store/authStore', () => ({
  __esModule: true,
  default: () => ({
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn()
  })
}));

// Mock del cliente de Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn()
    }
  }
}));

// Función auxiliar para renderizar con Router
const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Pruebas del Componente LoginForm', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  test('renderiza los campos del formulario de login', () => {
    renderWithRouter(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  test('muestra errores de validación para campos vacíos', async () => {
    renderWithRouter(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
  });

  test('valida formato de email', () => {
    renderWithRouter(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'emailinvalido' } });
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/por favor ingrese un email válido/i)).toBeInTheDocument();
  });

  test('permite ingresar datos en los campos del formulario', () => {
    renderWithRouter(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('maneja el restablecimiento de contraseña', async () => {
    renderWithRouter(<LoginForm />);
    
    const resetButton = screen.getByText(/¿olvidó su contraseña\?/i);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(resetButton);

    expect(screen.getByText(/se han enviado instrucciones/i)).toBeInTheDocument();
  });
});
```