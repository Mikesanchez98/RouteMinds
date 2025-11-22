import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// --- 1. ESTILOS GLOBALES ---
import 'react-datepicker/dist/react-datepicker.css';
// ---------------------------

// --- 2. NOTIFICACIONES (TOASTS) ---
import { Toaster } from 'react-hot-toast';
// ----------------------------------

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import UpdatePasswordPage from './pages/auth/UpdatePasswordPage';

// App Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ManagementPage from './pages/management/ManagementPage';
import MapPage from './pages/map/MapPage';
import RoutesPage from './pages/routes/RoutesPage';
import TimeAnalysisPage from './pages/analysis/TimeAnalysisPage';
import StoreDetailsPage from './pages/stores/StoreDetailsPage';
import ReportsPage from './pages/reports/ReportsPage';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Obtener estado de autenticación e inicialización desde el store
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    // Aún no sabemos si el usuario está logeado.
    // Muestra una pantalla de carga o nada.
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <div className="text-gray-600 font-medium">Cargando sesión...</div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Ahora SI sabemos que el store está inicializado y que no está autenticado.
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      {/* --- 3. CONFIGURACIÓN DE NOTIFICACIONES --- */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* ----------------------------------------- */}

      <Routes>
        {/* Rutas Públicas (Auth) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        
        {/* Rutas Protegidas (App) */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="management" element={<ManagementPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="time-analysis" element={<TimeAnalysisPage />} />
          <Route path="store-details" element={<StoreDetailsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        
        {/* Fallback (404) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;