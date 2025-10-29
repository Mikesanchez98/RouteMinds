import { act, renderHook } from '@testing-library/react';
import useDataStore from './dataStore';

describe('dataStore', () => {
  test('initializes with sample data', () => {
    const { result } = renderHook(() => useDataStore());
    
    expect(result.current.warehouses.length).toBeGreaterThan(0);
    expect(result.current.stores.length).toBeGreaterThan(0);
    expect(result.current.trucks.length).toBeGreaterThan(0);
  });

  test('adds warehouse', () => {
    const { result } = renderHook(() => useDataStore());
    const initialCount = result.current.warehouses.length;
    
    act(() => {
      result.current.addWarehouse({
        name: 'New Warehouse',
        location: { lat: 40, lng: -74 },
        capacity: 1000,
        address: '123 Test St'
      });
    });

    expect(result.current.warehouses.length).toBe(initialCount + 1);
  });

  test('updates warehouse', () => {
    const { result } = renderHook(() => useDataStore());
    const warehouse = result.current.warehouses[0];
    
    act(() => {
      result.current.updateWarehouse(warehouse.id, { name: 'Updated Name' });
    });

    const updated = result.current.warehouses.find(w => w.id === warehouse.id);
    expect(updated?.name).toBe('Updated Name');
  });

  test('deletes warehouse', () => {
    const { result } = renderHook(() => useDataStore());
    const warehouse = result.current.warehouses[0];
    const initialCount = result.current.warehouses.length;
    
    act(() => {
      result.current.deleteWarehouse(warehouse.id);
    });

    expect(result.current.warehouses.length).toBe(initialCount - 1);
  });

  test('generates routes', () => {
    const { result } = renderHook(() => useDataStore());
    
    act(() => {
      result.current.generateRoutes();
    });

    expect(result.current.routes.length).toBeGreaterThan(0);
  });

  test('calculates route distances correctly', () => {
    const { result } = renderHook(() => useDataStore());
    
    act(() => {
      result.current.generateRoutes();
    });

    result.current.routes.forEach(route => {
      expect(route.distance).toBeGreaterThan(0);
      expect(route.estimatedTime).toBeGreaterThan(0);
    });
  });
});