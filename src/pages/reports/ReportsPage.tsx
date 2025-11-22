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
  const { routes, trucks, warehouses, fetchRoutesByDate, fetchTrucks, fetchWarehouses } = useDataStore();

  // Cargar datos necesarios
  const prepareData = async () => {
    const loadingToast = toast.loading('Recopilando datos...');
    try {
      await Promise.all([
        fetchRoutesByDate(selectedDate),
        fetchTrucks(),
        fetchWarehouses()
      ]);
      toast.success('Datos listos para el reporte', { id: loadingToast });
      return true;
    } catch (error) {
      toast.error('Error al cargar datos', { id: loadingToast });
      return false;
    }
  };

  // --- GENERADOR DE PDF ---
  const generateDailyReport = async () => {
    const success = await prepareData();
    if (!success) return;

    // Si no hay rutas, avisar
    if (routes.length === 0) {
      toast.error('No hay rutas registradas para esta fecha.');
      return;
    }

    const doc = new jsPDF();
    const dateStr = selectedDate.toLocaleDateString();

    // 1. Encabezado
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte Operativo Diario', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha del reporte: ${dateStr}`, 14, 28);
    doc.text(`Generado por: RouteMinds System`, 14, 33);

    // 2. Resumen General (KPIs)
    const totalRoutes = routes.length;
    const completedRoutes = routes.filter(r => r.status === 'completed').length;
    const totalDistance = routes.reduce((acc, r) => acc + r.distance, 0).toFixed(1);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 40, 182, 25, 'F'); // Caja gris
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Rutas: ${totalRoutes}`, 20, 50);
    doc.text(`Completadas: ${completedRoutes}`, 20, 58);
    
    doc.text(`Distancia Total: ${totalDistance} km`, 100, 50);
    doc.text(`Eficiencia: ${Math.round((completedRoutes/totalRoutes)*100)}%`, 100, 58);

    // 3. Tabla de Datos
    const tableData = routes.map(route => {
      const truck = trucks.find(t => t.id === route.truckId);
      const warehouse = warehouses.find(w => w.id === route.warehouseId);
      
      return [
        route.id.substring(0, 6), // ID Corto
        truck?.name || 'N/A',
        truck?.driverName || 'Sin conductor',
        warehouse?.name || 'N/A',
        `${route.stores.length} paradas`,
        `${route.distance.toFixed(1)} km`,
        // Traducción de estado
        route.status === 'completed' ? 'Completada' : 
        route.status === 'in_progress' ? 'En Ruta' : 'Pendiente'
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [['ID', 'Camión', 'Conductor', 'Origen', 'Paradas', 'Distancia', 'Estado']],
      body: tableData,
      headStyles: { fillColor: [79, 70, 229] }, // Color Indigo (tu marca)
      alternateRowStyles: { fillColor: [245, 247, 255] },
      styles: { fontSize: 9 },
    });

    // 4. Pie de página
    const pageCount = doc.internal.pages.length - 1;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página 1 de ${pageCount}`, 14, doc.internal.pageSize.height - 10);

    // Guardar
    doc.save(`Reporte_Diario_${selectedDate.toISOString().split('T')[0]}.pdf`);
    toast.success('PDF descargado correctamente');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de Reportes</h1>
        <p className="mt-1 text-gray-600">Genera y descarga documentación operativa.</p>
      </div>

      {/* Selector de Fecha Global */}
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

      {/* GRID DE REPORTES DISPONIBLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* REPORTE 1: DIARIO OPERATIVO */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-indigo-200 transition-all">
          <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Resumen Diario de Rutas</h3>
          <p className="text-sm text-gray-500 mb-6">
            Detalle completo de todas las rutas generadas, camiones asignados, kilometraje y estado de cumplimiento del día seleccionado.
          </p>
          <Button 
            onClick={generateDailyReport} 
            fullWidth 
            leftIcon={<Download size={18} />}
          >
            Descargar PDF
          </Button>
        </div>

        {/* REPORTE 2: DESEMPEÑO (Placeholder para futuro) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-indigo-200 transition-all opacity-75">
          <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
            <Truck size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Reporte de Flotilla</h3>
          <p className="text-sm text-gray-500 mb-6">
            Análisis de uso de camiones y desempeño de conductores. (Próximamente)
          </p>
          <Button disabled fullWidth variant="outline">
            Próximamente
          </Button>
        </div>

        {/* REPORTE 3: CUMPLIMIENTO (Placeholder) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:border-indigo-200 transition-all opacity-75">
          <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Auditoría de Entregas</h3>
          <p className="text-sm text-gray-500 mb-6">
            Registro de tiempos de llegada vs tiempos estimados por tienda. (Próximamente)
          </p>
          <Button disabled fullWidth variant="outline">
            Próximamente
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;