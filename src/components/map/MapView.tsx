import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import useDataStore from '../../store/dataStore';
import { Warehouse, Store } from '../../types';

// --- 1. Arreglo de Iconos (Estándar y Funcional) ---
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

// --- 2. Componente RouteLayer (Lógica Pura) ---
// Este componente crea la ruta y maneja los errores de red silenciosamente
const RouteLayer: React.FC<{
  warehouse: Warehouse;
  stores: Store[];
  color: string;
}> = ({ warehouse, stores, color }) => {
  const map = useMap();

  useEffect(() => {
    if (!warehouse || !stores || stores.length === 0) return;

    // Puntos de la ruta
    const waypoints = [
      L.latLng(warehouse.location.lat, warehouse.location.lng),
      ...stores.map(s => L.latLng(s.location.lat, s.location.lng)),
      L.latLng(warehouse.location.lat, warehouse.location.lng)
    ];

    // Crear el control
    const routingControl = L.Routing.control({
      waypoints,
      show: false, // No mostrar panel de texto
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true, // Ajustar zoom automáticamente
      lineOptions: {
        styles: [{ color, weight: 5, opacity: 0.8 }]
      },
      createMarker: () => null // No crear marcadores extra
    });

    // --- PROTECCIÓN CONTRA CRASH ---
    // Escuchamos el evento de error. Si OSRM falla (timeout), 
    // esto evita que el error suba a React y ponga la pantalla blanca.
    routingControl.on('routingerror', function(e) {
      console.warn('Routing error (OSRM limit reached):', e);
    });

    // Añadir al mapa
    routingControl.addTo(map);

    // Limpieza al desmontar
    return () => {
      try {
        map.removeControl(routingControl);
      } catch (e) {
        console.warn("Error cleaning up map control", e);
      }
    };
  }, [map, warehouse, stores, color]);

  return null;
};

// --- 3. Componente para ajustar Zoom (Bounds) ---
const MapBounds: React.FC<{ warehouses: Warehouse[]; stores: Store[] }> = ({ warehouses, stores }) => {
  const map = useMap();
  
  useEffect(() => {
    if (warehouses.length === 0 && stores.length === 0) return;
    
    const points: [number, number][] = [];
    warehouses.forEach(w => points.push([w.location.lat, w.location.lng]));
    stores.forEach(s => points.push([s.location.lat, s.location.lng]));
    
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
    }
  }, [map, warehouses, stores]);
  
  return null;
};

// --- 4. Componente Principal MapView ---
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

  // Lógica simple: Si hay una ruta seleccionada, esa es la única que pintamos.
  // Si no hay ninguna seleccionada, no pintamos nada (para evitar el timeout).
  const routeToRender = selectedRoute 
    ? routes.find(r => r.id === selectedRoute) 
    : null;

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-md z-0 relative">
      <MapContainer
        center={[19.24, -103.72]} 
        zoom={10}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds warehouses={warehouses} stores={stores} />
        
        {/* Marcadores de Almacenes */}
        {showWarehouses && warehouses.map(w => (
          <Marker key={w.id} position={[w.location.lat, w.location.lng]} icon={warehouseIcon}>
            <Popup>
              <div className="font-bold">{w.name}</div>
              <div className="text-xs">{w.address}</div>
            </Popup>
          </Marker>
        ))}
        
        {/* Marcadores de Tiendas */}
        {showStores && stores.map(s => (
          <Marker key={s.id} position={[s.location.lat, s.location.lng]} icon={storeIcon}>
            <Popup>
              <div className="font-bold">{s.name}</div>
              <div className="text-xs">{s.address}</div>
              <div className="text-xs">Demanda: {s.demand}</div>
            </Popup>
          </Marker>
        ))}
        
        {/* Renderizado de la RUTA ÚNICA */}
        {showRoutes && routeToRender && (() => {
            const warehouse = warehouses.find(w => w.id === routeToRender.warehouseId);
            // Filtramos las tiendas asegurando que existen
            const routeStores = stores.filter(s => routeToRender.stores?.includes(s.id));
            
            if (warehouse && routeStores.length > 0) {
                return (
                    <RouteLayer 
                        // USAR KEY ES CRUCIAL: Fuerza a React a destruir y crear de nuevo el componente
                        // cuando cambia la ruta, evitando conflictos de Leaflet.
                        key={routeToRender.id} 
                        warehouse={warehouse}
                        stores={routeStores}
                        color="#2563eb"
                    />
                );
            }
            return null;
        })()}

      </MapContainer>
    </div>
  );
};

export default MapView;