import React, { useState } from 'react';
import { ClipboardList, Download, FileText, Truck, Route, Warehouse, Store, Filter } from 'lucide-react';
import Button from '../../components/common/Button';
import useDataStore from '../../store/dataStore';

const ReportsPage: React.FC = () => {
  const { warehouses, stores, trucks, routes } = useDataStore();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  
  // Filter reports based on selected warehouse
  const filteredRoutes = selectedWarehouse === 'all'
    ? routes
    : routes.filter(route => route.warehouseId === selectedWarehouse);
  
  // Group stores by warehouse (based on routes)
  const warehouseStores: Record<string, string[]> = {};
  
  routes.forEach(route => {
    if (!warehouseStores[route.warehouseId]) {
      warehouseStores[route.warehouseId] = [];
    }
    
    route.stores.forEach(storeId => {
      if (!warehouseStores[route.warehouseId].includes(storeId)) {
        warehouseStores[route.warehouseId].push(storeId);
      }
    });
  });
  
  // Calculate summary statistics
  const summaryStats = {
    totalWarehouses: warehouses.length,
    totalStores: stores.length,
    totalTrucks: trucks.length,
    totalRoutes: filteredRoutes.length,
    totalDistance: filteredRoutes.reduce((sum, route) => sum + route.distance, 0),
    totalTime: filteredRoutes.reduce((sum, route) => sum + route.estimatedTime, 0),
  };
  
  // Generate and download warehouse report
  const downloadWarehouseReport = () => {
    let reportContent = '# Warehouse to Store Report\n\n';
    reportContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    if (selectedWarehouse !== 'all') {
      const warehouse = warehouses.find(w => w.id === selectedWarehouse);
      if (warehouse) {
        reportContent += `## Warehouse: ${warehouse.name}\n\n`;
        reportContent += `Address: ${warehouse.address}\n`;
        reportContent += `Capacity: ${warehouse.capacity}\n`;
        reportContent += `Coordinates: ${warehouse.location.lat.toFixed(6)}, ${warehouse.location.lng.toFixed(6)}\n\n`;
        
        const warehouseTrucks = trucks.filter(t => t.warehouseId === warehouse.id);
        reportContent += `### Trucks (${warehouseTrucks.length})\n\n`;
        
        if (warehouseTrucks.length > 0) {
          reportContent += '| Name | Capacity | Speed |\n';
          reportContent += '|------|----------|-------|\n';
          
          warehouseTrucks.forEach(truck => {
            reportContent += `| ${truck.name} | ${truck.capacity} | ${truck.speed} km/h |\n`;
          });
          
          reportContent += '\n';
        } else {
          reportContent += 'No trucks assigned to this warehouse.\n\n';
        }
        
        const warehouseStoreIds = warehouseStores[warehouse.id] || [];
        const warehouseStoreDetails = stores.filter(s => warehouseStoreIds.includes(s.id));
        
        reportContent += `### Stores (${warehouseStoreDetails.length})\n\n`;
        
        if (warehouseStoreDetails.length > 0) {
          reportContent += '| Name | Address | Demand | Business Hours |\n';
          reportContent += '|------|---------|--------|----------------|\n';
          
          warehouseStoreDetails.forEach(store => {
            const hours = store.timeWindow 
              ? `${store.timeWindow.start} - ${store.timeWindow.end}`
              : 'Not specified';
            
            reportContent += `| ${store.name} | ${store.address} | ${store.demand} | ${hours} |\n`;
          });
          
          reportContent += '\n';
        } else {
          reportContent += 'No stores assigned to this warehouse.\n\n';
        }
        
        const warehouseRoutes = routes.filter(r => r.warehouseId === warehouse.id);
        
        reportContent += `### Routes (${warehouseRoutes.length})\n\n`;
        
        warehouseRoutes.forEach((route, index) => {
          const truck = trucks.find(t => t.id === route.truckId);
          const routeStores = stores.filter(s => route.stores.includes(s.id));
          
          reportContent += `#### Route ${index + 1}\n\n`;
          reportContent += `- Truck: ${truck?.name || 'Unknown'}\n`;
          reportContent += `- Distance: ${route.distance.toFixed(2)} km\n`;
          reportContent += `- Estimated Time: ${route.estimatedTime.toFixed(2)} hours\n`;
          reportContent += `- Stores Visited: ${routeStores.length}\n\n`;
          
          reportContent += 'Store sequence:\n\n';
          routeStores.forEach((store, storeIndex) => {
            reportContent += `${storeIndex + 1}. ${store.name} (Demand: ${store.demand})\n`;
          });
          
          reportContent += '\n';
        });
      }
    } else {
      // Report for all warehouses
      reportContent += `## Overview\n\n`;
      reportContent += `- Total Warehouses: ${warehouses.length}\n`;
      reportContent += `- Total Stores: ${stores.length}\n`;
      reportContent += `- Total Trucks: ${trucks.length}\n`;
      reportContent += `- Total Routes: ${routes.length}\n`;
      reportContent += `- Total Distance: ${summaryStats.totalDistance.toFixed(2)} km\n`;
      reportContent += `- Total Time: ${summaryStats.totalTime.toFixed(2)} hours\n\n`;
      
      // Report for each warehouse
      warehouses.forEach(warehouse => {
        reportContent += `## Warehouse: ${warehouse.name}\n\n`;
        reportContent += `Address: ${warehouse.address}\n`;
        reportContent += `Capacity: ${warehouse.capacity}\n\n`;
        
        const warehouseStoreIds = warehouseStores[warehouse.id] || [];
        reportContent += `Assigned Stores: ${warehouseStoreIds.length}\n\n`;
        
        if (warehouseStoreIds.length > 0) {
          reportContent += '| Store Name | Demand |\n';
          reportContent += '|------------|--------|\n';
          
          warehouseStoreIds.forEach(storeId => {
            const store = stores.find(s => s.id === storeId);
            if (store) {
              reportContent += `| ${store.name} | ${store.demand} |\n`;
            }
          });
          
          reportContent += '\n';
        }
        
        reportContent += '\n';
      });
    }
    
    // Create download link
    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse_report_${selectedWarehouse === 'all' ? 'all' : selectedWarehouse}.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-gray-600">Generate and view system reports</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button
            onClick={downloadWarehouseReport}
            leftIcon={<Download size={18} />}
          >
            Download Report
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <Filter size={20} className="text-gray-500" />
          <span className="font-medium">Filter Report:</span>
          
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="ml-4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            {selectedWarehouse === 'all' ? 'Overall Summary' : `${warehouses.find(w => w.id === selectedWarehouse)?.name} Summary`}
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Warehouse size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warehouses</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedWarehouse === 'all' ? summaryStats.totalWarehouses : 1}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Store size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stores</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedWarehouse === 'all' 
                      ? summaryStats.totalStores 
                      : (warehouseStores[selectedWarehouse]?.length || 0)
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Truck size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trucks</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedWarehouse === 'all' 
                      ? summaryStats.totalTrucks 
                      : trucks.filter(t => t.warehouseId === selectedWarehouse).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Route size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Routes</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summaryStats.totalRoutes}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <FileText size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summaryStats.totalDistance.toFixed(2)} km
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <ClipboardList size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Time</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summaryStats.totalTime.toFixed(2)} hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Warehouse-Store Assignments */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Warehouse-Store Assignments</h2>
        </div>
        
        <div className="p-6">
          {(selectedWarehouse === 'all' ? warehouses : warehouses.filter(w => w.id === selectedWarehouse)).map(warehouse => {
            const storeIds = warehouseStores[warehouse.id] || [];
            const assignedStores = stores.filter(store => storeIds.includes(store.id));
            
            return (
              <div key={warehouse.id} className="mb-8 last:mb-0">
                <h3 className="text-lg font-medium text-gray-800 mb-4">{warehouse.name}</h3>
                
                {assignedStores.length === 0 ? (
                  <p className="text-gray-500">No stores assigned to this warehouse.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Hours</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assignedStores.map(store => (
                          <tr key={store.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {store.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {store.address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {store.demand}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {store.timeWindow 
                                ? `${store.timeWindow.start} - ${store.timeWindow.end}`
                                : 'Not specified'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;