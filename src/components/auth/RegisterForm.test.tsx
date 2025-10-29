```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterForm from './RegisterForm';

// Mock del store de autenticación
jest.mock('../../store/authStore', () => ({
  __esModule: true,
  default: () => ({
    register: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn()
  })
}));

// Función auxiliar para renderizar con Router
const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Pruebas del Componente RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza los campos del formulario de registro', () => {
    renderWithRouter(<RegisterForm />);
    
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  test('muestra errores de validación para campos vacíos', () => {
    renderWithRouter(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/el nombre de usuario es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
  });

  test('valida que las contraseñas coincidan', () => {
    renderWithRouter(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  test('valida la longitud mínima de la contraseña', () => {
    renderWithRouter(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    fireEvent.change(passwordInput, { target: { value: '12345' } });

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/la contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();
  });

  test('permite navegar al formulario de inicio de sesión', () => {
    renderWithRouter(<RegisterForm />);
    
    const loginLink = screen.getByText(/iniciar sesión/i);
    expect(loginLink).toBeInTheDocument();
  });
});
```