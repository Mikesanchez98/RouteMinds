import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// App Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ManagementPage from './pages/management/ManagementPage';
import MapPage from './pages/map/MapPage';
import RoutesPage from './pages/routes/RoutesPage';
import TimeAnalysisPage from './pages/analysis/TimeAnalysisPage';
import StoreDetailsPage from './pages/stores/StoreDetailsPage';
import ReportsPage from './pages/reports/ReportsPage';

// Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  //Obtener estado de autenticación e inicialización desde el store
  const { isAuthenticated, isInitialized } = useAuthStore();

  if(!isInitialized) {
    //Aún no sabemos si el usuario esta logeado.
    //Muestra una pantalla de carga o nada.
    return(
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading session...</div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    //Ahora SI sabemos que el store esta inicializado yu que no esta autenticado.
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
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
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;