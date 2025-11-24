import { create } from 'zustand';
import { Warehouse, Store, Truck, Route, Driver } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DataState {
  warehouses: Warehouse[];
  stores: Store[];
  trucks: Truck[];
  routes: Route[];
  drivers: Driver[];
  isLoading: boolean;
  error: string | null;
  
  // Warehouses
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Promise<void>;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  fetchWarehouses: () => Promise<void>;
  
  // Stores
  addStore: (store: Omit<Store, 'id'>) => Promise<void>;
  updateStore: (id: string, data: Partial<Store>) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  fetchStores: () => Promise<void>;
  
  // Trucks
  addTruck: (truck: Omit<Truck, 'id'>) => Promise<void>;
  updateTruck: (id: string, data: Partial<Truck>) => Promise<void>;
  deleteTruck: (id: string) => Promise<void>;
  fetchTrucks: () => Promise<void>;
  
  // Drivers
  addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  fetchDrivers: () => Promise<void>;

  // Routes
  addRoute: (route: Omit<Route, 'id'>) => void;
  updateRoute: (id: string, data: Partial<Route>) => void;
  deleteRoute: (id: string) => Promise<void>;
  updateRouteStatus: (id: string, status: Route['status']) => Promise<void>;
  fetchRoutesByDate: (date: Date) => Promise<void>;
  
  // Algorithm
  generateRoutes: () => Promise<void>;
}

const useDataStore = create<DataState>((set, get) => ({
  warehouses: [],
  stores: [],
  trucks: [],
  routes: [],
  drivers: [],
  isLoading: false,
  error: null,

  // --- ALMACENES ---
  fetchWarehouses: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('warehouses').select('*');
      if (error) throw error;

      // Mapear lat/lng planos a objeto 'location'
      const formattedData: Warehouse[] = data?.map(warehouse => ({
        ...warehouse,
        location: {
          lat: warehouse.lat,
          lng: warehouse.lng,
        },
      })) || [];

      set({ warehouses: formattedData, isLoading: false });
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      set({ error: 'Failed to load warehouses', isLoading: false });
    }
  },

  addWarehouse: async (warehouseInput) => {
    const dbData = {
      name: warehouseInput.name,
      lat: warehouseInput.location.lat,
      lng: warehouseInput.location.lng,
      capacity: warehouseInput.capacity,
      address: warehouseInput.address,
    };
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('warehouses').insert(dbData);
      if (error) throw error;
      await get().fetchWarehouses(); 
    } catch (error) {
      console.error('Error adding warehouse:', error);
      set({ error: 'Failed to add warehouse', isLoading: false });
      throw error;
    }
  },

  updateWarehouse: async (id, warehouseInput) => {
    const dbData = {
      name: warehouseInput.name,
      lat: warehouseInput.location?.lat,
      lng: warehouseInput.location?.lng,
      capacity: warehouseInput.capacity,
      address: warehouseInput.address,
    };
    Object.keys(dbData).forEach(key => (dbData as any)[key] === undefined && delete (dbData as any)[key]);

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('warehouses').update(dbData).eq('id', id);
      if (error) throw error;
      await get().fetchWarehouses();
    } catch (error) {
      console.error('Error updating warehouse:', error);
      set({ error: 'Failed to update warehouse', isLoading: false });
      throw error;
    }
  },

  deleteWarehouse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('warehouses').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ warehouses: state.warehouses.filter((w) => w.id !== id), isLoading: false }));
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      set({ error: 'Failed to delete warehouse', isLoading: false });
      throw error;
    }
  },

  // --- TIENDAS ---
  fetchStores: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;

      const formattedData: Store[] = data?.map(store => ({
          ...store,
          location: { lat: store.lat, lng: store.lng },
          timeWindow: store.start_time && store.end_time
              ? { start: store.start_time.substring(0, 5), end: store.end_time.substring(0, 5) }
              : undefined,
          start_time: undefined,
          end_time: undefined,
      })) || [];
      
      set({ stores: formattedData, isLoading: false });
    } catch (error) {
      console.error('Error fetching stores:', error);
      set({ error: 'Failed to load stores', isLoading: false });
    }
  },

  addStore: async (storeInput) => {
    const dbData = {
      name: storeInput.name,
      lat: storeInput.location.lat,
      lng: storeInput.location.lng,
      demand: storeInput.demand,
      address: storeInput.address,
      start_time: storeInput.timeWindow?.start ? `${storeInput.timeWindow.start}:00` : null,
      end_time: storeInput.timeWindow?.end ? `${storeInput.timeWindow.end}:00` : null,
    };
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('stores').insert(dbData);
      if (error) throw error;
      await get().fetchStores();
    } catch (error) {
      console.error('Error adding store:', error);
      set({ error: 'Failed to add store', isLoading: false });
      throw error;
    }
  },

  updateStore: async (id, storeInput) => {
    const dbData = {
      name: storeInput.name,
      lat: storeInput.location?.lat,
      lng: storeInput.location?.lng,
      demand: storeInput.demand,
      address: storeInput.address,
      start_time: storeInput.timeWindow?.start ? `${storeInput.timeWindow.start}:00` : null,
      end_time: storeInput.timeWindow?.end ? `${storeInput.timeWindow.end}:00` : null,
    };
    Object.keys(dbData).forEach(key => (dbData as any)[key] === undefined && delete (dbData as any)[key]);

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('stores').update(dbData).eq('id', id);
      if (error) throw error;
      await get().fetchStores();
    } catch (error) {
      console.error('Error updating store:', error);
      set({ error: 'Failed to update store', isLoading: false });
      throw error;
    }
  },

  deleteStore: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ stores: state.stores.filter((s) => s.id !== id), isLoading: false }));
    } catch (error) {
      console.error('Error deleting store:', error);
      set({ error: 'Failed to delete store', isLoading: false });
      throw error;
    }
  },

  // --- CAMIONES (CON CONDUCTOR) ---
  fetchTrucks: async () => {
    set({ isLoading: true });
    try {
      // CORRECCIÓN CLAVE: Traemos el nombre del conductor relacionado
      const { data, error } = await supabase
        .from('trucks')
        .select(`
          *,
          driver:current_driver_id ( name )
        `);

      if (error) throw error;

      const formattedData = data?.map((truck: any) => ({
        id: truck.id,
        name: truck.name,
        capacity: truck.capacity,
        speed: truck.speed,
        warehouseId: truck.warehouse_id,
        currentDriverId: truck.current_driver_id,
        // Guardamos el nombre del conductor aquí para usarlo en Reportes y Tablas
        driverName: truck.driver?.name || 'Sin Conductor', 
      })) || [];

      set({ trucks: formattedData, isLoading: false });
    } catch (error) {
      console.error('Error fetching trucks:', error);
      set({ error: 'Failed to load trucks', isLoading: false });
    }
  },

  addTruck: async (truckInput) => {
    const dbData = {
      name: truckInput.name,
      capacity: truckInput.capacity,
      speed: truckInput.speed,
      warehouse_id: truckInput.warehouseId,
      current_driver_id: truckInput.currentDriverId || null
    };
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('trucks').insert(dbData);
      if (error) throw error;
      // IMPORTANTE: Recargamos la lista para obtener el nombre del conductor
      await get().fetchTrucks(); 
    } catch (error) {
      console.error('Error adding truck:', error);
      set({ error: 'Failed to add truck', isLoading: false });
      throw error;
    }
  },

  updateTruck: async (id, truckInput) => {
    const dbData = {
      name: truckInput.name,
      capacity: truckInput.capacity,
      speed: truckInput.speed,
      warehouse_id: truckInput.warehouseId,
      current_driver_id: truckInput.currentDriverId || null
    };
    Object.keys(dbData).forEach(key => (dbData as any)[key] === undefined && delete (dbData as any)[key]);

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('trucks').update(dbData).eq('id', id);
      if (error) throw error;
      // IMPORTANTE: Recargamos la lista para actualizar el nombre
      await get().fetchTrucks();
    } catch (error) {
      console.error('Error updating truck:', error);
      set({ error: 'Failed to update truck', isLoading: false });
      throw error;
    }
  },

  deleteTruck: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('trucks').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ trucks: state.trucks.filter((t) => t.id !== id), isLoading: false }));
    } catch (error) {
      console.error('Error deleting truck:', error);
      set({ error: 'Failed to delete truck', isLoading: false });
      throw error;
    }
  },

  // --- CONDUCTORES ---
  fetchDrivers: async () => {
    try {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      set({ drivers: data as Driver[] });
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  },
  addDriver: async (driverData) => {
    try {
      const { error } = await supabase.from('drivers').insert(driverData);
      if (error) throw error;
      await get().fetchDrivers();
    } catch (error) { console.error(error); throw error; }
  },
  updateDriver: async (id, driverData) => {
    try {
      const { error } = await supabase.from('drivers').update(driverData).eq('id', id);
      if (error) throw error;
      await get().fetchDrivers();
      // Recargar camiones también, por si cambiamos el nombre de un conductor asignado
      await get().fetchTrucks(); 
    } catch (error) { console.error(error); throw error; }
  },
  deleteDriver: async (id) => {
    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ drivers: state.drivers.filter((d) => d.id !== id) }));
      await get().fetchTrucks(); // Recargar camiones (quedarán sin nombre)
    } catch (error) { console.error(error); throw error; }
  },

  // --- RUTAS ---
  fetchRoutesByDate: async (date: Date) => {
    set({ isLoading: true });
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      
      const formattedRoutes: Route[] = data.map(route => ({
        id: route.id,
        warehouseId: route.warehouse_id,
        truckId: route.truck_id,
        stores: route.stores_sequence || [],
        distance: route.distance,
        estimatedTime: route.estimated_time,
        created: route.created_at,
        status: route.status,
        actualStartTime: route.actual_start_time,
        actualEndTime: route.actual_end_time
      }));

      set({ routes: formattedRoutes, isLoading: false });
    } catch (error) {
      console.error('Error fetching routes by date:', error);
      set({ error: 'Failed to load routes', isLoading: false });
    }
  },

  generateRoutes: async () => {
    const { warehouses, stores, trucks, routes } = get();

    // A. Filtrar camiones con conductor y NO ocupados
    const busyTruckIds = new Set(routes.map(r => r.truckId));
    const availableTrucks = trucks.filter(t => {
        const hasDriver = !!t.currentDriverId;
        const isFree = !busyTruckIds.has(t.id); 
        return hasDriver && isFree;
    });

    if (warehouses.length === 0 || stores.length === 0) {
      toast.error("Faltan almacenes o tiendas.");
      return;
    }

    if (availableTrucks.length === 0) {
      if (trucks.length > 0 && trucks.every(t => busyTruckIds.has(t.id))) {
          toast.error("Todos los camiones con conductor ya tienen ruta hoy.");
      } else {
          toast.error("No hay camiones disponibles con conductor asignado.");
      }
      return;
    }

    set({ isLoading: true, error: null }); 

    try {
      const { data, error } = await supabase.functions.invoke('solve-mdvrp', {
        body: JSON.stringify({ warehouses, stores, trucks: availableTrucks }),
      });

      if (error) throw error;

      if (data && data.routes) {
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        // Agregamos las nuevas rutas a las existentes
        set((state) => ({ 
            routes: [...state.routes, ...data.routes], 
            isLoading: false 
        }));
        toast.success(`Se generaron ${data.routes.length} rutas nuevas.`);
      } else {
        throw new Error('Respuesta inválida.');
      }
    } catch (error: any) {
      console.error('Error al generar rutas:', error);
      set({ error: `Error: ${error.message}`, isLoading: false });
      toast.error("Error al generar rutas");
    }
  },

  deleteRoute: async (id) => {
    const previousRoutes = get().routes;
    set((state) => ({ routes: state.routes.filter((r) => r.id !== id) }));

    try {
      const { error } = await supabase.from('routes').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting route:', error);
      set({ routes: previousRoutes });
      toast.error("No se pudo eliminar la ruta");
    }
  },

  updateRouteStatus: async (id, status) => {
    try {
      const updates: any = { status };
      const now = new Date().toISOString();
      
      if (status === 'in_progress') updates.actual_start_time = now;
      if (status === 'completed') updates.actual_end_time = now;

      const { error } = await supabase.from('routes').update(updates).eq('id', id);
      if (error) throw error;

      set((state) => ({
        routes: state.routes.map((route) => 
          route.id === id 
            ? { 
                ...route, 
                status: status,
                actualStartTime: status === 'in_progress' ? now : route.actualStartTime,
                actualEndTime: status === 'completed' ? now : route.actualEndTime
              } 
            : route
        ),
      }));
      toast.success(`Ruta marcada como ${status === 'in_progress' ? 'En Progreso' : 'Completada'}`);
    } catch (error) {
      console.error('Error updating route status:', error);
      toast.error("Error al actualizar estado");
    }
  },

  // Placeholders requeridos
  addRoute: () => {},
  updateRoute: () => {},
}));

export default useDataStore;