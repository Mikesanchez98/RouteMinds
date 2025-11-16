import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Mail } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    // 1. Construye la URL de redirección.
    // Esto le dice a Supabase a dónde enviar al usuario DESPUÉS
    // de que haga clic en el enlace de su correo.
    const redirectTo = `${window.location.origin}/update-password`;

    // 2. Llama a la función de Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Se ha enviado un enlace de recuperación a tu correo.');
      // Opcional: redirige al login después de un momento
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            No te preocupes. Introduce tu email y te enviaremos un enlace para recuperarla.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="rounded-md shadow-sm -space-y-px">
            <Input
              label="Email"
              id="email-address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              fullWidth
            />
          </div>

          {message && (
            <div className="text-sm font-medium text-green-600">
              {message}
            </div>
          )}
          {error && (
            <div className="text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              leftIcon={<Mail size={18} />}
            >
              {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </Button>
          </div>
        </form>
        
        <div className="text-sm text-center">
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Volver a Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;