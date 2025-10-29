import { render, screen } from '@testing-library/react';
import MapView from './MapView';

// Mock Leaflet and related components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    fitBounds: jest.fn(),
    removeControl: jest.fn()
  })
}));

// Mock the data store
jest.mock('../../store/dataStore', () => ({
  __esModule: true,
  default: () => ({
    warehouses: [
      {
        id: 'w1',
        name: 'Warehouse 1',
        location: { lat: 40.7128, lng: -74.006 },
        address: '123 Test St',
        capacity: 1000
      }
    ],
    stores: [
      {
        id: 's1',
        name: 'Store 1',
        location: { lat: 40.7, lng: -74 },
        address: '456 Test Ave',
        demand: 100
      }
    ],
    routes: [
      {
        id: 'r1',
        warehouseId: 'w1',
        truckId: 't1',
        stores: ['s1'],
        distance: 10,
        estimatedTime: 1,
        created: '2024-01-01'
      }
    ]
  })
}));

describe('MapView Component', () => {
  test('renders map container', () => {
    render(<MapView />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  test('renders warehouse markers', () => {
    render(<MapView />);
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBeGreaterThan(0);
  });

  test('renders store markers', () => {
    render(<MapView />);
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBeGreaterThan(0);
  });

  test('shows warehouse information in popup', () => {
    render(<MapView />);
    expect(screen.getByText('Warehouse 1')).toBeInTheDocument();
  });

  test('shows store information in popup', () => {
    render(<MapView />);
    expect(screen.getByText('Store 1')).toBeInTheDocument();
  });

  test('handles route selection', () => {
    render(<MapView selectedRoute="r1" />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});