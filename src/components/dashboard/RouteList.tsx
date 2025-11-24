import React from 'react';
import { Play, CheckCircle, MapPin, Package, Trash2 } from 'lucide-react'; // <--- Icono Trash2
import { Route } from '../../types';
import useDataStore from '../../store/dataStore';
import Button from '../common/Button';
import toast from 'react-hot-toast';

interface RouteListProps {
  routes: Route[];
  onSelectRoute?: (id: string) => void;
  selectedRouteId?: string;
}

const RouteList: React.FC<RouteListProps> = ({ routes, onSelectRoute, selectedRouteId }) => {
  // TRAEMOS deleteRoute
  const { trucks, stores, updateRouteStatus, deleteRoute } = useDataStore();

  const calculateLoad = (route: Route, truckCapacity: number) => {
    const totalDemand = route.stores.reduce((sum, storeId) => {
      const store = stores.find(s => s.id === storeId);
      return sum + (store?.demand || 0);
    }, 0);
    const percentage = Math.min(100, Math.round((totalDemand / truckCapacity) * 100));
    let colorClass = 'bg-blue-500';
    if (percentage > 90) colorClass = 'bg-red-500';
    else if (percentage < 50) colorClass = 'bg-yellow-500';
    else colorClass = 'bg-green-500';
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

  // --- NUEVO HANDLER PARA BORRAR ---
  const handleDelete = async (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation(); // Evitar seleccionar la ruta al borrar
    if (window.confirm("¿Eliminar esta ruta?")) {
        await deleteRoute(routeId);
        toast.success("Ruta eliminada");
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
        const capacity = truck?.capacity || 100;
        const { totalDemand, percentage, colorClass } = calculateLoad(route, capacity);

        return (
          <div 
            key={route.id} 
            onClick={() => onSelectRoute && onSelectRoute(route.id)}
            className={`
              border rounded-lg p-4 shadow-sm transition-all cursor-pointer relative group
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }
            `}
          >
            {/* --- BOTÓN DE ELIMINAR (Visible solo en hover) --- */}
            <button 
                onClick={(e) => handleDelete(e, route.id)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar Ruta"
            >
                <Trash2 size={16} />
            </button>
            {/* ------------------------------------------------ */}

            {/* Header */}
            <div className="flex justify-between items-start mb-3 pr-6"> {/* pr-6 para dejar espacio a la basura */}
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

            {/* Barra de Carga */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1 text-gray-600">
                <div className="flex items-center">
                    <Package size={12} className="mr-1" />
                    <span>Carga</span>
                </div>
                <span>{totalDemand} / {capacity} kg ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
              </div>
            </div>

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
                  Iniciar
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