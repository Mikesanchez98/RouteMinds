"""
Solucionador del Problema de Ruteo de Vehículos con Múltiples Depósitos (MDVRP)

Este módulo contiene algoritmos para resolver el Problema de Ruteo de Vehículos con Múltiples Depósitos.
Puede ser utilizado como un script independiente o importado como un módulo.

El MDVRP es una extensión del VRP donde hay múltiples depósitos (almacenes) disponibles,
y los vehículos deben ser asignados a depósitos y las rutas deben ser construidas para atender a los clientes.
"""

import math
import json
import random
from typing import List, Dict, Tuple, Any

# Alias de tipos
Location = Tuple[float, float]           # Tupla de (latitud, longitud)
Warehouse = Dict[str, Any]               # Diccionario con datos del almacén
Store = Dict[str, Any]                   # Diccionario con datos de la tienda
Truck = Dict[str, Any]                   # Diccionario con datos del camión
Route = Dict[str, Any]                   # Diccionario con datos de la ruta

class MDVRPSolver:
    """
    Solucionador del Problema de Ruteo de Vehículos con Múltiples Depósitos
    
    Esta clase implementa algoritmos para resolver el MDVRP usando:
    1. Construcción inicial mediante vecino más cercano
    2. Mejora mediante métodos de búsqueda local
    """
    
    def __init__(self, warehouses: List[Warehouse], stores: List[Store], trucks: List[Truck]):
        """
        Inicializa el solucionador MDVRP
        
        Args:
            warehouses: Lista de objetos almacén con id, ubicación, etc.
            stores: Lista de objetos tienda con id, ubicación, demanda, etc.
            trucks: Lista de objetos camión con id, capacidad, id_almacén, etc.
        """
        self.warehouses = warehouses
        self.stores = stores
        self.trucks = trucks
        self.routes = []
        
        # Precalcula distancias
        self.distances = {}
        self._precompute_distances()
    
    def _precompute_distances(self):
        """Calcula y almacena todas las distancias entre pares de ubicaciones"""
        # Almacena distancias entre almacenes
        for w1 in self.warehouses:
            for w2 in self.warehouses:
                self.distances[(w1['id'], w2['id'])] = self._calculate_distance(
                    (w1['location']['lat'], w1['location']['lng']), 
                    (w2['location']['lat'], w2['location']['lng'])
                )
        
        # Almacena distancias entre almacenes y tiendas
        for w in self.warehouses:
            for s in self.stores:
                self.distances[(w['id'], s['id'])] = self._calculate_distance(
                    (w['location']['lat'], w['location']['lng']),
                    (s['location']['lat'], s['location']['lng'])
                )
                self.distances[(s['id'], w['id'])] = self.distances[(w['id'], s['id'])]
        
        # Almacena distancias entre tiendas
        for s1 in self.stores:
            for s2 in self.stores:
                self.distances[(s1['id'], s2['id'])] = self._calculate_distance(
                    (s1['location']['lat'], s1['location']['lng']),
                    (s2['location']['lat'], s2['location']['lng'])
                )
    
    def _calculate_distance(self, loc1: Location, loc2: Location) -> float:
        """
        Calcula la distancia de Haversine entre dos ubicaciones
        
        Args:
            loc1: Tupla de (latitud, longitud) para la primera ubicación
            loc2: Tupla de (latitud, longitud) para la segunda ubicación
            
        Returns:
            Distancia en kilómetros
        """
        lat1, lon1 = loc1
        lat2, lon2 = loc2
        
        # Convierte a radianes
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Fórmula de Haversine
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Radio de la tierra en kilómetros
        return c * r
    
    def assign_stores_to_warehouses(self):
        """
        Asigna tiendas a almacenes basándose en proximidad
        
        Returns:
            Diccionario que mapea IDs de almacenes a listas de IDs de tiendas
        """
        assignments = {w['id']: [] for w in self.warehouses}
        
        # Para cada tienda, encuentra el almacén más cercano
        for store in self.stores:
            closest_warehouse = None
            min_distance = float('inf')
            
            for warehouse in self.warehouses:
                dist = self.distances[(warehouse['id'], store['id'])]
                if dist < min_distance:
                    min_distance = dist
                    closest_warehouse = warehouse['id']
            
            if closest_warehouse:
                assignments[closest_warehouse].append(store['id'])
        
        return assignments
    
    def create_initial_routes(self):
        """
        Crea rutas iniciales usando una heurística de construcción simple
        
        Returns:
            Lista de rutas
        """
        # Primero, asigna tiendas a almacenes
        warehouse_assignments = self.assign_stores_to_warehouses()
        
        # Agrupa camiones por almacén
        warehouse_trucks = {}
        for truck in self.trucks:
            if truck['warehouseId'] not in warehouse_trucks:
                warehouse_trucks[truck['warehouseId']] = []
            warehouse_trucks[truck['warehouseId']].append(truck)
        
        routes = []
        
        # Para cada almacén, crea rutas para sus camiones
        for warehouse_id, store_ids in warehouse_assignments.items():
            if not store_ids:  # Omite si no hay tiendas asignadas
                continue
                
            # Obtiene camiones para este almacén
            trucks = warehouse_trucks.get(warehouse_id, [])
            if not trucks:  # Omite si no hay camiones
                continue
            
            # Obtiene objetos tienda
            stores_to_assign = [s for s in self.stores if s['id'] in store_ids]
            
            # Ordena tiendas por demanda (descendente)
            stores_to_assign.sort(key=lambda s: s['demand'], reverse=True)
            
            # Encuentra el objeto almacén
            warehouse = next(w for w in self.warehouses if w['id'] == warehouse_id)
            
            # Crea rutas usando un enfoque simple de empaquetado
            for truck in trucks:
                truck_capacity = truck['capacity']
                current_route = []
                current_capacity = 0
                
                # Enfoque voraz - añade tiendas hasta llenar el camión
                for store in stores_to_assign[:]:
                    if current_capacity + store['demand'] <= truck_capacity:
                        current_route.append(store['id'])
                        current_capacity += store['demand']
                        stores_to_assign.remove(store)
                
                if current_route:
                    # Optimiza la ruta usando vecino más cercano
                    optimized_route = self._optimize_route(warehouse_id, current_route)
                    
                    # Calcula distancia y tiempo de la ruta
                    distance, time = self._calculate_route_metrics(
                        warehouse_id, truck['id'], optimized_route, truck['speed']
                    )
                    
                    # Crea ruta
                    route = {
                        'id': f"route_{len(routes) + 1}",
                        'warehouseId': warehouse_id,
                        'truckId': truck['id'],
                        'stores': optimized_route,
                        'distance': distance,
                        'estimatedTime': time,
                        'created': "2023-01-01T00:00:00Z"  # Placeholder
                    }
                    
                    routes.append(route)
            
            # Si quedan tiendas, asígnalas al primer camión
            if stores_to_assign and trucks:
                first_truck = trucks[0]
                remaining_store_ids = [s['id'] for s in stores_to_assign]
                
                # Optimiza la ruta
                optimized_route = self._optimize_route(warehouse_id, remaining_store_ids)
                
                # Calcula distancia y tiempo de la ruta
                distance, time = self._calculate_route_metrics(
                    warehouse_id, first_truck['id'], optimized_route, first_truck['speed']
                )
                
                # Crea ruta
                route = {
                    'id': f"route_{len(routes) + 1}",
                    'warehouseId': warehouse_id,
                    'truckId': first_truck['id'],
                    'stores': optimized_route,
                    'distance': distance,
                    'estimatedTime': time,
                    'created': "2023-01-01T00:00:00Z"  # Placeholder
                }
                
                routes.append(route)
        
        self.routes = routes
        return routes
    
    def _optimize_route(self, warehouse_id: str, store_ids: List[str]) -> List[str]:
        """
        Optimiza una ruta usando la heurística del vecino más cercano
        
        Args:
            warehouse_id: ID del almacén
            store_ids: Lista de IDs de tiendas a visitar
            
        Returns:
            Lista optimizada de IDs de tiendas
        """
        if not store_ids:
            return []
        
        unvisited = store_ids.copy()
        current_location = warehouse_id
        tour = []
        
        while unvisited:
            # Encuentra la tienda no visitada más cercana
            nearest = min(unvisited, key=lambda store_id: self.distances[(current_location, store_id)])
            tour.append(nearest)
            current_location = nearest
            unvisited.remove(nearest)
        
        return tour
    
    def _calculate_route_metrics(self, warehouse_id: str, truck_id: str, 
                                store_ids: List[str], speed: float) -> Tuple[float, float]:
        """
        Calcula la distancia y tiempo estimado de la ruta
        
        Args:
            warehouse_id: ID del almacén
            truck_id: ID del camión
            store_ids: Lista de IDs de tiendas en la ruta
            speed: Velocidad del camión en km/h
            
        Returns:
            Tupla de (distancia en km, tiempo en horas)
        """
        if not store_ids:
            return 0.0, 0.0
        
        total_distance = 0.0
        
        # Distancia desde el almacén a la primera tienda
        total_distance += self.distances[(warehouse_id, store_ids[0])]
        
        # Distancia entre tiendas
        for i in range(len(store_ids) - 1):
            total_distance += self.distances[(store_ids[i], store_ids[i+1])]
        
        # Distancia desde la última tienda de vuelta al almacén
        total_distance += self.distances[(store_ids[-1], warehouse_id)]
        
        # Calcula tiempo (distancia / velocidad)
        total_time = total_distance / speed
        
        return total_distance, total_time
    
    def improve_routes(self, iterations: int = 100):
        """
        Mejora las rutas usando técnicas de búsqueda local
        
        Args:
            iterations: Número de iteraciones de mejora
            
        Returns:
            Lista mejorada de rutas
        """
        if not self.routes:
            self.create_initial_routes()
        
        for _ in range(iterations):
            # Aplica búsqueda local 2-opt a cada ruta
            for i, route in enumerate(self.routes):
                store_ids = route['stores']
                if len(store_ids) >= 4:  # Solo aplica 2-opt si hay suficientes tiendas
                    improved_route = self._two_opt(route['warehouseId'], store_ids)
                    
                    if improved_route != store_ids:
                        # Actualiza ruta con secuencia mejorada
                        self.routes[i]['stores'] = improved_route
                        
                        # Recalcula métricas
                        truck = next(t for t in self.trucks if t['id'] == route['truckId'])
                        distance, time = self._calculate_route_metrics(
                            route['warehouseId'], route['truckId'], improved_route, truck['speed']
                        )
                        
                        self.routes[i]['distance'] = distance
                        self.routes[i]['estimatedTime'] = time
        
        return self.routes
    
    def _two_opt(self, warehouse_id: str, route: List[str]) -> List[str]:
        """
        Aplica búsqueda local 2-opt para mejorar una ruta
        
        Args:
            warehouse_id: ID del almacén
            route: Lista de IDs de tiendas representando la ruta
            
        Returns:
            Ruta mejorada
        """
        best_route = route.copy()
        improved = True
        
        while improved:
            improved = False
            best_distance = self._calculate_route_distance(warehouse_id, best_route)
            
            for i in range(len(route) - 1):
                for j in range(i + 1, len(route)):
                    new_route = best_route.copy()
                    # Invierte el segmento entre i y j
                    new_route[i:j+1] = reversed(new_route[i:j+1])
                    
                    new_distance = self._calculate_route_distance(warehouse_id, new_route)
                    
                    if new_distance < best_distance:
                        best_distance = new_distance
                        best_route = new_route
                        improved = True
            
        return best_route
    
    def _calculate_route_distance(self, warehouse_id: str, store_ids: List[str]) -> float:
        """
        Calcula la distancia total de una ruta
        
        Args:
            warehouse_id: ID del almacén
            store_ids: Lista de IDs de tiendas en la ruta
            
        Returns:
            Distancia total en km
        """
        if not store_ids:
            return 0.0
        
        total_distance = 0.0
        
        # Distancia desde el almacén a la primera tienda
        total_distance += self.distances[(warehouse_id, store_ids[0])]
        
        # Distancia entre tiendas
        for i in range(len(store_ids) - 1):
            total_distance += self.distances[(store_ids[i], store_ids[i+1])]
        
        # Distancia desde la última tienda de vuelta al almacén
        total_distance += self.distances[(store_ids[-1], warehouse_id)]
        
        return total_distance

def solve_mdvrp(warehouses, stores, trucks, iterations=100):
    """
    Resuelve el problema MDVRP
    
    Args:
        warehouses: Lista de objetos almacén
        stores: Lista de objetos tienda
        trucks: Lista de objetos camión
        iterations: Número de iteraciones de mejora
        
    Returns:
        Lista de rutas optimizadas
    """
    solver = MDVRPSolver(warehouses, stores, trucks)
    solver.create_initial_routes()
    solver.improve_routes(iterations)
    return solver.routes

if __name__ == "__main__":
    """
    Ejemplo de uso como script independiente
    
    La entrada debe ser un archivo JSON con almacenes, tiendas y camiones
    La salida será un archivo JSON con rutas optimizadas
    """
    import sys
    
    if len(sys.argv) < 3:
        print("Uso: python mdvrp.py entrada.json salida.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        warehouses = data.get('warehouses', [])
        stores = data.get('stores', [])
        trucks = data.get('trucks', [])
        
        routes = solve_mdvrp(warehouses, stores, trucks)
        
        with open(output_file, 'w') as f:
            json.dump({'routes': routes}, f, indent=2)
            
        print(f"MDVRP resuelto exitosamente y resultados escritos en {output_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)