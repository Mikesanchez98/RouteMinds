// Definición de tipos para nuestra aplicación

// Interfaz para el usuario
export interface User {
  id: string;                    // ID único del usuario
  username: string;              // Nombre de usuario
  email: string;                 // Correo electrónico
  role: 'admin' | 'user';        // Rol del usuario (administrador o usuario normal)
}

// Interfaz para ubicaciones geográficas
export interface Location {
  lat: number;                   // Latitud
  lng: number;                   // Longitud
}

// Interfaz para almacenes
export interface Warehouse {
  id: string;                    // ID único del almacén
  name: string;                  // Nombre del almacén
  location: Location;            // Ubicación geográfica
  capacity: number;              // Capacidad total del almacén
  address: string;               // Dirección física
}

// Interfaz para tiendas
export interface Store {
  id: string;                    // ID único de la tienda
  name: string;                  // Nombre de la tienda
  location: Location;            // Ubicación geográfica
  demand: number;                // Demanda de productos
  address: string;               // Dirección física
  timeWindow?: {                 // Ventana de tiempo para entregas (opcional)
    start: string;               // Hora de inicio
    end: string;                 // Hora de fin
  };
}

// Interfaz para camiones
export interface Truck {
  id: string;                    // ID único del camión
  name: string;                  // Nombre o identificador del camión
  capacity: number;              // Capacidad de carga
  speed: number;                 // Velocidad promedio en km/h
  warehouseId: string;           // ID del almacén asignado
}

// Interfaz para rutas
export interface Route {
  id: string;                    // ID único de la ruta
  warehouseId: string;           // ID del almacén de origen
  truckId: string;               // ID del camión asignado
  stores: string[];              // Lista de IDs de tiendas en la ruta
  distance: number;              // Distancia total en kilómetros
  estimatedTime: number;         // Tiempo estimado en horas
  created: string;               // Fecha de creación
}