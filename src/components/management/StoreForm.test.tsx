import { render, screen, fireEvent } from '@testing-library/react';
import StoreForm from './StoreForm';

// Mock the data store
jest.mock('../../store/dataStore', () => ({
  __esModule: true,
  default: () => ({
    addStore: jest.fn(),
    updateStore: jest.fn()
  })
}));

describe('StoreForm Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  test('renders empty form for new store', () => {
    render(<StoreForm onComplete={mockOnComplete} />);
    
    expect(screen.getByLabelText(/store name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/demand/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<StoreForm onComplete={mockOnComplete} />);
    
    const submitButton = screen.getByRole('button', { name: /add store/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/latitude is required/i)).toBeInTheDocument();
    expect(screen.getByText(/longitude is required/i)).toBeInTheDocument();
    expect(screen.getByText(/demand is required/i)).toBeInTheDocument();
    expect(screen.getByText(/address is required/i)).toBeInTheDocument();
  });

  test('validates latitude range', () => {
    render(<StoreForm onComplete={mockOnComplete} />);
    
    const latInput = screen.getByLabelText(/latitude/i);
    fireEvent.change(latInput, { target: { value: '100' } });
    
    const submitButton = screen.getByRole('button', { name: /add store/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/latitude must be between -90 and 90/i)).toBeInTheDocument();
  });

  test('validates longitude range', () => {
    render(<StoreForm onComplete={mockOnComplete} />);
    
    const lngInput = screen.getByLabelText(/longitude/i);
    fireEvent.change(lngInput, { target: { value: '200' } });
    
    const submitButton = screen.getByRole('button', { name: /add store/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/longitude must be between -180 and 180/i)).toBeInTheDocument();
  });

  test('pre-fills form when editing existing store', () => {
    const mockStore = {
      id: '1',
      name: 'Test Store',
      location: { lat: 40.7128, lng: -74.006 },
      demand: 100,
      address: '123 Test St',
      timeWindow: { start: '09:00', end: '17:00' }
    };

    render(<StoreForm store={mockStore} onComplete={mockOnComplete} />);
    
    expect(screen.getByLabelText(/store name/i)).toHaveValue('Test Store');
    expect(screen.getByLabelText(/latitude/i)).toHaveValue('40.7128');
    expect(screen.getByLabelText(/longitude/i)).toHaveValue('-74.006');
    expect(screen.getByLabelText(/demand/i)).toHaveValue('100');
    expect(screen.getByLabelText(/address/i)).toHaveValue('123 Test St');
  });
});