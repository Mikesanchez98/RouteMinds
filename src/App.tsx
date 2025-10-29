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
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
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