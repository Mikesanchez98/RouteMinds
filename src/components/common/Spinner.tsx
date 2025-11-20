import React from 'react';
import { Loader2 } from 'lucide-react'; //Usamos un icono de 'lucide'

interface SpinnerProps {
    size?: number;
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 24, className = '' }) => {
    return (
        <Loader2
            className={`animate-spin ${className}`}
            size={size}
        />
    );
};

export default Spinner;