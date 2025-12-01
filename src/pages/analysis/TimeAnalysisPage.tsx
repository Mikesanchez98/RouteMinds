import React, { useEffect, useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Clock, TrendingUp, DollarSign, MapPin, BarChart2, Calendar } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useDataStore from '../../store/dataStore';
import toast from 'react-hot-toast';

const TimeAnalysisPage: React.FC = () => {
  const { routes, fetchRoutesByDate, isLoading } = useDataStore();
  
  // Estado para la fecha seleccionada
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Cargar rutas cuando cambia la fecha
  useEffect(() => {
    const loadData = async () => {
        try {
            await fetchRoutesByDate(selectedDate);
            toast.success(`Datos del ${selectedDate.toLocaleDateString()} cargados`);
        } catch (e) {
            toast.error("Error al cargar datos");
        }
    };
    loadData();
  }, [selectedDate]); // Se ejecuta al cambiar la fecha

  // --- CONSTANTES DE NEGOCIO ---
  const COSTO_POR_KM = 15.50; 

  // --- CÁLCULOS MATEMÁTICOS ---
  const analysisData = useMemo(() => {
    const completedRoutes = routes.filter(r => 
        r.status === 'completed' && r.actualStartTime && r.actualEndTime
    );

    const chartData = completedRoutes.map(r => {
      const start = new Date(r.actualStartTime!).getTime();
      const end = new Date(r.actualEndTime!).getTime();
      const durationMinutes = (end - start) / (1000 * 60); 
      const estimatedMinutes = r.estimatedTime * 60;
      const routeCost = r.distance * COSTO_POR_KM;
      const costPerStop = r.stores.length > 0 ? routeCost / r.stores.length : 0;

      return {
        name: `Ruta ${r.id.substring(0, 4)}`,
        id: r.id,
        Estimado: Math.round(estimatedMinutes),
        Real: Math.round(durationMinutes),
        delta: Math.round(durationMinutes - estimatedMinutes),
        costo: Math.round(routeCost),
        paradas: r.stores.length,
        costoPorParada: Math.round(costPerStop),
        distancia: r.distance
      };
    });

    const totalRoutes = completedRoutes.length;
    const totalStops = chartData.reduce((acc, curr) => acc + curr.paradas, 0);
    const totalCost = chartData.reduce((acc, curr) => acc + curr.costo, 0);
    const delayedRoutes = chartData.filter(d => d.Real > d.Estimado * 1.1).length; 
    const onTimeRoutes = totalRoutes - delayedRoutes;
    const avgDeviation = totalRoutes > 0 
      ? Math.round(chartData.reduce((acc, curr) => acc + curr.delta, 0) / totalRoutes)
      : 0;
    const avgStopsPerRoute = totalRoutes > 0 ? (totalStops / totalRoutes).toFixed(1) : "0";
    const avgCostPerDelivery = totalStops > 0 ? (totalCost / totalStops).toFixed(2) : "0";

    return { chartData, totalRoutes, delayedRoutes, onTimeRoutes, avgDeviation, avgStopsPerRoute, avgCostPerDelivery, totalCost };
  }, [routes]);

  const COLORS = ['#10B981', '#EF4444', '#F59E0B']; 

  return (
    <div className="space-y-8 pb-12">
      
      {/* --- HEADER CON SELECTOR DE FECHA --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Analytics & Performance</h1>
            <p className="text-gray-600 mt-1">Análisis de eficiencia operativa y financiera.</p>
        </div>

        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 shadow-sm hover:border-indigo-500 transition-colors">
            <Calendar size={18} className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-600 mr-2 font-medium">Periodo:</span>
            <DatePicker 
                selected={selectedDate} 
                onChange={(date) => date && setSelectedDate(date)} 
                className="outline-none text-sm text-gray-900 font-semibold bg-transparent cursor-pointer w-24"
                dateFormat="dd/MM/yyyy"
                maxDate={new Date()}
            />
        </div>
      </div>

      {/* --- ESTADO VACÍO (SI NO HAY DATOS PARA ESA FECHA) --- */}
      {analysisData.totalRoutes === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 p-8 shadow-sm">
            <BarChart2 size={64} className="mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700">Sin datos operativos</h2>
            <p className="text-sm mt-2 max-w-md text-center">
            No se encontraron rutas <span className="font-bold text-green-600">COMPLETADAS</span> para el día {selectedDate.toLocaleDateString()}.
            Selecciona otra fecha o completa las rutas en el módulo de Seguimiento.
            </p>
        </div>
      ) : (
        <>
            {/* --- SECCIÓN 1: KPIs --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-100 rounded-full mr-4"><TrendingUp className="text-blue-600" size={24} /></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Rutas Analizadas</p><h3 className="text-2xl font-bold text-gray-900">{analysisData.totalRoutes}</h3></div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-full mr-4 ${analysisData.avgDeviation > 0 ? 'bg-red-100' : 'bg-green-100'}`}><Clock className={analysisData.avgDeviation > 0 ? 'text-red-600' : 'text-green-600'} size={24} /></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Desviación Promedio</p><h3 className={`text-2xl font-bold ${analysisData.avgDeviation > 0 ? 'text-red-600' : 'text-green-600'}`}>{analysisData.avgDeviation > 0 ? '+' : ''}{analysisData.avgDeviation} min</h3></div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center hover:shadow-md transition-shadow">
                <div className="p-3 bg-yellow-100 rounded-full mr-4"><DollarSign className="text-yellow-600" size={24} /></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Costo / Entrega</p><h3 className="text-2xl font-bold text-gray-900">${analysisData.avgCostPerDelivery}</h3></div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-100 rounded-full mr-4"><MapPin className="text-purple-600" size={24} /></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Paradas / Ruta</p><h3 className="text-2xl font-bold text-gray-900">{analysisData.avgStopsPerRoute}</h3></div>
                </div>
            </div>

            {/* --- SECCIÓN 2: GRÁFICAS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-6"><h3 className="text-lg font-bold text-gray-800">Planificación vs. Realidad</h3><p className="text-sm text-gray-500">Duración de rutas en minutos.</p></div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysisData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill: '#6B7280', fontSize: 12}} axisLine={false} tickLine={false} label={{ value: 'Minutos', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#F3F4F6'}} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                        <Bar dataKey="Estimado" fill="#93C5FD" name="Tiempo Estimado" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="Real" fill={analysisData.avgDeviation > 0 ? "#EF4444" : "#10B981"} name="Tiempo Real" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>

                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
                <div className="mb-2"><h3 className="text-lg font-bold text-gray-800">Cumplimiento</h3><p className="text-sm text-gray-500">Rutas dentro del margen de tiempo.</p></div>
                <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={[{ name: 'A Tiempo', value: analysisData.onTimeRoutes }, { name: 'Retrasado', value: analysisData.delayedRoutes }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                        <Cell key="cell-0" fill={COLORS[0]} />
                        <Cell key="cell-1" fill={COLORS[1]} />
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-gray-600">Rutas Totales:</span><span className="font-bold text-gray-900">{analysisData.totalRoutes}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-600">Con Retraso:</span><span className="font-bold text-red-600">{analysisData.delayedRoutes}</span></div>
                </div>
                </div>
            </div>

            {/* --- SECCIÓN 3: COSTOS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="mb-6"><h3 className="text-lg font-bold text-gray-800">Relación Costo - Distancia</h3><p className="text-sm text-gray-500">Costo acumulado por ruta.</p></div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analysisData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" hide />
                            <YAxis tickFormatter={(value) => `$${value}`} />
                            <Tooltip formatter={(value) => `$${value}`} />
                            <Area type="monotone" dataKey="costo" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} name="Costo Operativo" />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="mb-6"><h3 className="text-lg font-bold text-gray-800">Eficiencia de Entrega</h3><p className="text-sm text-gray-500">Costo promedio por parada.</p></div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysisData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                            <YAxis tickFormatter={(value) => `$${value}`} />
                            <Tooltip formatter={(value) => [`$${value}`, 'Costo/Parada']} />
                            <Bar dataKey="costoPorParada" fill="#F59E0B" name="Costo por Parada" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 4: TABLA DETALLADA --- */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h3 className="text-lg font-bold text-gray-800">Detalle de Rendimiento</h3></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Real</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desviación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paradas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eficiencia</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {analysisData.chartData.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Estimado} min</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Real} min</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${row.delta > 10 ? 'bg-red-100 text-red-800' : row.delta < -5 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {row.delta > 0 ? '+' : ''}{row.delta} min
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.paradas}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${row.costo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.costoPorParada}/parada</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default TimeAnalysisPage;