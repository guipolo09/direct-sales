import { AppNotification, AppSettings, Customer, Payable, Product, Receivable, Sale } from '../types/models';
import { formatCurrency, formatDate } from '../utils/format';

const THEMES = {
  rose:   '#be123c',
  blue:   '#1d4ed8',
  purple: '#7e22ce',
  green:  '#15803d',
  orange: '#c2410c',
  slate:  '#334155',
};

export const themeColor = (settings: AppSettings): string =>
  THEMES[settings.tema] ?? THEMES.rose;

const todayMidnight = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysDiff = (dateStr: string): number => {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - todayMidnight().getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

export const computeNotifications = (
  products: Product[],
  sales: Sale[],
  customers: Customer[],
  receivables: Receivable[],
  payables: Payable[],
  settings: AppSettings
): AppNotification[] => {
  const results: AppNotification[] = [];

  // ── Type A: Estoque baixo ──────────────────────────────────────────────
  if (settings.notificacoes.estoqueBaixo.ativo) {
    for (const product of products) {
      if (product.tipo !== 'produto') continue;
      if (product.estoqueAtual <= product.estoqueMinimo) {
        const diff = product.estoqueAtual - product.estoqueMinimo;
        results.push({
          id: `estoque_${product.id}`,
          tipo: 'estoque_baixo',
          prioridade: product.estoqueAtual === 0 ? 'critico' : 'aviso',
          titulo: 'Estoque baixo',
          mensagem: `"${product.nome}" está com estoque baixo. Atual: ${product.estoqueAtual} | Mínimo: ${product.estoqueMinimo}`,
          data: new Date().toISOString(),
          diasRestantes: diff,
          produtoId: product.id,
        });
      }
    }
  }

  // ── Type B: Produto do cliente próximo do fim ──────────────────────────
  if (settings.notificacoes.consumoCliente.ativo) {
    const antecedencia = settings.notificacoes.consumoCliente.antecedenciaDias;

    for (const product of products) {
      if (!product.tempoMedioConsumo) continue;

      // Find latest sale of this product per customer
      const latestSaleByCustomer = new Map<string, Sale>();
      for (const sale of sales) {
        if (!sale.itens.some((item) => item.productId === product.id)) continue;
        const existing = latestSaleByCustomer.get(sale.customerId);
        if (!existing || new Date(sale.data) > new Date(existing.data)) {
          latestSaleByCustomer.set(sale.customerId, sale);
        }
      }

      for (const [customerId, lastSale] of latestSaleByCustomer.entries()) {
        const customer = customers.find((c) => c.id === customerId);
        if (!customer) continue;

        const saleDate = new Date(lastSale.data);
        saleDate.setHours(0, 0, 0, 0);
        const endDate = new Date(saleDate);
        endDate.setDate(endDate.getDate() + product.tempoMedioConsumo!);

        const diasRestantes = Math.round(
          (endDate.getTime() - todayMidnight().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasRestantes <= antecedencia) {
          results.push({
            id: `consumo_${product.id}_${customerId}`,
            tipo: 'consumo_cliente',
            prioridade: diasRestantes <= 0 ? 'critico' : diasRestantes <= 3 ? 'aviso' : 'info',
            titulo: 'Produto do cliente terminando',
            mensagem: `${customer.nome} deve estar precisando de "${product.nome}". Último pedido: ${formatDate(lastSale.data)}. Previsão de término: ${formatDate(endDate.toISOString())}.`,
            data: endDate.toISOString(),
            diasRestantes,
            produtoId: product.id,
            clienteId: customerId,
          });
        }
      }
    }
  }

  // ── Type C: Contas a receber vencendo ─────────────────────────────────
  if (settings.notificacoes.contaReceber.ativo) {
    const antecedencia = settings.notificacoes.contaReceber.antecedenciaDias;
    for (const receivable of receivables) {
      if (receivable.status === 'paga') continue;
      const diasRestantes = daysDiff(receivable.vencimento);
      if (diasRestantes <= antecedencia) {
        const customer = customers.find((c) => c.id === receivable.customerId);
        const nome = customer?.nome ?? 'Cliente';
        const valor = formatCurrency(receivable.valor);
        results.push({
          id: `receber_${receivable.id}`,
          tipo: 'conta_receber',
          prioridade: diasRestantes < 0 ? 'critico' : diasRestantes === 0 ? 'aviso' : 'info',
          titulo: 'Conta a receber',
          mensagem:
            diasRestantes < 0
              ? `${nome} tem conta VENCIDA de ${valor} (${Math.abs(diasRestantes)}d atrás)`
              : diasRestantes === 0
              ? `${nome} tem conta de ${valor} vencendo HOJE`
              : `${nome} tem conta de ${valor} vencendo em ${diasRestantes}d`,
          data: receivable.vencimento,
          diasRestantes,
          clienteId: receivable.customerId,
          contaId: receivable.id,
        });
      }
    }
  }

  // ── Type D: Contas a pagar vencendo ───────────────────────────────────
  if (settings.notificacoes.contaPagar.ativo) {
    const antecedencia = settings.notificacoes.contaPagar.antecedenciaDias;
    for (const payable of payables) {
      if (payable.status === 'paga') continue;
      const diasRestantes = daysDiff(payable.vencimento);
      if (diasRestantes <= antecedencia) {
        const valor = formatCurrency(payable.valor);
        results.push({
          id: `pagar_${payable.id}`,
          tipo: 'conta_pagar',
          prioridade: diasRestantes < 0 ? 'critico' : diasRestantes === 0 ? 'aviso' : 'info',
          titulo: 'Conta a pagar',
          mensagem:
            diasRestantes < 0
              ? `Conta para ${payable.fornecedor} de ${valor} VENCIDA (${Math.abs(diasRestantes)}d atrás)`
              : diasRestantes === 0
              ? `Conta para ${payable.fornecedor} de ${valor} vence HOJE`
              : `Conta para ${payable.fornecedor} de ${valor} vence em ${diasRestantes}d`,
          data: payable.vencimento,
          diasRestantes,
          contaId: payable.id,
        });
      }
    }
  }

  // Sort: critical first, then by urgency (lowest diasRestantes first)
  results.sort((a, b) => {
    const order = { critico: 0, aviso: 1, info: 2 };
    const pDiff = order[a.prioridade] - order[b.prioridade];
    return pDiff !== 0 ? pDiff : a.diasRestantes - b.diasRestantes;
  });

  return results;
};
