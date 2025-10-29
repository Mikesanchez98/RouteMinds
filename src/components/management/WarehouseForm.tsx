import React, { useState } from 'react';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useDataStore from '../../store/dataStore';
import { Warehouse } from '../../types';

interface WarehouseFormProps {
  warehouse?: Warehouse;
  onComplete: () => void;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({ warehouse, onComplete }) => {
  const [name, setName] = useState(warehouse?.name || '');
  const [lat, setLat] = useState(warehouse?.location.lat.toString() || '');
  const [lng, setLng] = useState(warehouse?.location.lng.toString() || '');
  const [capacity, setCapacity] = useState(warehouse?.capacity.toString() || '');
  const [address, setAddress] = useState(warehouse?.address || '');
  const [errors, setErrors] = useState({
    name: '',
    lat: '',
    lng: '',
    capacity: '',
    address: '',
  });
  
  const { addWarehouse, updateWarehouse } = useDataStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {
      name: '',
      lat: '',
      lng: '',
      capacity: '',
      address: '',
    };
    let hasError = false;
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      hasError = true;
    }
    
    if (!lat.trim()) {
      newErrors.lat = 'Latitude is required';
      hasError = true;
    } else if (isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90) {
      newErrors.lat = 'Latitude must be between -90 and 90';
      hasError = true;
    }
    
    if (!lng.trim()) {
      newErrors.lng = 'Longitude is required';
      hasError = true;
    } else if (isNaN(Number(lng)) || Number(lng) < -180 || Number(lng) > 180) {
      newErrors.lng = 'Longitude must be between -180 and 180';
      hasError = true;
    }
    
    if (!capacity.trim()) {
      newErrors.capacity = 'Capacity is required';
      hasError = true;
    } else if (isNaN(Number(capacity)) || Number(capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
      hasError = true;
    }
    
    if (!address.trim()) {
      newErrors.address = 'Address is required';
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    const warehouseData = {
      name,
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
      capacity: Number(capacity),
      address,
    };
    
    if (warehouse) {
      updateWarehouse(warehouse.id, warehouseData);
    } else {
      addWarehouse(warehouseData);
    }
    
    onComplete();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Warehouse Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        fullWidth
        placeholder="Enter warehouse name"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Latitude"
          type="text"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          error={errors.lat}
          fullWidth
          placeholder="e.g., 40.7128"
        />
        
        <Input
          label="Longitude"
          type="text"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          error={errors.lng}
          fullWidth
          placeholder="e.g., -74.0060"
        />
      </div>
      
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
        label="Address"
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={errors.address}
        fullWidth
        placeholder="Enter full address"
      />
      
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