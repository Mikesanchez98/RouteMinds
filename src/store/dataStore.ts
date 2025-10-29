import { create } from 'zustand';
import { Warehouse, Store, Truck, Route } from '../types';

interface DataState {
  warehouses: Warehouse[];
  stores: Store[];
  trucks: Truck[];
  routes: Route[];
  
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
const sampleWarehouses: Warehouse[] = [
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
];

const sampleStores: Store[] = [
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
];

const sampleTrucks: Truck[] = [
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
];

const useDataStore = create<DataState>((set, get) => ({
  warehouses: sampleWarehouses,
  stores: sampleStores,
  trucks: sampleTrucks,
  routes: [],
  
  // Warehouses
  addWarehouse: (warehouse) => {
    const newWarehouse = {
      ...warehouse,
      id: Math.random().toString(36).substring(2, 9)
    };
    set((state) => ({
      warehouses: [...state.warehouses, newWarehouse]
    }));
  },
  
  updateWarehouse: (id, data) => {
    set((state) => ({
      warehouses: state.warehouses.map((warehouse) => 
        warehouse.id === id ? { ...warehouse, ...data } : warehouse
      )
    }));
  },
  
  deleteWarehouse: (id) => {
    set((state) => ({
      warehouses: state.warehouses.filter((warehouse) => warehouse.id !== id)
    }));
  },
  
  // Stores
  addStore: (store) => {
    const newStore = {
      ...store,
      id: Math.random().toString(36).substring(2, 9)
    };
    set((state) => ({
      stores: [...state.stores, newStore]
    }));
  },
  
  updateStore: (id, data) => {
    set((state) => ({
      stores: state.stores.map((store) => 
        store.id === id ? { ...store, ...data } : store
      )
    }));
  },
  
  deleteStore: (id) => {
    set((state) => ({
      stores: state.stores.filter((store) => store.id !== id)
    }));
  },
  
  // Trucks
  addTruck: (truck) => {
    const newTruck = {
      ...truck,
      id: Math.random().toString(36).substring(2, 9)
    };
    set((state) => ({
      trucks: [...state.trucks, newTruck]
    }));
  },
  
  updateTruck: (id, data) => {
    set((state) => ({
      trucks: state.trucks.map((truck) => 
        truck.id === id ? { ...truck, ...data } : truck
      )
    }));
  },
  
  deleteTruck: (id) => {
    set((state) => ({
      trucks: state.trucks.filter((truck) => truck.id !== id)
    }));
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