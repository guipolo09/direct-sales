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
  tempoMedioConsumo?: number | null;
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

export type PurchaseOrderItem = {
  id: string;
  nome: string;
  codigo: string;
  quantidade: number;
};

export type PurchaseOrder = {
  id: string;
  data: string;
  itens: PurchaseOrderItem[];
};

export type NotificationType = 'estoque_baixo' | 'consumo_cliente' | 'conta_receber' | 'conta_pagar';
export type NotificationPriority = 'critico' | 'aviso' | 'info';

export type AppNotification = {
  id: string;
  tipo: NotificationType;
  prioridade: NotificationPriority;
  titulo: string;
  mensagem: string;
  data: string;
  diasRestantes: number;
  produtoId?: string;
  clienteId?: string;
  contaId?: string;
};

export type NotificationSettings = {
  ativo: boolean;
  antecedenciaDias: number;
};

export type ThemeName = 'rose' | 'blue' | 'purple' | 'green' | 'orange' | 'slate';

export type AppSettings = {
  tema: ThemeName;
  notificacoes: {
    estoqueBaixo: NotificationSettings;
    consumoCliente: NotificationSettings;
    contaReceber: NotificationSettings;
    contaPagar: NotificationSettings;
  };
};

export const DEFAULT_SETTINGS: AppSettings = {
  tema: 'rose',
  notificacoes: {
    estoqueBaixo:   { ativo: true, antecedenciaDias: 0  },
    consumoCliente: { ativo: true, antecedenciaDias: 7  },
    contaReceber:   { ativo: true, antecedenciaDias: 3  },
    contaPagar:     { ativo: true, antecedenciaDias: 7  },
  },
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
