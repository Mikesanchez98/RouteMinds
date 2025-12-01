import React, { useEffect, useState } from 'react';
import { Route as RouteIcon, Calendar, Download } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx'; // Importar librería XLSX

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
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);
  
  // Estado local para el spinner de "Cargando ruta..." en el mapa
  const [isSelectingRoute, setIsSelectingRoute] = useState(false);

  // Cargar datos iniciales al entrar a la página
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
      setSelectedRouteId(undefined); // Limpiar selección al cambiar de día
    }
  };

  // Manejar selección de ruta (Click en la tarjeta)
  const handleRouteSelect = (id: string) => {
    if (selectedRouteId === id) return; // Si es la misma, no hacer nada

    setIsSelectingRoute(true); // 1. Activar spinner
    setSelectedRouteId(id);    // 2. Cambiar ruta (esto dispara el useEffect de abajo)
  };

  // Efecto para apagar el spinner DESPUÉS de que la ruta ha cambiado
  useEffect(() => {
    if (isSelectingRoute) {
      // Mantenemos el spinner por 1 segundo para dar tiempo al mapa de Leaflet a procesar
      // y evitar que se vea el cambio brusco o vacío.
      const timer = setTimeout(() => {
        setIsSelectingRoute(false);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [selectedRouteId]); 


  // --- EXPORTACIÓN EXCEL (XLSX) ---
  const exportRoutesToExcel = () => {
    // 1. Preparar los datos
    const excelData = routes.map(route => {
      const warehouse = warehouses.find(w => w.id === route.warehouseId)?.name || 'Unknown';
      const truck = trucks.find(t => t.id === route.truckId);
      const truckName = truck?.name || 'Unknown';
      const driverName = truck?.driverName || 'Unassigned';
      
      // Obtener nombres de tiendas y formatear la secuencia
      const storesList = route.stores.map((storeId, index) => {
        const store = stores.find(s => s.id === storeId);
        return `${index + 1}. ${store?.name || 'Unknown'}`;
      }).join('\n'); // Salto de línea para lista en celda

      return {
        'ID Ruta': route.id.substring(0, 8),
        'Fecha': new Date(route.created).toLocaleDateString(),
        'Almacén Origen': warehouse,
        'Unidad': truckName,
        'Conductor': driverName,
        'Estatus': route.status === 'completed' ? 'Completada' : 
                   route.status === 'in_progress' ? 'En Ruta' : 'Pendiente',
        'Paradas Total': route.stores.length,
        'Secuencia de Tiendas': storesList, // Lista de tiendas
        'Distancia (km)': route.distance.toFixed(2),
        'Tiempo Est. (min)': (route.estimatedTime * 60).toFixed(0),
        'Inicio Real': route.actualStartTime ? new Date(route.actualStartTime).toLocaleTimeString() : '-',
        'Fin Real': route.actualEndTime ? new Date(route.actualEndTime).toLocaleTimeString() : '-'
      };
    });

    // 2. Crear Libro y Hoja
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rutas");

    // 3. Ajustar ancho de columnas (Opcional pero recomendado)
    const columnWidths = [
        { wch: 10 }, // ID
        { wch: 12 }, // Fecha
        { wch: 20 }, // Almacén
        { wch: 15 }, // Unidad
        { wch: 20 }, // Conductor
        { wch: 12 }, // Estatus
        { wch: 8 },  // Paradas
        { wch: 40 }, // Secuencia (Ancha)
        { wch: 10 }, // Distancia
        { wch: 10 }, // Tiempo
        { wch: 12 }, // Inicio
        { wch: 12 }  // Fin
    ];
    worksheet['!cols'] = columnWidths;

    // 4. Descargar archivo
    const dateStr = selectedDate.toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Reporte_Rutas_${dateStr}.xlsx`);
  };

  // ----------------------------------

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
          {/* Selector de Fecha */}
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

          {/* Botón Exportar Excel */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportRoutesToExcel} // Usamos la nueva función
            leftIcon={<Download size={16} />}
            disabled={routes.length === 0}
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100" // Estilo Excel
          >
            Exportar Excel
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
              <RouteList 
                routes={routes} 
                onSelectRoute={handleRouteSelect} 
                selectedRouteId={selectedRouteId} 
              />
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: MAPA */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden h-full relative border border-gray-200">
          
          {/* Spinner Global (Carga inicial) */}
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                <Spinner size={48} />
            </div>
          )}

          {/* Spinner Local (Selección de Ruta) - Este es el que dura 1 seg */}
          {isSelectingRoute && (
            <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center backdrop-blur-sm transition-opacity duration-300">
                <div className="bg-white p-4 rounded-full shadow-lg flex flex-col items-center border border-gray-100">
                  <Spinner size={32} className="text-purple-600" />
                  <span className="text-xs text-gray-500 mt-2 font-medium">Cargando ruta...</span>
                </div>
            </div>
          )}

          <div className="h-full w-full">
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