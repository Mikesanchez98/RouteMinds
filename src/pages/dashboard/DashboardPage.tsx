import React from 'react';
import { Truck, Warehouse, Store, Route, BarChart4 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import MapView from '../../components/map/MapView';
import useDataStore from '../../store/dataStore';
import useAuthStore from '../../store/authStore';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { warehouses, stores, trucks, routes, generateRoutes } = useDataStore();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}</h1>
          <p className="mt-1 text-gray-600">Route Optimization Dashboard</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button
            onClick={generateRoutes}
            leftIcon={<Route size={18} />}
          >
            Generate Optimal Routes
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <Warehouse className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Warehouses</p>
              <p className="text-2xl font-bold text-gray-800">{warehouses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-full p-3">
              <Store className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Stores</p>
              <p className="text-2xl font-bold text-gray-800">{stores.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
              <Truck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Trucks</p>
              <p className="text-2xl font-bold text-gray-800">{trucks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
              <Route className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Routes</p>
              <p className="text-2xl font-bold text-gray-800">{routes.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map View */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Network Overview</h2>
        </div>
        <div className="h-[400px]">
          <MapView />
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/management"
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors flex items-center space-x-3"
            >
              <Warehouse className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Manage Warehouses & Stores</span>
            </Link>
            
            <Link
              to="/routes"
              className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg transition-colors flex items-center space-x-3"
            >
              <Route className="h-5 w-5 text-purple-600" />
              <span className="font-medium">View Route Summaries</span>
            </Link>
            
            <Link
              to="/time-analysis"
              className="bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors flex items-center space-x-3"
            >
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