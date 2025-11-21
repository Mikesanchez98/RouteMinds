import { create } from 'zustand';
import { Warehouse, Store, Truck, Route, Driver } from '../types';
import { supabase } from '../lib/supabase';

interface DataState {
  warehouses: Warehouse[];
  stores: Store[];
  trucks: Truck[];
  routes: Route[];
  drivers: Driver[];
  isLoading?: boolean;
  error?: string | null;
  
  // Warehouses
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;
  
  // Stores
  addStore: (store: Omit<Store, 'id'>) => void;
  updateStore: (id: string, data: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  
  // Trucks
  addTruck: (truck: Omit<Truck, 'id'>) => void;
  updateTruck: (id: string, data: Partial<Truck>) => void;
  deleteTruck: (id: string) => void;
  
  // Routes
  addRoute: (route: Omit<Route, 'id'>) => void;
  updateRoute: (id: string, data: Partial<Route>) => void;
  deleteRoute: (id: string) => void;

  // Drivers
  fetchDrivers: () => Promise<void>;
  addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>;
  updateDriver: (id: string, driver: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  
  // Generate optimized routes
  generateRoutes: () => void;
}

// Sample data for initial development
/*const sampleWarehouses: Warehouse[] = [
  {
    id: 'w1',
    name: 'Central Warehouse',
    location: { lat: 40.7128, lng: -74.0060 },
    capacity: 1000,
    address: '123 Main St, New York, NY'
  },
  {
    id: 'w2',
    name: 'West Distribution Center',
    location: { lat: 37.7749, lng: -122.4194 },
    capacity: 800,
    address: '456 Market St, San Francisco, CA'
  }
];*/

//Sample data for initial development
/*const sampleStores: Store[] = [
  {
    id: 's1',
    name: 'Downtown Store',
    location: { lat: 40.7112, lng: -74.0055 },
    demand: 50,
    address: '789 Broadway, New York, NY',
    timeWindow: { start: '09:00', end: '17:00' }
  },
  {
    id: 's2',
    name: 'Uptown Store',
    location: { lat: 40.8075, lng: -73.9626 },
    demand: 30,
    address: '555 5th Ave, New York, NY',
    timeWindow: { start: '08:00', end: '18:00' }
  },
  {
    id: 's3',
    name: 'SF Downtown',
    location: { lat: 37.7833, lng: -122.4167 },
    demand: 40,
    address: '123 Market St, San Francisco, CA',
    timeWindow: { start: '10:00', end: '19:00' }
  }
];*/

// Sample data for initial development
/*const sampleTrucks: Truck[] = [
  {
    id: 't1',
    name: 'Truck 001',
    capacity: 200,
    speed: 60,
    warehouseId: 'w1'
  },
  {
    id: 't2',
    name: 'Truck 002',
    capacity: 150,
    speed: 55,
    warehouseId: 'w1'
  },
  {
    id: 't3',
    name: 'Truck 003',
    capacity: 180,
    speed: 65,
    warehouseId: 'w2'
  }
];*/

const useDataStore = create<DataState>((set, get) => ({
  warehouses: [],
  stores: [],
  trucks: [],
  routes: [],
  drivers: [],
  
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
      const { data, error } = await supabase.from('drivers').insert(driverData).select().single();
      if (error) throw error;
      set((state) => ({ drivers: [...state.drivers, data as Driver] }));
    } catch (error) {
      console.error('Error adding driver:', error);
    }
  },

  updateDriver: async (id, driverData) => {
    try {
      const { error } = await supabase.from('drivers').update(driverData).eq('id', id);
      if (error) throw error;
      // Recargamos para asegurar consistencia
      get().fetchDrivers();
    } catch (error) {
      console.error('Error updating driver:', error);
    }
  },
  
  deleteDriver: async (id) => {
    try {
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) throw error;
        set((state) => ({ drivers: state.drivers.filter((d) => d.id !== id) }));
    } catch (error) {
        console.error('Error deleting driver:', error);
    }
  },

  // --- ACTUALIZA FETCH TRUCKS (Para traer el driver asignado) ---
  fetchTrucks: async () => {
      set({ isLoading: true });
      try {
        // Pedimos trucks Y el nombre del driver (join)
        const { data, error } = await supabase
          .from('trucks')
          .select(`
            *,
            drivers ( name ) 
          `); 
          // Nota: asegúrate de que en Supabase la relación se llame 'drivers' 
          // o usa la foreign key correcta.

        if (error) throw error;

        const formattedData = data?.map(truck => ({
          id: truck.id,
          name: truck.name,
          capacity: truck.capacity,
          warehouseId: truck.warehouse_id, 
          // Mapeamos los nuevos campos
          currentDriverId: truck.current_driver_id,
          driverName: truck.drivers?.name || 'Sin Conductor',
        })) || [];

        set({ trucks: formattedData, isLoading: false });
      } catch (error) {
        console.error('Error fetching trucks:', error);
        set({ error: 'Failed to load trucks', isLoading: false });
      }
  },

  fetchWarehouses: async () => {
    set({ isLoading: true }); //Estado isLoading añadido al store para indicar que se está cargando
    try{
      const { data, error } = await supabase.from('warehouses').select('*');
      if (error) throw error;

      const formattedData: Warehouse[] = data?.map(warehouse => ({
        ...warehouse,
        location: {
          lat: warehouse.lat,
          lng: warehouse.lng
        },
      })) || [];

      set({ warehouses: formattedData, isLoading: false });
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      set({ error: 'Failed to load warehouses', isLoading: false });
    }
  },

  fetchStores: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;
      //Supabase save 'time' as string HH:MM:SS, adjust only if necessary
      const formattedData: Store[] = data?.map(store => ({
        ...store,

        location: { lat: store.lat, lng: store.lng },

        timeWindow: store.start_time && store.end_time
          ? { start: store.start_time.substring(0, 5), end: store.end_time.substring(0, 5) }
          : undefined,
        start_time: undefined, // remove original fields
        end_time: undefined,   
      })) || [];
      set({ stores: formattedData, isLoading: false });
    } catch (error) {
      console.error('Error fetching stores:', error);
      set({ error: 'Failed to load stores', isLoading: false });
    }
  },

// En src/store/dataStore.ts

    fetchRoutesByDate: async (date: Date) => {
      set({ isLoading: true });

      // Formatea la fecha para Supabase
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0); // Inicio del día

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999); // Fin del día

      try {
        const { data, error } = await supabase
          .from('routes')
          .select('*')
          // Filtra donde 'created_at' es mayor o igual al inicio del día
          .gte('created_at', startDate.toISOString())
          // Y menor o igual al fin del día
          .lte('created_at', endDate.toISOString())
          // Ordena por fecha de creación
          .order('created_at', { ascending: false }); 

        if (error) throw error;
        
        // Formateamos los datos de la BD a la forma de la App
        const formattedRoutes: Route[] = data.map(route => ({
          id: route.id,
          warehouseId: route.warehouse_id,
          truckId: route.truck_id,
          stores: route.stores_sequence, // jsonb a array
          distance: route.distance,
          estimatedTime: route.estimated_time,
          created: route.created_at
        }));

        set({ routes: formattedRoutes, isLoading: false });
        
      } catch (error) {
        console.error('Error fetching routes by date:', error);
        set({ error: 'Failed to load routes', isLoading: false });
      }
    },

//INICIO DE LAS OPERACIONES CRUD

  // ALMACENES
  //Añadir almacen
  addWarehouse: async (warehouseInput) => {
    //Preparar datos para supabase
    const dbData = {
      name: warehouseInput.name,
      lat: warehouseInput.location.lat,
      lng: warehouseInput.location.lng,
      capacity: warehouseInput.capacity,
      address: warehouseInput.address
    };

    set({ isLoading: true, error: null});
    try {
      //Insertamos en supabase y pedimos que devuelva el registro generado
      const { data, error } = await supabase
        .from('warehouses')
        .insert(dbData)
        .select() //Pide que devuelva lo insertado
        .single(); //Esperamos solo un resultado

      if (error) throw error;

      //Formateamos la espuesta para que coincida con nuestro tipo Warehouse
      const newWarehouse: Warehouse = {
        id: data.id,
        name: data.name,
        location: { lat: data.lat, lng: data.lng },
        capacity: data.capacity,
        address: data.address
      };

      //Actualizamos el estado local añadiendo el nuevo almacen
      set((state) => ({
        warehouses: [...state.warehouses, newWarehouse],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding warehouse:', error);
      set({ error: 'Failed to add warehouse', isLoading: false });
    }
  },
  
  //Actualizar almacen
  updateWarehouse: async (id, warehouseInput) => {
    //Preparamos datos (solo los que se podrían actualizar)
    const dbData = {
      name: warehouseInput.name,
      lat: warehouseInput.location?.lat,
      lng: warehouseInput.location?.lng,
      capacity: warehouseInput.capacity,
      address: warehouseInput.address,
    };

    //Filtramos campos undefined para que supabase no los actualice a null
    Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);

    set({ isLoading: true, error: null});
    try {
      const {data, error} = await supabase
        .from('warehouses')
        .update(dbData)
        .eq('id', id) //Muy importante para indicar qué registro actualizar
        .select()
        .single();

      if (error) throw error;

      const updatedWarehouse: Warehouse = {
        id: data.id,
        name: data.name,
        location: { lat: data.lat, lng: data.lng },
        capacity: data.capacity,
        address: data.address
      };

      //Actualizamos el estado local remplazando el almacen modificado
      set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === id ? updatedWarehouse : w
      ),
      isLoading: false,
      }))
    } catch (error) {
      console.error('Error updating warehouse:', error);
      set({ error: 'Failed to update warehouse', isLoading: false });
    } 
  },
  
  //Eliminar almacen
  deleteWarehouse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error} = await supabase
        .from('warehouses')
        .delete()
        .eq('id', id); //Muy importante para indicar qué registro eliminar

    if (error) throw error;

    //Actualizamos el estado local eliminando el almacen
    set((state) => ({
      warehouses: state.warehouses.filter((w) => w.id !== id),
      isLoading: false,
    }));
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      set({ error: 'Failed to delete warehouse', isLoading: false });
    }
  },
  
  // TIENDAS
  //Añadir tienda
  addStore: async (storeInput) => {
    //Preparar datos para supabase
    const dbData = {
      name: storeInput.name,
      lat: storeInput.location.lat,
      lng: storeInput.location.lng,
      demand: storeInput.demand,
      address: storeInput.address,
      start_time: storeInput.timeWindow?.start ? `${storeInput.timeWindow.start}:00` : null,
      end_time: storeInput.timeWindow?.end ? `${storeInput.timeWindow.end}:00` : null,
    };

    set({ isLoading: true, error: null});
    try {
      //Insertamos en supabase y pedimos que devuelva el registro generado
      const { data, error } = await supabase
        .from('stores')
        .insert(dbData)
        .select() //Pide que devuelva lo insertado
        .single(); //Esperamos solo un resultado

      if (error) throw error;

      //Formateamos la espuesta para que coincida con nuestro tipo Store
      const newStore: Store = {
        id: data.id,
        name: data.name,
        location: { lat: data.lat, lng: data.lng },
        demand: data.demand,
        address: data.address,
        timeWindow: data.start_time && data.end_time
          ? { start: data.start_time.substring(0,5), end: data.end_time.substring(0,5) }
          : undefined,
      };

      //Actualizamos el estado local añadiendo la nueva tienda
      set((state) => ({
        stores: [...state.stores, newStore],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding store:', error);
      set({ error: 'Failed to add store', isLoading: false });
    }
  },
  
  //Actualizar tienda
  updateStore: async (id, storeInput) => {
    //Preparamos datos (solo los que se podrían actualizar)
    const dbData = {
      name: storeInput.name,
      lat: storeInput.location?.lat,
      lng: storeInput.location?.lng,
      demand: storeInput.demand,
      address: storeInput.address,
      start_time: storeInput.timeWindow?.start ? `${storeInput.timeWindow.start}:00` : null,
      end_time: storeInput.timeWindow?.end ? `${storeInput.timeWindow.end}:00` : null,
    };

    //Filtramos campos undefined para que supabase no los actualice a null
    Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);

    set({ isLoading: true, error: null});
    try {
      const {data, error} = await supabase
        .from('stores')
        .update(dbData)
        .eq('id', id) //Muy importante para indicar qué registro actualizar
        .select()
        .single();

      if (error) throw error;

      const updatedStore: Store = {
        id: data.id,
        name: data.name,
        location: { lat: data.lat, lng: data.lng },
        demand: data.demand,
        address: data.address,
        timeWindow: data.start_time && data.end_time
          ? { start: data.start_time.substring(0,5), end: data.end_time.substring(0,5) }
          : undefined,
      };

      //Actualizamos el estado local remplazando la tienda modificada
      set((state) => ({
        stores: state.stores.map((s) =>
          s.id === id ? updatedStore : s
      ),
      isLoading: false,
      }))
    } catch (error) {
      console.error('Error updating store:', error);
      set({ error: 'Failed to update store', isLoading: false });
    }
  },
  
  //Eliminar tienda
  deleteStore: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        stores: state.stores.filter((store) => store.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting store:', error);
      set({ error: 'Failed to delete store', isLoading: false });
    }
  },
  

  // Camiones
  // Añadir camión
  addTruck: async (truckInput) => {
    // Preparar datos para supabase
    const dbData = {
      name: truckInput.name,
      capacity: truckInput.capacity,
      speed: truckInput.speed,
      warehouse_id: truckInput.warehouseId
    };

    set({ isLoading: true, error: null });
    try {
      // Insertamos en supabase y pedimos que devuelva el registro generado
      const { data, error } = await supabase
        .from('trucks')
        .insert(dbData)
        .select() // Pide que devuelva lo insertado
        .single(); // Esperamos solo un resultado

      if (error) throw error;

      // Formateamos la respuesta para que coincida con nuestro tipo Truck
      const newTruck: Truck = {
        id: data.id,
        name: data.name,
        capacity: data.capacity,
        speed: data.speed,
        warehouseId: data.warehouse_id
      };

      // Actualizamos el estado local añadiendo el nuevo camión
      set((state) => ({
        trucks: [...state.trucks, newTruck],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding truck:', error);
      set({ error: 'Failed to add truck', isLoading: false });
    }
  },
  
  // Actualizar camión
  updateTruck: async (id, truckInput) => {
    // Preparar datos para supabase
    const dbData = {
      name: truckInput.name,
      capacity: truckInput.capacity,
      speed: truckInput.speed,
      warehouse_id: truckInput.warehouseId
    };

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('trucks')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTruck: Truck = {
        id: data.id,
        name: data.name,
        capacity: data.capacity,
        speed: data.speed,
        warehouseId: data.warehouse_id
      };

      // Actualizamos el estado local reemplazando el camión modificado
      set((state) => ({
        trucks: state.trucks.map((t) =>
          t.id === id ? updatedTruck : t
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating truck:', error);
      set({ error: 'Failed to update truck', isLoading: false });
    }
  },
  
  // Eliminar camión
  deleteTruck: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('trucks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        trucks: state.trucks.filter((truck) => truck.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting truck:', error);
      set({ error: 'Failed to delete truck', isLoading: false });
    }
  },
  
  // Routes
  addRoute: (route) => {
    const newRoute = {
      ...route,
      id: Math.random().toString(36).substring(2, 9)
    };
    set((state) => ({
      routes: [...state.routes, newRoute]
    }));
  },
  
  updateRoute: (id, data) => {
    set((state) => ({
      routes: state.routes.map((route) => 
        route.id === id ? { ...route, ...data } : route
      )
    }));
  },
  
  deleteRoute: (id) => {
    set((state) => ({
      routes: state.routes.filter((route) => route.id !== id)
    }));
  },
  
  // Generate optimized routes
  generateRoutes: async () => {
    // 1. Obtiene los datos actuales del estado (leídos de la BD)
    const { warehouses, stores, trucks } = get();

    if (warehouses.length === 0 || stores.length === 0 || trucks.length === 0) {
      console.warn("Se necesitan almacenes, tiendas y camiones para generar rutas.");
      set({ error: "No hay suficientes datos para generar rutas.", routes: [] });
      return;
    }

    set({ isLoading: true, error: null, routes: [] }); // Limpia rutas viejas y muestra carga

    try {
      // 2. ¡Llama a la Edge Function por su nombre!
      const { data, error } = await supabase.functions.invoke('solve-mdvrp', {
        // 3. Envía los datos de la BD como 'body'
        body: JSON.stringify({ warehouses, stores, trucks }),
      });

      if (error) {
        throw error; // Lanza el error si Supabase falla
      }

      // 4. Recibe las rutas del algoritmo
      if (data && data.routes) {
        // 5. ¡Guarda las rutas REALES en el estado!
        set({ routes: data.routes, isLoading: false });
      } else {
        throw new Error('Respuesta inválida de la función de rutas.');
      }

    } catch (error) {
      console.error('Error al generar rutas:', error);
      set({
        error: `Error al generar rutas: ${error.message}`,
        isLoading: false,
      });
    }
  },
}));

export default useDataStore;