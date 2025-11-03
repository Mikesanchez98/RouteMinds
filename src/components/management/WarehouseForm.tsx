import React, { useState } from 'react';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useDataStore from '../../store/dataStore';
import { Warehouse } from '../../types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form'; // <-- ¡IMPORTANTE!
import AsyncSelect from 'react-select/async';

// Define el tipo para los datos del formulario (plano)
type WarehouseFormData = {
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  address: string;
};

// --- Funciones de API (Estas las tenías bien) ---
const VITE_LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY;

const loadAddressOptions = (inputValue: string, callback: (options: any[]) => void) => {
  if (!inputValue || inputValue.length < 3) {
    callback([]);
    return;
  }
  fetch(
    `https://api.locationiq.com/v1/autocomplete.php?key=${VITE_LOCATIONIQ_API_KEY}&q=${inputValue}&limit=5&format=json`
  )
    .then(response => response.json())
    .then(data => {
      const options = data.map((place: any) => ({
        label: place.display_name,
        value: {
          address: place.display_name,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
        },
      }));
      callback(options);
    })
    .catch(() => callback([]));
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  if (!lat || !lng) return "";
  try {
    const response = await fetch(
      `https://api.locationiq.com/v1/reverse.php?key=${VITE_LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lng}&format=json`
    );
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    return "Dirección no encontrada";
  } catch (error) {
    console.error("Error en Geocodificación Inversa:", error);
    return "Error al buscar la dirección";
  }
};
// --- Fin de Funciones de API ---


interface WarehouseFormProps {
  warehouse?: Warehouse;
  onComplete: () => void;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({ warehouse, onComplete }) => {
  // 1. ELIMINAMOS todos los 'useState' para los campos del formulario
  const [isGeocoding, setIsGeocoding] = useState(false); // (Este sí se queda)
  
  const { addWarehouse, updateWarehouse } = useDataStore();
  
  // 2. INICIALIZAMOS 'useForm'
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    // Aplanamos los datos por defecto para el formulario
    defaultValues: {
      name: warehouse?.name || '',
      address: warehouse?.address || '',
      lat: warehouse?.location.lat || 0,
      lng: warehouse?.location.lng || 0,
      capacity: warehouse?.capacity || 0,
    },
  });

  // 3. ESTA ES LA FUNCIÓN 'onSubmit' para react-hook-form
  const onSubmitForm: SubmitHandler<WarehouseFormData> = (data) => {
    // 'data' ya está validado y tiene todos los valores
    
    // Reformateamos los datos a la estructura que espera la BD
    const warehouseData = {
      name: data.name,
      address: data.address,
      capacity: Number(data.capacity),
      location: {
        lat: Number(data.lat),
        lng: Number(data.lng),
      },
    };

    if (warehouse) {
      updateWarehouse(warehouse.id, warehouseData);
    } else {
      addWarehouse(warehouseData);
    }
    
    onComplete();
  };

  // 4. ESTA ES LA FUNCIÓN para el botón de 'Buscar Dirección'
  const handleFindAddress = async () => {
    const lat = getValues('lat');
    const lng = getValues('lng');

    if (!lat || !lng) {
      // Podríamos usar 'setError' de RHF, pero un 'alert' es más simple
      alert("Por favor, introduce la latitud y longitud.");
      return;
    }

    setIsGeocoding(true);
    const foundAddress = await reverseGeocode(Number(lat), Number(lng));
    
    // Usamos 'setValue' de RHF para actualizar el campo 'address'
    setValue('address', foundAddress);
    setIsGeocoding(false);
  };

  return (
    // 5. CONECTAMOS el 'handleSubmit' de RHF al <form>
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      
      {/* 6. CONECTAMOS los Inputs con 'register' */}
      {/* CAMPO 'NAME' CONECTADO */}
      <Controller
        name="name"
        control={control}
        rules={{ required: 'El nombre es obligatorio' }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field} 
            label="Warehouse Name"
            error={error?.message}
            fullWidth
            placeholder="Enter warehouse name"
          />
        )}
      />
      
      {/* CAMPO 'CAPACITY' CONECTADO */}
      <Controller
        name="capacity"
        control={control}
        rules={{ 
          required: 'La capacidad es obligatoria', 
          valueAsNumber: true,
          min: { value: 1, message: 'La capacidad debe ser positiva' }
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Capacity"
            type="number"
            error={error?.message}
            fullWidth
            placeholder="Enter capacity"
          />
        )}
      />
      
      {/* 7. El CAMPO DE BÚSQUEDA (este ya lo tenías casi bien) */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Buscar Dirección
        </label>
        <Controller
          name="address"
          control={control}
          rules={{ required: 'La dirección es obligatoria' }}
          render={({ field }) => (
            <AsyncSelect
              {...field}
              id="address"
              cacheOptions
              defaultOptions
              loadOptions={loadAddressOptions}
              placeholder="Empieza a escribir una dirección..."
              isClearable
              onChange={(selectedOption) => {
                if (selectedOption) {
                  // Actualizamos TODOS los campos con 'setValue'
                  setValue('address', selectedOption.label);
                  setValue('lat', selectedOption.value.lat);
                  setValue('lng', selectedOption.value.lng);
                } else {
                  setValue('address', '');
                  setValue('lat', 0);
                  setValue('lng', 0);
                }
              }}
              value={
                field.value
                  ? { label: field.value, value: { address: field.value } }
                  : null
              }
            />
          )}
        />
        {errors.address && (
          <span className="text-xs text-red-600">{errors.address.message}</span>
        )}
      </div>
      
      {/* 8. AÑADIMOS los campos 'lat' y 'lng' (CON CONTROLLER) */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="lat"
          control={control}
          rules={{ 
            required: 'Latitud es requerida', 
            valueAsNumber: true,
            min: { value: -90, message: 'Debe ser > -90' },
            max: { value: 90, message: 'Debe ser < 90' }
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field} // Esto pasa onChange, onBlur, value, etc.
              label="Latitud"
              type="number"
              step="any"
              error={error?.message}
            />
          )}
        />
        <Controller
          name="lng"
          control={control}
          rules={{ 
            required: 'Longitud es requerida', 
            valueAsNumber: true,
            min: { value: -180, message: 'Debe ser > -180' },
            max: { value: 180, message: 'Debe ser < 180' }
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Longitud"
              type="number"
              step="any"
              error={error?.message}
            />
          )}
        />
      </div>

      {/* 9. AÑADIMOS el botón de 'Buscar Dirección' */}
      <div>
        <Button
          type="button" // ¡Importante! 'type="button"'
          onClick={handleFindAddress}
          disabled={isGeocoding}
          variant="outline" // Asumiendo que tienes una variante 'outline'
          fullWidth
        >
          {isGeocoding ? 'Buscando...' : 'Buscar Dirección desde Coordenadas'}
        </Button>
      </div>
      
      {/* Botones de Cancelar y Guardar */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onComplete}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          leftIcon={<WarehouseIcon size={18} />}
        >
          {warehouse ? 'Update' : 'Add'} Warehouse
        </Button>
      </div>
    </form>
  );
};

export default WarehouseForm;