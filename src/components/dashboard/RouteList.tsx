import React from 'react';
import { Play, CheckCircle, MapPin, Package } from 'lucide-react'; // <--- Icono Package añadido
import { Route } from '../../types';
import useDataStore from '../../store/dataStore';
import Button from '../common/Button';

interface RouteListProps {
  routes: Route[];
  onSelectRoute?: (id: string) => void;
  selectedRouteId?: string;
}

const RouteList: React.FC<RouteListProps> = ({ routes, onSelectRoute, selectedRouteId }) => {
  const { trucks, stores, updateRouteStatus } = useDataStore();

  // --- NUEVO: Calcular Carga ---
  const calculateLoad = (route: Route, truckCapacity: number) => {
    // Sumar la demanda de todas las tiendas en esta ruta
    const totalDemand = route.stores.reduce((sum, storeId) => {
      const store = stores.find(s => s.id === storeId);
      return sum + (store?.demand || 0);
    }, 0);

    const percentage = Math.min(100, Math.round((totalDemand / truckCapacity) * 100));
    
    // Color de la barra según llenado
    let colorClass = 'bg-blue-500';
    if (percentage > 90) colorClass = 'bg-red-500'; // Casi lleno (¡Bien!)
    else if (percentage < 50) colorClass = 'bg-yellow-500'; // Medio vacío (Ineficiente)
    else colorClass = 'bg-green-500'; // Óptimo

    return { totalDemand, percentage, colorClass };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Ruta';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {routes.length === 0 && (
        <p className="text-gray-500 text-center py-8">No hay rutas para mostrar.</p>
      )}

      {routes.map((route) => {
        const truck = trucks.find(t => t.id === route.truckId);
        const isSelected = selectedRouteId === route.id;
        
        // Calcular datos de carga
        const capacity = truck?.capacity || 100; // Evitar división por cero
        const { totalDemand, percentage, colorClass } = calculateLoad(route, capacity);

        return (
          <div 
            key={route.id} 
            onClick={() => onSelectRoute && onSelectRoute(route.id)}
            className={`
              border rounded-lg p-4 shadow-sm transition-all cursor-pointer
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }
            `}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700">
                    {truck?.name || 'Camión Desconocido'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(route.status)}`}>
                    {getStatusLabel(route.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {route.distance.toFixed(1)} km • ~{Math.round(route.estimatedTime)} min
                </p>
              </div>
            </div>

            {/* --- NUEVA SECCIÓN: BARRA DE CARGA --- */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1 text-gray-600">
                <div className="flex items-center">
                    <Package size={12} className="mr-1" />
                    <span>Carga</span>
                </div>
                <span>{totalDemand} / {capacity} kg ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${colorClass}`} 
                  style={{ width: `${percentage}%` }} 
                ></div>
              </div>
            </div>
            {/* ------------------------------------- */}

            {/* Paradas */}
            <div className="mb-4">
               <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-1 text-gray-400" />
                  <span>{route.stores?.length || 0} paradas asignadas</span>
               </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
              {route.status === 'pending' && (
                <Button 
                  size="sm"
                  variant="primary"
                  leftIcon={<Play size={14} />}
                  onClick={(e) => {
                    e.stopPropagation(); 
                    updateRouteStatus(route.id, 'in_progress');
                  }}
                >
                  Iniciar Ruta
                </Button>
              )}

              {route.status === 'in_progress' && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  leftIcon={<CheckCircle size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateRouteStatus(route.id, 'completed');
                  }}
                >
                  Finalizar
                </Button>
              )}

              {route.status === 'completed' && (
                <span className="text-xs font-medium text-green-600 flex items-center">
                  <CheckCircle size={14} className="mr-1" /> Completada
                </span>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default RouteList;