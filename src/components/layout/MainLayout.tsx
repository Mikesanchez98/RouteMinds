import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Warehouse, Store, Truck, BarChart4, Map, 
  Table, Clock, ClipboardList, LogOut, Menu, X 
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const MainLayout: React.FC = () => {
  // Obtener funciones y estado del store de autenticación
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para controlar la visibilidad del menú en móviles
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Manejar cierre de sesión
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Elementos del menú de navegación
  const menuItems = [
    { path: '/dashboard', icon: <BarChart4 size={20} />, label: 'Panel Principal' },
    { path: '/management', icon: <Warehouse size={20} />, label: 'Gestión' },
    { path: '/map', icon: <Map size={20} />, label: 'Vista Mapa' },
    { path: '/routes', icon: <Table size={20} />, label: 'Rutas' },
    { path: '/time-analysis', icon: <Clock size={20} />, label: 'Análisis de Tiempo' },
    { path: '/store-details', icon: <Store size={20} />, label: 'Detalles de Tiendas' },
    { path: '/reports', icon: <ClipboardList size={20} />, label: 'Reportes' },
  ];

  // Funciones para controlar el menú móvil
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Botón de alternar menú móvil */}
      <div className="fixed z-20 top-4 left-4 md:hidden">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow-md text-gray-700 hover:bg-gray-100 focus:outline-none"
          aria-label="Alternar menú"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Fondo oscuro para menú móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Barra lateral */}
      <aside
        className={`fixed md:relative z-20 md:z-0 inset-y-0 left-0 bg-white w-64 shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Encabezado de la barra lateral */}
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Optimizador de Rutas</h2>
            {user && (
              <p className="text-sm text-gray-600 mt-1">Bienvenido, {user.username}</p>
            )}
          </div>

          {/* Navegación */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="px-2 space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      closeSidebar();
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md text-sm transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Pie de la barra lateral */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;