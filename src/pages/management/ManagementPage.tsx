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

// Componente Modal (MÁS ANCHO AHORA: max-w-5xl)
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm transition-opacity">
      {/* AUMENTADO A max-w-5xl para dar más aire */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all scale-100 flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">Complete la información solicitada a continuación.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 flex-1">{children}</div>
      </div>
    </div>
  );
};

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'warehouses' | 'stores' | 'trucks' | 'drivers'>('warehouses');
  
  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; 

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
    isLoading 
  } = useDataStore();

  // Cargar datos al iniciar
  useEffect(() => {
    const loadAll = async () => {
        await Promise.all([fetchWarehouses(), fetchStores(), fetchTrucks(), fetchDrivers()]);
    };
    loadAll();
  }, []);

  // Resetear página
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
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Recursos</h1>
            <p className="text-gray-500 mt-2 text-lg">Administra tu flota, personal y puntos de interés de forma centralizada.</p>
        </div>
        <div className="mt-4 md:mt-0 flex-shrink-0">
          <Button onClick={
            activeTab === 'warehouses' ? handleAddWarehouse :
            activeTab === 'stores' ? handleAddStore :
            activeTab === 'trucks' ? handleAddTruck :
            handleAddDriver
          } leftIcon={<Plus size={20} />} size="lg" className="shadow-sm">
            Add {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50">
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
                className={`group relative min-w-[120px] flex-1 py-5 px-6 text-center font-medium text-sm flex items-center justify-center space-x-3 transition-all duration-200 ease-in-out outline-none focus:outline-none ${
                  activeTab === tab.id 
                    ? `text-${tab.color}-700 bg-white border-b-2 border-${tab.color}-500` 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} className={`transition-colors ${activeTab === tab.id ? `text-${tab.color}-600` : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-0">
          {/* --- MANEJO DE CARGA --- */}
          {isLoading ? (
             <div className="p-8">
               <TableSkeleton rows={6} columns={5} />
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(warehouses).map((w) => (
                        <tr key={w.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{w.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm max-w-md truncate">{w.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {w.capacity} u
                              </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button onClick={() => handleEditWarehouse(w)} className="text-gray-400 hover:text-indigo-600 transition-colors"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteWarehouse(w.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Demand</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(stores).map((s) => (
                        <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{s.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm max-w-md truncate">{s.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {s.demand} u
                              </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button onClick={() => handleEditStore(s)} className="text-gray-400 hover:text-indigo-600 transition-colors"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteStore(s.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Conductor</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(trucks).map((t) => (
                        <tr key={t.id} className="hover:bg-green-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{t.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">{t.capacity} kg</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {t.driverName && t.driverName !== 'Sin Conductor' ? (
                                  <div className="flex items-center">
                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs mr-2 font-bold">
                                        {t.driverName.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{t.driverName}</span>
                                  </div>
                              ) : (
                                  <span className="text-gray-400 italic text-xs flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                                    Sin asignar
                                  </span>
                              )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button onClick={() => handleEditTruck(t)} className="text-gray-400 hover:text-indigo-600 transition-colors"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteTruck(t.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Licencia</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estatus</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(drivers).map((d) => (
                        <tr key={d.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mr-3">
                                    {d.name.charAt(0)}
                                </div>
                                <div className="text-sm font-medium text-gray-900">{d.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">{d.license_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{d.phone || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              {d.status === 'active' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Activo</span>}
                              {d.status === 'inactive' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Inactivo</span>}
                              {d.status === 'on_leave' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Vacaciones</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button onClick={() => handleEditDriver(d)} className="text-gray-400 hover:text-indigo-600 transition-colors"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteDriver(d.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
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