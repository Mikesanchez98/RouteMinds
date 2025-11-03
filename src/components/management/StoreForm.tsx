import React, { useState } from 'react';
import { Store as StoreIcon } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useDataStore from '../../store/dataStore';
import { Store } from '../../types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form'; // <-- IMPORTANTE
import AsyncSelect from 'react-select/async';

// Define el tipo para los datos del formulario (plano)
type StoreFormData = {
  name: string;
  lat: number;
  lng: number;
  demand: number;
  address: string;
  startTime: string;
  endTime: string;
};

// --- Funciones de API (Copiadas de WarehouseForm) ---
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


interface StoreFormProps {
  store?: Store;
  onComplete: () => void;
}

const StoreForm: React.FC<StoreFormProps> = ({ store, onComplete }) => {
  // 1. ELIMINAMOS todos los 'useState' para los campos
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const { addStore, updateStore } = useDataStore();
  
  // 2. INICIALIZAMOS 'useForm'
  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<StoreFormData>({
    // Aplanamos los datos por defecto para el formulario
    defaultValues: {
      name: store?.name || '',
      address: store?.address || '',
      lat: store?.location.lat || 0,
      lng: store?.location.lng || 0,
      demand: store?.demand || 0,
      startTime: store?.timeWindow?.start || '',
      endTime: store?.timeWindow?.end || '',
    },
  });

  // 3. Función 'onSubmit' para react-hook-form
  const onSubmitForm: SubmitHandler<StoreFormData> = (data) => {
    // 'data' ya está validado
    
    // Reformateamos los datos a la estructura que espera la BD
    const storeData = {
      name: data.name,
      address: data.address,
      demand: Number(data.demand),
      location: {
        lat: Number(data.lat),
        lng: Number(data.lng),
      },
      // Lógica para la ventana de tiempo
      timeWindow: data.startTime && data.endTime 
        ? { start: data.startTime, end: data.endTime } 
        : undefined,
    };

    if (store) {
      updateStore(store.id, storeData);
    } else {
      addStore(storeData);
    }
    
    onComplete();
  };

  // 4. Función para el botón de 'Buscar Dirección'
  const handleFindAddress = async () => {
    setIsGeocoding(true);
    const lat = getValues('lat');
    const lng = getValues('lng');

    if (!lat || !lng) {
      alert("Por favor, introduce la latitud y longitud.");
      setIsGeocoding(false);
      return;
    }

    const foundAddress = await reverseGeocode(Number(lat), Number(lng));
    setValue('address', foundAddress);
    setIsGeocoding(false);
  };

  return (
    // 5. CONECTAMOS el 'handleSubmit' de RHF al <form>
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      
      {/* 6. CONECTAMOS los Inputs con <Controller> */}
      <Controller
        name="name"
        control={control}
        rules={{ required: 'El nombre es obligatorio' }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Store Name"
            error={error?.message}
            fullWidth
            placeholder="Enter store name"
          />
        )}
      />
      
      <Controller
        name="demand"
        control={control}
        rules={{ 
          required: 'La demanda es obligatoria', 
          valueAsNumber: true,
          min: { value: 1, message: 'La demanda debe ser positiva' }
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Demand"
            type="number"
            error={error?.message}
            fullWidth
            placeholder="Enter demand amount"
          />
        )}
      />
      
      {/* 7. El CAMPO DE BÚSQUEDA de Dirección */}
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
                  setValue('address', selectedOption.label);
                  setValue('lat', selectedOption.value.lat);
                  setValue('lng', selectedOption.value.lng);
                  field.onChange(selectedOption.label);
                } else {
                  setValue('address', '');
                  setValue('lat', 0);
                  setValue('lng', 0);
                  field.onChange('');
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
      
      {/* 8. CAMPOS 'lat' y 'lng' */}
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
              {...field}
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

      {/* 9. BOTÓN de 'Buscar Dirección' */}
      <div>
        <Button
          type="button" 
          onClick={handleFindAddress}
          disabled={isGeocoding}
          variant="outline"
          fullWidth
        >
          {isGeocoding ? 'Buscando...' : 'Buscar Dirección desde Coordenadas'}
        </Button>
      </div>

      {/* 10. CAMPOS de 'Time Window' */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="startTime"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Opening Time"
              type="time"
              fullWidth
            />
          )}
        />
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Closing Time"
              type="time"
              fullWidth
            />
          )}
        />
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
          leftIcon={<StoreIcon size={18} />}
        >
          {store ? 'Update' : 'Add'} Store
        </Button>
      </div>
    </form>
  );
};

export default StoreForm;