/**
 * Testes de Fluxo do Aplicativo Sales Store
 *
 * Estes testes simulam os principais fluxos de uso do aplicativo:
 * - Cadastro de clientes
 * - Cadastro de produtos, kits, categorias e marcas
 * - Registro de vendas (à vista e a prazo com parcelas)
 * - Entrada de estoque
 * - Gestão financeira (recebíveis e contas a pagar)
 * - Pedidos de compra
 * - Fluxo integrado completo
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppStoreProvider, useAppStore } from '../store/AppStore';
import * as db from '../services/db';
import { ProductRepository } from '../services/ProductRepository';
import { CustomerRepository } from '../services/CustomerRepository';
import { SaleRepository } from '../services/SaleRepository';
import { FinancialRepository } from '../services/FinancialRepository';
import { CategoryRepository } from '../services/CategoryRepository';
import { BrandRepository } from '../services/BrandRepository';
import { StockMoveRepository } from '../services/StockMoveRepository';
import { PurchaseOrderRepository } from '../services/PurchaseOrderRepository';

// ─────────────────────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('../services/db', () => ({
  initDB: jest.fn().mockResolvedValue(undefined),
  getDB: jest.fn().mockResolvedValue({
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    withTransactionAsync: jest.fn((cb: () => Promise<void>) => cb()),
    execAsync: jest.fn(),
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

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_FIXTURE = {
  id: 'prod-1',
  nome: 'Perfume Rose',
  tipo: 'produto' as const,
  categoria: 'Perfumes',
  marca: 'Dior',
  estoqueAtual: 20,
  estoqueMinimo: 5,
  precoVenda: 350,
};

const CUSTOMER_FIXTURE = {
  id: 'cust-1',
  nome: 'Maria Silva',
  telefone: '11999998888',
  status: 'novo' as const,
  createdAt: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppStoreProvider>{children}</AppStoreProvider>
);

/** Retorna um store inicializado com estado vazio */
const getStore = async () => {
  const { result } = renderHook(() => useAppStore(), { wrapper });
  // O provider retorna null enquanto isReady=false, então aguardamos ser não-null
  await waitFor(() => expect(result.current).not.toBeNull());
  return result;
};

/** Retorna um store pré-carregado com um produto e um cliente */
const getStoreWithData = async () => {
  (ProductRepository.getAll as jest.Mock).mockResolvedValue([PRODUCT_FIXTURE]);
  (CustomerRepository.getAll as jest.Mock).mockResolvedValue([CUSTOMER_FIXTURE]);
  const result = await getStore();
  await waitFor(() => {
    expect(result.current.products).toHaveLength(1);
    expect(result.current.customers).toHaveLength(1);
  });
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUITE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

describe('Fluxos do Aplicativo', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Estado inicial vazio
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

  // ───────────────────────────────────────────────────────
  // FLUXO: CADASTRO DE CLIENTE
  // ───────────────────────────────────────────────────────

  describe('Fluxo: Cadastro de Cliente', () => {
    it('cadastra cliente com todos os dados', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addCustomer({
          nome: 'Ana Costa',
          telefone: '11988887777',
          status: 'novo',
        });
      });

      expect(res.ok).toBe(true);
      expect(res.id).toBeDefined();
      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0].nome).toBe('Ana Costa');
      expect(result.current.customers[0].telefone).toBe('11988887777');
      expect(result.current.customers[0].status).toBe('novo');
      expect(CustomerRepository.create).toHaveBeenCalledTimes(1);
    });

    it('rejeita cliente sem nome', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addCustomer({
          nome: '',
          telefone: '11999990000',
          status: 'novo',
        });
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBeDefined();
      expect(result.current.customers).toHaveLength(0);
      expect(CustomerRepository.create).not.toHaveBeenCalled();
    });

    it('rejeita cliente com nome apenas com espacos em branco', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addCustomer({
          nome: '   ',
          telefone: '11999990000',
          status: 'novo',
        });
      });

      expect(res.ok).toBe(false);
      expect(result.current.customers).toHaveLength(0);
    });

    it('cadastra cliente sem telefone e usa fallback', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addCustomer({
          nome: 'Pedro Alves',
          telefone: '',
          status: 'recorrente',
        });
      });

      expect(result.current.customers[0].telefone).toBe('Nao informado');
    });

    it('remove cliente existente', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addCustomer({
          nome: 'Ana Costa',
          telefone: '11988887777',
          status: 'novo',
        });
      });

      const customerId = result.current.customers[0].id;

      await act(async () => {
        await result.current.removeCustomer(customerId);
      });

      expect(result.current.customers).toHaveLength(0);
      expect(CustomerRepository.delete).toHaveBeenCalledWith(customerId);
    });

    it('cadastra clientes com diferentes status', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addCustomer({ nome: 'Cliente Novo', telefone: '1', status: 'novo' });
        await result.current.addCustomer({ nome: 'Cliente Recorrente', telefone: '2', status: 'recorrente' });
        await result.current.addCustomer({ nome: 'Cliente Inativo', telefone: '3', status: 'inativo' });
      });

      expect(result.current.customers).toHaveLength(3);
      expect(result.current.customers.map(c => c.status)).toEqual(
        expect.arrayContaining(['novo', 'recorrente', 'inativo'])
      );
    });
  });

  // ───────────────────────────────────────────────────────
  // FLUXO: CADASTRO DE PRODUTO
  // ───────────────────────────────────────────────────────

  describe('Fluxo: Cadastro de Produto', () => {
    it('cadastra categoria, marca e produto em sequencia', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addCategory('Perfumes');
        await result.current.addBrand('Dior');
      });

      let res: any;
      await act(async () => {
        res = await result.current.addProduct({
          nome: 'Perfume Rose',
          categoria: 'Perfumes',
          marca: 'Dior',
          estoqueAtual: 10,
          estoqueMinimo: 2,
          precoVenda: 350,
        });
      });

      expect(res.ok).toBe(true);
      expect(result.current.products).toHaveLength(1);
      expect(result.current.products[0].nome).toBe('Perfume Rose');
      expect(result.current.products[0].tipo).toBe('produto');
      expect(result.current.products[0].estoqueAtual).toBe(10);
      expect(ProductRepository.create).toHaveBeenCalledTimes(1);
    });

    it('rejeita produto sem nome', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addProduct({
          nome: '',
          categoria: 'Perfumes',
          marca: 'Dior',
          estoqueAtual: 5,
          estoqueMinimo: 1,
          precoVenda: 100,
        });
      });

      expect(res.ok).toBe(false);
      expect(result.current.products).toHaveLength(0);
    });

    it('rejeita produto sem categoria', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addProduct({
          nome: 'Perfume X',
          categoria: '',
          marca: 'Dior',
          estoqueAtual: 5,
          estoqueMinimo: 1,
          precoVenda: 100,
        });
      });

      expect(res.ok).toBe(false);
      expect(result.current.products).toHaveLength(0);
    });

    it('rejeita produto sem marca', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addProduct({
          nome: 'Perfume X',
          categoria: 'Perfumes',
          marca: '',
          estoqueAtual: 5,
          estoqueMinimo: 1,
          precoVenda: 100,
        });
      });

      expect(res.ok).toBe(false);
      expect(result.current.products).toHaveLength(0);
    });

    it('rejeita produto com preco zero', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addProduct({
          nome: 'Perfume X',
          categoria: 'Perfumes',
          marca: 'Dior',
          estoqueAtual: 5,
          estoqueMinimo: 1,
          precoVenda: 0,
        });
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('rejeita produto com estoque negativo', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addProduct({
          nome: 'Perfume X',
          categoria: 'Perfumes',
          marca: 'Dior',
          estoqueAtual: -1,
          estoqueMinimo: 1,
          precoVenda: 100,
        });
      });

      expect(res.ok).toBe(false);
    });

    it('rejeita categoria duplicada (case-insensitive)', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addCategory('Perfumes');
      });

      let res: any;
      await act(async () => {
        res = await result.current.addCategory('perfumes');
      });

      expect(res.ok).toBe(false);
      expect(result.current.categories).toHaveLength(1);
    });

    it('rejeita marca duplicada (case-insensitive)', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addBrand('Dior');
      });

      let res: any;
      await act(async () => {
        res = await result.current.addBrand('DIOR');
      });

      expect(res.ok).toBe(false);
      expect(result.current.brands).toHaveLength(1);
    });

    it('atualiza nome de categoria e reflete em todos os produtos', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addCategory('Perfumes');
        await result.current.addBrand('Dior');
        await result.current.addProduct({
          nome: 'Perfume Rose',
          categoria: 'Perfumes',
          marca: 'Dior',
          estoqueAtual: 10,
          estoqueMinimo: 2,
          precoVenda: 350,
        });
      });

      await act(async () => {
        await result.current.updateCategory('Perfumes', 'Fragrancias');
      });

      expect(result.current.categories).toContain('Fragrancias');
      expect(result.current.categories).not.toContain('Perfumes');
      expect(result.current.products[0].categoria).toBe('Fragrancias');
    });

    it('atualiza nome de marca e reflete em todos os produtos', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addBrand('Dior');
        await result.current.addCategory('Perfumes');
        await result.current.addProduct({
          nome: 'Perfume Rose',
          categoria: 'Perfumes',
          marca: 'Dior',
          estoqueAtual: 10,
          estoqueMinimo: 2,
          precoVenda: 350,
        });
      });

      await act(async () => {
        await result.current.updateBrand('Dior', 'Christian Dior');
      });

      expect(result.current.brands).toContain('Christian Dior');
      expect(result.current.brands).not.toContain('Dior');
      expect(result.current.products[0].marca).toBe('Christian Dior');
    });

    it('remove categoria existente', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addCategory('Perfumes');
      });

      await act(async () => {
        await result.current.removeCategory('Perfumes');
      });

      expect(result.current.categories).toHaveLength(0);
      expect(CategoryRepository.remove).toHaveBeenCalledWith('Perfumes');
    });

    it('remove produto existente', async () => {
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([PRODUCT_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(1));

      await act(async () => {
        await result.current.removeProduct(PRODUCT_FIXTURE.id);
      });

      expect(result.current.products).toHaveLength(0);
      expect(ProductRepository.delete).toHaveBeenCalledWith(PRODUCT_FIXTURE.id);
    });
  });

  // ───────────────────────────────────────────────────────
  // FLUXO: CADASTRO DE KIT
  // ───────────────────────────────────────────────────────

  describe('Fluxo: Cadastro de Kit', () => {
    it('cria kit com produtos existentes', async () => {
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([PRODUCT_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(1));

      let res: any;
      await act(async () => {
        res = await result.current.addKit({
          nome: 'Kit Presente Rose',
          categoria: 'Kits',
          marca: 'Dior',
          estoqueMinimo: 2,
          precoVenda: 500,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 2 }],
        });
      });

      expect(res.ok).toBe(true);
      const kit = result.current.products.find(p => p.tipo === 'kit');
      expect(kit).toBeDefined();
      expect(kit!.nome).toBe('Kit Presente Rose');
      expect(kit!.tipo).toBe('kit');
      expect(kit!.kitItens).toHaveLength(1);
      expect(kit!.kitItens![0].quantidade).toBe(2);
    });

    it('rejeita kit sem itens', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addKit({
          nome: 'Kit Vazio',
          categoria: 'Kits',
          marca: 'Dior',
          estoqueMinimo: 1,
          precoVenda: 200,
          itens: [],
        });
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Adicione ao menos um produto ao kit');
    });

    it('rejeita kit sem nome', async () => {
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([PRODUCT_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(1));

      let res: any;
      await act(async () => {
        res = await result.current.addKit({
          nome: '',
          categoria: 'Kits',
          marca: 'Dior',
          estoqueMinimo: 1,
          precoVenda: 200,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
        });
      });

      expect(res.ok).toBe(false);
    });

    it('rejeita kit com preco zero', async () => {
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([PRODUCT_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(1));

      let res: any;
      await act(async () => {
        res = await result.current.addKit({
          nome: 'Kit X',
          categoria: 'Kits',
          marca: 'Dior',
          estoqueMinimo: 1,
          precoVenda: 0,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
        });
      });

      expect(res.ok).toBe(false);
    });

    it('calcula estoque disponivel do kit com base nos produtos componentes', async () => {
      // Produto com 10 unidades. Kit precisa de 2 por unidade => 5 kits possíveis
      const product = { ...PRODUCT_FIXTURE, estoqueAtual: 10 };
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([product]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(1));

      await act(async () => {
        await result.current.addKit({
          nome: 'Kit Duplo',
          categoria: 'Kits',
          marca: 'Dior',
          estoqueMinimo: 1,
          precoVenda: 600,
          itens: [{ productId: product.id, quantidade: 2 }],
        });
      });

      const kit = result.current.products.find(p => p.tipo === 'kit')!;
      const kitStock = result.current.getProductStock(kit.id);
      expect(kitStock).toBe(5); // floor(10 / 2)
    });

    it('estoque do kit e limitado pelo componente mais restrito', async () => {
      const productA = { ...PRODUCT_FIXTURE, id: 'p-a', estoqueAtual: 10 };
      const productB = { ...PRODUCT_FIXTURE, id: 'p-b', estoqueAtual: 3 };
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([productA, productB]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(2));

      await act(async () => {
        await result.current.addKit({
          nome: 'Kit Composto',
          categoria: 'Kits',
          marca: 'Dior',
          estoqueMinimo: 1,
          precoVenda: 700,
          itens: [
            { productId: productA.id, quantidade: 1 },
            { productId: productB.id, quantidade: 1 },
          ],
        });
      });

      const kit = result.current.products.find(p => p.tipo === 'kit')!;
      // Limitado pelo produto B: min(10, 3) = 3
      expect(result.current.getProductStock(kit.id)).toBe(3);
    });
  });

  // ───────────────────────────────────────────────────────
  // FLUXO: VENDA À VISTA
  // ───────────────────────────────────────────────────────

  describe('Fluxo: Venda a Vista', () => {
    it('registra venda a vista com baixa automatica de estoque', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 3 }],
          formaPagamento: 'avista',
        });
      });

      expect(res.ok).toBe(true);
      expect(result.current.sales).toHaveLength(1);
      expect(result.current.sales[0].total).toBe(1050); // 350 * 3
      expect(result.current.sales[0].formaPagamento).toBe('avista');

      // Estoque descontado: 20 - 3 = 17
      const updatedProduct = result.current.products.find(p => p.id === PRODUCT_FIXTURE.id)!;
      expect(updatedProduct.estoqueAtual).toBe(17);
      expect(ProductRepository.updateStock).toHaveBeenCalledWith(PRODUCT_FIXTURE.id, 17);
    });

    it('registra movimentacao de saida de estoque ao vender', async () => {
      const result = await getStoreWithData();

      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 2 }],
          formaPagamento: 'avista',
        });
      });

      expect(result.current.stockMoves).toHaveLength(1);
      expect(result.current.stockMoves[0].tipo).toBe('saida');
      expect(result.current.stockMoves[0].quantidade).toBe(2);
      expect(result.current.stockMoves[0].origem).toBe('Venda');
      expect(StockMoveRepository.createBatch).toHaveBeenCalledTimes(1);
    });

    it('nao gera recebiveis em venda a vista', async () => {
      const result = await getStoreWithData();

      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
          formaPagamento: 'avista',
        });
      });

      expect(result.current.receivables).toHaveLength(0);
      expect(FinancialRepository.createReceivables).not.toHaveBeenCalled();
    });

    it('calcula corretamente o total com multiplos itens', async () => {
      const productA = { ...PRODUCT_FIXTURE, id: 'p-a', precoVenda: 100 };
      const productB = { ...PRODUCT_FIXTURE, id: 'p-b', precoVenda: 200 };
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([productA, productB]);
      (CustomerRepository.getAll as jest.Mock).mockResolvedValue([CUSTOMER_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(2));

      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [
            { productId: productA.id, quantidade: 2 }, // 200
            { productId: productB.id, quantidade: 1 }, // 200
          ],
          formaPagamento: 'avista',
        });
      });

      expect(result.current.sales[0].total).toBe(400);
    });

    it('rejeita venda sem itens', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [],
          formaPagamento: 'avista',
        });
      });

      expect(res.ok).toBe(false);
      expect(result.current.sales).toHaveLength(0);
    });

    it('rejeita venda com estoque insuficiente', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 999 }],
          formaPagamento: 'avista',
        });
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Estoque insuficiente');
      expect(result.current.sales).toHaveLength(0);
      // Estoque não deve ser alterado
      expect(result.current.products[0].estoqueAtual).toBe(PRODUCT_FIXTURE.estoqueAtual);
      expect(ProductRepository.updateStock).not.toHaveBeenCalled();
    });

    it('rejeita item com quantidade zero ou negativa', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 0 }],
          formaPagamento: 'avista',
        });
      });

      expect(res.ok).toBe(false);
      expect(result.current.sales).toHaveLength(0);
    });

    it('rejeita venda com produto inexistente', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: 'produto-inexistente', quantidade: 1 }],
          formaPagamento: 'avista',
        });
      });

      expect(res.ok).toBe(false);
      expect(result.current.sales).toHaveLength(0);
    });
  });

  // ───────────────────────────────────────────────────────
  // FLUXO: VENDA A PRAZO
  // ───────────────────────────────────────────────────────

  describe('Fluxo: Venda a Prazo', () => {
    it('registra venda em 3x e gera 3 recebiveis', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
          formaPagamento: 'prazo',
          prazoConfig: {
            parcelas: 3,
            entrada: 0,
            diaVencimento: 10,
          },
        });
      });

      expect(res.ok).toBe(true);
      expect(result.current.receivables).toHaveLength(3);

      // Total 350 distribuído em 3 parcelas
      const totalReceivable = result.current.receivables.reduce((acc, r) => acc + r.valor, 0);
      expect(totalReceivable).toBeCloseTo(350, 2);
      expect(FinancialRepository.createReceivables).toHaveBeenCalledTimes(1);
    });

    it('registra venda em 6x e gera 6 recebiveis iguais', async () => {
      const result = await getStoreWithData();

      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 2 }], // total = 700
          formaPagamento: 'prazo',
          prazoConfig: {
            parcelas: 6,
            entrada: 100,
            diaVencimento: 15,
          },
        });
      });

      // Financiado = 700 - 100 = 600 / 6 = 100 por parcela
      expect(result.current.receivables).toHaveLength(6);
      result.current.receivables.forEach(r => {
        expect(r.valor).toBe(100);
      });
    });

    it('registra venda em 4x e gera 4 recebiveis', async () => {
      const result = await getStoreWithData();

      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 4 }], // total = 1400
          formaPagamento: 'prazo',
          prazoConfig: {
            parcelas: 4,
            entrada: 0,
            diaVencimento: 20,
          },
        });
      });

      expect(result.current.receivables).toHaveLength(4);
      const totalReceivable = result.current.receivables.reduce((acc, r) => acc + r.valor, 0);
      expect(totalReceivable).toBeCloseTo(1400, 2);
    });

    it('registra venda 1x com data especifica de vencimento', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
          formaPagamento: 'prazo',
          prazoConfig: {
            parcelas: 1,
            entrada: 0,
            primeiraData: '2026-03-15',
          },
        });
      });

      expect(res.ok).toBe(true);
      expect(result.current.receivables).toHaveLength(1);
      expect(result.current.receivables[0].vencimento).toBe('2026-03-15');
      expect(result.current.receivables[0].valor).toBe(350);
    });

    it('desconta a entrada do valor total financiado', async () => {
      const result = await getStoreWithData();

      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 2 }], // total = 700
          formaPagamento: 'prazo',
          prazoConfig: {
            parcelas: 3,
            entrada: 100,
            diaVencimento: 10,
          },
        });
      });

      // Financiado = 700 - 100 = 600 / 3 = 200 por parcela
      expect(result.current.receivables).toHaveLength(3);
      const totalReceivable = result.current.receivables.reduce((acc, r) => acc + r.valor, 0);
      expect(totalReceivable).toBe(600);
      expect(result.current.sales[0].valorEntrada).toBe(100);
    });

    it('venda com entrada total (financiado zero) nao gera recebiveis', async () => {
      const result = await getStoreWithData();

      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }], // total = 350
          formaPagamento: 'prazo',
          prazoConfig: {
            parcelas: 3,
            entrada: 350, // igual ao total => sem financiamento
            diaVencimento: 10,
          },
        });
      });

      expect(result.current.receivables).toHaveLength(0);
    });

    it('recebiveis sao vinculados ao cliente correto', async () => {
      const result = await getStoreWithData();

      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
          formaPagamento: 'prazo',
          prazoConfig: { parcelas: 3, entrada: 0, diaVencimento: 5 },
        });
      });

      result.current.receivables.forEach(r => {
        expect(r.customerId).toBe(CUSTOMER_FIXTURE.id);
      });
    });

    it('rejeita venda a prazo sem configuracao de prazo', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
          formaPagamento: 'prazo',
        });
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Configuracao de prazo nao informada');
    });

    it('rejeita venda quando entrada e maior que o total', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }], // total = 350
          formaPagamento: 'prazo',
          prazoConfig: { parcelas: 3, entrada: 999, diaVencimento: 10 },
        });
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Entrada nao pode ser maior que o total');
    });

    it('rejeita parcela unica sem data de vencimento', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
          formaPagamento: 'prazo',
          prazoConfig: { parcelas: 1, entrada: 0 },
        });
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Informe a data de vencimento para parcela unica');
    });

    it('rejeita 3+ parcelas sem dia de vencimento', async () => {
      const result = await getStoreWithData();

      let res: any;
      await act(async () => {
        res = await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 1 }],
          formaPagamento: 'prazo',
          prazoConfig: { parcelas: 3, entrada: 0 },
        });
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('Informe um dia de vencimento valido');
    });
  });

  // ───────────────────────────────────────────────────────
  // FLUXO: ENTRADA DE ESTOQUE
  // ───────────────────────────────────────────────────────

  describe('Fluxo: Entrada de Estoque', () => {
    it('registra entrada de estoque, aumenta quantidade e gera conta a pagar', async () => {
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([PRODUCT_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(1));

      await act(async () => {
        await result.current.addStockEntry(PRODUCT_FIXTURE.id, 10, 'Fornecedor Teste', 80);
      });

      // Estoque: 20 + 10 = 30
      expect(result.current.products[0].estoqueAtual).toBe(30);
      expect(ProductRepository.updateStock).toHaveBeenCalledWith(PRODUCT_FIXTURE.id, 30);

      // Movimentação de entrada criada
      expect(result.current.stockMoves).toHaveLength(1);
      expect(result.current.stockMoves[0].tipo).toBe('entrada');
      expect(result.current.stockMoves[0].quantidade).toBe(10);
      expect(result.current.stockMoves[0].origem).toContain('Fornecedor Teste');

      // Conta a pagar gerada automaticamente: 10 * 80 = 800
      expect(result.current.payables).toHaveLength(1);
      expect(result.current.payables[0].valor).toBe(800);
      expect(result.current.payables[0].fornecedor).toBe('Fornecedor Teste');
      expect(result.current.payables[0].status).toBe('pendente');
      expect(FinancialRepository.createPayable).toHaveBeenCalledTimes(1);
    });

    it('nao registra entrada com quantidade zero', async () => {
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([PRODUCT_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(1));

      await act(async () => {
        await result.current.addStockEntry(PRODUCT_FIXTURE.id, 0, 'Fornecedor', 50);
      });

      expect(result.current.stockMoves).toHaveLength(0);
      expect(result.current.payables).toHaveLength(0);
      expect(result.current.products[0].estoqueAtual).toBe(PRODUCT_FIXTURE.estoqueAtual);
    });

    it('conta a pagar de entrada tem vencimento em 30 dias', async () => {
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([PRODUCT_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(1));

      const before = new Date();
      await act(async () => {
        await result.current.addStockEntry(PRODUCT_FIXTURE.id, 5, 'ABC', 100);
      });

      const payable = result.current.payables[0];
      const dueDate = new Date(payable.vencimento);
      const diffDays = Math.round((dueDate.getTime() - before.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  // ───────────────────────────────────────────────────────
  // FLUXO: GESTÃO FINANCEIRA
  // ───────────────────────────────────────────────────────

  describe('Fluxo: Gestao Financeira', () => {
    it('marca recebivel como pago e registra data', async () => {
      const receivable = {
        id: 'rec-1',
        customerId: 'cust-1',
        descricao: 'Venda (Perfume) (1/3)',
        valor: 116.67,
        vencimento: '2026-03-10',
        status: 'pendente' as const,
      };
      (FinancialRepository.getAllReceivables as jest.Mock).mockResolvedValue([receivable]);
      const result = await getStore();
      await waitFor(() => expect(result.current.receivables).toHaveLength(1));

      await act(async () => {
        await result.current.markReceivablePaid(receivable.id);
      });

      expect(result.current.receivables[0].status).toBe('paga');
      expect(result.current.receivables[0].paidAt).toBeDefined();
      expect(FinancialRepository.updateReceivable).toHaveBeenCalledTimes(1);
    });

    it('marca conta a pagar como paga e registra data', async () => {
      const payable = {
        id: 'pay-1',
        fornecedor: 'Fornecedor ABC',
        descricao: 'Reposicao de estoque',
        valor: 500,
        vencimento: '2026-03-01',
        status: 'pendente' as const,
      };
      (FinancialRepository.getAllPayables as jest.Mock).mockResolvedValue([payable]);
      const result = await getStore();
      await waitFor(() => expect(result.current.payables).toHaveLength(1));

      await act(async () => {
        await result.current.markPayablePaid(payable.id);
      });

      expect(result.current.payables[0].status).toBe('paga');
      expect(result.current.payables[0].paidAt).toBeDefined();
      expect(FinancialRepository.updatePayable).toHaveBeenCalledTimes(1);
    });

    it('adiciona conta a pagar manual do tipo conta_fixa', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addManualPayable({
          tipo: 'conta_fixa',
          referencia: 'Energia',
          descricao: 'Conta de luz de fevereiro',
          valor: 250,
          vencimento: '2026-02-28',
        });
      });

      expect(res.ok).toBe(true);
      expect(result.current.payables).toHaveLength(1);
      expect(result.current.payables[0].descricao).toBe('Conta de luz de fevereiro');
      expect(result.current.payables[0].valor).toBe(250);
      expect(result.current.payables[0].fornecedor).toContain('Energia');
      expect(result.current.payables[0].status).toBe('pendente');
    });

    it('adiciona conta a pagar manual do tipo boleto', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addManualPayable({
          tipo: 'boleto',
          referencia: 'Banco XYZ',
          descricao: 'Parcela equipamento',
          valor: 1200,
          vencimento: '2026-03-05',
        });
      });

      expect(res.ok).toBe(true);
      expect(result.current.payables[0].fornecedor).toContain('Boleto');
    });

    it('adiciona conta a pagar manual do tipo imposto', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addManualPayable({
          tipo: 'imposto',
          referencia: 'Receita Federal',
          descricao: 'IRPJ Trimestral',
          valor: 3500,
          vencimento: '2026-03-31',
        });
      });

      expect(res.ok).toBe(true);
      expect(result.current.payables[0].fornecedor).toContain('Imposto');
    });

    it('rejeita conta manual sem descricao', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addManualPayable({
          tipo: 'conta_fixa',
          referencia: '',
          descricao: '',
          valor: 100,
          vencimento: '2026-03-01',
        });
      });

      expect(res.ok).toBe(false);
      expect(result.current.payables).toHaveLength(0);
    });

    it('rejeita conta manual com valor zero', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addManualPayable({
          tipo: 'imposto',
          referencia: 'Receita',
          descricao: 'IRPJ',
          valor: 0,
          vencimento: '2026-03-30',
        });
      });

      expect(res.ok).toBe(false);
    });

    it('rejeita conta manual com data invalida', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addManualPayable({
          tipo: 'boleto',
          referencia: '',
          descricao: 'Teste',
          valor: 100,
          vencimento: 'data-invalida',
        });
      });

      expect(res.ok).toBe(false);
    });

    it('edita conta a pagar existente', async () => {
      const payable = {
        id: 'pay-edit',
        fornecedor: 'Conta fixa - Energia',
        descricao: 'Conta original',
        valor: 200,
        vencimento: '2026-02-28',
        status: 'pendente' as const,
      };
      (FinancialRepository.getAllPayables as jest.Mock).mockResolvedValue([payable]);
      const result = await getStore();
      await waitFor(() => expect(result.current.payables).toHaveLength(1));

      let res: any;
      await act(async () => {
        res = await result.current.updatePayable({
          id: payable.id,
          fornecedor: payable.fornecedor,
          descricao: 'Conta atualizada',
          valor: 350,
          vencimento: '2026-03-15',
        });
      });

      expect(res.ok).toBe(true);
      expect(result.current.payables[0].descricao).toBe('Conta atualizada');
      expect(result.current.payables[0].valor).toBe(350);
      expect(result.current.payables[0].vencimento).toBe('2026-03-15');
      expect(FinancialRepository.updatePayable).toHaveBeenCalledTimes(1);
    });

    it('remove recebivel existente', async () => {
      const receivable = {
        id: 'rec-del',
        customerId: 'c1',
        descricao: 'Parcela',
        valor: 100,
        vencimento: '2026-03-10',
        status: 'pendente' as const,
      };
      (FinancialRepository.getAllReceivables as jest.Mock).mockResolvedValue([receivable]);
      const result = await getStore();
      await waitFor(() => expect(result.current.receivables).toHaveLength(1));

      await act(async () => {
        await result.current.removeReceivable(receivable.id);
      });

      expect(result.current.receivables).toHaveLength(0);
      expect(FinancialRepository.removeReceivable).toHaveBeenCalledWith(receivable.id);
    });

    it('remove conta a pagar existente', async () => {
      const payable = {
        id: 'pay-del',
        fornecedor: 'ABC',
        descricao: 'Conta',
        valor: 300,
        vencimento: '2026-03-20',
        status: 'pendente' as const,
      };
      (FinancialRepository.getAllPayables as jest.Mock).mockResolvedValue([payable]);
      const result = await getStore();
      await waitFor(() => expect(result.current.payables).toHaveLength(1));

      await act(async () => {
        await result.current.removePayable(payable.id);
      });

      expect(result.current.payables).toHaveLength(0);
      expect(FinancialRepository.removePayable).toHaveBeenCalledWith(payable.id);
    });
  });

  // ───────────────────────────────────────────────────────
  // FLUXO: PEDIDOS DE COMPRA
  // ───────────────────────────────────────────────────────

  describe('Fluxo: Pedidos de Compra', () => {
    it('adiciona item ao pedido pendente', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addPurchaseOrderItem('Perfume Rose 30ml', 'SKU-001', 5);
      });

      expect(res.ok).toBe(true);
      expect(result.current.pendingOrderItems).toHaveLength(1);
      expect(result.current.pendingOrderItems[0].nome).toBe('Perfume Rose 30ml');
      expect(result.current.pendingOrderItems[0].codigo).toBe('SKU-001');
      expect(result.current.pendingOrderItems[0].quantidade).toBe(5);
      expect(PurchaseOrderRepository.addPendingItem).toHaveBeenCalledTimes(1);
    });

    it('rejeita item sem nome', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addPurchaseOrderItem('', 'SKU-001', 3);
      });

      expect(res.ok).toBe(false);
      expect(result.current.pendingOrderItems).toHaveLength(0);
    });

    it('rejeita item sem codigo', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addPurchaseOrderItem('Produto Y', '', 3);
      });

      expect(res.ok).toBe(false);
    });

    it('rejeita item com quantidade zero', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.addPurchaseOrderItem('Produto Y', 'SKU-002', 0);
      });

      expect(res.ok).toBe(false);
    });

    it('atualiza quantidade de item pendente', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addPurchaseOrderItem('Perfume D', 'SKU-D', 2);
      });

      const itemId = result.current.pendingOrderItems[0].id;

      let res: any;
      await act(async () => {
        res = await result.current.updatePurchaseOrderItemQty(itemId, 10);
      });

      expect(res.ok).toBe(true);
      expect(result.current.pendingOrderItems[0].quantidade).toBe(10);
      expect(PurchaseOrderRepository.updatePendingItemQty).toHaveBeenCalledWith(itemId, 10);
    });

    it('atualiza nome e codigo de item pendente', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addPurchaseOrderItem('Nome Antigo', 'COD-OLD', 3);
      });

      const itemId = result.current.pendingOrderItems[0].id;

      let res: any;
      await act(async () => {
        res = await result.current.updatePurchaseOrderItem(itemId, 'Nome Novo', 'COD-NEW');
      });

      expect(res.ok).toBe(true);
      expect(result.current.pendingOrderItems[0].nome).toBe('Nome Novo');
      expect(result.current.pendingOrderItems[0].codigo).toBe('COD-NEW');
    });

    it('finaliza pedido com todos os itens selecionados', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addPurchaseOrderItem('Perfume A', 'SKU-A', 3);
        await result.current.addPurchaseOrderItem('Perfume B', 'SKU-B', 5);
      });

      expect(result.current.pendingOrderItems).toHaveLength(2);
      const itemIds = result.current.pendingOrderItems.map(i => i.id);

      let res: any;
      await act(async () => {
        res = await result.current.finalizePurchaseOrder(itemIds);
      });

      expect(res.ok).toBe(true);
      expect(result.current.purchaseOrders).toHaveLength(1);
      expect(result.current.purchaseOrders[0].itens).toHaveLength(2);
      // Itens removidos da fila pendente
      expect(result.current.pendingOrderItems).toHaveLength(0);
    });

    it('finaliza pedido parcial mantendo itens nao selecionados', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addPurchaseOrderItem('Perfume A', 'SKU-A', 3);
        await result.current.addPurchaseOrderItem('Perfume B', 'SKU-B', 5);
      });

      const firstItemId = result.current.pendingOrderItems[0].id;

      await act(async () => {
        await result.current.finalizePurchaseOrder([firstItemId]);
      });

      expect(result.current.purchaseOrders).toHaveLength(1);
      expect(result.current.purchaseOrders[0].itens).toHaveLength(1);
      // Segundo item permanece pendente
      expect(result.current.pendingOrderItems).toHaveLength(1);
    });

    it('rejeita finalizacao de pedido sem itens selecionados', async () => {
      const result = await getStore();

      let res: any;
      await act(async () => {
        res = await result.current.finalizePurchaseOrder([]);
      });

      expect(res.ok).toBe(false);
      expect(result.current.purchaseOrders).toHaveLength(0);
    });

    it('remove item pendente do pedido', async () => {
      const result = await getStore();

      await act(async () => {
        await result.current.addPurchaseOrderItem('Perfume C', 'SKU-C', 2);
      });

      const itemId = result.current.pendingOrderItems[0].id;

      await act(async () => {
        await result.current.removePurchaseOrderItem(itemId);
      });

      expect(result.current.pendingOrderItems).toHaveLength(0);
      expect(PurchaseOrderRepository.deletePendingItem).toHaveBeenCalledWith(itemId);
    });

    it('exclui pedido finalizado do historico', async () => {
      const order = {
        id: 'order-1',
        data: new Date().toISOString(),
        itens: [{ id: 'oi-1', nome: 'Produto', codigo: 'COD', quantidade: 1 }],
      };
      (PurchaseOrderRepository.getAllOrders as jest.Mock).mockResolvedValue([order]);
      const result = await getStore();
      await waitFor(() => expect(result.current.purchaseOrders).toHaveLength(1));

      await act(async () => {
        await result.current.deletePurchaseOrder(order.id);
      });

      expect(result.current.purchaseOrders).toHaveLength(0);
      expect(PurchaseOrderRepository.deleteOrder).toHaveBeenCalledWith(order.id);
    });
  });

  // ───────────────────────────────────────────────────────
  // FLUXO INTEGRADO COMPLETO
  // ───────────────────────────────────────────────────────

  describe('Fluxo Completo: Jornada de Venda', () => {
    it('cadastra cliente, produto e realiza venda a vista do inicio ao fim', async () => {
      const result = await getStore();

      // 1. Cadastro de categoria e marca
      await act(async () => {
        await result.current.addCategory('Perfumes');
        await result.current.addBrand('Chanel');
      });
      expect(result.current.categories).toContain('Perfumes');
      expect(result.current.brands).toContain('Chanel');

      // 2. Cadastro do produto
      let addProductRes: any;
      await act(async () => {
        addProductRes = await result.current.addProduct({
          nome: 'Chanel No. 5',
          categoria: 'Perfumes',
          marca: 'Chanel',
          estoqueAtual: 8,
          estoqueMinimo: 2,
          precoVenda: 500,
        });
      });
      expect(addProductRes.ok).toBe(true);
      expect(result.current.products[0].nome).toBe('Chanel No. 5');

      // 3. Cadastro do cliente
      let addCustomerRes: any;
      await act(async () => {
        addCustomerRes = await result.current.addCustomer({
          nome: 'Gabriela Rocha',
          telefone: '11977776666',
          status: 'novo',
        });
      });
      expect(addCustomerRes.ok).toBe(true);
      expect(result.current.customers[0].nome).toBe('Gabriela Rocha');

      const productId = result.current.products[0].id;
      const customerId = result.current.customers[0].id;

      // 4. Registro da venda
      let saleRes: any;
      await act(async () => {
        saleRes = await result.current.registerSale({
          customerId,
          itens: [{ productId, quantidade: 2 }],
          formaPagamento: 'avista',
        });
      });
      expect(saleRes.ok).toBe(true);
      expect(result.current.sales[0].total).toBe(1000); // 500 * 2
      expect(result.current.products[0].estoqueAtual).toBe(6); // 8 - 2
      expect(result.current.stockMoves[0].tipo).toBe('saida');
      expect(result.current.receivables).toHaveLength(0);
    });

    it('fluxo completo: entrada de estoque, venda parcelada e baixa de recebivel', async () => {
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([
        { ...PRODUCT_FIXTURE, estoqueAtual: 5 },
      ]);
      (CustomerRepository.getAll as jest.Mock).mockResolvedValue([CUSTOMER_FIXTURE]);
      const result = await getStore();
      await waitFor(() => {
        expect(result.current.products).toHaveLength(1);
        expect(result.current.customers).toHaveLength(1);
      });

      // 1. Entrada de estoque
      await act(async () => {
        await result.current.addStockEntry(PRODUCT_FIXTURE.id, 15, 'Distribuidora X', 100);
      });
      expect(result.current.products[0].estoqueAtual).toBe(20); // 5 + 15
      expect(result.current.payables[0].valor).toBe(1500); // 15 * 100

      // 2. Venda parcelada em 3x com entrada
      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: PRODUCT_FIXTURE.id, quantidade: 4 }], // total = 1400
          formaPagamento: 'prazo',
          prazoConfig: { parcelas: 3, entrada: 200, diaVencimento: 5 },
        });
      });
      // Financiado = 1400 - 200 = 1200 / 3 = 400 por parcela
      expect(result.current.sales[0].total).toBe(1400);
      expect(result.current.receivables).toHaveLength(3);
      result.current.receivables.forEach(r => expect(r.valor).toBe(400));
      expect(result.current.products[0].estoqueAtual).toBe(16); // 20 - 4

      // 3. Baixa da primeira parcela
      const firstReceivableId = result.current.receivables[0].id;
      await act(async () => {
        await result.current.markReceivablePaid(firstReceivableId);
      });
      const paid = result.current.receivables.find(r => r.id === firstReceivableId)!;
      expect(paid.status).toBe('paga');
      const pending = result.current.receivables.filter(r => r.status === 'pendente');
      expect(pending).toHaveLength(2);
    });

    it('fluxo completo: kit composto, venda e deducao dos produtos componentes', async () => {
      const productA = { ...PRODUCT_FIXTURE, id: 'p-a', estoqueAtual: 10, precoVenda: 200 };
      const productB = { ...PRODUCT_FIXTURE, id: 'p-b', estoqueAtual: 8, precoVenda: 150 };
      (ProductRepository.getAll as jest.Mock).mockResolvedValue([productA, productB]);
      (CustomerRepository.getAll as jest.Mock).mockResolvedValue([CUSTOMER_FIXTURE]);
      const result = await getStore();
      await waitFor(() => expect(result.current.products).toHaveLength(2));

      // 1. Cria kit com 1 de cada produto
      await act(async () => {
        await result.current.addKit({
          nome: 'Kit Duo',
          categoria: 'Kits',
          marca: 'Dior',
          estoqueMinimo: 1,
          precoVenda: 400,
          itens: [
            { productId: productA.id, quantidade: 1 },
            { productId: productB.id, quantidade: 1 },
          ],
        });
      });

      const kit = result.current.products.find(p => p.tipo === 'kit')!;
      // Estoque kit = min(10, 8) = 8
      expect(result.current.getProductStock(kit.id)).toBe(8);

      // 2. Venda do kit (2 unidades)
      await act(async () => {
        await result.current.registerSale({
          customerId: CUSTOMER_FIXTURE.id,
          itens: [{ productId: kit.id, quantidade: 2 }],
          formaPagamento: 'avista',
        });
      });

      // Produtos componentes descontados: A = 10-2=8, B = 8-2=6
      const updatedA = result.current.products.find(p => p.id === productA.id)!;
      const updatedB = result.current.products.find(p => p.id === productB.id)!;
      expect(updatedA.estoqueAtual).toBe(8);
      expect(updatedB.estoqueAtual).toBe(6);
      expect(result.current.sales[0].total).toBe(800); // 400 * 2
    });

    it('fluxo completo: cadastro de conta manual, edicao e pagamento', async () => {
      const result = await getStore();

      // 1. Adiciona conta
      await act(async () => {
        await result.current.addManualPayable({
          tipo: 'conta_fixa',
          referencia: 'Aluguel',
          descricao: 'Aluguel do galpao',
          valor: 3000,
          vencimento: '2026-03-05',
        });
      });
      expect(result.current.payables[0].valor).toBe(3000);

      const payableId = result.current.payables[0].id;

      // 2. Edita o valor
      await act(async () => {
        await result.current.updatePayable({
          id: payableId,
          fornecedor: result.current.payables[0].fornecedor,
          descricao: 'Aluguel do galpao (reajuste)',
          valor: 3300,
          vencimento: '2026-03-05',
        });
      });
      expect(result.current.payables[0].valor).toBe(3300);
      expect(result.current.payables[0].descricao).toBe('Aluguel do galpao (reajuste)');

      // 3. Marca como pago
      await act(async () => {
        await result.current.markPayablePaid(payableId);
      });
      expect(result.current.payables[0].status).toBe('paga');
      expect(result.current.payables[0].paidAt).toBeDefined();
    });
  });
});
