import React from 'react';
import { Truck as TruckIcon } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useDataStore from '../../store/dataStore';
import { Truck } from '../../types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

// Definimos la estructura del formulario
type TruckFormData = {
  name: string;
  capacity: number;
  speed: number;
  warehouseId: string;
  currentDriverId: string; // <--- NUEVO CAMPO
};

interface TruckFormProps {
  truck?: Truck;
  onComplete: () => void;
}

const TruckForm: React.FC<TruckFormProps> = ({ truck, onComplete }) => {
  // Obtenemos drivers y warehouses del store
  const { addTruck, updateTruck, warehouses, drivers } = useDataStore();
  
  // Inicializamos el formulario
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TruckFormData>({
    defaultValues: {
      name: truck?.name || '',
      capacity: truck?.capacity || 0,
      speed: truck?.speed || 0,
      warehouseId: truck?.warehouseId || '',
      currentDriverId: truck?.currentDriverId || '', // <--- Valor inicial del conductor
    },
  });

  const onSubmitForm: SubmitHandler<TruckFormData> = (data) => {
    // Preparamos los datos para el store
    // El store se encargará de convertirlos a snake_case para Supabase
    const truckData = {
      name: data.name,
      capacity: Number(data.capacity),
      speed: Number(data.speed),
      warehouseId: data.warehouseId,
      currentDriverId: data.currentDriverId || undefined, // Enviar undefined si está vacío
    };

    if (truck) {
      updateTruck(truck.id, truckData);
    } else {
      addTruck(truckData);
    }
    
    onComplete();
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      
      {/* CAMPO NOMBRE */}
      <Controller
        name="name"
        control={control}
        rules={{ required: 'El nombre es obligatorio' }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Truck Name"
            error={error?.message}
            fullWidth
            placeholder="Enter truck name/ID"
          />
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CAMPO CAPACIDAD */}
        <Controller
          name="capacity"
          control={control}
          rules={{ 
            required: 'Capacidad requerida', 
            valueAsNumber: true,
            min: { value: 1, message: 'Debe ser positiva' }
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              type="number"
              label="Capacity"
              error={error?.message}
              fullWidth
              placeholder="Enter capacity"
            />
          )}
        />
        
        {/* CAMPO VELOCIDAD */}
        <Controller
          name="speed"
          control={control}
          rules={{ 
            required: 'Velocidad requerida', 
            valueAsNumber: true,
            min: { value: 1, message: 'Debe ser positiva' }
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              type="number"
              label="Speed (km/h)"
              error={error?.message}
              fullWidth
              placeholder="Enter average speed"
            />
          )}
        />
      </div>
      
      {/* SELECTOR DE ALMACÉN */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assigned Warehouse
        </label>
        <select
          {...register('warehouseId', { required: 'Selecciona un almacén' })}
          className={`
            block w-full px-4 py-2 bg-white border rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${errors.warehouseId ? 'border-red-300' : 'border-gray-300'}
          `}
        >
          <option value="">Select a warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>
        {errors.warehouseId && (
          <p className="mt-1 text-sm text-red-600">{errors.warehouseId.message}</p>
        )}
      </div>

      {/* --- SELECTOR DE CONDUCTOR (NUEVO) --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assigned Driver
        </label>
        <select
          {...register('currentDriverId')}
          className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- No Driver Assigned --</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name} ({driver.status === 'active' ? 'Active' : 'Inactive'})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Select who will be driving this truck.
        </p>
      </div>
      {/* ------------------------------------- */}
      
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
          leftIcon={<TruckIcon size={18} />}
        >
          {truck ? 'Update' : 'Add'} Truck
        </Button>
      </div>
    </form>
  );
};

export default TruckForm;