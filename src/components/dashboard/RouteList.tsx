import React from 'react';
import { Play, CheckCircle, Clock, AlertCircle, MapPin } from 'lucide-react';
import { Route, Store, Truck } from '../../types';
import useDataStore from '../../store/dataStore';
import Button from '../common/Button';

interface RouteListProps {
  routes: Route[];
}

const RouteList: React.FC<RouteListProps> = ({ routes }) => {
  const { trucks, updateRouteStatus } = useDataStore();

  // Función auxiliar para obtener color según estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Función auxiliar para obtener etiqueta
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
      <h3 className="text-lg font-medium text-gray-900 sticky top-0 bg-white py-2">
        Rutas de Hoy ({routes.length})
      </h3>
      
      {routes.length === 0 && (
        <p className="text-gray-500 text-center py-8">No hay rutas generadas aún.</p>
      )}

      {routes.map((route) => {
        const truck = trucks.find(t => t.id === route.truckId);
        
        return (
          <div key={route.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            
            {/* Encabezado de la Tarjeta */}
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

            {/* Lista de Paradas (Resumida) */}
            <div className="mb-4">
               <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-1 text-gray-400" />
                  <span>{route.stores.length} paradas asignadas</span>
               </div>
            </div>

            {/* BOTONES DE ACCIÓN (El control de flujo) */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              
              {/* Estado: PENDIENTE -> EN PROGRESO */}
              {route.status === 'pending' && (
                <Button 
                  size="sm"
                  variant="primary" // Azul
                  leftIcon={<Play size={14} />}
                  onClick={() => updateRouteStatus(route.id, 'in_progress')}
                >
                  Iniciar Ruta
                </Button>
              )}

              {/* Estado: EN PROGRESO -> COMPLETADA */}
              {route.status === 'in_progress' && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  leftIcon={<CheckCircle size={14} />}
                  onClick={() => updateRouteStatus(route.id, 'completed')}
                >
                  Finalizar
                </Button>
              )}

              {/* Estado: COMPLETADA (Solo info) */}
              {route.status === 'completed' && (
                <span className="text-xs font-medium text-green-600 flex items-center">
                  <CheckCircle size={14} className="mr-1" /> Completada a las {route.actualEndTime ? new Date(route.actualEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
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