import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import useDataStore from '../../store/dataStore';
import { Warehouse, Store, Route as RouteType } from '../../types';

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
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

// RouteLayer component to handle routing
const RouteLayer: React.FC<{
  warehouse: Warehouse;
  stores: Store[];
  color: string;
}> = ({ warehouse, stores, color }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!stores.length) return;
    
    // Create waypoints starting from warehouse
    const waypoints = [
      L.latLng(warehouse.location.lat, warehouse.location.lng),
      ...stores.map(store => L.latLng(store.location.lat, store.location.lng)),
      L.latLng(warehouse.location.lat, warehouse.location.lng), // Return to warehouse
    ];
    
    // Create the routing control
    const routingControl = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: false,
      lineOptions: {
        styles: [{ color, weight: 4, opacity: 0.7 }]
      },
      createMarker: () => null, // Don't show default markers
    }).addTo(map);
    
    // Cleanup - use remove() instead of removeControl
    return () => {
      if (routingControl) {
        routingControl.remove();
      }
    };
  }, [map, warehouse, stores, color]);
  
  return null;
};

// MapBounds component to set the map view to fit all markers
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

interface MapViewProps {
  showRoutes?: boolean;
  selectedRoute?: string;
}

const MapView: React.FC<MapViewProps> = ({ showRoutes = true, selectedRoute }) => {
  const { warehouses, stores, routes } = useDataStore();
  
  // Filter routes based on selectedRoute prop
  const filteredRoutes = selectedRoute 
    ? routes.filter(route => route.id === selectedRoute)
    : routes;
  
  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={[40, -95]} // Default center (US)
        zoom={4}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds warehouses={warehouses} stores={stores} />
        
        {/* Warehouses */}
        {warehouses.map((warehouse) => (
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
        
        {/* Stores */}
        {stores.map((store) => (
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
        
        {/* Routes */}
        {showRoutes && filteredRoutes.map((route) => {
          const warehouse = warehouses.find(w => w.id === route.warehouseId);
          if (!warehouse) return null;
          
          const routeStores = stores.filter(s => route.stores.includes(s.id));
          if (routeStores.length === 0) return null;
          
          // Generate a color based on the route id
          const routeColor = `#${route.id.substring(0, 6).padEnd(6, '0')}`;
          
          return (
            <RouteLayer
              key={route.id}
              warehouse={warehouse}
              stores={routeStores}
              color={routeColor}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;