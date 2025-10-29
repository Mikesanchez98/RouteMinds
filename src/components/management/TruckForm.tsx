import React, { useState } from 'react';
import { Truck as TruckIcon } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useDataStore from '../../store/dataStore';
import { Truck } from '../../types';

interface TruckFormProps {
  truck?: Truck;
  onComplete: () => void;
}

const TruckForm: React.FC<TruckFormProps> = ({ truck, onComplete }) => {
  const [name, setName] = useState(truck?.name || '');
  const [capacity, setCapacity] = useState(truck?.capacity.toString() || '');
  const [speed, setSpeed] = useState(truck?.speed.toString() || '');
  const [warehouseId, setWarehouseId] = useState(truck?.warehouseId || '');
  
  const [errors, setErrors] = useState({
    name: '',
    capacity: '',
    speed: '',
    warehouseId: '',
  });
  
  const { addTruck, updateTruck, warehouses } = useDataStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {
      name: '',
      capacity: '',
      speed: '',
      warehouseId: '',
    };
    let hasError = false;
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      hasError = true;
    }
    
    if (!capacity.trim()) {
      newErrors.capacity = 'Capacity is required';
      hasError = true;
    } else if (isNaN(Number(capacity)) || Number(capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
      hasError = true;
    }
    
    if (!speed.trim()) {
      newErrors.speed = 'Speed is required';
      hasError = true;
    } else if (isNaN(Number(speed)) || Number(speed) <= 0) {
      newErrors.speed = 'Speed must be a positive number';
      hasError = true;
    }
    
    if (!warehouseId) {
      newErrors.warehouseId = 'Please select a warehouse';
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    const truckData = {
      name,
      capacity: Number(capacity),
      speed: Number(speed),
      warehouseId,
    };
    
    if (truck) {
      updateTruck(truck.id, truckData);
    } else {
      addTruck(truckData);
    }
    
    onComplete();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Truck Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        fullWidth
        placeholder="Enter truck name/ID"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          error={errors.capacity}
          fullWidth
          placeholder="Enter capacity"
        />
        
        <Input
          label="Speed (km/h)"
          type="number"
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
          error={errors.speed}
          fullWidth
          placeholder="Enter average speed"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assigned Warehouse
        </label>
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
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
          <p className="mt-1 text-sm text-red-600">{errors.warehouseId}</p>
        )}
      </div>
      
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