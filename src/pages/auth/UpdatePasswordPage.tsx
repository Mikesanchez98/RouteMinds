import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Lock } from 'lucide-react';

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Este useEffect maneja el evento de Supabase cuando el usuario
  // acaba de iniciar sesión a través del enlace mágico.
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // El usuario ha iniciado sesión con un token de recuperación
        // No es necesario hacer nada extra, solo mostrar el formulario.
        console.log('Sesión de recuperación de contraseña iniciada.');
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validación simple
    if (!password) {
      setError('La contraseña no puede estar vacía.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    // 1. Llama a la función de Supabase para actualizar al usuario
    // Como el usuario llegó aquí desde un enlace de email, Supabase
    // ya tiene la sesión de "recuperación" activa.
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...');
      // 2. Cierra la sesión de recuperación
      await supabase.auth.signOut();
      // 3. Envía al usuario al login
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Crea tu nueva contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Introduce una contraseña segura y que recuerdes.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              label="Nueva Contraseña"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              fullWidth
            />
            <Input
              label="Confirmar Contraseña"
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
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
              leftIcon={<Lock size={18} />}
            >
              {isLoading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;