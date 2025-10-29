import React, { useState } from 'react';
import { Route, ArrowRight, Eye, Download, ChevronRight, ChevronDown } from 'lucide-react';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';
import useDataStore from '../../store/dataStore';

const RoutesPage: React.FC = () => {
  const { warehouses, stores, trucks, routes } = useDataStore();
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  
  const toggleRouteExpansion = (routeId: string) => {
    if (expandedRoute === routeId) {
      setExpandedRoute(null);
    } else {
      setExpandedRoute(routeId);
    }
  };
  
  // Sort routes by warehouse name
  const sortedRoutes = [...routes].sort((a, b) => {
    const warehouseA = warehouses.find(w => w.id === a.warehouseId)?.name || '';
    const warehouseB = warehouses.find(w => w.id === b.warehouseId)?.name || '';
    return warehouseA.localeCompare(warehouseB);
  });
  
  // Function to export routes as CSV
  const exportRoutes = () => {
    const csvRows = [];
    
    // Add header row
    csvRows.push(['Warehouse', 'Truck', 'Stores', 'Distance (km)', 'Estimated Time (hours)'].join(','));
    
    // Add data rows
    sortedRoutes.forEach(route => {
      const warehouse = warehouses.find(w => w.id === route.warehouseId)?.name || 'Unknown';
      const truck = trucks.find(t => t.id === route.truckId)?.name || 'Unknown';
      const storeCount = route.stores.length;
      
      csvRows.push([
        warehouse,
        truck,
        storeCount,
        route.distance.toFixed(2),
        route.estimatedTime.toFixed(2)
      ].join(','));
    });
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'routes_summary.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Summaries</h1>
          <p className="mt-1 text-gray-600">Overview of all optimized routes</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={exportRoutes}
            leftIcon={<Download size={18} />}
          >
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Route List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">All Routes</h2>
        </div>
        
        {routes.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">No routes have been generated yet.</p>
            <Link to="/dashboard">
              <Button>Generate Routes</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedRoutes.map(route => {
              const warehouse = warehouses.find(w => w.id === route.warehouseId);
              const truck = trucks.find(t => t.id === route.truckId);
              const isExpanded = expandedRoute === route.id;
              
              return (
                <div key={route.id} className="p-0">
                  <div 
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRouteExpansion(route.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-500" />
                        )}
                        <Route size={20} className="text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {warehouse?.name || 'Unknown Warehouse'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Truck: {truck?.name || 'Unknown'} | Stores: {route.stores.length}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">{route.distance.toFixed(2)} km</p>
                        <p className="text-sm text-gray-500">{route.estimatedTime.toFixed(2)} hours</p>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-10 pb-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Stores on this route:</h4>
                        <div className="space-y-2">
                          {route.stores.map((storeId, index) => {
                            const store = stores.find(s => s.id === storeId);
                            if (!store) return null;
                            
                            return (
                              <div key={store.id} className="flex items-center text-sm">
                                <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-2">
                                  {index + 1}
                                </span>
                                <span className="font-medium">{store.name}</span>
                                <ArrowRight size={12} className="mx-2 text-gray-400" />
                                <span className="text-gray-600">Demand: {store.demand}</span>
                              </div>
                            );
                          })}
                          
                          {/* Return to warehouse */}
                          <div className="flex items-center text-sm mt-2 pt-2 border-t border-gray-200">
                            <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-2">
                              {route.stores.length + 1}
                            </span>
                            <span className="font-medium">Return to {warehouse?.name}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <Link to={`/map?route=${route.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Eye size={16} />}
                            >
                              View on Map
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutesPage;