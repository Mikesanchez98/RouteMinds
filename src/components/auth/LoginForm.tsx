// Componente de formulario de inicio de sesión
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';

// Función para validar formato de email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const LoginForm: React.FC = () => {
  // Estados locales del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Obtener funciones y estado del store de autenticación
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const newErrors = { email: '', password: '' };
    let hasError = false;
    
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
      hasError = true;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Por favor ingrese un email válido';
      hasError = true;
    }
    
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      // El error es manejado por el store
    }
  };

  // Manejar solicitud de restablecimiento de contraseña
  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrors({ ...errors, email: 'Por favor ingrese su email para restablecer la contraseña' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ ...errors, email: 'Por favor ingrese un email válido' });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetEmailSent(true);
      setErrors({ email: '', password: '' });
    } catch (error) {
      setErrors({
        ...errors,
        email: 'Error al enviar el email de restablecimiento. Por favor intente nuevamente.',
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          fullWidth
          leftIcon={<Mail size={18} />}
          placeholder="Ingrese su email"
          disabled={isLoading}
        />
        
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          fullWidth
          leftIcon={<Lock size={18} />}
          placeholder="Ingrese su contraseña"
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {resetEmailSent && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md text-sm">
          Se han enviado instrucciones para restablecer su contraseña.
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Recordarme
          </label>
        </div>
        
        <div className="text-sm">
          <button
            type="button"
            onClick={handlePasswordReset}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ¿Olvidó su contraseña?
          </button>
        </div>
      </div>
      
      <Button
        type="submit"
        fullWidth
        size="lg"
        isLoading={isLoading}
        rightIcon={<LogIn size={18} />}
      >
        Iniciar Sesión
      </Button>
      
      <div className="text-center text-sm text-gray-600">
        ¿No tiene una cuenta?{' '}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Registrarse
        </button>
      </div>
    </form>
  );
};

export default LoginForm;