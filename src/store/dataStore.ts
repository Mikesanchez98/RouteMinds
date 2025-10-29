import { create } from 'zustand';
import { Warehouse, Store, Truck, Route } from '../types';
import { supabase } from '../lib/supabase';

interface DataState {
  warehouses: Warehouse[];
  stores: Store[];
  trucks: Truck[];
  routes: Route[];

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
  
  fetchWarehouses: async () => {
    set({ isLoading: true }); //Estado isLoading añadido al store para indicar que se está cargando
    try{
      const { data, error } = await supabase.from('warehouses').select('*');
      if (error) throw error;
      set({ warehouses: data || [], isLoading: false });
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
      const formattedData = data?.map(store => ({
        ...store,
        timeWindow: store.start_time && store.end_time
          ? { start: store.start_time.substring(onabort, 5), end: store.end_time.substring(0,5) }
          :undefined,
        start_time: undefined, // remove original fields
        end_time: undefined,   
      })) || [];
      set({ stores:formattedData, isLoading: false });
    } catch (error) {
      console.error('Error fetching stores:', error);
      set({ error: 'Failed to load stores', isLoading: false });
    }
  },

  fetchTrucks: async () => {
  set({ isLoading: true });
  try {
    // Usamos 'select' con referencia para obtener el nombre del almacén también
    const { data, error } = await supabase
      .from('trucks')
      .select(`
        *,
        warehouse:warehouses ( name )
      `); // Esto asume que llamaste 'warehouse' a la relación FK

    if (error) throw error;

    // Formateamos para que coincida con tu tipo Truck (que espera warehouseId)
    // Y añadimos el nombre del almacén si quieres mostrarlo fácilmente
    const formattedData = data?.map(truck => ({
        ...truck,
        warehouseName: truck.warehouse?.name || 'Unknown', // Nombre extra
        warehouse: undefined, // Quitamos el objeto anidado
    })) || [];

    set({ trucks: formattedData, isLoading: false });
  } catch (error) {
    console.error('Error fetching trucks:', error);
    set({ error: 'Failed to load trucks', isLoading: false });
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
  generateRoutes: () => {
    const { warehouses, stores, trucks } = get();
    
    // This is a simplified mock implementation of route generation
    // In a real app, this would call a backend API with a proper MDVRP algorithm
    
    // Clear existing routes
    set({ routes: [] });
    
    // For each warehouse, create simple routes to nearby stores
    warehouses.forEach(warehouse => {
      // Get trucks for this warehouse
      const warehouseTrucks = trucks.filter(t => t.warehouseId === warehouse.id);
      
      if (warehouseTrucks.length === 0) return;
      
      // Simple distance calculation (not considering real road distances)
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
      };
      
      // Group stores by proximity to this warehouse
      const storesWithDistance = stores.map(store => ({
        ...store,
        distance: calculateDistance(
          warehouse.location.lat, warehouse.location.lng,
          store.location.lat, store.location.lng
        )
      }));
      
      // Sort by distance (closest first)
      storesWithDistance.sort((a, b) => a.distance - b.distance);
      
      // Assign stores to trucks (simple round-robin for this mock)
      const truckAssignments: Record<string, string[]> = {};
      warehouseTrucks.forEach(truck => {
        truckAssignments[truck.id] = [];
      });
      
      // Distribute stores among trucks
      storesWithDistance.forEach((store, index) => {
        const truckIndex = index % warehouseTrucks.length;
        const truckId = warehouseTrucks[truckIndex].id;
        truckAssignments[truckId].push(store.id);
      });
      
      // Create routes
      Object.entries(truckAssignments).forEach(([truckId, storeIds]) => {
        if (storeIds.length === 0) return;
        
        // Calculate total distance (sum of distances between consecutive points)
        let totalDistance = 0;
        let prevLat = warehouse.location.lat;
        let prevLng = warehouse.location.lng;
        
        storeIds.forEach(storeId => {
          const store = stores.find(s => s.id === storeId)!;
          totalDistance += calculateDistance(
            prevLat, prevLng,
            store.location.lat, store.location.lng
          );
          prevLat = store.location.lat;
          prevLng = store.location.lng;
        });
        
        // Add return to warehouse
        totalDistance += calculateDistance(
          prevLat, prevLng,
          warehouse.location.lat, warehouse.location.lng
        );
        
        // Calculate estimated time (distance / speed)
        const truck = trucks.find(t => t.id === truckId)!;
        const estimatedTime = totalDistance / truck.speed; // Time in hours
        
        // Create the route
        const route: Route = {
          id: Math.random().toString(36).substring(2, 9),
          warehouseId: warehouse.id,
          truckId,
          stores: storeIds,
          distance: parseFloat(totalDistance.toFixed(2)),
          estimatedTime: parseFloat(estimatedTime.toFixed(2)),
          created: new Date().toISOString()
        };
        
        // Add to routes
        set((state) => ({
          routes: [...state.routes, route]
        }));
      });
    });
  }
}));

export default useDataStore;