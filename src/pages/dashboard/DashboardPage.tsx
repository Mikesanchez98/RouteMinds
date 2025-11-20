// src/pages/dashboard/DashboardPage.tsx
import React from 'react';
import { Truck, Warehouse, Store, Route, BarChart4, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import MapView from '../../components/map/MapView';
import useDataStore from '../../store/dataStore';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/common/Spinner';

// IMPORTANTE: El DatePicker
import DatePicker from "react-datepicker";

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { warehouses, stores, trucks, routes, generateRoutes, fetchRoutesByDate, isLoading } = useDataStore();

  // ESTADOS PARA LOS FILTROS
  const [showWarehouses, setShowWarehouses] = React.useState(true);
  const [showStores, setShowStores] = React.useState(true);
  const [showRoutes, setShowRoutes] = React.useState(true);

  // ESTADO PARA LA FECHA
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      fetchRoutesByDate(date);
    }
  };
  
  return (
    <div className="space-y-6 relative min-h-[500px]">

      {/* --- SPINNER --- */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg transition-all">
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <Spinner size={48} className="text-indigo-600"/>
            <p className="mt-4 text-lg font-semibold text-gray-700 animate-pulse">Procesando...</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}</h1>
          <p className="mt-1 text-gray-600">Route Optimization Dashboard</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* CALENDARIO */}
          <div className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm hover:border-indigo-500 transition-colors">
            <Calendar size={18} className="text-gray-500 mr-2" />
            <DatePicker 
                selected={selectedDate} 
                onChange={handleDateChange} 
                className="outline-none text-sm text-gray-700 w-28 cursor-pointer bg-transparent"
                dateFormat="dd/MM/yyyy"
                maxDate={new Date()}
                placeholderText="Seleccionar fecha"
            />
          </div>
          
          <Button onClick={generateRoutes} leftIcon={<Route size={18} />}>
            Generate Optimal Routes
          </Button>
        </div>
      </div>
      
      {/* TARJETAS DE ESTADÍSTICAS (Resumido para ahorrar espacio, pero usa las tuyas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 flex items-center">
             <div className="bg-blue-100 p-3 rounded-full"><Warehouse className="h-6 w-6 text-blue-600"/></div>
             <div className="ml-5"><p className="text-gray-500 text-sm">Warehouses</p><p className="text-2xl font-bold">{warehouses.length}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center">
             <div className="bg-orange-100 p-3 rounded-full"><Store className="h-6 w-6 text-orange-600"/></div>
             <div className="ml-5"><p className="text-gray-500 text-sm">Stores</p><p className="text-2xl font-bold">{stores.length}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center">
             <div className="bg-green-100 p-3 rounded-full"><Truck className="h-6 w-6 text-green-600"/></div>
             <div className="ml-5"><p className="text-gray-500 text-sm">Trucks</p><p className="text-2xl font-bold">{trucks.length}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center">
             <div className="bg-purple-100 p-3 rounded-full"><Route className="h-6 w-6 text-purple-600"/></div>
             <div className="ml-5"><p className="text-gray-500 text-sm">Routes</p><p className="text-2xl font-bold">{routes.length}</p></div>
        </div>
      </div>
      
      {/* MAPA Y FILTROS */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-medium text-gray-800">Network Overview</h2>
          
          {/* CHECKBOXES DE FILTROS */}
          <div className="flex space-x-4 text-sm bg-gray-50 px-3 py-1 rounded-md">
            <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
              <input type="checkbox" checked={showWarehouses} onChange={(e) => setShowWarehouses(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-700 font-medium">Almacenes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
              <input type="checkbox" checked={showStores} onChange={(e) => setShowStores(e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500" />
              <span className="text-gray-700 font-medium">Tiendas</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
              <input type="checkbox" checked={showRoutes} onChange={(e) => setShowRoutes(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
              <span className="text-gray-700 font-medium">Rutas</span>
            </label>
          </div>
        </div>
        
        <div className="h-[400px]">
          {/* Pasamos los estados al componente MapView */}
          <MapView 
            showWarehouses={showWarehouses}
            showStores={showStores}
            showRoutes={showRoutes}
          />
        </div>
      </div>
      
      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/management" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors flex items-center space-x-3">
              <Warehouse className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Manage Warehouses & Stores</span>
            </Link>
            <Link to="/routes" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg transition-colors flex items-center space-x-3">
              <Route className="h-5 w-5 text-purple-600" />
              <span className="font-medium">View Route Summaries</span>
            </Link>
            <Link to="/time-analysis" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors flex items-center space-x-3">
              <BarChart4 className="h-5 w-5 text-green-600" />
              <span className="font-medium">Time Analysis</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;