import React, { useEffect, useState } from 'react';
import { Route as RouteIcon, Calendar, Download } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import MapView from '../../components/map/MapView';
import RouteList from '../../components/dashboard/RouteList';
import useDataStore from '../../store/dataStore';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';

const RoutesPage: React.FC = () => {
  const { 
    routes, 
    warehouses, 
    stores, 
    trucks, 
    fetchRoutesByDate, 
    fetchWarehouses, 
    fetchStores, 
    fetchTrucks,
    isLoading 
  } = useDataStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  // ESTE ES EL ESTADO QUE CONTROLA QUÉ SE PINTA EN EL MAPA
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchWarehouses(),
        fetchStores(),
        fetchTrucks(),
        fetchRoutesByDate(selectedDate)
      ]);
    };
    loadData();
  }, []);

  // Manejar cambio de fecha
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      fetchRoutesByDate(date);
      setSelectedRouteId(undefined); // Limpiar selección al cambiar fecha
    }
  };

  // --- EXPORTACIÓN CSV ---
  const exportRoutes = () => {
    const csvRows = [];
    csvRows.push(['Warehouse', 'Truck', 'Driver', 'Status', 'Stops', 'Distance (km)', 'Est. Time (min)'].join(','));
    
    routes.forEach(route => {
      const warehouse = warehouses.find(w => w.id === route.warehouseId)?.name || 'Unknown';
      const truck = trucks.find(t => t.id === route.truckId);
      const truckName = truck?.name || 'Unknown';
      const driverName = truck?.driverName || 'Unassigned';
      const storeCount = route.stores?.length || 0;
      
      const safeWarehouse = `"${warehouse}"`;
      const safeTruck = `"${truckName}"`;
      const safeDriver = `"${driverName}"`;

      csvRows.push([
        safeWarehouse,
        safeTruck,
        safeDriver,
        route.status,
        storeCount,
        route.distance.toFixed(2),
        route.estimatedTime.toFixed(0)
      ].join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = selectedDate.toISOString().split('T')[0];
    link.setAttribute('download', `routes_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-purple-100 p-2 rounded-lg mr-3">
            <RouteIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Historial y Seguimiento</h1>
            <p className="text-sm text-gray-500">Control operativo de rutas diarias</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 shadow-sm">
            <Calendar size={18} className="text-gray-500 mr-2" />
            <DatePicker 
                selected={selectedDate} 
                onChange={handleDateChange} 
                className="outline-none text-sm text-gray-700 w-28 bg-transparent cursor-pointer"
                dateFormat="dd/MM/yyyy"
                maxDate={new Date()}
                placeholderText="Seleccionar fecha"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={exportRoutes}
            leftIcon={<Download size={16} />}
            disabled={routes.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* COLUMNA IZQUIERDA: LISTA DE RUTAS */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden flex flex-col h-full border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Rutas del Día</span>
            <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-600 font-medium">
              {routes.length} Total
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Spinner size={32} />
              </div>
            ) : (
              // --- AQUÍ CONECTAMOS LA LISTA CON EL ESTADO ---
              <RouteList 
                routes={routes} 
                onSelectRoute={(id) => setSelectedRouteId(id)} // Al hacer click, actualiza el estado
                selectedRouteId={selectedRouteId} // Pasa el estado para saber cuál resaltar
              />
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: MAPA */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden h-full relative border border-gray-200">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                <Spinner size={48} />
            </div>
          )}
          <div className="h-full w-full">
            {/* El mapa recibe el ID seleccionado y se encarga de pintarlo */}
            <MapView 
                showRoutes={true}
                showWarehouses={true}
                showStores={true}
                selectedRoute={selectedRouteId} 
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoutesPage;