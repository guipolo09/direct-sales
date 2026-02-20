import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppStoreProvider, useAppStore } from './AppStore';
import * as db from '../services/db';
import { ProductRepository } from '../services/ProductRepository';
import { CustomerRepository } from '../services/CustomerRepository';
import { SaleRepository } from '../services/SaleRepository';
import { FinancialRepository } from '../services/FinancialRepository';
import { CategoryRepository } from '../services/CategoryRepository';
import { BrandRepository } from '../services/BrandRepository';
import { StockMoveRepository } from '../services/StockMoveRepository';
import { PurchaseOrderRepository } from '../services/PurchaseOrderRepository';

// Mock dependencies
jest.mock('../services/db', () => ({
  initDB: jest.fn().mockResolvedValue(undefined),
  getDB: jest.fn().mockResolvedValue({
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      withTransactionAsync: jest.fn((cb) => cb()),
      execAsync: jest.fn()
  }),
}));

jest.mock('../services/ProductRepository');
jest.mock('../services/CustomerRepository');
jest.mock('../services/SaleRepository');
jest.mock('../services/FinancialRepository');
jest.mock('../services/CategoryRepository');
jest.mock('../services/BrandRepository');
jest.mock('../services/StockMoveRepository');
jest.mock('../services/PurchaseOrderRepository');

describe('AppStore Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations to return empty arrays/nulls
    (ProductRepository.getAll as jest.Mock).mockResolvedValue([]);
    (CustomerRepository.getAll as jest.Mock).mockResolvedValue([]);
    (SaleRepository.getAll as jest.Mock).mockResolvedValue([]);
    (FinancialRepository.getAllReceivables as jest.Mock).mockResolvedValue([]);
    (FinancialRepository.getAllPayables as jest.Mock).mockResolvedValue([]);
    (CategoryRepository.getAll as jest.Mock).mockResolvedValue([]);
    (BrandRepository.getAll as jest.Mock).mockResolvedValue([]);
    (StockMoveRepository.getAll as jest.Mock).mockResolvedValue([]);
    (PurchaseOrderRepository.getPendingItems as jest.Mock).mockResolvedValue([]);
    (PurchaseOrderRepository.getAllOrders as jest.Mock).mockResolvedValue([]);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppStoreProvider>{children}</AppStoreProvider>
  );

  it('should initialize and load data from repositories', async () => {
    const { result } = renderHook(() => useAppStore(), { wrapper });

    await waitFor(() => {
        expect(db.initDB).toHaveBeenCalled();
        expect(ProductRepository.getAll).toHaveBeenCalled();
    });
  });

  describe('CRUD Operations', () => {
      it('should add a category', async () => {
          const { result } = renderHook(() => useAppStore(), { wrapper });
          await waitFor(() => expect(result.current).not.toBeNull());

          await act(async () => {
              const res = await result.current.addCategory('Electronics');
              expect(res.ok).toBe(true);
          });

          expect(CategoryRepository.add).toHaveBeenCalledWith('Electronics');
          expect(result.current.categories).toContain('Electronics');
      });

      it('should add a brand', async () => {
          const { result } = renderHook(() => useAppStore(), { wrapper });
          await waitFor(() => expect(result.current).not.toBeNull());

          await act(async () => {
              const res = await result.current.addBrand('Sony');
              expect(res.ok).toBe(true);
          });

          expect(BrandRepository.add).toHaveBeenCalledWith('Sony');
          expect(result.current.brands).toContain('Sony');
      });

      it('should add a customer', async () => {
          const { result } = renderHook(() => useAppStore(), { wrapper });
          await waitFor(() => expect(result.current).not.toBeNull());

          const newCustomer = {
              nome: 'John Doe',
              telefone: '123456789',
              status: 'novo' as const
          };

          await act(async () => {
              const res = await result.current.addCustomer(newCustomer);
              expect(res.ok).toBe(true);
              expect(res.id).toBeDefined();
          });

          expect(CustomerRepository.create).toHaveBeenCalled();
          expect(result.current.customers[0].nome).toBe('John Doe');
      });

      it('should add a product', async () => {
          const { result } = renderHook(() => useAppStore(), { wrapper });
          await waitFor(() => expect(result.current).not.toBeNull());
          
          // Setup brands/categories first for validation
          await act(async () => {
             await result.current.addCategory('Electronics');
             await result.current.addBrand('Sony');
          });

          const newProduct = {
              nome: 'Headphones',
              categoria: 'Electronics',
              marca: 'Sony',
              estoqueAtual: 10,
              estoqueMinimo: 2,
              precoVenda: 100
          };

          await act(async () => {
              const res = await result.current.addProduct(newProduct);
              expect(res.ok).toBe(true);
          });

          expect(ProductRepository.create).toHaveBeenCalled();
          expect(result.current.products[0].nome).toBe('Headphones');
      });
      
      it('should add a manual payable account', async () => {
           const { result } = renderHook(() => useAppStore(), { wrapper });
           await waitFor(() => expect(result.current).not.toBeNull());

           const payable = {
               tipo: 'conta_fixa' as const,
               referencia: 'Energy',
               descricao: 'Electric Bill',
               valor: 150.50,
               vencimento: '2026-03-01'
           };

           await act(async () => {
               const res = await result.current.addManualPayable(payable);
               expect(res.ok).toBe(true);
           });

           expect(FinancialRepository.createPayable).toHaveBeenCalled();
           expect(result.current.payables[0].descricao).toBe('Electric Bill');
      });
  });

  describe('Sales Flow', () => {
      it('should register a cash sale', async () => {
          const { result } = renderHook(() => useAppStore(), { wrapper });
          await waitFor(() => expect(result.current).not.toBeNull());

          // Pre-populate product
          const product = {
              id: 'p1',
              nome: 'Phone',
              tipo: 'produto' as const,
              categoria: 'Electronics',
              marca: 'Samsung',
              estoqueAtual: 10,
              estoqueMinimo: 1,
              precoVenda: 1000
          };
          
          // Mock initial state loading with this product
          (ProductRepository.getAll as jest.Mock).mockResolvedValue([product]);
          
          // Re-render to load mock data
          const { result: loadedResult } = renderHook(() => useAppStore(), { wrapper });
          await waitFor(() => expect(loadedResult.current.products.length).toBe(1));

          const salePayload = {
              customerId: 'c1',
              itens: [{ productId: 'p1', quantidade: 2 }],
              formaPagamento: 'avista' as const
          };

          await act(async () => {
              const res = await loadedResult.current.registerSale(salePayload);
              expect(res.ok).toBe(true);
          });

          expect(SaleRepository.create).toHaveBeenCalled();
          
          // Check stock deduction
          expect(ProductRepository.updateStock).toHaveBeenCalledWith('p1', 8); // 10 - 2
          expect(loadedResult.current.products[0].estoqueAtual).toBe(8);
          
          // Check sale record
          expect(loadedResult.current.sales.length).toBe(1);
          expect(loadedResult.current.sales[0].total).toBe(2000);
      });

      it('should register an installment sale', async () => {
          const { result } = renderHook(() => useAppStore(), { wrapper });
          await waitFor(() => expect(result.current).not.toBeNull());

           const product = {
              id: 'p1',
              nome: 'TV',
              tipo: 'produto' as const,
              categoria: 'Electronics',
              marca: 'LG',
              estoqueAtual: 5,
              estoqueMinimo: 1,
              precoVenda: 2000
          };
          
          (ProductRepository.getAll as jest.Mock).mockResolvedValue([product]);
          const { result: loadedResult } = renderHook(() => useAppStore(), { wrapper });
          await waitFor(() => expect(loadedResult.current.products.length).toBe(1));

          const salePayload = {
              customerId: 'c1',
              itens: [{ productId: 'p1', quantidade: 1 }],
              formaPagamento: 'prazo' as const,
              prazoConfig: {
                  parcelas: 3 as const,
                  entrada: 500,
                  diaVencimento: 10
              }
          };

          await act(async () => {
              const res = await loadedResult.current.registerSale(salePayload);
              expect(res.ok).toBe(true);
          });

          // Check receivables created
          expect(FinancialRepository.createReceivables).toHaveBeenCalled();
          // Total 2000 - 500 entry = 1500 financed / 3 = 500 per installment
          expect(loadedResult.current.receivables.length).toBe(3);
          expect(loadedResult.current.receivables[0].valor).toBe(500);
          
          // Check entry value in sale
          expect(loadedResult.current.sales[0].valorEntrada).toBe(500);
      });
  });
});
