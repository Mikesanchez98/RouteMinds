import React, { useState } from 'react';
import { Map, Filter } from 'lucide-react';
import Button from '../../components/common/Button';
import MapView from '../../components/map/MapView';
import useDataStore from '../../store/dataStore';

const MapPage: React.FC = () => {
  const { warehouses, stores, routes } = useDataStore();
  const [selectedRoute, setSelectedRoute] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Map Visualization</h1>
          <p className="mt-1 text-gray-600">View your network and routes</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter size={18} />}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-3">Filter Routes</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Route
            </label>
            <select
              value={selectedRoute || ''}
              onChange={(e) => setSelectedRoute(e.target.value || undefined)}
              className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Routes</option>
              {routes.map((route) => {
                // Find warehouse name
                const warehouse = warehouses.find(w => w.id === route.warehouseId);
                
                return (
                  <option key={route.id} value={route.id}>
                    {warehouse?.name || 'Unknown'} - {route.stores.length} stores ({route.distance.toFixed(1)} km)
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Warehouses: {warehouses.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Stores: {stores.length}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <Map size={20} className="text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Network Map</h2>
        </div>
        <div className="h-[600px]">
          <MapView showRoutes={true} selectedRoute={selectedRoute} />
        </div>
      </div>
      
      {/* Route Information */}
      {selectedRoute && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Route Details</h3>
          {routes.filter(r => r.id === selectedRoute).map(route => {
            const warehouse = warehouses.find(w => w.id === route.warehouseId);
            const routeStores = route.stores.map(id => stores.find(s => s.id === id)).filter(Boolean);
            
            return (
              <div key={route.id}>
                <p className="mb-2">
                  <span className="font-medium">Warehouse:</span> {warehouse?.name || 'Unknown'}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Total Distance:</span> {route.distance.toFixed(2)} km
                </p>
                <p className="mb-2">
                  <span className="font-medium">Estimated Time:</span> {route.estimatedTime.toFixed(2)} hours
                </p>
                <p className="mb-2">
                  <span className="font-medium">Stores Visited:</span> {routeStores.length}
                </p>
                
                {routeStores.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Store Sequence:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {routeStores.map((store, index) => (
                        <li key={store?.id} className="text-sm text-gray-700">
                          {store?.name} (Demand: {store?.demand})
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MapPage;