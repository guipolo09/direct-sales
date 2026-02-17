import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Customer,
  Payable,
  Product,
  Receivable,
  RegisterSalePayload,
  Sale,
  StockMove
} from '../types/models';
import { initDB } from '../services/db';
import { ProductRepository } from '../services/ProductRepository';
import { CustomerRepository } from '../services/CustomerRepository';
import { SaleRepository } from '../services/SaleRepository';
import { StockMoveRepository } from '../services/StockMoveRepository';
import { FinancialRepository } from '../services/FinancialRepository';
import { CategoryRepository } from '../services/CategoryRepository';
import { BrandRepository } from '../services/BrandRepository';

type AppStoreValue = {
  products: Product[];
  categories: string[];
  brands: string[];
  customers: Customer[];
  sales: Sale[];
  stockMoves: StockMove[];
  receivables: Receivable[];
  payables: Payable[];
  getProductStock: (productId: string) => number;
  addProduct: (payload: {
    nome: string;
    categoria: string;
    marca: string;
    estoqueAtual: number;
    estoqueMinimo: number;
    precoVenda: number;
  }) => Promise<{ ok: boolean; error?: string }>;
  addKit: (payload: {
    nome: string;
    categoria: string;
    marca: string;
    estoqueMinimo: number;
    precoVenda: number;
    itens: Array<{ productId: string; quantidade: number }>;
  }) => Promise<{ ok: boolean; error?: string }>;
  addCategory: (nome: string) => Promise<{ ok: boolean; error?: string }>;
  addBrand: (nome: string) => Promise<{ ok: boolean; error?: string }>;
  addCustomer: (payload: {
    nome: string;
    telefone: string;
    status: Customer['status'];
  }) => Promise<{ ok: boolean; id?: string; error?: string }>;
  addManualPayable: (payload: {
    tipo: 'boleto' | 'imposto' | 'conta_fixa';
    referencia: string;
    descricao: string;
    valor: number;
    vencimento: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  updatePayable: (payload: {
    id: string;
    fornecedor: string;
    descricao: string;
    valor: number;
    vencimento: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  registerSale: (payload: RegisterSalePayload) => Promise<{ ok: boolean; error?: string }>;
  addStockEntry: (productId: string, quantidade: number, fornecedor: string, custoUnitario: number) => Promise<void>;
  markReceivablePaid: (id: string) => Promise<void>;
  markPayablePaid: (id: string) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
  removeReceivable: (id: string) => Promise<void>;
  removePayable: (id: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<{ ok: boolean; error?: string }>;
  removeCategory: (name: string) => Promise<void>;
  updateBrand: (oldName: string, newName: string) => Promise<{ ok: boolean; error?: string }>;
  removeBrand: (name: string) => Promise<void>;
};

const AppStore = createContext<AppStoreValue | undefined>(undefined);

const now = () => new Date().toISOString();

const toLocalDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
};

const isValidDateStr = (value: string) => !Number.isNaN(parseLocalDate(value).getTime());

const plusDaysIso = (days: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return toLocalDateStr(dt);
};
const generateId = () => Math.random().toString(36).slice(2, 10);
const roundMoney = (value: number) => Math.round(value * 100) / 100;
const clampDay = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(day, 1), lastDay);
};
const buildInstallments = (total: number, parcelas: number) => {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / parcelas);
  const remainder = cents % parcelas;
  return Array.from({ length: parcelas }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100);
};


const calculateKitStock = (kit: Product, sourceProducts: Product[]) => {
  if (kit.tipo !== 'kit' || !kit.kitItens?.length) {
    return 0;
  }

  const availability = kit.kitItens.map((item) => {
    const component = sourceProducts.find((product) => product.id === item.productId);
    if (!component || component.tipo !== 'produto') {
      return 0;
    }
    return Math.floor(component.estoqueAtual / item.quantidade);
  });

  return availability.length > 0 ? Math.min(...availability) : 0;
};

export const AppStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [isReady, setIsReady] = useState(false);

  const loadData = async () => {
    try {
        await initDB();
        
        const [
            loadedProducts,
            loadedCategories,
            loadedBrands,
            loadedCustomers,
            loadedSales,
            loadedStockMoves,
            loadedReceivables,
            loadedPayables
        ] = await Promise.all([
            ProductRepository.getAll(),
            CategoryRepository.getAll(),
            BrandRepository.getAll(),
            CustomerRepository.getAll(),
            SaleRepository.getAll(),
            StockMoveRepository.getAll(),
            FinancialRepository.getAllReceivables(),
            FinancialRepository.getAllPayables()
        ]);

        setProducts(loadedProducts);
        setCategories(loadedCategories);
        setBrands(loadedBrands);
        setCustomers(loadedCustomers);
        setSales(loadedSales);
        setStockMoves(loadedStockMoves);
        setReceivables(loadedReceivables);
        setPayables(loadedPayables);
        setIsReady(true);
    } catch (error) {
        console.error('Failed to load data from DB:', error);
        // Fallback or alert user
        setIsReady(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProductStock = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return 0;
    }

    if (product.tipo === 'kit') {
      return calculateKitStock(product, products);
    }

    return product.estoqueAtual;
  };

  const addCategory = async (nome: string) => {
    const normalized = nome.trim();
    if (!normalized) {
      return { ok: false, error: 'Informe o nome da categoria.' };
    }

    if (categories.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return { ok: false, error: 'Categoria ja cadastrada.' };
    }

    await CategoryRepository.add(normalized);
    setCategories((prev) => [normalized, ...prev]);
    return { ok: true };
  };

  const addBrand = async (nome: string) => {
    const normalized = nome.trim();
    if (!normalized) {
      return { ok: false, error: 'Informe o nome da marca.' };
    }

    if (brands.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return { ok: false, error: 'Marca ja cadastrada.' };
    }

    await BrandRepository.add(normalized);
    setBrands((prev) => [normalized, ...prev]);
    return { ok: true };
  };

  const addProduct = async (payload: {
    nome: string;
    categoria: string;
    marca: string;
    estoqueAtual: number;
    estoqueMinimo: number;
    precoVenda: number;
  }) => {
    if (!payload.nome.trim()) {
      return { ok: false, error: 'Informe o nome do produto.' };
    }

    if (!payload.categoria.trim()) {
      return { ok: false, error: 'Selecione uma categoria.' };
    }

    if (!payload.marca.trim()) {
      return { ok: false, error: 'Selecione uma marca.' };
    }

    if (payload.precoVenda <= 0) {
      return { ok: false, error: 'Preco de venda deve ser maior que zero.' };
    }

    if (payload.estoqueAtual < 0 || payload.estoqueMinimo < 0) {
      return { ok: false, error: 'Estoque nao pode ser negativo.' };
    }

    const product: Product = {
      id: generateId(),
      nome: payload.nome.trim(),
      tipo: 'produto',
      categoria: payload.categoria.trim(),
      marca: payload.marca.trim(),
      estoqueAtual: payload.estoqueAtual,
      estoqueMinimo: payload.estoqueMinimo,
      precoVenda: payload.precoVenda
    };

    await ProductRepository.create(product);
    setProducts((prev) => [product, ...prev]);
    return { ok: true };
  };

  const addKit = async (payload: {
    nome: string;
    categoria: string;
    marca: string;
    estoqueMinimo: number;
    precoVenda: number;
    itens: Array<{ productId: string; quantidade: number }>;
  }) => {
    if (!payload.nome.trim()) {
      return { ok: false, error: 'Informe o nome do kit.' };
    }

    if (!payload.categoria.trim()) {
      return { ok: false, error: 'Selecione uma categoria para o kit.' };
    }

    if (!payload.marca.trim()) {
      return { ok: false, error: 'Selecione uma marca para o kit.' };
    }

    if (payload.precoVenda <= 0) {
      return { ok: false, error: 'Preco de venda deve ser maior que zero.' };
    }

    if (!payload.itens.length) {
      return { ok: false, error: 'Adicione ao menos um produto ao kit.' };
    }

    const invalid = payload.itens.find((item) => {
      const component = products.find((product) => product.id === item.productId);
      return !component || component.tipo !== 'produto' || item.quantidade <= 0;
    });

    if (invalid) {
      return { ok: false, error: 'Kit contem produto invalido.' };
    }

    const kit: Product = {
      id: generateId(),
      nome: payload.nome.trim(),
      tipo: 'kit',
      categoria: payload.categoria.trim(),
      marca: payload.marca.trim(),
      estoqueAtual: 0,
      estoqueMinimo: payload.estoqueMinimo,
      precoVenda: payload.precoVenda,
      kitItens: payload.itens
    };

    await ProductRepository.create(kit);
    setProducts((prev) => [kit, ...prev]);
    return { ok: true };
  };

  const addCustomer = async (payload: { nome: string; telefone: string; status: Customer['status'] }) => {
    if (!payload.nome.trim()) {
      return { ok: false, error: 'Informe o nome do cliente.' };
    }

    const customer: Customer = {
      id: generateId(),
      nome: payload.nome.trim(),
      telefone: payload.telefone.trim() || 'Nao informado',
      status: payload.status,
      createdAt: now()
    };

    await CustomerRepository.create(customer);
    setCustomers((prev) => [customer, ...prev]);
    return { ok: true, id: customer.id };
  };

  const addManualPayable = async (payload: {
    tipo: 'boleto' | 'imposto' | 'conta_fixa';
    referencia: string;
    descricao: string;
    valor: number;
    vencimento: string;
  }) => {
    if (!payload.descricao.trim()) {
      return { ok: false, error: 'Informe a descricao da conta.' };
    }

    if (payload.valor <= 0) {
      return { ok: false, error: 'Valor deve ser maior que zero.' };
    }

    if (!isValidDateStr(payload.vencimento)) {
      return { ok: false, error: 'Data de vencimento invalida. Use formato YYYY-MM-DD.' };
    }

    const tipoLabel =
      payload.tipo === 'boleto' ? 'Boleto' : payload.tipo === 'imposto' ? 'Imposto' : 'Conta fixa';
    const fornecedor = payload.referencia.trim()
      ? `${tipoLabel} - ${payload.referencia.trim()}`
      : tipoLabel;

    const payable: Payable = {
      id: generateId(),
      fornecedor,
      descricao: payload.descricao.trim(),
      valor: payload.valor,
      vencimento: payload.vencimento,
      status: 'pendente'
    };

    await FinancialRepository.createPayable(payable);
    setPayables((prev) => [payable, ...prev]);

    return { ok: true };
  };

  const updatePayable = async (payload: {
    id: string;
    fornecedor: string;
    descricao: string;
    valor: number;
    vencimento: string;
  }) => {
    if (!payload.descricao.trim()) {
      return { ok: false, error: 'Informe a descricao da conta.' };
    }

    if (payload.valor <= 0) {
      return { ok: false, error: 'Valor deve ser maior que zero.' };
    }

    if (!isValidDateStr(payload.vencimento)) {
      return { ok: false, error: 'Data de vencimento invalida.' };
    }

    const existing = payables.find(p => p.id === payload.id);
    if (!existing) {
        return { ok: false, error: 'Conta nao encontrada.' };
    }

    const updated: Payable = {
        ...existing,
        fornecedor: payload.fornecedor.trim() || existing.fornecedor,
        descricao: payload.descricao.trim(),
        valor: payload.valor,
        vencimento: payload.vencimento
    };
    
    await FinancialRepository.updatePayable(updated);

    setPayables((prev) =>
      prev.map((item) => (item.id === payload.id ? updated : item))
    );

    return { ok: true };
  };

  const registerSale = async (payload: RegisterSalePayload) => {
    if (!payload.itens.length) {
      return { ok: false, error: 'Adicione ao menos um item na venda.' };
    }

    const saleItemsMap = new Map<string, number>();
    for (const item of payload.itens) {
      if (item.quantidade <= 0) {
        return { ok: false, error: 'Quantidade deve ser maior que zero.' };
      }
      saleItemsMap.set(item.productId, (saleItemsMap.get(item.productId) ?? 0) + item.quantidade);
    }

    const saleItems = Array.from(saleItemsMap.entries()).map(([productId, quantidade]) => {
      const product = products.find((item) => item.id === productId);
      if (!product) {
        return null;
      }
      return {
        product,
        quantidade,
        valorUnitario: product.precoVenda
      };
    });

    if (saleItems.some((item) => item === null)) {
      return { ok: false, error: 'Um dos produtos selecionados nao existe.' };
    }

    const typedSaleItems = saleItems as Array<{ product: Product; quantidade: number; valorUnitario: number }>;

    const baseProductDeductions = new Map<string, number>();
    for (const item of typedSaleItems) {
      if (item.product.tipo === 'produto') {
        baseProductDeductions.set(
          item.product.id,
          (baseProductDeductions.get(item.product.id) ?? 0) + item.quantidade
        );
      } else {
        for (const kitItem of item.product.kitItens ?? []) {
          baseProductDeductions.set(
            kitItem.productId,
            (baseProductDeductions.get(kitItem.productId) ?? 0) + kitItem.quantidade * item.quantidade
          );
        }
      }
    }

    for (const [productId, deduction] of baseProductDeductions.entries()) {
      const baseProduct = products.find((item) => item.id === productId);
      if (!baseProduct || baseProduct.tipo !== 'produto') {
        return { ok: false, error: 'Produto base invalido na composicao da venda.' };
      }
      if (baseProduct.estoqueAtual < deduction) {
        return { ok: false, error: `Estoque insuficiente para ${baseProduct.nome}.` };
      }
    }

    const total = roundMoney(
      typedSaleItems.reduce((acc, item) => acc + item.valorUnitario * item.quantidade, 0)
    );

    let receivableItems: Receivable[] = [];
    if (payload.formaPagamento === 'prazo') {
      const config = payload.prazoConfig;
      if (!config) {
        return { ok: false, error: 'Configuracao de prazo nao informada.' };
      }

      const entrada = roundMoney(Math.max(config.entrada, 0));
      if (entrada > total) {
        return { ok: false, error: 'Entrada nao pode ser maior que o total da venda.' };
      }

      const financiado = roundMoney(total - entrada);
      if (financiado > 0) {
        const parcelas = config.parcelas;
        const saleDesc = typedSaleItems.map((item) => item.product.nome).join(', ');

        if (parcelas === 1) {
          if (!config.primeiraData) {
            return { ok: false, error: 'Informe a data de vencimento para parcela unica.' };
          }
          if (!isValidDateStr(config.primeiraData)) {
            return { ok: false, error: 'Data de vencimento invalida.' };
          }

          receivableItems = [
            {
              id: generateId(),
              customerId: payload.customerId,
              descricao: `Venda (${saleDesc}) (1/1)`,
              valor: financiado,
              vencimento: config.primeiraData,
              status: 'pendente'
            }
          ];
        } else {
          if (!config.diaVencimento || config.diaVencimento < 1 || config.diaVencimento > 31) {
            return { ok: false, error: 'Informe um dia de vencimento valido (1-31).' };
          }

          const saleDate = new Date();
          const installmentValues = buildInstallments(financiado, parcelas);
          receivableItems = installmentValues.map((installmentValue, index) => {
            const dueMonthRef = new Date(saleDate.getFullYear(), saleDate.getMonth() + 1 + index, 1);
            const dueDay = clampDay(
              dueMonthRef.getFullYear(),
              dueMonthRef.getMonth(),
              config.diaVencimento!
            );
            const dueDate = new Date(dueMonthRef.getFullYear(), dueMonthRef.getMonth(), dueDay);
            return {
              id: generateId(),
              customerId: payload.customerId,
              descricao: `Venda (${saleDesc}) (${index + 1}/${parcelas})`,
              valor: installmentValue,
              vencimento: toLocalDateStr(dueDate),
              status: 'pendente' as const
            };
          });
        }
      }
    }

    // Update products stock in DB
    for (const [productId, deduction] of baseProductDeductions.entries()) {
        const product = products.find(p => p.id === productId);
        if (product) {
            const newStock = product.estoqueAtual - deduction;
            await ProductRepository.updateStock(productId, newStock);
        }
    }

    // Update products state
    setProducts((prev) =>
      prev.map((item) => {
        if (item.tipo !== 'produto') {
          return item;
        }

        const deduction = baseProductDeductions.get(item.id);
        if (!deduction) {
          return item;
        }

        return {
          ...item,
          estoqueAtual: item.estoqueAtual - deduction
        };
      })
    );

    const newMoves: StockMove[] = [];
    for (const item of typedSaleItems) {
      if (item.product.tipo === 'produto') {
        newMoves.push({
          id: generateId(),
          productId: item.product.id,
          tipo: 'saida',
          quantidade: item.quantidade,
          data: now(),
          origem: 'Venda'
        });
      } else {
        for (const kitItem of item.product.kitItens ?? []) {
          newMoves.push({
            id: generateId(),
            productId: kitItem.productId,
            tipo: 'saida',
            quantidade: kitItem.quantidade * item.quantidade,
            data: now(),
            origem: `Venda kit ${item.product.nome}`
          });
        }
      }
    }
    
    // Save stock moves
    await StockMoveRepository.createBatch(newMoves);
    setStockMoves((prev) => [...newMoves, ...prev]);

    const sale: Sale = {
      id: generateId(),
      customerId: payload.customerId,
      itens: typedSaleItems.map((item) => ({
        productId: item.product.id,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario
      })),
      total,
      valorEntrada: payload.formaPagamento === 'prazo' ? roundMoney(payload.prazoConfig?.entrada ?? 0) : 0,
      data: now(),
      formaPagamento: payload.formaPagamento
    };

    await SaleRepository.create(sale);
    setSales((prev) => [sale, ...prev]);

    if (receivableItems.length > 0) {
      await FinancialRepository.createReceivables(receivableItems);
      setReceivables((prev) => [...receivableItems, ...prev]);
    }

    return { ok: true };
  };

  const addStockEntry = async (productId: string, quantidade: number, fornecedor: string, custoUnitario: number) => {
    if (quantidade <= 0) {
      return;
    }

    const product = products.find(p => p.id === productId && p.tipo === 'produto');
    if (product) {
         const newStock = product.estoqueAtual + quantidade;
         await ProductRepository.updateStock(productId, newStock);
    }
    
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId && item.tipo === 'produto'
          ? {
              ...item,
              estoqueAtual: item.estoqueAtual + quantidade
            }
          : item
      )
    );

    const move: StockMove = {
        id: generateId(),
        productId,
        tipo: 'entrada',
        quantidade,
        data: now(),
        origem: `Compra ${fornecedor}`
    };

    await StockMoveRepository.create(move);
    setStockMoves((prev) => [move, ...prev]);

    const payable: Payable = {
        id: generateId(),
        fornecedor,
        descricao: `Reposicao de estoque (${quantidade} itens)`,
        valor: quantidade * custoUnitario,
        vencimento: plusDaysIso(30),
        status: 'pendente'
    };

    await FinancialRepository.createPayable(payable);
    setPayables((prev) => [payable, ...prev]);
  };

  const markReceivablePaid = async (id: string) => {
    const receivable = receivables.find(r => r.id === id);
    if (receivable) {
        const updated = { ...receivable, status: 'paga' as const, paidAt: now() };
        await FinancialRepository.updateReceivable(updated);
        setReceivables((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
    }
  };

  const markPayablePaid = async (id: string) => {
    const payable = payables.find(p => p.id === id);
    if (payable) {
        const updated = { ...payable, status: 'paga' as const, paidAt: now() };
        await FinancialRepository.updatePayable(updated);
        setPayables((prev) => prev.map((item) => (item.id === id ? updated : item)));
    }
  };

  const removeProduct = async (id: string) => {
    await ProductRepository.delete(id);
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const removeCustomer = async (id: string) => {
    await CustomerRepository.delete(id);
    setCustomers((prev) => prev.filter((item) => item.id !== id));
  };

  const removeReceivable = async (id: string) => {
    await FinancialRepository.removeReceivable(id);
    setReceivables((prev) => prev.filter((item) => item.id !== id));
  };

  const removePayable = async (id: string) => {
    await FinancialRepository.removePayable(id);
    setPayables((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCategory = async (oldName: string, newName: string) => {
    const normalized = newName.trim();
    if (!normalized) {
      return { ok: false, error: 'Informe o nome da categoria.' };
    }
    if (categories.some((item) => item.toLowerCase() === normalized.toLowerCase() && item !== oldName)) {
      return { ok: false, error: 'Categoria ja cadastrada.' };
    }
    
    await CategoryRepository.update(oldName, normalized);

    setCategories((prev) => prev.map((item) => (item === oldName ? normalized : item)));
    setProducts((prev) =>
      prev.map((item) => (item.categoria === oldName ? { ...item, categoria: normalized } : item))
    );
    return { ok: true };
  };

  const removeCategory = async (name: string) => {
    await CategoryRepository.remove(name);
    setCategories((prev) => prev.filter((item) => item !== name));
  };

  const updateBrand = async (oldName: string, newName: string) => {
    const normalized = newName.trim();
    if (!normalized) {
      return { ok: false, error: 'Informe o nome da marca.' };
    }
    if (brands.some((item) => item.toLowerCase() === normalized.toLowerCase() && item !== oldName)) {
      return { ok: false, error: 'Marca ja cadastrada.' };
    }
    
    await BrandRepository.update(oldName, normalized);
    
    setBrands((prev) => prev.map((item) => (item === oldName ? normalized : item)));
    setProducts((prev) =>
      prev.map((item) => (item.marca === oldName ? { ...item, marca: normalized } : item))
    );
    return { ok: true };
  };

  const removeBrand = async (name: string) => {
    await BrandRepository.remove(name);
    setBrands((prev) => prev.filter((item) => item !== name));
  };

  const value = useMemo(
    () => ({
      products,
      categories,
      brands,
      customers,
      sales,
      stockMoves,
      receivables,
      payables,
      getProductStock,
      addProduct,
      addKit,
      addCategory,
      addBrand,
      addCustomer,
      addManualPayable,
      updatePayable,
      registerSale,
      addStockEntry,
      markReceivablePaid,
      markPayablePaid,
      removeProduct,
      removeCustomer,
      removeReceivable,
      removePayable,
      updateCategory,
      removeCategory,
      updateBrand,
      removeBrand
    }),
    [products, categories, brands, customers, sales, stockMoves, receivables, payables]
  );

  if (!isReady) return null;

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
};

export const useAppStore = () => {
  const context = useContext(AppStore);
  if (!context) {
    throw new Error('useAppStore deve ser usado dentro de AppStoreProvider');
  }
  return context;
};
