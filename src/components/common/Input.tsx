// Componente Input - Un campo de entrada reutilizable con soporte para iconos y estados de error
import React from 'react';

// Interfaz para las propiedades del input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;           // Etiqueta del campo
  error?: string;           // Mensaje de error
  fullWidth?: boolean;      // Si debe ocupar todo el ancho disponible
  leftIcon?: React.ReactNode;  // Icono a la izquierda
  rightIcon?: React.ReactNode; // Icono a la derecha
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  // Generar ID único si no se proporciona
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Etiqueta del campo */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Icono izquierdo */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {leftIcon}
          </div>
        )}
        
        {/* Campo de entrada */}
        <input
          id={inputId}
          className={`
            block px-4 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${fullWidth ? 'w-full' : ''}
          `}
          {...props}
        />
        
        {/* Icono derecho */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;