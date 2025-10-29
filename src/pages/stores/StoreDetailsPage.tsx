import React, { useState } from 'react';
import { Store as StoreIcon, MapPin, Clock, ShoppingCart, Eye, Edit, Search } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import StoreForm from '../../components/management/StoreForm';
import { Link } from 'react-router-dom';
import useDataStore from '../../store/dataStore';
import { Store } from '../../types';

const StoreDetailsPage: React.FC = () => {
  const { stores, warehouses, routes } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  
  // Filter stores based on search term
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const closeEditForm = () => {
    setEditingStore(null);
  };
  
  // Find which warehouse serves each store
  const getServingWarehouse = (storeId: string) => {
    for (const route of routes) {
      if (route.stores.includes(storeId)) {
        return warehouses.find(w => w.id === route.warehouseId);
      }
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Details</h1>
          <p className="mt-1 text-gray-600">View and manage store information</p>
        </div>
        
        <div className="mt-4 md:mt-0 w-full md:w-64">
          <Input
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
            fullWidth
          />
        </div>
      </div>
      
      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <StoreIcon size={48} className="mx-auto text-gray-400" />
            <p className="mt-4 text-gray-500">
              {searchTerm ? 'No stores match your search criteria' : 'No stores found. Add some stores to get started.'}
            </p>
            {searchTerm && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          filteredStores.map(store => {
            const servingWarehouse = getServingWarehouse(store.id);
            
            return (
              <div key={store.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
                  <h3 className="font-medium text-lg text-gray-900">{store.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingStore(store)}
                      className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
                      title="Edit store"
                    >
                      <Edit size={18} />
                    </button>
                    <Link
                      to={`/map?highlight=${store.id}`}
                      className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100"
                      title="View on map"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-start">
                    <MapPin size={18} className="mt-0.5 mr-2 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-sm text-gray-600">{store.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coords: {store.location.lat.toFixed(6)}, {store.location.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <ShoppingCart size={18} className="mt-0.5 mr-2 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Demand</p>
                      <p className="text-sm text-gray-600">{store.demand} units</p>
                    </div>
                  </div>
                  
                  {store.timeWindow && (
                    <div className="flex items-start">
                      <Clock size={18} className="mt-0.5 mr-2 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Business Hours</p>
                        <p className="text-sm text-gray-600">
                          {store.timeWindow.start} - {store.timeWindow.end}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {servingWarehouse && (
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700">Served by</p>
                      <p className="text-sm text-blue-600">{servingWarehouse.name}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Edit Store Modal */}
      {editingStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Edit Store: {editingStore.name}
              </h2>
            </div>
            <div className="p-6">
              <StoreForm
                store={editingStore}
                onComplete={closeEditForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreDetailsPage;