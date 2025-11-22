import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Map as MapIcon } from 'lucide-react';
import MapView from '../../components/map/MapView';
import useDataStore from '../../store/dataStore';
import Spinner from '../../components/common/Spinner';

const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const routeIdFromUrl = searchParams.get('route');
  
  const { 
    warehouses, 
    stores, 
    routes, 
    fetchWarehouses, 
    fetchStores, 
    fetchTrucks, 
    fetchRoutesByDate,
    isLoading 
  } = useDataStore();

  // Filtros locales
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [showStores, setShowStores] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  
  // Ruta seleccionada
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(
    routeIdFromUrl || undefined
  );

  // Cargar datos al inicio
  useEffect(() => {
    const loadData = async () => {
      // Cargamos rutas de hoy por defecto si no hay fecha especificada
      await Promise.all([
        fetchWarehouses(),
        fetchStores(),
        fetchTrucks(),
        fetchRoutesByDate(new Date())
      ]);
    };
    loadData();
  }, []);

  // Sincronizar URL con estado local si cambia
  useEffect(() => {
    if (routeIdFromUrl) {
      setSelectedRouteId(routeIdFromUrl);
    }
  }, [routeIdFromUrl]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      
      {/* Header y Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <MapIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Mapa Completo</h1>
        </div>

        {/* Controles de Filtro */}
        <div className="flex items-center space-x-4 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
          <Filter size={16} className="text-gray-500 mr-2" />
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showWarehouses} 
              onChange={(e) => setShowWarehouses(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500" 
            />
            <span className="text-sm text-gray-700">Almacenes</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showStores} 
              onChange={(e) => setShowStores(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500" 
            />
            <span className="text-sm text-gray-700">Tiendas</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showRoutes} 
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500" 
            />
            <span className="text-sm text-gray-700">Rutas</span>
          </label>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden relative border border-gray-200">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <Spinner size={48} />
          </div>
        )}
        
        <div className="h-full w-full">
          <MapView 
            showWarehouses={showWarehouses}
            showStores={showStores}
            showRoutes={showRoutes}
            selectedRoute={selectedRouteId}
          />
        </div>
        
        {/* Selector rápido de rutas superpuesto (Opcional) */}
        {showRoutes && routes.length > 0 && (
          <div className="absolute top-4 right-4 z-[400] bg-white p-2 rounded-md shadow-lg border border-gray-200 max-w-xs">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase px-1">Seleccionar Ruta</p>
            <select 
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedRouteId || ''}
              onChange={(e) => setSelectedRouteId(e.target.value || undefined)}
            >
              <option value="">-- Ver todas (Puede ser lento) --</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  Ruta {r.id.substring(0, 6)} ({r.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;