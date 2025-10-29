import React, { useState } from 'react';
import { Warehouse, Store, Truck, Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import WarehouseForm from '../../components/management/WarehouseForm';
import StoreForm from '../../components/management/StoreForm';
import TruckForm from '../../components/management/TruckForm';
import useDataStore from '../../store/dataStore';

type FormType = 'warehouse' | 'store' | 'truck' | null;
type Tab = 'warehouses' | 'stores' | 'trucks';

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('warehouses');
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [editItem, setEditItem] = useState<any>(null);
  
  const { warehouses, stores, trucks, deleteWarehouse, deleteStore, deleteTruck } = useDataStore();
  
  const handleAdd = (type: FormType) => {
    setActiveForm(type);
    setEditItem(null);
  };
  
  const handleEdit = (type: FormType, item: any) => {
    setActiveForm(type);
    setEditItem(item);
  };
  
  const handleDelete = (type: Tab, id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      if (type === 'warehouses') {
        deleteWarehouse(id);
      } else if (type === 'stores') {
        deleteStore(id);
      } else if (type === 'trucks') {
        deleteTruck(id);
      }
    }
  };
  
  const closeForm = () => {
    setActiveForm(null);
    setEditItem(null);
  };
  
  const renderForm = () => {
    if (!activeForm) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {editItem ? `Edit ${activeForm}` : `Add New ${activeForm}`}
            </h2>
          </div>
          <div className="p-6">
            {activeForm === 'warehouse' && (
              <WarehouseForm
                warehouse={editItem}
                onComplete={closeForm}
              />
            )}
            {activeForm === 'store' && (
              <StoreForm
                store={editItem}
                onComplete={closeForm}
              />
            )}
            {activeForm === 'truck' && (
              <TruckForm
                truck={editItem}
                onComplete={closeForm}
              />
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
          <p className="mt-1 text-gray-600">Manage warehouses, stores, and trucks</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => handleAdd(activeTab === 'warehouses' ? 'warehouse' : activeTab === 'stores' ? 'store' : 'truck')}
            leftIcon={<Plus size={18} />}
          >
            Add {activeTab === 'warehouses' ? 'Warehouse' : activeTab === 'stores' ? 'Store' : 'Truck'}
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'warehouses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <div className="flex items-center space-x-2">
              <Warehouse size={20} />
              <span>Warehouses</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('stores')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'stores'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <div className="flex items-center space-x-2">
              <Store size={20} />
              <span>Stores</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('trucks')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'trucks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <div className="flex items-center space-x-2">
              <Truck size={20} />
              <span>Trucks</span>
            </div>
          </button>
        </nav>
      </div>
      
      {/* Content */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {activeTab === 'warehouses' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No warehouses found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  warehouses.map((warehouse) => (
                    <tr key={warehouse.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {warehouse.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {warehouse.location.lat.toFixed(4)}, {warehouse.location.lng.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {warehouse.capacity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {warehouse.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEdit('warehouse', warehouse)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete('warehouses', warehouse.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'stores' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No stores found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {store.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {store.location.lat.toFixed(4)}, {store.location.lng.toFixed(4)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEdit('store', store)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete('stores', store.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'trucks' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speed (km/h)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trucks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No trucks found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  trucks.map((truck) => {
                    const warehouse = warehouses.find(w => w.id === truck.warehouseId);
                    
                    return (
                      <tr key={truck.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {truck.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {truck.capacity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {truck.speed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {warehouse ? warehouse.name : 'Unknown warehouse'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleEdit('truck', truck)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete('trucks', truck.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {renderForm()}
    </div>
  );
};

export default ManagementPage;