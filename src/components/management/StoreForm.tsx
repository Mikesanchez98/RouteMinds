import React, { useState, useEffect } from 'react';
import { Store as StoreIcon, Globe, MapPin, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useDataStore from '../../store/dataStore';
import { Store } from '../../types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import AsyncSelect from 'react-select/async';

// --- 1. FUNCIÓN MATEMÁTICA (DMS -> Decimal) ---
const dmsToDecimal = (degrees: number, minutes: number, seconds: number, direction: string): number => {
  let decimal = degrees + (minutes / 60) + (seconds / 3600);
  if (direction === 'S' || direction === 'W' || direction === 'O') {
    decimal = decimal * -1;
  }
  return Number(decimal.toFixed(6));
};

// --- Funciones de API (LocationIQ) ---
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
    if (data && data.display_name) return data.display_name;
    return "Dirección no encontrada";
  } catch (error) {
    return "Error al buscar la dirección";
  }
};

// --- TIPOS DEL FORMULARIO ---
type StoreFormData = {
  name: string;
  lat: number;
  lng: number;
  demand: number;
  address: string;
  startTime: string;
  endTime: string;
  
  // Campos para Latitud DMS
  latDeg: number;
  latMin: number;
  latSec: number;
  latDir: 'N' | 'S';

  // Campos para Longitud DMS
  lngDeg: number;
  lngMin: number;
  lngSec: number;
  lngDir: 'E' | 'W';
};

interface StoreFormProps {
  store?: Store;
  onComplete: () => void;
}

const StoreForm: React.FC<StoreFormProps> = ({ store, onComplete }) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordMode, setCoordMode] = useState<'decimal' | 'dms'>('decimal');
  
  const { addStore, updateStore } = useDataStore();
  
  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    watch, 
    formState: { errors },
  } = useForm<StoreFormData>({
    defaultValues: {
      name: store?.name || '',
      address: store?.address || '',
      lat: store?.location.lat || 0,
      lng: store?.location.lng || 0,
      demand: store?.demand || 0,
      startTime: store?.timeWindow?.start || '',
      endTime: store?.timeWindow?.end || '',
      // Valores por defecto para DMS
      latDeg: 0, latMin: 0, latSec: 0, latDir: 'N',
      lngDeg: 0, lngMin: 0, lngSec: 0, lngDir: 'W',
    },
  });

  // Observadores para DMS
  const latDeg = watch('latDeg');
  const latMin = watch('latMin');
  const latSec = watch('latSec');
  const latDir = watch('latDir');
  const lngDeg = watch('lngDeg');
  const lngMin = watch('lngMin');
  const lngSec = watch('lngSec');
  const lngDir = watch('lngDir');

  // Efecto de conversión automática DMS -> Decimal
  useEffect(() => {
    if (coordMode === 'dms') {
        const newLat = dmsToDecimal(Number(latDeg||0), Number(latMin||0), Number(latSec||0), latDir);
        const newLng = dmsToDecimal(Number(lngDeg||0), Number(lngMin||0), Number(lngSec||0), lngDir);
        setValue('lat', newLat);
        setValue('lng', newLng);
    }
  }, [coordMode, latDeg, latMin, latSec, latDir, lngDeg, lngMin, lngSec, lngDir, setValue]);

  const onSubmitForm: SubmitHandler<StoreFormData> = (data) => {
    const storeData = {
      name: data.name,
      address: data.address,
      demand: Number(data.demand),
      location: {
        lat: Number(data.lat),
        lng: Number(data.lng),
      },
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

  const handleFindAddress = async () => {
    const lat = getValues('lat');
    const lng = getValues('lng');

    if (!lat || !lng) {
      alert("Por favor, calcula o introduce las coordenadas primero.");
      return;
    }

    setIsGeocoding(true);
    const foundAddress = await reverseGeocode(Number(lat), Number(lng));
    setValue('address', foundAddress);
    setIsGeocoding(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col h-full w-full">
      
      <div className="mb-6 pb-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">Complete los datos de la tienda o punto de entrega. Los campos marcados son obligatorios.</p>
      </div>

      <div className="space-y-8 px-2">
        
        {/* SECCIÓN 1: DATOS GENERALES */}
        <div className="bg-white p-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide border-l-4 border-orange-500 pl-3">
                Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                    <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'El nombre es obligatorio' }}
                    render={({ field, fieldState: { error } }) => (
                        <Input {...field} label="Nombre de la Tienda" error={error?.message} fullWidth placeholder="Ej. Supermercado Centro" />
                    )}
                    />
                </div>
                
                <div className="md:col-span-4">
                    <Controller
                    name="demand"
                    control={control}
                    rules={{ 
                      required: 'La demanda es obligatoria', 
                      valueAsNumber: true,
                      min: { value: 1, message: 'Debe ser positiva' }
                    }}
                    render={({ field, fieldState: { error } }) => (
                        <Input
                        {...field}
                        label="Demanda Estimada (u)"
                        type="number"
                        error={error?.message}
                        fullWidth
                        placeholder="0"
                        leftIcon={<ShoppingBag size={16} />}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                    )}
                    />
                </div>
            </div>

            {/* Horario de Atención */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} label="Hora de Apertura" type="time" fullWidth leftIcon={<Clock size={16} />} />
                  )}
                />
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} label="Hora de Cierre" type="time" fullWidth leftIcon={<Clock size={16} />} />
                  )}
                />
            </div>
        </div>

        {/* SECCIÓN 2: UBICACIÓN GEOGRÁFICA */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center">
                    <MapPin size={18} className="mr-2 text-indigo-600" />
                    Geolocalización
                </h3>
                
                {/* Selector de Modo */}
                <div className="bg-white p-1 rounded-lg border border-gray-300 flex shadow-sm">
                    <button
                        type="button"
                        onClick={() => setCoordMode('decimal')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            coordMode === 'decimal' 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        DECIMALES
                    </button>
                    <button
                        type="button"
                        onClick={() => setCoordMode('dms')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            coordMode === 'dms' 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        GMS (GPS)
                    </button>
                </div>
            </div>

            {/* --- MODO DMS (Vertical y Espacioso) --- */}
            {coordMode === 'dms' && (
                <div className="mb-6 flex flex-col gap-6 animate-fadeIn">
                    {/* Latitud Box */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm w-full">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 text-left">Latitud (Norte/Sur)</label>
                        <div className="grid grid-cols-7 gap-2 items-center">
                            <div className="col-span-2"><Controller name="latDeg" control={control} render={({ field }) => (<Input {...field} type="number" placeholder="°" className="text-center font-mono text-lg h-12" />)} /></div>
                            <div className="col-span-2"><Controller name="latMin" control={control} render={({ field }) => (<Input {...field} type="number" placeholder="'" className="text-center font-mono text-lg h-12" />)} /></div>
                            <div className="col-span-2"><Controller name="latSec" control={control} render={({ field }) => (<Input {...field} type="number" placeholder='"' step="any" className="text-center font-mono text-lg h-12" />)} /></div>
                            <div className="col-span-1">
                                <Controller name="latDir" control={control} render={({ field }) => (
                                    <select {...field} className="block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-center font-bold bg-gray-50 text-base px-0 cursor-pointer">
                                        <option value="N">N</option>
                                        <option value="S">S</option>
                                    </select>
                                )} />
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-2">
                            <span>GRADOS (°)</span><span>MINUTOS (')</span><span>SEGUNDOS (")</span><span>DIR</span>
                        </div>
                    </div>

                    {/* Longitud Box */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm w-full">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-3 text-left">Longitud (Este/Oeste)</label>
                        <div className="grid grid-cols-7 gap-2 items-center">
                            <div className="col-span-2"><Controller name="lngDeg" control={control} render={({ field }) => (<Input {...field} type="number" placeholder="°" className="text-center font-mono text-lg h-12" />)} /></div>
                            <div className="col-span-2"><Controller name="lngMin" control={control} render={({ field }) => (<Input {...field} type="number" placeholder="'" className="text-center font-mono text-lg h-12" />)} /></div>
                            <div className="col-span-2"><Controller name="lngSec" control={control} render={({ field }) => (<Input {...field} type="number" placeholder='"' step="any" className="text-center font-mono text-lg h-12" />)} /></div>
                            <div className="col-span-1">
                                <Controller name="lngDir" control={control} render={({ field }) => (
                                    <select {...field} className="block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-center font-bold bg-gray-50 text-base px-0 cursor-pointer">
                                        <option value="W">W</option>
                                        <option value="E">E</option>
                                    </select>
                                )} />
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-2">
                            <span>GRADOS (°)</span><span>MINUTOS (')</span><span>SEGUNDOS (")</span><span>DIR</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Coordenadas Decimales (Ocultas en modo DMS) */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${coordMode === 'dms' ? 'hidden' : ''}`}>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-bold text-xs">LAT</span>
                    </div>
                    <Controller
                        name="lat"
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState: { error } }) => (
                            <Input
                            {...field}
                            type="number"
                            step="any"
                            error={error?.message}
                            readOnly={coordMode === 'dms'}
                            className={`pl-10 font-mono ${coordMode === 'dms' ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                            />
                        )}
                    />
                </div>
                <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-bold text-xs">LNG</span>
                    </div>
                    <Controller
                        name="lng"
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState: { error } }) => (
                            <Input
                            {...field}
                            type="number"
                            step="any"
                            error={error?.message}
                            readOnly={coordMode === 'dms'}
                            className={`pl-10 font-mono ${coordMode === 'dms' ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                            />
                        )}
                    />
                </div>
            </div>
        </div>

        {/* SECCIÓN 3: DIRECCIÓN FINAL */}
        <div className="bg-white p-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide border-l-4 border-green-500 pl-3">
                Confirmación de Domicilio
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Normalizada</label>
                    <Controller
                    name="address"
                    control={control}
                    rules={{ required: 'Requerido' }}
                    render={({ field }) => (
                        <AsyncSelect
                        {...field}
                        loadOptions={loadAddressOptions}
                        placeholder="Escribe para buscar dirección..."
                        className="text-base"
                        onChange={(opt: any) => {
                            if(opt) {
                                setValue('address', opt.label);
                                setValue('lat', opt.value.lat);
                                setValue('lng', opt.value.lng);
                                setCoordMode('decimal');
                            }
                        }}
                        value={field.value ? { label: field.value, value: field.value } : null}
                        styles={{
                            control: (base) => ({
                                ...base,
                                minHeight: '48px',
                                borderRadius: '0.5rem',
                                borderColor: errors.address ? '#ef4444' : '#d1d5db',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                '&:hover': { borderColor: '#9ca3af' }
                            }),
                            menu: (base) => ({ ...base, zIndex: 100 })
                        }}
                        />
                    )}
                    />
                    {errors.address && <span className="text-xs text-red-600 mt-1 block">{errors.address.message}</span>}
                </div>

                <div className="mt-7">
                    <Button
                        type="button" 
                        onClick={handleFindAddress}
                        disabled={isGeocoding}
                        variant="secondary"
                        className="h-[48px] px-6 shadow-sm border-gray-300 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                    >
                        {isGeocoding ? (
                            <span className="animate-pulse">Buscando...</span>
                        ) : (
                            <>
                                <Globe size={18} className="mr-2" />
                                Validar Coordenadas
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">
                * Utilice el botón "Validar" para confirmar que las coordenadas ingresadas corresponden a una dirección real.
            </p>
        </div>
      </div>
      
      {/* PIE DE FORMULARIO */}
      <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-100">
        <Button 
            type="button" 
            variant="outline" 
            onClick={onComplete}
            className="px-8 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
        >
            Cancelar
        </Button>
        <Button 
            type="submit" 
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            leftIcon={<CheckCircle size={20} />}
        >
          {store ? 'Guardar Cambios' : 'Registrar Tienda'}
        </Button>
      </div>
    </form>
  );
};

export default StoreForm;