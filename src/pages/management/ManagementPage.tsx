import React, { useState, useEffect } from 'react';
import { Warehouse, Store, Truck, Plus, Edit, Trash2, X, User } from 'lucide-react';
import Button from '../../components/common/Button';
import useDataStore from '../../store/dataStore';
import toast from 'react-hot-toast';

// Componentes Nuevos
import Pagination from '../../components/common/Pagination';
import TableSkeleton from '../../components/common/TableSkeleton';

// Formularios
import WarehouseForm from '../../components/management/WarehouseForm';
import StoreForm from '../../components/management/StoreForm';
import TruckForm from '../../components/management/TruckForm';
import DriverForm from '../../components/management/DriverForm';

// Tipos
import { Warehouse as WarehouseType, Store as StoreType, Truck as TruckType, Driver as DriverType } from '../../types';

// Componente Modal
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'warehouses' | 'stores' | 'trucks' | 'drivers'>('warehouses');
  
  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; // Número de elementos por página

  // Estados de los Modales
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  
  // Estados de Edición
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | undefined>(undefined);
  const [editingStore, setEditingStore] = useState<StoreType | undefined>(undefined);
  const [editingTruck, setEditingTruck] = useState<TruckType | undefined>(undefined);
  const [editingDriver, setEditingDriver] = useState<DriverType | undefined>(undefined);

  // Store
  const { 
    warehouses, stores, trucks, drivers,
    fetchWarehouses, fetchStores, fetchTrucks, fetchDrivers,
    deleteWarehouse, deleteStore, deleteTruck, deleteDriver,
    isLoading // Asegúrate de tener isLoading en tu dataStore
  } = useDataStore();

  // Cargar datos al iniciar
  useEffect(() => {
    const loadAll = async () => {
        await Promise.all([fetchWarehouses(), fetchStores(), fetchTrucks(), fetchDrivers()]);
    };
    loadAll();
  }, []);

  // Resetear página a 1 cuando cambia la pestaña
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // --- LÓGICA DE PAGINACIÓN ---
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // --- HANDLERS ---
  const handleAddWarehouse = () => { setEditingWarehouse(undefined); setIsWarehouseModalOpen(true); };
  const handleEditWarehouse = (w: WarehouseType) => { setEditingWarehouse(w); setIsWarehouseModalOpen(true); };
  const handleDeleteWarehouse = async (id: string) => { 
    if(window.confirm('¿Eliminar este almacén?')) await toast.promise(deleteWarehouse(id), { loading: '...', success: 'Eliminado', error: 'Error' });
  };
  
  const handleAddStore = () => { setEditingStore(undefined); setIsStoreModalOpen(true); };
  const handleEditStore = (s: StoreType) => { setEditingStore(s); setIsStoreModalOpen(true); };
  const handleDeleteStore = async (id: string) => { 
    if(window.confirm('¿Eliminar esta tienda?')) await toast.promise(deleteStore(id), { loading: '...', success: 'Eliminado', error: 'Error' });
  };

  const handleAddTruck = () => { setEditingTruck(undefined); setIsTruckModalOpen(true); };
  const handleEditTruck = (t: TruckType) => { setEditingTruck(t); setIsTruckModalOpen(true); };
  const handleDeleteTruck = async (id: string) => { 
    if(window.confirm('¿Eliminar este camión?')) await toast.promise(deleteTruck(id), { loading: '...', success: 'Eliminado', error: 'Error' });
  };

  const handleAddDriver = () => { setEditingDriver(undefined); setIsDriverModalOpen(true); };
  const handleEditDriver = (d: DriverType) => { setEditingDriver(d); setIsDriverModalOpen(true); };
  const handleDeleteDriver = async (id: string) => { 
    if(window.confirm('¿Eliminar este conductor?')) await toast.promise(deleteDriver(id), { loading: '...', success: 'Eliminado', error: 'Error' });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Recursos</h1>
            <p className="text-gray-500 mt-1">Administra tu flota, personal y puntos de interés.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={
            activeTab === 'warehouses' ? handleAddWarehouse :
            activeTab === 'stores' ? handleAddStore :
            activeTab === 'trucks' ? handleAddTruck :
            handleAddDriver
          } leftIcon={<Plus size={18} />}>
            Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { id: 'warehouses', label: 'Warehouses', icon: Warehouse, color: 'blue' },
              { id: 'stores', label: 'Stores', icon: Store, color: 'orange' },
              { id: 'trucks', label: 'Trucks', icon: Truck, color: 'green' },
              { id: 'drivers', label: 'Drivers', icon: User, color: 'purple' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2 transition-colors ${
                  activeTab === tab.id 
                    ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50/50` 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-0">
          {/* --- MANEJO DE CARGA CON SKELETON --- */}
          {isLoading ? (
             <div className="p-6">
               <TableSkeleton rows={5} columns={4} />
             </div>
          ) : (
            <>
              {/* TABLA DE ALMACENES */}
              {activeTab === 'warehouses' && (
                <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(warehouses).map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{w.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm max-w-xs truncate">{w.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{w.capacity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleEditWarehouse(w)} className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteWarehouse(w.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={currentPage} totalItems={warehouses.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
                </>
              )}

              {/* TABLA DE TIENDAS */}
              {activeTab === 'stores' && (
                <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(stores).map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{s.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm max-w-xs truncate">{s.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{s.demand}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleEditStore(s)} className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteStore(s.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={currentPage} totalItems={stores.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
                </>
              )}

              {/* TABLA DE CAMIONES */}
              {activeTab === 'trucks' && (
                <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(trucks).map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{t.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{t.capacity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {t.driverName && t.driverName !== 'Sin Conductor' ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {t.driverName}
                                  </span>
                              ) : (
                                  <span className="text-gray-400 italic text-xs">Sin asignar</span>
                              )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleEditTruck(t)} className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteTruck(t.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={currentPage} totalItems={trucks.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
                </>
              )}

              {/* TABLA DE CONDUCTORES */}
              {activeTab === 'drivers' && (
                <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Licencia</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(drivers).map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{d.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{d.license_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{d.phone || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              {d.status === 'active' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>}
                              {d.status === 'inactive' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactivo</span>}
                              {d.status === 'on_leave' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Vacaciones</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleEditDriver(d)} className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteDriver(d.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={currentPage} totalItems={drivers.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
                </>
              )}
            </>
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

      <Modal isOpen={isDriverModalOpen} onClose={() => setIsDriverModalOpen(false)} title={`${editingDriver ? 'Editar' : 'Añadir'} Conductor`}>
        <DriverForm driver={editingDriver} onComplete={() => setIsDriverModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default ManagementPage;