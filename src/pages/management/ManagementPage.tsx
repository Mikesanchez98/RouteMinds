import React, { useState, useEffect } from 'react';
import { Warehouse, Store, Truck, Plus, Edit, Trash2, X, User } from 'lucide-react'; // <--- AÑADÍ 'User'
import Button from '../../components/common/Button';
import useDataStore from '../../store/dataStore';

// Formularios
import WarehouseForm from '../../components/management/WarehouseForm';
import StoreForm from '../../components/management/StoreForm';
import TruckForm from '../../components/management/TruckForm';
import DriverForm from '../../components/management/DriverForm'; // <--- IMPORTANTE

// Tipos
import { Warehouse as WarehouseType, Store as StoreType, Truck as TruckType, Driver as DriverType } from '../../types';

// Componente Modal Simple (Interno para no crear otro archivo ahora)
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const ManagementPage: React.FC = () => {
  // 1. ESTADO DE LAS PESTAÑAS (Ahora incluye 'drivers')
  const [activeTab, setActiveTab] = useState<'warehouses' | 'stores' | 'trucks' | 'drivers'>('warehouses');
  
  // Estados de los Modales
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false); // <--- NUEVO
  
  // Estados de Edición
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | undefined>(undefined);
  const [editingStore, setEditingStore] = useState<StoreType | undefined>(undefined);
  const [editingTruck, setEditingTruck] = useState<TruckType | undefined>(undefined);
  const [editingDriver, setEditingDriver] = useState<DriverType | undefined>(undefined); // <--- NUEVO

  // Store
  const { 
    warehouses, stores, trucks, drivers, // <--- TRAEMOS DRIVERS
    fetchWarehouses, fetchStores, fetchTrucks, fetchDrivers, // <--- TRAEMOS FETCH
    deleteWarehouse, deleteStore, deleteTruck, deleteDriver // <--- TRAEMOS DELETE
  } = useDataStore();

  // Cargar datos al iniciar
  useEffect(() => {
    fetchWarehouses();
    fetchStores();
    fetchTrucks();
    fetchDrivers(); // <--- CARGAMOS CONDUCTORES
  }, []);

  // --- HANDLERS PARA CONDUCTORES ---
  const handleAddDriver = () => {
    setEditingDriver(undefined);
    setIsDriverModalOpen(true);
  };

  const handleEditDriver = (driver: DriverType) => {
    setEditingDriver(driver);
    setIsDriverModalOpen(true);
  };

  const handleDeleteDriver = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este conductor?')) {
      await deleteDriver(id);
    }
  };
  // ---------------------------------

  // Handlers existentes (Simplificados para no ocupar tanto espacio, asumo que ya los tenías)
  const handleAddWarehouse = () => { setEditingWarehouse(undefined); setIsWarehouseModalOpen(true); };
  const handleEditWarehouse = (w: WarehouseType) => { setEditingWarehouse(w); setIsWarehouseModalOpen(true); };
  const handleDeleteWarehouse = async (id: string) => { if(window.confirm('Confirmar?')) await deleteWarehouse(id); };

  const handleAddStore = () => { setEditingStore(undefined); setIsStoreModalOpen(true); };
  const handleEditStore = (s: StoreType) => { setEditingStore(s); setIsStoreModalOpen(true); };
  const handleDeleteStore = async (id: string) => { if(window.confirm('Confirmar?')) await deleteStore(id); };

  const handleAddTruck = () => { setEditingTruck(undefined); setIsTruckModalOpen(true); };
  const handleEditTruck = (t: TruckType) => { setEditingTruck(t); setIsTruckModalOpen(true); };
  const handleDeleteTruck = async (id: string) => { if(window.confirm('Confirmar?')) await deleteTruck(id); };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Recursos</h1>
        <div className="mt-4 md:mt-0">
          {/* BOTÓN DINÁMICO SEGÚN LA PESTAÑA */}
          {activeTab === 'warehouses' && (
            <Button onClick={handleAddWarehouse} leftIcon={<Plus size={18} />}>Add Warehouse</Button>
          )}
          {activeTab === 'stores' && (
            <Button onClick={handleAddStore} leftIcon={<Plus size={18} />}>Add Store</Button>
          )}
          {activeTab === 'trucks' && (
            <Button onClick={handleAddTruck} leftIcon={<Plus size={18} />}>Add Truck</Button>
          )}
          {activeTab === 'drivers' && ( // <--- NUEVO BOTÓN
            <Button onClick={handleAddDriver} leftIcon={<Plus size={18} />}>Add Driver</Button>
          )}
        </div>
      </div>
      
      {/* TABS DE NAVEGACIÓN */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2 ${
                activeTab === 'warehouses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Warehouse size={18} />
              <span>Warehouses</span>
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2 ${
                activeTab === 'stores' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Store size={18} />
              <span>Stores</span>
            </button>
            <button
              onClick={() => setActiveTab('trucks')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2 ${
                activeTab === 'trucks' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Truck size={18} />
              <span>Trucks</span>
            </button>
            {/* --- NUEVA PESTAÑA DRIVERS --- */}
            <button
              onClick={() => setActiveTab('drivers')}
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2 ${
                activeTab === 'drivers' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User size={18} />
              <span>Drivers</span>
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {/* TABLA DE ALMACENES */}
          {activeTab === 'warehouses' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {warehouses.map((w) => (
                    <tr key={w.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{w.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{w.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{w.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => handleEditWarehouse(w)} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteWarehouse(w.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLA DE TIENDAS */}
          {activeTab === 'stores' && (
             <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead>
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {stores.map((s) => (
                   <tr key={s.id}>
                     <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{s.name}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-gray-500">{s.address}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-gray-500">{s.demand}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                       <button onClick={() => handleEditStore(s)} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                       <button onClick={() => handleDeleteStore(s.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
          )}

          {/* TABLA DE CAMIONES */}
          {activeTab === 'trucks' && (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trucks.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{t.capacity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {t.driverName ? (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{t.driverName}</span>
                        ) : (
                            <span className="text-gray-400 italic">Sin asignar</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleEditTruck(t)} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteTruck(t.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* --- TABLA DE CONDUCTORES (NUEVO) --- */}
          {activeTab === 'drivers' && (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Licencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{d.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{d.license_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{d.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {d.status === 'active' && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activo</span>}
                        {d.status === 'inactive' && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Inactivo</span>}
                        {d.status === 'on_leave' && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Vacaciones</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleEditDriver(d)} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteDriver(d.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No hay conductores registrados.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
      
      {/* MODALS */}
      <Modal isOpen={isWarehouseModalOpen} onClose={() => setIsWarehouseModalOpen(false)} title={`${editingWarehouse ? 'Edit' : 'Add'} Warehouse`}>
        <WarehouseForm warehouse={editingWarehouse} onComplete={() => setIsWarehouseModalOpen(false)} />
      </Modal>
      
      <Modal isOpen={isStoreModalOpen} onClose={() => setIsStoreModalOpen(false)} title={`${editingStore ? 'Edit' : 'Add'} Store`}>
        <StoreForm store={editingStore} onComplete={() => setIsStoreModalOpen(false)} />
      </Modal>
      
      <Modal isOpen={isTruckModalOpen} onClose={() => setIsTruckModalOpen(false)} title={`${editingTruck ? 'Edit' : 'Add'} Truck`}>
        <TruckForm truck={editingTruck} onComplete={() => setIsTruckModalOpen(false)} />
      </Modal>

      {/* --- MODAL DE CONDUCTORES (NUEVO) --- */}
      <Modal isOpen={isDriverModalOpen} onClose={() => setIsDriverModalOpen(false)} title={`${editingDriver ? 'Editar' : 'Añadir'} Conductor`}>
        <DriverForm driver={editingDriver} onComplete={() => setIsDriverModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default ManagementPage;