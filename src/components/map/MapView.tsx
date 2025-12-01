import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'; // <--- Importamos Polyline
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import useDataStore from '../../store/dataStore';
import { Warehouse, Store } from '../../types';

// --- 1. CONFIGURACIÓN DE ICONOS ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const warehouseIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// --- 2. FUNCION AUXILIAR DE VALIDACIÓN ---
const isValidCoord = (lat: any, lng: any) => {
  const numLat = Number(lat);
  const numLng = Number(lng);
  return Number.isFinite(numLat) && Number.isFinite(numLng) && Math.abs(numLat) <= 90 && Math.abs(numLng) <= 180;
};

// --- 3. COMPONENTE RouteLayer (Para Ruta Detallada) ---
const RouteLayer: React.FC<{
  warehouse: Warehouse;
  stores: Store[];
  color: string;
  isSelected: boolean;
}> = ({ warehouse, stores, color, isSelected }) => {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  
  useEffect(() => {
    if (!warehouse?.location || !stores || !Array.isArray(stores)) return;
    if (!isValidCoord(warehouse.location.lat, warehouse.location.lng)) return;

    const validStores = stores.filter(s => s.location && isValidCoord(s.location.lat, s.location.lng));
    if (validStores.length === 0) return;

    // Limpieza previa
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      } catch (e) {}
    }

    try {
      const waypoints = [
        L.latLng(Number(warehouse.location.lat), Number(warehouse.location.lng)),
        ...validStores.map(store => L.latLng(Number(store.location.lat), Number(store.location.lng))),
        L.latLng(Number(warehouse.location.lat), Number(warehouse.location.lng)),
      ];

      const routingControl = L.Routing.control({
        waypoints,
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: isSelected,
        show: false,
        lineOptions: {
          styles: [{ color, weight: isSelected ? 6 : 4, opacity: isSelected ? 1 : 0.6 }]
        },
        createMarker: () => null,
        addWaypoints: false,
        draggableWaypoints: false,
        // @ts-ignore
        containerClassName: 'routing-container-hidden'
      });

      routingControl.addTo(map);
      routingControlRef.current = routingControl;

      if (isSelected) {
        const container = routingControl.getContainer();
        if (container) container.style.zIndex = "1000";
      }

    } catch (error) {
      console.error("Error en Leaflet Routing Machine:", error);
    }

    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {}
      }
    };
  }, [map, warehouse, stores, color, isSelected]);
  
  return null;
};

// --- 4. NUEVO: Componente SimpleRoute (Líneas Rectas para Vista General) ---
const SimpleRouteLayer: React.FC<{
    warehouse: Warehouse;
    stores: Store[];
    color: string;
}> = ({ warehouse, stores, color }) => {
    if (!warehouse?.location || !stores || stores.length === 0) return null;

    // Construir array de coordenadas: [Lat, Lng]
    // Almacén -> Tienda 1 -> Tienda 2 ... -> Almacén
    const positions: [number, number][] = [];
    
    // Inicio
    if (isValidCoord(warehouse.location.lat, warehouse.location.lng)) {
        positions.push([Number(warehouse.location.lat), Number(warehouse.location.lng)]);
    }

    // Tiendas
    stores.forEach(s => {
        if (isValidCoord(s.location.lat, s.location.lng)) {
            positions.push([Number(s.location.lat), Number(s.location.lng)]);
        }
    });

    // Regreso (cerrar ciclo)
    if (positions.length > 0) {
        positions.push(positions[0]);
    }

    return (
        <Polyline 
            positions={positions} 
            pathOptions={{ color: color, weight: 2, opacity: 0.5, dashArray: '5, 10' }} 
        />
    );
};


// --- 5. COMPONENTE MapBounds ---
const MapBounds: React.FC<{ warehouses: Warehouse[]; stores: Store[] }> = ({ warehouses, stores }) => {
  const map = useMap();
  
  useEffect(() => {
    const validPoints: [number, number][] = [];
    warehouses.forEach(w => {
        if(isValidCoord(w.location?.lat, w.location?.lng)) validPoints.push([Number(w.location.lat), Number(w.location.lng)]);
    });
    stores.forEach(s => {
        if(isValidCoord(s.location?.lat, s.location?.lng)) validPoints.push([Number(s.location.lat), Number(s.location.lng)]);
    });
    
    if (validPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (e) { console.warn(e); }
    }
  }, [map, warehouses, stores]);
  
  return null;
};

// --- 6. COMPONENTE PRINCIPAL ---
interface MapViewProps {
  showRoutes?: boolean;
  selectedRoute?: string;
  showWarehouses?: boolean;
  showStores?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ 
  showRoutes = true, 
  selectedRoute,
  showWarehouses = true,
  showStores = true
}) => {
  const { warehouses, stores, routes } = useDataStore();
  
  // Decidimos qué rutas mostrar
  const filteredRoutes = selectedRoute 
    ? routes.filter(route => route.id === selectedRoute) // Si hay selección, solo esa
    : routes; // Si no, TODAS (pero las pintaremos simples)

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-md z-0 relative">
      <MapContainer
        center={[19.24, -103.72]} 
        zoom={10}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds warehouses={warehouses} stores={stores} />
        
        {/* ALMACENES */}
        {showWarehouses && warehouses.map((warehouse) => {
            if (!isValidCoord(warehouse.location?.lat, warehouse.location?.lng)) return null;
            return (
              <Marker
                key={warehouse.id}
                position={[Number(warehouse.location.lat), Number(warehouse.location.lng)]}
                icon={warehouseIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">{warehouse.name}</h3>
                    <p className="text-xs">{warehouse.address}</p>
                  </div>
                </Popup>
              </Marker>
            )
        })}
        
        {/* TIENDAS */}
        {showStores && stores.map((store) => {
            if (!isValidCoord(store.location?.lat, store.location?.lng)) return null;
            return (
              <Marker
                key={store.id}
                position={[Number(store.location.lat), Number(store.location.lng)]}
                icon={storeIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">{store.name}</h3>
                    <p className="text-xs">{store.address}</p>
                    <p className="text-xs mt-1">Demanda: {store.demand}</p>
                  </div>
                </Popup>
              </Marker>
            )
        })}
        
        {/* RUTAS */}
        {showRoutes && filteredRoutes.map((route) => {
          const warehouse = warehouses.find(w => w.id === route.warehouseId);
          if (!warehouse) return null;
          
          const routeStores = stores.filter(s => route.stores?.includes(s.id));
          if (route.stores?.length > 0 && routeStores.length === 0) return null;
          
          // Color único por ruta (hash simple del ID)
          // O azul fijo si está seleccionada
          const isSelected = selectedRoute === route.id;
          const routeColor = isSelected ? '#2563eb' : `#${route.id.substring(0, 6).padEnd(6, '0')}`;

          // ESTRATEGIA HÍBRIDA:
          // 1. Si la ruta está SELECCIONADA -> Usamos RouteLayer (Cálculo real de carreteras)
          // 2. Si NO está seleccionada (Vista general) -> Usamos SimpleRouteLayer (Líneas rectas)
          
          if (isSelected) {
              return (
                <RouteLayer
                  key={route.id} // Key importante para reinicializar
                  warehouse={warehouse}
                  stores={routeStores}
                  color={routeColor}
                  isSelected={true}
                />
              );
          } else {
              return (
                  <SimpleRouteLayer
                    key={`simple-${route.id}`}
                    warehouse={warehouse}
                    stores={routeStores}
                    color={routeColor}
                  />
              );
          }
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;