import React from 'react';
import { Truck } from 'lucide-react';
import RegisterForm from '../../components/auth/RegisterForm';
import useAuthStore from '../../store/authStore';

const RegisterPage: React.FC = () => {
  const { error, clearError } = useAuthStore();

  React.useEffect(() => {
    // Clear any existing errors when the component mounts
    clearError();
  }, [clearError]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Truck size={48} className="text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Route Optimization System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create a new account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;