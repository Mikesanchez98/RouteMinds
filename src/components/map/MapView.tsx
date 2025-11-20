import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import useDataStore from '../../store/dataStore';
import { Warehouse, Store } from '../../types';

// --- 1. CONFIGURACIÓN DE ICONOS ---
// Arreglo para los iconos por defecto de Leaflet que a veces fallan en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Iconos personalizados de colores
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

// --- 2. COMPONENTE RouteLayer (Dibuja las líneas) ---
const RouteLayer: React.FC<{
  warehouse: Warehouse;
  stores: Store[];
  color: string;
  isSelected: boolean;
}> = ({ warehouse, stores, color, isSelected }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!stores.length) return;
    
    // Puntos de la ruta: Almacén -> Tiendas -> Almacén
    const waypoints = [
      L.latLng(warehouse.location.lat, warehouse.location.lng),
      ...stores.map(store => L.latLng(store.location.lat, store.location.lng)),
      L.latLng(warehouse.location.lat, warehouse.location.lng),
    ];
    
    // Crear el control de rutas
    const routingControl = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: false,
      show: isSelected, // Muestra las instrucciones solo si está seleccionada
      lineOptions: {
        styles: [{ color, weight: 4, opacity: 0.7 }]
      },
      createMarker: () => null, // No crear marcadores extra (usamos los nuestros)
    }).addTo(map);
    
    // Limpieza al desmontar
    return () => {
      if (routingControl) {
        routingControl.remove();
      }
    };
  }, [map, warehouse, stores, color, isSelected]);
  
  return null;
};

// --- 3. COMPONENTE MapBounds (Ajusta el zoom) ---
interface MapBoundsProps {
  warehouses: Warehouse[];
  stores: Store[];
}

const MapBounds: React.FC<MapBoundsProps> = ({ warehouses, stores }) => {
  const map = useMap();
  
  useEffect(() => {
    if (warehouses.length === 0 && stores.length === 0) return;
    
    const allPoints = [
      ...warehouses.map(w => [w.location.lat, w.location.lng]),
      ...stores.map(s => [s.location.lat, s.location.lng]),
    ] as [number, number][];
    
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, warehouses, stores]);
  
  return null;
};

// --- 4. COMPONENTE PRINCIPAL MapView ---

// Definimos qué propiedades acepta este componente
interface MapViewProps {
  showRoutes?: boolean;
  selectedRoute?: string;
  showWarehouses?: boolean; // Nuevo: Filtro de almacenes
  showStores?: boolean;     // Nuevo: Filtro de tiendas
}

const MapView: React.FC<MapViewProps> = ({ 
  showRoutes = true, 
  selectedRoute,
  showWarehouses = true, // Por defecto se muestran
  showStores = true      // Por defecto se muestran
}) => {
  const { warehouses, stores, routes } = useDataStore();
  
  // Filtramos las rutas si hay una seleccionada específicamente
  const filteredRoutes = selectedRoute 
    ? routes.filter(route => route.id === selectedRoute)
    : routes;

  // Solo mostramos instrucciones si hay una ruta específica seleccionada
  const showInstructions = !!selectedRoute;
  
  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={[40, -95]} // Centro por defecto (se ajustará solo con MapBounds)
        zoom={4}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds warehouses={warehouses} stores={stores} />
        
        {/* --- RENDERIZADO DE ALMACENES (Con filtro) --- */}
        {showWarehouses && warehouses.map((warehouse) => (
          <Marker
            key={warehouse.id}
            position={[warehouse.location.lat, warehouse.location.lng]}
            icon={warehouseIcon}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{warehouse.name}</h3>
                <p className="text-sm">{warehouse.address}</p>
                <p className="text-sm mt-1">Capacity: {warehouse.capacity}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* --- RENDERIZADO DE TIENDAS (Con filtro) --- */}
        {showStores && stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.location.lat, store.location.lng]}
            icon={storeIcon}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{store.name}</h3>
                <p className="text-sm">{store.address}</p>
                <p className="text-sm mt-1">Demand: {store.demand}</p>
                {store.timeWindow && (
                  <p className="text-sm">
                    Hours: {store.timeWindow.start} - {store.timeWindow.end}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* --- RENDERIZADO DE RUTAS (Con filtro) --- */}
        {showRoutes && filteredRoutes.map((route) => {
          const warehouse = warehouses.find(w => w.id === route.warehouseId);
          if (!warehouse) return null;
          
          const routeStores = stores.filter(s => route.stores.includes(s.id));
          if (routeStores.length === 0) return null;
          
          // Generar color basado en ID
          const routeColor = `#${route.id.substring(0, 6).padEnd(6, '0')}`;
          
          return (
            <RouteLayer
              key={route.id}
              warehouse={warehouse}
              stores={routeStores}
              color={routeColor}
              isSelected={showInstructions}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;