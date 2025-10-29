import React from 'react';
import { Clock, BarChart4, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useDataStore from '../../store/dataStore';

const TimeAnalysisPage: React.FC = () => {
  const { warehouses, stores, trucks, routes } = useDataStore();
  
  // Prepare data for warehouse distribution chart
  const warehouseData = warehouses.map(warehouse => {
    const warehouseRoutes = routes.filter(r => r.warehouseId === warehouse.id);
    const totalTime = warehouseRoutes.reduce((sum, route) => sum + route.estimatedTime, 0);
    const totalDistance = warehouseRoutes.reduce((sum, route) => sum + route.distance, 0);
    const storeCount = new Set(warehouseRoutes.flatMap(r => r.stores)).size;
    
    return {
      name: warehouse.name,
      time: parseFloat(totalTime.toFixed(2)),
      distance: parseFloat(totalDistance.toFixed(2)),
      stores: storeCount,
    };
  });
  
  // Prepare data for truck utilization chart
  const truckData = trucks.map(truck => {
    const truckRoutes = routes.filter(r => r.truckId === truck.id);
    const totalTime = truckRoutes.reduce((sum, route) => sum + route.estimatedTime, 0);
    const totalDistance = truckRoutes.reduce((sum, route) => sum + route.distance, 0);
    const storeCount = new Set(truckRoutes.flatMap(r => r.stores)).size;
    const warehouse = warehouses.find(w => w.id === truck.warehouseId);
    
    return {
      name: truck.name,
      warehouse: warehouse?.name || 'Unknown',
      time: parseFloat(totalTime.toFixed(2)),
      distance: parseFloat(totalDistance.toFixed(2)),
      stores: storeCount,
    };
  });
  
  // Prepare data for pie chart (stores per warehouse)
  const storeDistributionData = warehouses.map(warehouse => {
    const warehouseRoutes = routes.filter(r => r.warehouseId === warehouse.id);
    const storeCount = new Set(warehouseRoutes.flatMap(r => r.stores)).size;
    
    return {
      name: warehouse.name,
      value: storeCount,
    };
  });
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  // Calculate overall statistics
  const totalRoutes = routes.length;
  const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0);
  const totalTime = routes.reduce((sum, route) => sum + route.estimatedTime, 0);
  const averageTimePerRoute = totalRoutes > 0 ? totalTime / totalRoutes : 0;
  const averageStoresPerRoute = totalRoutes > 0 
    ? routes.reduce((sum, route) => sum + route.stores.length, 0) / totalRoutes 
    : 0;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Analysis</h1>
        <p className="mt-1 text-gray-600">Analyze route timing and performance</p>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <BarChart4 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Total Routes</p>
              <p className="text-2xl font-bold text-gray-800">{totalRoutes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Total Time</p>
              <p className="text-2xl font-bold text-gray-800">{totalTime.toFixed(2)} h</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-full p-3">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Total Distance</p>
              <p className="text-2xl font-bold text-gray-800">{totalDistance.toFixed(2)} km</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5">
              <p className="text-gray-500 text-sm font-medium">Avg. Time/Route</p>
              <p className="text-2xl font-bold text-gray-800">{averageTimePerRoute.toFixed(2)} h</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Warehouse Distribution Chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Warehouse Time Distribution</h2>
        </div>
        <div className="p-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={warehouseData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="time" name="Time (hours)" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="distance" name="Distance (km)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Truck Utilization Chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Truck Utilization</h2>
        </div>
        <div className="p-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={truckData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="time" name="Time (hours)" fill="#0088FE" />
              <Bar dataKey="stores" name="Stores Visited" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Store Distribution Pie Chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Store Distribution by Warehouse</h2>
        </div>
        <div className="p-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={storeDistributionData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {storeDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Key Insights</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Route Efficiency</h3>
              <p className="text-gray-700">
                On average, each route visits {averageStoresPerRoute.toFixed(1)} stores and takes {averageTimePerRoute.toFixed(2)} hours to complete.
              </p>
            </div>
            
            {warehouseData.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900">Warehouse Comparison</h3>
                <p className="text-gray-700">
                  {warehouseData.sort((a, b) => b.time - a.time)[0].name} has the highest total delivery time at {warehouseData.sort((a, b) => b.time - a.time)[0].time} hours.
                </p>
              </div>
            )}
            
            {truckData.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900">Truck Utilization</h3>
                <p className="text-gray-700">
                  {truckData.sort((a, b) => b.stores - a.stores)[0].name} is serving the most stores ({truckData.sort((a, b) => b.stores - a.stores)[0].stores}) among all trucks.
                </p>
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-gray-900">Time Optimization Opportunities</h3>
              <p className="text-gray-700">
                Adjusting truck assignments or optimizing store groupings could potentially reduce total delivery time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeAnalysisPage;