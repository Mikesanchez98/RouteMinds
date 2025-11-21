import React from 'react';
import { User } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useDataStore from '../../store/dataStore';
import { Driver } from '../../types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

type DriverFormData = {
  name: string;
  license_number: string;
  phone: string;
  status: 'active' | 'inactive' | 'on_leave';
};

interface DriverFormProps {
  driver?: Driver;
  onComplete: () => void;
}

const DriverForm: React.FC<DriverFormProps> = ({ driver, onComplete }) => {
  const { addDriver, updateDriver } = useDataStore();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DriverFormData>({
    defaultValues: {
      name: driver?.name || '',
      license_number: driver?.license_number || '',
      phone: driver?.phone || '',
      status: driver?.status || 'active',
    },
  });

  const onSubmitForm: SubmitHandler<DriverFormData> = (data) => {
    if (driver) {
      updateDriver(driver.id, data);
    } else {
      addDriver(data);
    }
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <Controller
        name="name"
        control={control}
        rules={{ required: 'El nombre es obligatorio' }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Nombre del Conductor"
            error={error?.message}
            fullWidth
            placeholder="Ej. Juan Pérez"
          />
        )}
      />
      
      <Controller
        name="license_number"
        control={control}
        rules={{ required: 'Licencia requerida' }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Número de Licencia"
            error={error?.message}
            fullWidth
            placeholder="Ej. A-12345678"
          />
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Teléfono (Opcional)"
            fullWidth
            placeholder="555-123-4567"
          />
        )}
      />

      {/* Selector de Estatus Simple */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Estatus</label>
        <select
          {...register('status')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
          <option value="active">Activo</option>
          <option value="on_leave">De Vacaciones</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>
      
      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onComplete}>
          Cancelar
        </Button>
        <Button type="submit" leftIcon={<User size={18} />}>
          {driver ? 'Actualizar' : 'Añadir'} Conductor
        </Button>
      </div>
    </form>
  );
};

export default DriverForm;