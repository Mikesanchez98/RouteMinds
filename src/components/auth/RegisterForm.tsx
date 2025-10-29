import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useAuthStore from '../../store/authStore';

// Función para validar formato de email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const RegisterForm: React.FC = () => {
  // Estados locales del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Obtener funciones y estado del store de autenticación
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    let hasError = false;
    
    // Validación de nombre de usuario
    if (!username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
      hasError = true;
    }
    
    // Validación de email
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
      hasError = true;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Por favor ingrese un email válido';
      hasError = true;
    }
    
    // Validación de contraseña
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      hasError = true;
    }
    
    // Validación de confirmación de contraseña
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Intentar registro
      await register(username, email, password);
      navigate('/dashboard');
    } catch (error) {
      // El error es manejado por el store
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="space-y-4">
        <Input
          label="Nombre de Usuario"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          fullWidth
          leftIcon={<User size={18} />}
          placeholder="Elija un nombre de usuario"
          disabled={isLoading}
        />
        
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
          placeholder="Cree una contraseña"
          disabled={isLoading}
        />
        
        <Input
          label="Confirmar Contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          fullWidth
          leftIcon={<Lock size={18} />}
          placeholder="Confirme su contraseña"
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <Button
        type="submit"
        fullWidth
        size="lg"
        isLoading={isLoading}
        rightIcon={<UserPlus size={18} />}
      >
        Crear Cuenta
      </Button>
      
      <div className="text-center text-sm text-gray-600">
        ¿Ya tiene una cuenta?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Iniciar Sesión
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;