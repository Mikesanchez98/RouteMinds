import React, { useState } from 'react';
import { FileText, Download, Calendar, Truck, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Button from '../../components/common/Button';
import useDataStore from '../../store/dataStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const ReportsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { 
    routes, trucks, warehouses, drivers, stores,
    fetchRoutesByDate, fetchTrucks, fetchWarehouses, fetchDrivers, fetchStores 
  } = useDataStore();

  // --- CONSTANTES DE NEGOCIO ---
  const COSTO_POR_KM = 15.50; 
  const COSTO_FIJO_POR_RUTA = 150.00; 
  const UMBRAL_RETRASO_MIN = 15; 

  // Cargar datos
  const prepareData = async () => {
    const loadingToast = toast.loading('Procesando datos...');
    try {
      await Promise.all([
        fetchRoutesByDate(selectedDate),
        fetchTrucks(),
        fetchWarehouses(),
        fetchDrivers(),
        fetchStores()
      ]);
      toast.success('Datos listos', { id: loadingToast });
      return true;
    } catch (error) {
      toast.error('Error al cargar datos', { id: loadingToast });
      return false;
    }
  };

  // --- GENERADOR REPORTE 1: FINANCIERO Y OPERATIVO ---
  const generateDailyReport = async () => {
    if (!(await prepareData())) return;
    if (routes.length === 0) { toast.error('Sin datos para esta fecha.'); return; }

    const doc = new jsPDF();
    const dateStr = selectedDate.toLocaleDateString();

    // Encabezado Visual
    doc.setFillColor(41, 128, 185); // Azul
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('REPORTE DIARIO DE OPERACIONES', 14, 18);
    doc.setFontSize(10);
    doc.text(`Business Intelligence Module | Fecha: ${dateStr}`, 14, 25);

    // Cálculos BI
    const totalKm = routes.reduce((acc, r) => acc + r.distance, 0);
    const totalCost = (totalKm * COSTO_POR_KM) + (routes.length * COSTO_FIJO_POR_RUTA);
    const completed = routes.filter(r => r.status === 'completed').length;
    const efficiency = Math.round((completed / routes.length) * 100);

    // Cajas de KPIs (Dibujadas)
    const drawKPI = (x: number, title: string, value: string, subtitle: string, color: [number, number, number]) => {
        doc.setDrawColor(220);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, 40, 55, 30, 2, 2, 'FD');
        
        doc.setFontSize(9); doc.setTextColor(100);
        doc.text(title, x + 5, 48);
        
        doc.setFontSize(16); doc.setTextColor(color[0], color[1], color[2]);
        doc.text(value, x + 5, 58);
        
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text(subtitle, x + 5, 66);
    };

    drawKPI(14, "COSTO OPERATIVO", `$${totalCost.toLocaleString()}`, "Estimado Total", [41, 128, 185]);
    drawKPI(74, "KILOMETRAJE", `${totalKm.toFixed(1)} km`, "Recorrido Total", [230, 126, 34]);
    drawKPI(134, "EFICIENCIA", `${efficiency}%`, "Rutas Completadas", efficiency > 80 ? [39, 174, 96] : [192, 57, 43]);

    // Tabla Detallada
    const tableRows = routes.map(r => {
      const w = warehouses.find(wh => wh.id === r.warehouseId)?.name || 'N/A';
      const t = trucks.find(tr => tr.id === r.truckId)?.name || 'N/A';
      const costo = (r.distance * COSTO_POR_KM) + COSTO_FIJO_POR_RUTA;
      
      return [
        r.id.substring(0, 6),
        w,
        t,
        r.stores.length,
        `${r.distance.toFixed(1)} km`,
        `$${costo.toFixed(0)}`,
        r.status === 'completed' ? 'OK' : 'PEND'
      ];
    });

    autoTable(doc, {
      startY: 80,
      head: [['ID', 'Origen', 'Unidad', 'Paradas', 'Distancia', 'Costo', 'Estado']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94], halign: 'center' },
      columnStyles: { 
          4: { halign: 'right' }, 
          5: { halign: 'right', fontStyle: 'bold' },
          6: { halign: 'center' }
      },
      didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 6) {
              if (data.cell.raw === 'OK') {
                  data.cell.styles.textColor = [39, 174, 96];
                  data.cell.styles.fontStyle = 'bold';
              } else {
                  data.cell.styles.textColor = [192, 57, 43];
              }
          }
      }
    });

    // Gráfica de Barras Simulada (Progreso de Costos)
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text('Distribución de Costos por Ruta (Análisis Visual)', 14, finalY);
    
    let barY = finalY + 10;
    const maxCost = Math.max(...routes.map(r => (r.distance * COSTO_POR_KM) + COSTO_FIJO_POR_RUTA));
    
    routes.slice(0, 5).forEach((r, i) => { 
        const cost = (r.distance * COSTO_POR_KM) + COSTO_FIJO_POR_RUTA;
        const width = (cost / maxCost) * 100; 
        
        doc.setFontSize(9); doc.setTextColor(100);
        doc.text(`Ruta ${r.id.substring(0, 4)}`, 14, barY + 4);
        
        doc.setFillColor(52, 152, 219);
        doc.rect(35, barY, width, 5, 'F');
        
        doc.setFontSize(9); doc.setTextColor(50);
        doc.text(`$${cost.toFixed(0)}`, 35 + width + 2, barY + 4);
        
        barY += 10;
    });

    doc.save(`Reporte_Financiero_${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success('Reporte Financiero generado');
  };

  // --- REPORTE 2: FLOTILLA (Con Gráficas de Barra en Tabla) ---
  const generateFleetReport = async () => {
    if (!(await prepareData())) return;
    if (trucks.length === 0) { toast.error('Sin datos.'); return; }

    const doc = new jsPDF();
    const dateStr = selectedDate.toLocaleDateString();

    // Encabezado Verde (Productividad)
    doc.setFillColor(39, 174, 96); 
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('ANÁLISIS DE PRODUCTIVIDAD DE FLOTILLA', 14, 18);
    doc.setFontSize(10); doc.text(`Rendimiento y Ocupación | ${dateStr}`, 14, 25);

    // --- CÁLCULOS PREVIOS ---
    let totalFleetKm = 0;
    let totalFleetStops = 0;
    let totalFleetRoutes = 0;

    const fleetData = trucks.map(truck => {
      const truckRoutes = routes.filter(r => r.truckId === truck.id);
      const km = truckRoutes.reduce((sum, r) => sum + r.distance, 0);
      const stops = truckRoutes.reduce((sum, r) => sum + r.stores.length, 0);
      
      totalFleetKm += km;
      totalFleetStops += stops;
      totalFleetRoutes += truckRoutes.length;

      const maxCap = truck.capacity * (truckRoutes.length || 1);
      const usedCap = truckRoutes.reduce((sum, r) => sum + (r.stores.length * 15), 0); 
      const occupation = Math.min(100, Math.round((usedCap / maxCap) * 100));

      return {
        name: truck.name,
        driver: truck.driverName || 'N/A',
        km: km,
        stops: stops,
        occupation: occupation,
        routesCount: truckRoutes.length
      };
    });

    fleetData.sort((a, b) => b.km - a.km);

    // --- RECUADROS DE RESUMEN (KPIs) ---
    const drawKPI = (x: number, title: string, value: string, subtitle: string, color: [number, number, number]) => {
        doc.setDrawColor(200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, 40, 55, 30, 2, 2, 'FD');
        
        doc.setFontSize(9); doc.setTextColor(100);
        doc.text(title, x + 5, 48);
        
        doc.setFontSize(16); doc.setTextColor(color[0], color[1], color[2]);
        doc.text(value, x + 5, 58);
        
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text(subtitle, x + 5, 66);
    };

    drawKPI(14, "DISTANCIA TOTAL", `${totalFleetKm.toFixed(1)} km`, "Flota Activa", [22, 160, 133]);
    drawKPI(74, "ENTREGAS TOTALES", `${totalFleetStops}`, "Puntos Visitados", [230, 126, 34]);
    drawKPI(134, "RUTAS ASIGNADAS", `${totalFleetRoutes}`, "Despachos del Día", [41, 128, 185]);

    // --- TABLA ---
    autoTable(doc, {
      startY: 80, // Bajamos la tabla para dar espacio a los KPIs
      head: [['Unidad', 'Conductor', 'Km Recorridos', 'Entregas', 'Nivel de Ocupación (Visual)']],
      body: fleetData.map(d => [d.name, d.driver, `${d.km.toFixed(1)} km`, d.stops.toString(), '']), 
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 10, halign: 'center' },
      columnStyles: { 
          0: { halign: 'left', fontStyle: 'bold' },
          1: { halign: 'left' },
          2: { halign: 'right' },
          4: { cellWidth: 60 } 
      },
      didDrawCell: function(data) {
          if (data.section === 'body' && data.column.index === 4) {
              const index = data.row.index;
              const occupation = fleetData[index].occupation;
              
              const cellX = data.cell.x + 2;
              const cellY = data.cell.y + 3;
              // Dibujar barra de fondo (Gris)
              const barHeight = data.cell.height - 6;
              doc.setFillColor(240, 240, 240);
              doc.rect(cellX, cellY, data.cell.width - 4, barHeight, 'F');

              // Definir color según porcentaje
              if (occupation < 50) doc.setFillColor(231, 76, 60); // Rojo (Vacío)
              else if (occupation < 80) doc.setFillColor(241, 196, 15); // Amarillo
              else doc.setFillColor(46, 204, 113); // Verde (Lleno)
              
              // Dibujar barra de progreso
              const barWidth = (data.cell.width - 4) * (occupation / 100);
              doc.rect(cellX, cellY, barWidth, barHeight, 'F');
              
              // Texto del porcentaje
              doc.setFontSize(8);
              doc.setTextColor(0);
              // Centrar texto
              const textWidth = doc.getTextWidth(`${occupation}%`);
              doc.text(`${occupation}%`, cellX + (data.cell.width / 2) - (textWidth / 2), cellY + (barHeight / 2) + 3);
          }
      }
    });

    doc.save(`Flotilla_${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success('Reporte de Flotilla generado');
  };

  // --- REPORTE 3: AUDITORÍA (Calidad de Servicio - MEJORADO) ---
  const generateAuditReport = async () => {
    if (!(await prepareData())) return;
    
    const auditRoutes = routes.filter(r => r.status === 'completed');

    if (auditRoutes.length === 0) {
      toast.error('No hay rutas completadas para auditar en esta fecha.');
      return;
    }

    const doc = new jsPDF();
    const dateStr = selectedDate.toLocaleDateString();

    // --- 1. PORTADA / ENCABEZADO FORMAL ---
    doc.setFillColor(44, 62, 80); // Azul oscuro formal
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('AUDITORÍA DE CUMPLIMIENTO DE RUTAS', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Fecha de Auditoría: ${dateStr}`, 14, 28);
    doc.text(`ID de Auditoría: AUD-${Date.now().toString().substring(8)}`, 14, 34);
    doc.text(`Alcance: ${auditRoutes.length} rutas completadas`, 140, 28);

    // --- 2. ANÁLISIS DE DATOS (Examen) ---
    let totalDeviationMinutes = 0;
    let lateRoutes = 0;
    let earlyRoutes = 0;
    let onTimeRoutes = 0;
    
    const auditData = auditRoutes.map(route => {
      const truck = trucks.find(t => t.id === route.truckId);

      let deviationStr = '--';
      let status = 'N/A';
      let rawDeviation = 0;
      let realDuration = 'N/A';

      if (route.actualStartTime && route.actualEndTime) {
        const start = new Date(route.actualStartTime).getTime();
        const end = new Date(route.actualEndTime).getTime();
        const durationHours = (end - start) / (1000 * 60 * 60);
        realDuration = `${durationHours.toFixed(2)} h`;
        
        const estimated = route.estimatedTime || 0.1; 
        const deviation = durationHours - estimated;
        rawDeviation = Math.round(deviation * 60); // Minutos
        
        deviationStr = `${rawDeviation > 0 ? '+' : ''}${rawDeviation} min`;
        
        const deviationPerc = (deviation / estimated) * 100;

        if (deviationPerc > 10 || rawDeviation > UMBRAL_RETRASO_MIN) {
            status = 'CRÍTICO'; 
            lateRoutes++;
        } else if (deviationPerc < -10) {
            status = 'HOLGADO'; 
            earlyRoutes++;
        } else {
            status = 'CUMPLIMIENTO';
            onTimeRoutes++;
        }
        totalDeviationMinutes += rawDeviation;
      }

      return {
        id: route.id.substring(0, 8),
        driver: truck?.driverName || 'N/A',
        estimated: `${(route.estimatedTime).toFixed(2)} h`,
        real: realDuration,
        deviation: deviationStr,
        status: status,
        rawDev: rawDeviation
      };
    });

    // Puntaje General
    // Corrección: Si no hay rutas completadas (auditRoutes.length es 0), el resultado es 0 para evitar NaN.
    const score = auditRoutes.length > 0 ? Math.round((onTimeRoutes / auditRoutes.length) * 100) : 0;
    const avgDeviation = auditRoutes.length > 0 ? Math.round(totalDeviationMinutes / auditRoutes.length) : 0;

    // --- 3. RESULTADOS DEL EXAMEN (Dashboard en PDF) ---
    
    doc.setTextColor(0);
    let yPos = 50;

    // Resumen Ejecutivo
    doc.setFontSize(14);
    doc.text('Resumen Ejecutivo', 14, yPos);
    yPos += 10;

    doc.setDrawColor(200);
    doc.setFillColor(250, 250, 250);
    doc.rect(14, yPos, 182, 30, 'FD');
    
    // KPI 1: Score
    doc.setFontSize(10); doc.setTextColor(100); doc.text('NIVEL DE CUMPLIMIENTO', 20, yPos + 8);
    doc.setFontSize(18); 
    if (score >= 90) doc.setTextColor(39, 174, 96);
    else if (score >= 70) doc.setTextColor(243, 156, 18);
    else doc.setTextColor(192, 57, 43);
    doc.text(`${score}%`, 20, yPos + 20);

    // KPI 2: Retrasos
    doc.setFontSize(10); doc.setTextColor(100); doc.text('RUTAS CRÍTICAS', 90, yPos + 8);
    doc.setFontSize(18); doc.setTextColor(192, 57, 43);
    doc.text(`${lateRoutes}`, 90, yPos + 20);

    // KPI 3: Desviación
    doc.setFontSize(10); doc.setTextColor(100); doc.text('DESVIACIÓN PROMEDIO', 150, yPos + 8);
    doc.setFontSize(18); doc.setTextColor(0);
    doc.text(`${avgDeviation > 0 ? '+' : ''}${avgDeviation} min`, 150, yPos + 20);

    yPos += 40;

    // --- 4. HALLAZGOS Y CONCLUSIONES AUTOMÁTICAS ---
    doc.setFontSize(14); doc.setTextColor(0);
    doc.text('Hallazgos de la Auditoría', 14, yPos);
    yPos += 8;
    doc.setFontSize(10); doc.setTextColor(80);

    let findings = [];
    if (score === 100) findings.push("• La operación se ejecutó perfectamente según lo planificado.");
    if (lateRoutes > 0) findings.push(`• Se detectaron ${lateRoutes} rutas con tiempos de ejecución superiores a la tolerancia permitida.`);
    if (earlyRoutes > 0) findings.push(`• Se observaron ${earlyRoutes} rutas con holgura excesiva, sugiriendo oportunidad para agregar más paradas.`);
    if (avgDeviation > 30) findings.push("• Desviación sistémica severa: Se recomienda revisar los parámetros de velocidad de la flota en el algoritmo.");
    if (findings.length === 0) findings.push("• Operación dentro de parámetros normales con variaciones menores.");
    
    findings.forEach(f => {
        doc.text(f, 14, yPos);
        yPos += 6;
    });
    yPos += 5;

    // --- 5. TABLA DE EVIDENCIA ---
    const tableBody = auditData.map(d => [d.id, d.driver, d.estimated, d.real, d.deviation, d.status]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['ID Ruta', 'Operador', 'Planificado', 'Real', 'Desviación', 'Dictamen']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 9, halign: 'center' },
      columnStyles: {
          5: { fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'CRÍTICO') data.cell.styles.textColor = [192, 57, 43];
            else if (data.cell.raw === 'CUMPLIMIENTO') data.cell.styles.textColor = [39, 174, 96];
            else data.cell.styles.textColor = [243, 156, 18];
        }
      }
    });

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Documento generado automáticamente por el Módulo de Auditoría RouteMinds.`, 14, doc.internal.pageSize.height - 10);

    doc.save(`Auditoria_Oficial_${selectedDate.toISOString().split('T')[0]}.pdf`);
    toast.success('Auditoría generada exitosamente');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de Inteligencia (BI)</h1>
            <p className="mt-1 text-gray-600">Generación de informes estratégicos para la toma de decisiones.</p>
        </div>
      </div>

      {/* Selector de Fecha Global */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Periodo de Análisis:</span>
        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
          <Calendar size={18} className="text-gray-500 mr-2" />
          <DatePicker 
              selected={selectedDate} 
              onChange={(date) => date && setSelectedDate(date)} 
              className="outline-none text-sm text-gray-700 w-28 bg-transparent cursor-pointer"
              dateFormat="dd/MM/yyyy"
              maxDate={new Date()}
          />
        </div>
      </div>

      {/* GRID DE REPORTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Reporte 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-blue-400 transition-all group cursor-pointer hover:shadow-lg transform hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <DollarSign size={24} />
            </div>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Financiero</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Resumen Diario & Costos</h3>
          <p className="text-sm text-gray-500 mb-6">
            Análisis de costos operativos estimados, KPIs de eficiencia y volumen.
          </p>
          <Button onClick={generateDailyReport} fullWidth leftIcon={<FileText size={18} />}>
            Reporte Financiero
          </Button>
        </div>

        {/* Reporte 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-green-400 transition-all group cursor-pointer hover:shadow-lg transform hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp size={24} />
            </div>
            <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-full">Productividad</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Desempeño de Flotilla</h3>
          <p className="text-sm text-gray-500 mb-6">
            Ranking de conductores, densidad de entrega y % de ocupación.
          </p>
          <Button 
            onClick={generateFleetReport} 
            fullWidth 
            className="bg-green-600 hover:bg-green-700 text-white"
            leftIcon={<Truck size={18} />}
          >
            Reporte Productividad
          </Button>
        </div>

        {/* Reporte 3 */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-orange-400 transition-all group cursor-pointer hover:shadow-lg transform hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle size={24} />
            </div>
            <span className="text-xs font-semibold bg-orange-50 text-orange-700 px-2 py-1 rounded-full">Calidad</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Auditoría de Tiempos</h3>
          <p className="text-sm text-gray-500 mb-6">
            Detección de cuellos de botella y desviaciones críticas (&gt;15 min).
          </p>
          <Button 
            onClick={generateAuditReport} 
            fullWidth 
            className="bg-orange-600 hover:bg-orange-700 text-white"
            leftIcon={<Download size={18} />}
          >
            Auditar Calidad
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;