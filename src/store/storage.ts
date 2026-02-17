import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer, Payable, Product, Receivable, Sale, StockMove } from '../types/models';

const KEYS = {
  products: '@salesstore:products',
  categories: '@salesstore:categories',
  brands: '@salesstore:brands',
  customers: '@salesstore:customers',
  sales: '@salesstore:sales',
  stockMoves: '@salesstore:stockMoves',
  receivables: '@salesstore:receivables',
  payables: '@salesstore:payables',
} as const;

export type AppData = {
  products: Product[];
  categories: string[];
  brands: string[];
  customers: Customer[];
  sales: Sale[];
  stockMoves: StockMove[];
  receivables: Receivable[];
  payables: Payable[];
};

const EMPTY: AppData = {
  products: [],
  categories: [],
  brands: [],
  customers: [],
  sales: [],
  stockMoves: [],
  receivables: [],
  payables: [],
};

export async function loadAllData(): Promise<AppData> {
  const keys = Object.values(KEYS);
  const pairs = await AsyncStorage.multiGet(keys);

  const parsed: Record<string, unknown> = {};
  for (const [key, value] of pairs) {
    parsed[key] = value ? JSON.parse(value) : null;
  }

  return {
    products: (parsed[KEYS.products] as Product[]) ?? EMPTY.products,
    categories: (parsed[KEYS.categories] as string[]) ?? EMPTY.categories,
    brands: (parsed[KEYS.brands] as string[]) ?? EMPTY.brands,
    customers: (parsed[KEYS.customers] as Customer[]) ?? EMPTY.customers,
    sales: (parsed[KEYS.sales] as Sale[]) ?? EMPTY.sales,
    stockMoves: (parsed[KEYS.stockMoves] as StockMove[]) ?? EMPTY.stockMoves,
    receivables: (parsed[KEYS.receivables] as Receivable[]) ?? EMPTY.receivables,
    payables: (parsed[KEYS.payables] as Payable[]) ?? EMPTY.payables,
  };
}

export async function saveSlice<K extends keyof AppData>(key: K, data: AppData[K]): Promise<void> {
  await AsyncStorage.setItem(KEYS[key], JSON.stringify(data));
}
