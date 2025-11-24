import React, { useState } from 'react';
import { FileText, Download, Calendar, Truck, CheckCircle } from 'lucide-react';
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
    routes, trucks, warehouses, drivers, 
    fetchRoutesByDate, fetchTrucks, fetchWarehouses, fetchDrivers 
  } = useDataStore();

  // Función auxiliar para cargar datos frescos
  const prepareData = async () => {
    const loadingToast = toast.loading('Recopilando datos...');
    try {
      await Promise.all([
        fetchRoutesByDate(selectedDate),
        fetchTrucks(),
        fetchWarehouses(),
        fetchDrivers() 
      ]);
      toast.success('Datos actualizados', { id: loadingToast });
      return true;
    } catch (error) {
      toast.error('Error al cargar datos', { id: loadingToast });
      return false;
    }
  };

  // --- REPORTE 1: DIARIO OPERATIVO ---
  const generateDailyReport = async () => {
    const success = await prepareData();
    if (!success) return;

    if (routes.length === 0) {
      toast.error('No hay rutas registradas para esta fecha.');
      return;
    }

    const doc = new jsPDF();
    const dateStr = selectedDate.toLocaleDateString();

    // Encabezado
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte Operativo Diario', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${dateStr}`, 14, 28);
    doc.text(`Generado por: RouteMinds System`, 14, 33);

    // Resumen (KPIs)
    const totalRoutes = routes.length;
    const completedRoutes = routes.filter(r => r.status === 'completed').length;
    const totalDistance = routes.reduce((acc, r) => acc + r.distance, 0).toFixed(1);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 40, 182, 25, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Rutas: ${totalRoutes}`, 20, 50);
    doc.text(`Completadas: ${completedRoutes}`, 20, 58);
    doc.text(`Distancia Total: ${totalDistance} km`, 100, 50);
    doc.text(`Eficiencia: ${totalRoutes > 0 ? Math.round((completedRoutes/totalRoutes)*100) : 0}%`, 100, 58);

    // Tabla Detallada
    const tableData = routes.map(route => {
      const truck = trucks.find(t => t.id === route.truckId);
      const warehouse = warehouses.find(w => w.id === route.warehouseId);
      
      return [
        route.id.substring(0, 6),
        truck?.name || 'N/A',
        truck?.driverName || 'Sin conductor',
        warehouse?.name || 'N/A',
        `${route.stores.length} paradas`,
        `${route.distance.toFixed(1)} km`,
        route.status === 'completed' ? 'Completada' : route.status === 'in_progress' ? 'En Ruta' : 'Pendiente'
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [['ID', 'Camión', 'Conductor', 'Origen', 'Paradas', 'Distancia', 'Estado']],
      body: tableData,
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      styles: { fontSize: 9 },
    });

    doc.save(`Reporte_Diario_${selectedDate.toISOString().split('T')[0]}.pdf`);
    toast.success('PDF descargado');
  };

  // --- REPORTE 2: FLOTILLA ---
  const generateFleetReport = async () => {
    const success = await prepareData();
    if (!success) return;

    if (trucks.length === 0) {
      toast.error('No hay camiones registrados.');
      return;
    }

    const doc = new jsPDF();
    const dateStr = selectedDate.toLocaleDateString();

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Desempeño de Flotilla', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de análisis: ${dateStr}`, 14, 28);
    
    const fleetData = trucks.map(truck => {
      const truckRoutes = routes.filter(r => r.truckId === truck.id);
      const completed = truckRoutes.filter(r => r.status === 'completed');
      const totalKm = truckRoutes.reduce((sum, r) => sum + r.distance, 0);
      const totalStops = truckRoutes.reduce((sum, r) => sum + r.stores.length, 0);
      const driver = drivers.find(d => d.id === truck.currentDriverId);

      return [
        truck.name,
        driver?.name || 'Sin asignar',
        truckRoutes.length.toString(),
        completed.length.toString(),
        `${totalKm.toFixed(1)} km`,
        totalStops.toString(),
        `${truck.capacity} kg`
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [['Camión', 'Conductor', 'Rutas Total', 'Completadas', 'Distancia', 'Paradas', 'Capacidad']],
      body: fleetData,
      headStyles: { fillColor: [16, 185, 129] }, // Verde
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 9, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 1: { halign: 'left' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;
    const totalFleetKm = routes.reduce((sum, r) => sum + r.distance, 0);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Kilometraje Total de la Flotilla: ${totalFleetKm.toFixed(1)} km`, 14, finalY + 10);

    doc.save(`Reporte_Flotilla_${selectedDate.toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte de Flotilla descargado');
  };

// --- REPORTE 3: AUDITORÍA DE ENTREGAS (MEJORADO) ---
  const generateAuditReport = async () => {
    const success = await prepareData();
    if (!success) return;

    // CAMBIO 1: Filtro más permisivo.
    // Aceptamos rutas completadas, aunque falte algún tiempo (lo manejaremos después)
    const auditRoutes = routes.filter(r => r.status === 'completed');

    if (auditRoutes.length === 0) {
      toast.error('No hay rutas completadas para auditar en esta fecha.');
      return;
    }

    const doc = new jsPDF();
    const dateStr = selectedDate.toLocaleDateString();

    // Encabezado
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Auditoría de Cumplimiento de Entregas', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de auditoría: ${dateStr}`, 14, 28);
    doc.text('Criterio de Retraso: >10% sobre tiempo estimado', 14, 33);

    let totalDelayed = 0;
    let totalAudited = 0;

    const auditData = auditRoutes.map(route => {
      const truck = trucks.find(t => t.id === route.truckId);
      const driver = drivers.find(d => d.id === truck?.currentDriverId);
      
      // Valores por defecto si faltan datos
      let startTimeStr = 'N/A';
      let endTimeStr = 'N/A';
      let durationStr = 'N/A';
      let deviationStr = 'N/A';
      let status = 'Sin Datos';

      // CAMBIO 2: Cálculo seguro
      if (route.actualStartTime && route.actualEndTime) {
        const start = new Date(route.actualStartTime).getTime();
        const end = new Date(route.actualEndTime).getTime();
        const durationHours = (end - start) / (1000 * 60 * 60);

        const estimated = route.estimatedTime || 0; // Evitar división por cero
        
        startTimeStr = new Date(route.actualStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        endTimeStr = new Date(route.actualEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        durationStr = `${durationHours.toFixed(2)} h`;

        if (estimated > 0) {
            const deviation = durationHours - estimated;
            const deviationPerc = (deviation / estimated) * 100;
            deviationStr = `${deviation > 0 ? '+' : ''}${Math.round(deviation * 60)} min`;

            if (deviationPerc > 10) {
                status = 'Retrasada';
                totalDelayed++;
            } else if (deviationPerc < -10) {
                status = 'Adelantada';
            } else {
                status = 'A Tiempo';
            }
            totalAudited++;
        } else {
            status = 'N/A (Est. 0)';
        }
      } else {
          status = 'Datos Incompletos';
      }

      return [
        route.id.substring(0, 6),
        driver?.name || 'N/A',
        startTimeStr,
        endTimeStr,
        `${(route.estimatedTime || 0).toFixed(2)} h`,
        durationStr,
        deviationStr,
        status
      ];
    });

    // Resumen visual (Evitar división por cero)
    const cumplimientoRate = totalAudited > 0 
        ? Math.round(((totalAudited - totalDelayed) / totalAudited) * 100) 
        : 0;
    
    doc.setFillColor(255, 247, 237); 
    doc.setDrawColor(251, 146, 60); 
    doc.rect(14, 40, 182, 20, 'FD');
    
    doc.setFontSize(11);
    doc.setTextColor(194, 65, 12); 
    doc.text(`Índice de Cumplimiento: ${cumplimientoRate}%`, 20, 53);
    doc.text(`Rutas Retrasadas: ${totalDelayed} de ${totalAudited}`, 100, 53);

    autoTable(doc, {
      startY: 65,
      head: [['ID Ruta', 'Conductor', 'Inicio Real', 'Fin Real', 'Est.', 'Real', 'Desv.', 'Estatus']],
      body: auditData,
      headStyles: { fillColor: [234, 88, 12] },
      styles: { fontSize: 9, halign: 'center' },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 7) {
            const status = data.cell.raw;
            if (status === 'Retrasada') {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
            } else if (status === 'A Tiempo') {
                data.cell.styles.textColor = [22, 163, 74];
            } else if (status === 'Datos Incompletos') {
                data.cell.styles.textColor = [156, 163, 175]; // Gris
            }
        }
      }
    });

    doc.save(`Auditoria_Entregas_${selectedDate.toISOString().split('T')[0]}.pdf`);
    toast.success('Auditoría descargada');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de Reportes</h1>
        <p className="mt-1 text-gray-600">Genera y descarga documentación operativa.</p>
      </div>

      {/* Selector de Fecha */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Seleccionar periodo:</span>
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

      {/* TARJETAS DE REPORTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Reporte 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-indigo-200 transition-all group">
          <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Resumen Diario</h3>
          <p className="text-sm text-gray-500 mb-6">
            Detalle de todas las rutas, estado de cumplimiento y tiempos estimados del día.
          </p>
          <Button onClick={generateDailyReport} fullWidth leftIcon={<Download size={18} />}>
            Descargar PDF
          </Button>
        </div>

        {/* Reporte 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-green-200 transition-all group">
          <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Truck size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Reporte de Flotilla</h3>
          <p className="text-sm text-gray-500 mb-6">
            Análisis de productividad por camión y conductor: kilómetros, paradas y rutas.
          </p>
          <Button 
            onClick={generateFleetReport} 
            fullWidth 
            className="bg-green-600 hover:bg-green-700 text-white"
            leftIcon={<Download size={18} />}
          >
            Descargar PDF
          </Button>
        </div>

        {/* Reporte 3 */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-orange-200 transition-all group">
          <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Auditoría de Entregas</h3>
          <p className="text-sm text-gray-500 mb-6">
            Comparativa de tiempos estimados vs reales y desviaciones. Requiere rutas completadas.
          </p>
          <Button 
            onClick={generateAuditReport} 
            fullWidth 
            className="bg-orange-600 hover:bg-orange-700 text-white"
            leftIcon={<Download size={18} />}
          >
            Descargar PDF
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;