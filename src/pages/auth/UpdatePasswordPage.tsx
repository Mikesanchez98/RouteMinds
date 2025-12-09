import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false); // Validar si el link funcionó
  const navigate = useNavigate();

  useEffect(() => {
    // Escuchar cuando Supabase procesa el link mágico
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsSessionValid(true);
        // Opcional: Limpiar la URL fea para que el usuario no se asuste
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('La contraseña no puede estar vacía.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Actualizando contraseña...');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success('¡Contraseña actualizada! Redirigiendo...', { id: loadingToast });
      
      // Cerrar sesión y mandar al login para que entre con la nueva pass
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 2000);

    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Recuperación de Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSessionValid 
              ? "Ingresa tu nueva contraseña a continuación." 
              : "Verificando enlace de seguridad..."}
          </p>
        </div>
        
        {isSessionValid ? (
          <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              <Input
                label="Nueva Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                fullWidth
                leftIcon={<Lock size={18} />}
              />
              <Input
                label="Confirmar Contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                fullWidth
                leftIcon={<Lock size={18} />}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Establecer Nueva Contraseña'}
            </Button>
          </form>
        ) : (
           <div className="flex justify-center py-10">
             {/* Spinner simple mientras valida el token */}
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
           </div>
        )}
      </div>
    </div>
  );
};

export default UpdatePasswordPage;