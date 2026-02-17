export type CustomerStatus = 'novo' | 'recorrente' | 'inativo';

export type Product = {
  id: string;
  nome: string;
  tipo: 'produto' | 'kit';
  categoria: string;
  marca: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  precoVenda: number;
  kitItens?: Array<{
    productId: string;
    quantidade: number;
  }>;
};

export type Customer = {
  id: string;
  nome: string;
  telefone: string;
  status: CustomerStatus;
  createdAt: string;
  observacoes?: string;
};

export type SaleItem = {
  productId: string;
  quantidade: number;
  valorUnitario: number;
};

export type Sale = {
  id: string;
  customerId: string;
  itens: SaleItem[];
  total: number;
  valorEntrada: number;
  data: string;
  formaPagamento: 'avista' | 'prazo';
};

export type StockMove = {
  id: string;
  productId: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  data: string;
  origem: string;
};

export type Receivable = {
  id: string;
  customerId: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'paga' | 'atrasada';
  paidAt?: string;
};

export type Payable = {
  id: string;
  fornecedor: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'paga' | 'atrasada';
  paidAt?: string;
};

export type RegisterSalePayload = {
  customerId: string;
  itens: Array<{
    productId: string;
    quantidade: number;
  }>;
  formaPagamento: 'avista' | 'prazo';
  prazoConfig?: {
    parcelas: 1 | 3 | 4 | 6;
    entrada: number;
    primeiraData?: string;
    diaVencimento?: number;
  };
};
