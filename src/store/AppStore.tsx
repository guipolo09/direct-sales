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
import { loadAllData, saveSlice } from './storage';

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
  }) => { ok: boolean; error?: string };
  addKit: (payload: {
    nome: string;
    categoria: string;
    marca: string;
    estoqueMinimo: number;
    precoVenda: number;
    itens: Array<{ productId: string; quantidade: number }>;
  }) => { ok: boolean; error?: string };
  addCategory: (nome: string) => { ok: boolean; error?: string };
  addBrand: (nome: string) => { ok: boolean; error?: string };
  addCustomer: (payload: {
    nome: string;
    telefone: string;
    status: Customer['status'];
  }) => { ok: boolean; id?: string; error?: string };
  addManualPayable: (payload: {
    tipo: 'boleto' | 'imposto' | 'conta_fixa';
    referencia: string;
    descricao: string;
    valor: number;
    vencimento: string;
  }) => { ok: boolean; error?: string };
  updatePayable: (payload: {
    id: string;
    fornecedor: string;
    descricao: string;
    valor: number;
    vencimento: string;
  }) => { ok: boolean; error?: string };
  registerSale: (payload: RegisterSalePayload) => { ok: boolean; error?: string };
  addStockEntry: (productId: string, quantidade: number, fornecedor: string, custoUnitario: number) => void;
  markReceivablePaid: (id: string) => void;
  markPayablePaid: (id: string) => void;
  removeProduct: (id: string) => void;
  removeCustomer: (id: string) => void;
  removeReceivable: (id: string) => void;
  removePayable: (id: string) => void;
  updateCategory: (oldName: string, newName: string) => { ok: boolean; error?: string };
  removeCategory: (name: string) => void;
  updateBrand: (oldName: string, newName: string) => { ok: boolean; error?: string };
  removeBrand: (name: string) => void;
};

const AppStore = createContext<AppStoreValue | undefined>(undefined);

const now = () => new Date().toISOString();

const plusDaysIso = (days: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString();
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
  const isLoadedRef = useRef(false);

  useEffect(() => {
    loadAllData().then((data) => {
      setProducts(data.products);
      setCategories(data.categories);
      setBrands(data.brands);
      setCustomers(data.customers);
      setSales(data.sales);
      setStockMoves(data.stockMoves);
      setReceivables(data.receivables);
      setPayables(data.payables);
      isLoadedRef.current = true;
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSlice('products', products);
  }, [products]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSlice('categories', categories);
  }, [categories]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSlice('brands', brands);
  }, [brands]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSlice('customers', customers);
  }, [customers]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSlice('sales', sales);
  }, [sales]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSlice('stockMoves', stockMoves);
  }, [stockMoves]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSlice('receivables', receivables);
  }, [receivables]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveSlice('payables', payables);
  }, [payables]);

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

  const addCategory = (nome: string) => {
    const normalized = nome.trim();
    if (!normalized) {
      return { ok: false, error: 'Informe o nome da categoria.' };
    }

    if (categories.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return { ok: false, error: 'Categoria ja cadastrada.' };
    }

    setCategories((prev) => [normalized, ...prev]);
    return { ok: true };
  };

  const addBrand = (nome: string) => {
    const normalized = nome.trim();
    if (!normalized) {
      return { ok: false, error: 'Informe o nome da marca.' };
    }

    if (brands.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return { ok: false, error: 'Marca ja cadastrada.' };
    }

    setBrands((prev) => [normalized, ...prev]);
    return { ok: true };
  };

  const addProduct = (payload: {
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

    setProducts((prev) => [product, ...prev]);
    return { ok: true };
  };

  const addKit = (payload: {
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

    setProducts((prev) => [kit, ...prev]);
    return { ok: true };
  };

  const addCustomer = (payload: { nome: string; telefone: string; status: Customer['status'] }) => {
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

    setCustomers((prev) => [customer, ...prev]);
    return { ok: true, id: customer.id };
  };

  const addManualPayable = (payload: {
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

    const dueDate = new Date(payload.vencimento);
    if (Number.isNaN(dueDate.getTime())) {
      return { ok: false, error: 'Data de vencimento invalida. Use formato YYYY-MM-DD.' };
    }

    const tipoLabel =
      payload.tipo === 'boleto' ? 'Boleto' : payload.tipo === 'imposto' ? 'Imposto' : 'Conta fixa';
    const fornecedor = payload.referencia.trim()
      ? `${tipoLabel} - ${payload.referencia.trim()}`
      : tipoLabel;

    setPayables((prev) => [
      {
        id: generateId(),
        fornecedor,
        descricao: payload.descricao.trim(),
        valor: payload.valor,
        vencimento: dueDate.toISOString(),
        status: 'pendente'
      },
      ...prev
    ]);

    return { ok: true };
  };

  const updatePayable = (payload: {
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

    const dueDate = new Date(payload.vencimento);
    if (Number.isNaN(dueDate.getTime())) {
      return { ok: false, error: 'Data de vencimento invalida.' };
    }

    let found = false;
    setPayables((prev) =>
      prev.map((item) => {
        if (item.id !== payload.id) {
          return item;
        }
        found = true;
        if (item.status === 'paga') {
          return item;
        }
        return {
          ...item,
          fornecedor: payload.fornecedor.trim() || item.fornecedor,
          descricao: payload.descricao.trim(),
          valor: payload.valor,
          vencimento: dueDate.toISOString()
        };
      })
    );

    if (!found) {
      return { ok: false, error: 'Conta nao encontrada.' };
    }

    return { ok: true };
  };

  const registerSale = (payload: RegisterSalePayload) => {
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
          const dueDate = new Date(config.primeiraData);
          if (Number.isNaN(dueDate.getTime())) {
            return { ok: false, error: 'Data de vencimento invalida.' };
          }

          receivableItems = [
            {
              id: generateId(),
              customerId: payload.customerId,
              descricao: `Venda (${saleDesc}) (1/1)`,
              valor: financiado,
              vencimento: dueDate.toISOString(),
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
              vencimento: dueDate.toISOString(),
              status: 'pendente' as const
            };
          });
        }
      }
    }

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

    setSales((prev) => [sale, ...prev]);

    if (receivableItems.length > 0) {
      setReceivables((prev) => [...receivableItems, ...prev]);
    }

    return { ok: true };
  };

  const addStockEntry = (productId: string, quantidade: number, fornecedor: string, custoUnitario: number) => {
    if (quantidade <= 0) {
      return;
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

    setStockMoves((prev) => [
      {
        id: generateId(),
        productId,
        tipo: 'entrada',
        quantidade,
        data: now(),
        origem: `Compra ${fornecedor}`
      },
      ...prev
    ]);

    setPayables((prev) => [
      {
        id: generateId(),
        fornecedor,
        descricao: `Reposicao de estoque (${quantidade} itens)`,
        valor: quantidade * custoUnitario,
        vencimento: plusDaysIso(30),
        status: 'pendente'
      },
      ...prev
    ]);
  };

  const markReceivablePaid = (id: string) => {
    setReceivables((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'paga', paidAt: now() } : item))
    );
  };

  const markPayablePaid = (id: string) => {
    setPayables((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'paga', paidAt: now() } : item)));
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const removeCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((item) => item.id !== id));
  };

  const removeReceivable = (id: string) => {
    setReceivables((prev) => prev.filter((item) => item.id !== id));
  };

  const removePayable = (id: string) => {
    setPayables((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCategory = (oldName: string, newName: string) => {
    const normalized = newName.trim();
    if (!normalized) {
      return { ok: false, error: 'Informe o nome da categoria.' };
    }
    if (categories.some((item) => item.toLowerCase() === normalized.toLowerCase() && item !== oldName)) {
      return { ok: false, error: 'Categoria ja cadastrada.' };
    }
    setCategories((prev) => prev.map((item) => (item === oldName ? normalized : item)));
    setProducts((prev) =>
      prev.map((item) => (item.categoria === oldName ? { ...item, categoria: normalized } : item))
    );
    return { ok: true };
  };

  const removeCategory = (name: string) => {
    setCategories((prev) => prev.filter((item) => item !== name));
  };

  const updateBrand = (oldName: string, newName: string) => {
    const normalized = newName.trim();
    if (!normalized) {
      return { ok: false, error: 'Informe o nome da marca.' };
    }
    if (brands.some((item) => item.toLowerCase() === normalized.toLowerCase() && item !== oldName)) {
      return { ok: false, error: 'Marca ja cadastrada.' };
    }
    setBrands((prev) => prev.map((item) => (item === oldName ? normalized : item)));
    setProducts((prev) =>
      prev.map((item) => (item.marca === oldName ? { ...item, marca: normalized } : item))
    );
    return { ok: true };
  };

  const removeBrand = (name: string) => {
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
