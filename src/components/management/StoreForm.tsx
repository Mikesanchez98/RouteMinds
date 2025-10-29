import React, { useState } from 'react';
import { Store as StoreIcon } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useDataStore from '../../store/dataStore';
import { Store } from '../../types';

interface StoreFormProps {
  store?: Store;
  onComplete: () => void;
}

const StoreForm: React.FC<StoreFormProps> = ({ store, onComplete }) => {
  const [name, setName] = useState(store?.name || '');
  const [lat, setLat] = useState(store?.location.lat.toString() || '');
  const [lng, setLng] = useState(store?.location.lng.toString() || '');
  const [demand, setDemand] = useState(store?.demand.toString() || '');
  const [address, setAddress] = useState(store?.address || '');
  const [startTime, setStartTime] = useState(store?.timeWindow?.start || '');
  const [endTime, setEndTime] = useState(store?.timeWindow?.end || '');
  
  const [errors, setErrors] = useState({
    name: '',
    lat: '',
    lng: '',
    demand: '',
    address: '',
    timeWindow: '',
  });
  
  const { addStore, updateStore } = useDataStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {
      name: '',
      lat: '',
      lng: '',
      demand: '',
      address: '',
      timeWindow: '',
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
    
    if (!demand.trim()) {
      newErrors.demand = 'Demand is required';
      hasError = true;
    } else if (isNaN(Number(demand)) || Number(demand) <= 0) {
      newErrors.demand = 'Demand must be a positive number';
      hasError = true;
    }
    
    if (!address.trim()) {
      newErrors.address = 'Address is required';
      hasError = true;
    }
    
    // Time window validation (both or none)
    if ((startTime && !endTime) || (!startTime && endTime)) {
      newErrors.timeWindow = 'Both start and end time must be provided';
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    const storeData = {
      name,
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
      demand: Number(demand),
      address,
      timeWindow: startTime && endTime ? { start: startTime, end: endTime } : undefined,
    };
    
    if (store) {
      updateStore(store.id, storeData);
    } else {
      addStore(storeData);
    }
    
    onComplete();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Store Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        fullWidth
        placeholder="Enter store name"
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
        label="Demand"
        type="number"
        value={demand}
        onChange={(e) => setDemand(e.target.value)}
        error={errors.demand}
        fullWidth
        placeholder="Enter demand amount"
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Opening Time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          fullWidth
        />
        
        <Input
          label="Closing Time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          fullWidth
        />
      </div>
      
      {errors.timeWindow && (
        <p className="text-sm text-red-600">{errors.timeWindow}</p>
      )}
      
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