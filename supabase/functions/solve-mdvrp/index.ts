import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- Definición de Tipos (de tu types.ts) ---
interface Location { lat: number; lng: number; }
interface Warehouse { id: string; name: string; location: Location; capacity: number; address: string; }
interface Store { id: string; name: string; location: Location; demand: number; address: string; timeWindow?: { start: string; end: string }; }
interface Truck { id: string; name: string; capacity: number; speed: number; warehouseId: string; }
interface Route {
  id: string;
  warehouseId: string;
  truckId: string;
  stores: string[];
  distance: number;
  estimatedTime: number;
  created: string;
}

// --- El Solucionador MDVRP (Traducido de Python) ---
class MDVRPSolverTS {
  warehouses: Warehouse[];
  stores: Store[];
  trucks: Truck[];
  routes: Route[];
  distances: Map<string, number>; // Reemplaza el dict de Python

  constructor(warehouses: Warehouse[], stores: Store[], trucks: Truck[]) {
    this.warehouses = warehouses;
    this.stores = stores;
    this.trucks = trucks;
    this.routes = [];
    this.distances = new Map<string, number>();
    this._precomputeDistances();
  }

  _calculateDistance(loc1: Location, loc2: Location): number {
    const [lat1, lon1] = [loc1.lat, loc1.lng];
    const [lat2, lon2] = [loc2.lat, loc2.lng];

    const [rLat1, rLon1, rLat2, rLon2] = [lat1, lon1, lat2, lon2].map(deg => deg * (Math.PI / 180));

    const dLat = rLat2 - rLat1;
    const dLon = rLon2 - rLon1;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(a));
    const r = 6371; // Radio de la tierra en km
    return c * r;
  }

  _precomputeDistances() {
    for (const w1 of this.warehouses) {
      for (const w2 of this.warehouses) {
        this.distances.set(`${w1.id},${w2.id}`, this._calculateDistance(w1.location, w2.location));
      }
    }
    for (const w of this.warehouses) {
      for (const s of this.stores) {
        const dist = this._calculateDistance(w.location, s.location);
        this.distances.set(`${w.id},${s.id}`, dist);
        this.distances.set(`${s.id},${w.id}`, dist);
      }
    }
    for (const s1 of this.stores) {
      for (const s2 of this.stores) {
        this.distances.set(`${s1.id},${s2.id}`, this._calculateDistance(s1.location, s2.location));
      }
    }
  }
  
  _getDistance(id1: string, id2: string): number {
    return this.distances.get(`${id1},${id2}`) || Infinity;
  }

  assignStoresToWarehouses(): Map<string, string[]> {
    const assignments = new Map<string, string[]>(this.warehouses.map(w => [w.id, []]));
    for (const store of this.stores) {
      let closestWarehouse: string | null = null;
      let minDistance = Infinity;
      for (const warehouse of this.warehouses) {
        const dist = this._getDistance(warehouse.id, store.id);
        if (dist < minDistance) {
          minDistance = dist;
          closestWarehouse = warehouse.id;
        }
      }
      if (closestWarehouse) {
        assignments.get(closestWarehouse)!.push(store.id);
      }
    }
    return assignments;
  }

  createInitialRoutes() {
    const warehouseAssignments = this.assignStoresToWarehouses();
    const warehouseTrucks = new Map<string, Truck[]>();
    for (const truck of this.trucks) {
      if (!warehouseTrucks.has(truck.warehouseId)) {
        warehouseTrucks.set(truck.warehouseId, []);
      }
      warehouseTrucks.get(truck.warehouseId)!.push(truck);
    }

    const routes: Route[] = [];

    for (const [warehouseId, storeIds] of warehouseAssignments.entries()) {
      if (!storeIds.length) continue;
      const trucks = warehouseTrucks.get(warehouseId) || [];
      if (!trucks.length) continue;

      const storesToAssign = [...this.stores.filter(s => storeIds.includes(s.id))];
      storesToAssign.sort((a, b) => b.demand - a.demand);

      for (const truck of trucks) {
        const truckCapacity = truck.capacity;
        let currentCapacity = 0;
        const currentRoute: string[] = [];

        for (let i = storesToAssign.length - 1; i >= 0; i--) {
          const store = storesToAssign[i];
          if (currentCapacity + store.demand <= truckCapacity) {
            currentRoute.push(store.id);
            currentCapacity += store.demand;
            storesToAssign.splice(i, 1); // Quita la tienda de la lista
          }
        }

        if (currentRoute.length > 0) {
          const optimizedRoute = this._optimizeRoute(warehouseId, currentRoute);
          const [distance, time] = this._calculateRouteMetrics(warehouseId, optimizedRoute, truck.speed);
          routes.push({
            id: `route_${routes.length + 1}_${Date.now()}`,
            warehouseId: warehouseId,
            truckId: truck.id,
            stores: optimizedRoute,
            distance: parseFloat(distance.toFixed(2)),
            estimatedTime: parseFloat(time.toFixed(2)),
            created: new Date().toISOString(),
          });
        }
      }
      
      // Asigna tiendas sobrantes al primer camión (lógica simplificada)
      if (storesToAssign.length > 0 && trucks.length > 0) {
        const firstTruck = trucks[0];
        const remainingStoreIds = storesToAssign.map(s => s.id);
        const optimizedRoute = this._optimizeRoute(warehouseId, remainingStoreIds);
        const [distance, time] = this._calculateRouteMetrics(warehouseId, optimizedRoute, firstTruck.speed);
        routes.push({
          id: `route_${routes.length + 1}_${Date.now()}`,
          warehouseId: warehouseId,
          truckId: firstTruck.id,
          stores: optimizedRoute,
          distance: parseFloat(distance.toFixed(2)),
          estimatedTime: parseFloat(time.toFixed(2)),
          created: new Date().toISOString(),
        });
      }
    }
    this.routes = routes;
    return routes;
  }

  _optimizeRoute(warehouseId: string, storeIds: string[]): string[] {
    if (storeIds.length === 0) return [];
    const unvisited = [...storeIds];
    let currentLocation = warehouseId;
    const tour: string[] = [];
    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let minDistance = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const dist = this._getDistance(currentLocation, unvisited[i]);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }
      const nearest = unvisited[nearestIndex];
      tour.push(nearest);
      currentLocation = nearest;
      unvisited.splice(nearestIndex, 1);
    }
    return tour;
  }

  _calculateRouteMetrics(warehouseId: string, storeIds: string[], speed: number): [number, number] {
    if (storeIds.length === 0) return [0.0, 0.0];
    let totalDistance = 0.0;
    totalDistance += this._getDistance(warehouseId, storeIds[0]);
    for (let i = 0; i < storeIds.length - 1; i++) {
      totalDistance += this._getDistance(storeIds[i], storeIds[i + 1]);
    }
    totalDistance += this._getDistance(storeIds[storeIds.length - 1], warehouseId);
    const totalTime = totalDistance / speed;
    return [totalDistance, totalTime];
  }

  _calculateRouteDistance(warehouseId: string, storeIds: string[]): number {
    if (storeIds.length === 0) return 0.0;
    let totalDistance = 0.0;
    totalDistance += this._getDistance(warehouseId, storeIds[0]);
    for (let i = 0; i < storeIds.length - 1; i++) {
      totalDistance += this._getDistance(storeIds[i], storeIds[i + 1]);
    }
    totalDistance += this._getDistance(storeIds[storeIds.length - 1], warehouseId);
    return totalDistance;
  }

  _twoOpt(warehouseId: string, route: string[]): string[] {
    let bestRoute = [...route];
    let improved = true;
    while (improved) {
      improved = false;
      let bestDistance = this._calculateRouteDistance(warehouseId, bestRoute);
      for (let i = 0; i < route.length - 1; i++) {
        for (let j = i + 1; j < route.length; j++) {
          const newRoute = [...bestRoute];
          // Invierte el segmento
          const segmentToReverse = newRoute.slice(i, j + 1).reverse();
          newRoute.splice(i, j - i + 1, ...segmentToReverse);
          
          const newDistance = this._calculateRouteDistance(warehouseId, newRoute);
          if (newDistance < bestDistance) {
            bestDistance = newDistance;
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }
    return bestRoute;
  }
  
  improveRoutes(iterations = 100) {
    if (this.routes.length === 0) this.createInitialRoutes();
    
    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < this.routes.length; i++) {
            const route = this.routes[i];
            const storeIds = route.stores;
            if (storeIds.length >= 4) {
                const improvedRoute = this._twoOpt(route.warehouseId, storeIds);
                if (improvedRoute !== storeIds) {
                    const truck = this.trucks.find(t => t.id === route.truckId);
                    if (truck) {
                        const [distance, time] = this._calculateRouteMetrics(route.warehouseId, improvedRoute, truck.speed);
                        this.routes[i].stores = improvedRoute;
                        this.routes[i].distance = parseFloat(distance.toFixed(2));
                        this.routes[i].estimatedTime = parseFloat(time.toFixed(2));
                    }
                }
            }
        }
    }
    return this.routes;
  }

  solve(iterations = 100): Route[] {
    this.createInitialRoutes();
    this.improveRoutes(iterations);
    return this.routes;
  }
}

// --- El Servidor (Manejador de la Función) ---
serve(async (req) => {
  // Manejo de CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("--- solve-mdvrp INVOCADA ---");

  try {
    // --- ¡NUEVO! Crear un cliente de Supabase ---
    // Necesario para hablar con la base de datos
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    // --- FIN DE BLOQUE NUEVO ---

    const { warehouses, stores, trucks } = await req.json();

    console.log("Datos recibidos:", { 
      warehousesCount: warehouses?.length || 0, 
      storesCount: stores?.length || 0, 
      trucksCount: trucks?.length || 0 
    });

    if (!warehouses || !stores || !trucks) {
      throw new Error('Faltan datos (warehouses, stores, trucks)');
    }

    const solver = new MDVRPSolverTS(warehouses, stores, trucks);
    const optimizedRoutes: Route[] = solver.solve(); // Obtiene las rutas

    console.log("Algoritmo finalizado. Rutas generadas:", optimizedRoutes);

    // --- ¡NUEVO! Guardar las rutas en la base de datos ---
    if (optimizedRoutes.length > 0) {
      // Preparamos los datos para la tabla 'routes'
      const routesToInsert = optimizedRoutes.map(route => ({
        // 'id' y 'created_at' se generan automáticamente
        warehouse_id: route.warehouseId,
        truck_id: route.truckId,
        distance: route.distance,
        estimated_time: route.estimatedTime,
        stores_sequence: route.stores // jsonb acepta arrays
      }));

      console.log("Guardando rutas en la base de datos...");

      // Insertamos en la tabla 'routes'
      const { error: insertError } = await supabaseClient
        .from('routes')
        .insert(routesToInsert);

      if (insertError) {
        console.error("Error al guardar rutas:", insertError);
        throw new Error(`Error al guardar rutas: ${insertError.message}`);
      }

      console.log("¡Rutas guardadas exitosamente!");
    }
    // --- FIN DE BLOQUE NUEVO ---

    // 4. Devuelve el resultado (esto no cambia)
    return new Response(
      JSON.stringify({ routes: optimizedRoutes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("¡ERROR DENTRO DE LA FUNCIÓN!", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});