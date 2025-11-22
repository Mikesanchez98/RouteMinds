import React, { useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import useDataStore from '../../store/dataStore';

const TimeAnalysisPage: React.FC = () => {
  const { routes, fetchRoutesByDate } = useDataStore();

  // Cargar rutas (puedes ajustar para cargar un rango más amplio si quieres)
  useEffect(() => {
    fetchRoutesByDate(new Date());
  }, []);

  // --- CÁLCULOS MATEMÁTICOS ---
  const analysisData = useMemo(() => {
    // Filtramos solo rutas completadas para el análisis real
    const completedRoutes = routes.filter(r => r.status === 'completed' && r.actualStartTime && r.actualEndTime);

    const chartData = completedRoutes.map(r => {
      const start = new Date(r.actualStartTime!).getTime();
      const end = new Date(r.actualEndTime!).getTime();
      const durationMinutes = (end - start) / (1000 * 60); // De milisegundos a minutos

      return {
        name: `Ruta ${r.id.substring(0, 4)}`, // ID corto
        Estimado: Math.round(r.estimatedTime), // Tu algoritmo ya lo da en minutos? Asumo que sí.
        Real: Math.round(durationMinutes),
        delta: Math.round(durationMinutes - r.estimatedTime)
      };
    });

    // KPIs
    const totalRoutes = completedRoutes.length;
    const delayedRoutes = chartData.filter(d => d.Real > d.Estimado * 1.1).length; // 10% de margen
    const onTimeRoutes = totalRoutes - delayedRoutes;
    
    // Eficiencia promedio (Si tarda menos del estimado es > 100%, si tarda más es < 100%)
    // Pero usualmente queremos saber la desviación.
    const avgDeviation = totalRoutes > 0 
      ? Math.round(chartData.reduce((acc, curr) => acc + curr.delta, 0) / totalRoutes)
      : 0;

    return { chartData, totalRoutes, delayedRoutes, onTimeRoutes, avgDeviation };
  }, [routes]);

  // Colores para la gráfica de pastel
  const COLORS = ['#10B981', '#EF4444']; // Verde, Rojo

  if (analysisData.totalRoutes === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
        <Clock size={64} className="mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold">No hay datos suficientes</h2>
        <p>Necesitas completar rutas (Finalizar) para ver el análisis de tiempos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Análisis de Tiempos</h1>
        <p className="text-gray-600">Comparativa de rendimiento: Algoritmo vs Realidad</p>
      </div>

      {/* --- TARJETAS DE KPIs --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <TrendingUp className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rutas Analizadas</p>
            <h3 className="text-2xl font-bold text-gray-900">{analysisData.totalRoutes}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className={`p-3 rounded-full mr-4 ${analysisData.avgDeviation > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
            <Clock className={analysisData.avgDeviation > 0 ? 'text-red-600' : 'text-green-600'} size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Desviación Promedio</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {analysisData.avgDeviation > 0 ? '+' : ''}{analysisData.avgDeviation} min
            </h3>
            <p className="text-xs text-gray-400">Diferencia vs Estimado</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 bg-purple-100 rounded-full mr-4">
            <CheckCircle className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tasa de Puntualidad</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {Math.round((analysisData.onTimeRoutes / analysisData.totalRoutes) * 100)}%
            </h3>
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
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Estimado" fill="#93C5FD" name="Tiempo Estimado" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Real" fill="#2563EB" name="Tiempo Real" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICA DE PASTEL (ESTADO) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Puntualidad</h3>
          <div className="h-64 flex justify-center">
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
          <div className="mt-4 text-center text-sm text-gray-500">
            <p className="flex items-center justify-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              {analysisData.delayedRoutes} rutas excedieron el estimado (+10%)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TimeAnalysisPage;