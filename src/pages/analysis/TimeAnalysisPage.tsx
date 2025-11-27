import React, { useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import useDataStore from '../../store/dataStore';

const TimeAnalysisPage: React.FC = () => {
  const { routes, fetchRoutesByDate } = useDataStore();

  // Cargar rutas al iniciar (puedes cambiar la fecha si quieres analizar otro día)
  useEffect(() => {
    fetchRoutesByDate(new Date());
  }, []);

  // --- CÁLCULOS MATEMÁTICOS (MEMOIZED) ---
  const analysisData = useMemo(() => {
    // 1. Filtramos solo las rutas que realmente se completaron
    // y que tienen tiempos de inicio y fin registrados.
    const completedRoutes = routes.filter(r => 
        r.status === 'completed' && r.actualStartTime && r.actualEndTime
    );

    // 2. Generamos los datos para la gráfica de barras
    const chartData = completedRoutes.map(r => {
      const start = new Date(r.actualStartTime!).getTime();
      const end = new Date(r.actualEndTime!).getTime();
      
      // Duración real en minutos
      const durationMinutes = (end - start) / (1000 * 60); 
      
      // Estimado en minutos (asumiendo que estimatedTime viene en horas desde la BD)
      // Si tu estimatedTime ya viene en minutos, quita el * 60
      const estimatedMinutes = r.estimatedTime * 60;

      return {
        name: `Ruta ${r.id.substring(0, 4)}`, // ID corto para la gráfica
        Estimado: Math.round(estimatedMinutes),
        Real: Math.round(durationMinutes),
        // Delta: Diferencia (Positivo = Tardó más, Negativo = Fue más rápido)
        delta: Math.round(durationMinutes - estimatedMinutes)
      };
    });

    // 3. Calculamos los KPIs (Indicadores Clave)
    const totalRoutes = completedRoutes.length;
    
    // Consideramos "Retrasada" si tardó más del 10% extra de lo estimado
    const delayedRoutes = chartData.filter(d => d.Real > d.Estimado * 1.1).length; 
    const onTimeRoutes = totalRoutes - delayedRoutes;
    
    // Desviación Promedio (en minutos)
    const avgDeviation = totalRoutes > 0 
      ? Math.round(chartData.reduce((acc, curr) => acc + curr.delta, 0) / totalRoutes)
      : 0;

    return { chartData, totalRoutes, delayedRoutes, onTimeRoutes, avgDeviation };
  }, [routes]);

  // Colores para la gráfica de pastel
  const COLORS = ['#10B981', '#EF4444']; // Verde (A tiempo), Rojo (Retrasado)

  // --- UI SI NO HAY DATOS ---
  if (analysisData.totalRoutes === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <Clock size={64} className="mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">No hay datos suficientes</h2>
        <p className="text-sm mt-2 max-w-md text-center">
          Para ver el análisis de tiempos, necesitas tener rutas en estado 
          <span className="font-bold text-green-600"> Completada </span> 
          con registros de inicio y fin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Análisis de Tiempos</h1>
        <p className="text-gray-600 mt-1">Comparativa de rendimiento: Algoritmo vs Realidad Operativa</p>
      </div>

      {/* --- TARJETAS DE KPIs --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta 1: Total Analizado */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <TrendingUp className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rutas Analizadas</p>
            <h3 className="text-2xl font-bold text-gray-900">{analysisData.totalRoutes}</h3>
            <p className="text-xs text-gray-400">Rutas completadas hoy</p>
          </div>
        </div>

        {/* Tarjeta 2: Desviación */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className={`p-3 rounded-full mr-4 ${analysisData.avgDeviation > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
            <Clock className={analysisData.avgDeviation > 0 ? 'text-red-600' : 'text-green-600'} size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Desviación Promedio</p>
            <h3 className={`text-2xl font-bold ${analysisData.avgDeviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {analysisData.avgDeviation > 0 ? '+' : ''}{analysisData.avgDeviation} min
            </h3>
            <p className="text-xs text-gray-400">Diferencia vs Estimado</p>
          </div>
        </div>

        {/* Tarjeta 3: Puntualidad */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 bg-purple-100 rounded-full mr-4">
            <CheckCircle className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tasa de Puntualidad</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {Math.round((analysisData.onTimeRoutes / analysisData.totalRoutes) * 100)}%
            </h3>
            <p className="text-xs text-gray-400">Rutas dentro del margen</p>
          </div>
        </div>
      </div>

      {/* --- GRÁFICAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICA DE BARRAS (PRINCIPAL) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Comparativa: Estimado vs Real (Minutos)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analysisData.chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                    dataKey="name" 
                    tick={{fill: '#6B7280', fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false} 
                />
                <YAxis 
                    tick={{fill: '#6B7280', fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#F3F4F6'}}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar dataKey="Estimado" fill="#93C5FD" name="Tiempo Estimado" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Real" fill="#2563EB" name="Tiempo Real" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICA DE PASTEL (ESTADO) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Estado de Cumplimiento</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'A Tiempo', value: analysisData.onTimeRoutes },
                    { name: 'Retrasado', value: analysisData.delayedRoutes },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {/* A Tiempo (Verde), Retrasado (Rojo) */}
                  <Cell key="cell-0" fill={COLORS[0]} />
                  <Cell key="cell-1" fill={COLORS[1]} />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 bg-red-50 p-3 rounded-md border border-red-100">
            <p className="flex items-center justify-center gap-2 font-medium text-red-700">
              <AlertTriangle size={16} />
              {analysisData.delayedRoutes} rutas excedieron el tiempo (+10%)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TimeAnalysisPage;