# Sales Store App

Aplicativo mobile para gestão de loja de perfumes e cosméticos, desenvolvido em React Native com Expo.

## Funcionalidades Implementadas

### Dashboard
- Indicadores KPI do mês: total de vendas, valor recebido, contas a receber, contas pagas, contas a pagar e novos clientes
- Comparativo entre total vendido e valor efetivamente recebido (gráfico donut)
- Gráfico de barras com contagem de vendas diárias
- Alertas de estoque baixo (produtos abaixo do mínimo)
- Histórico recente de movimentações de estoque
- Navegação entre meses

### Estoque
- Cadastro de produtos com nome, categoria, marca, estoque atual, estoque mínimo e preço de venda
- Cadastro de kits (conjuntos de produtos) com cálculo automático de estoque disponível baseado nos componentes
- Entrada rápida de estoque com registro de fornecedor e custo unitário
- Geração automática de conta a pagar ao registrar entrada de estoque
- Gerenciamento de categorias (criar, renomear, excluir)
- Gerenciamento de marcas (criar, renomear, excluir)
- Histórico de movimentações (entradas, saídas e ajustes)
- Alertas visuais de estoque mínimo

### Vendas
- Registro de vendas com seleção de cliente e produtos
- Exibição do estoque disponível por produto no momento da venda
- Baixa automática de estoque ao confirmar a venda
- Bloqueio automático quando o estoque é insuficiente
- Duas formas de pagamento:
  - **À vista**: pagamento imediato sem geração de parcelas
  - **A prazo**: parcelamento em 1x, 3x, 4x ou 6x com entrada configurável
- Venda em 1x a prazo: configuração de data de vencimento específica
- Venda em 3x/4x/6x: configuração do dia do mês para vencimento das parcelas
- Geração automática de contas a receber para vendas a prazo
- Histórico de vendas filtrado por mês

### CRM (Clientes)
- Cadastro de clientes com nome, telefone e status
- Três status de cliente: novo, recorrente e inativo
- Histórico de compras por cliente com detalhes expandíveis
- Adição rápida de cliente durante o registro de venda
- Exclusão de clientes

### Financeiro
**Contas a Receber**
- Geração automática a partir de vendas a prazo
- Marcação manual de recebimento (com registro de data)
- Exclusão de parcelas
- Status: pendente, paga e atrasada

**Contas a Pagar**
- Geração automática a partir de entradas de estoque
- Cadastro manual de contas (boleto, imposto, conta fixa)
- Edição de contas existentes
- Marcação manual de pagamento (com registro de data)
- Status: pendente, paga e atrasada

### Pedidos de Compra
- Lista de itens pendentes de pedido com nome, código e quantidade
- Adição, edição e exclusão de itens pendentes
- Finalização de pedido com seleção parcial de itens
- Histórico de pedidos finalizados com data
- Exclusão de pedidos do histórico
- Exportação de pedido para planilha Excel (.xlsx)

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Expo + React Native |
| Linguagem | TypeScript |
| Navegação | React Navigation (Bottom Tabs) |
| Estado global | Context API |
| Banco de dados | SQLite via expo-sqlite (WAL mode) |
| Exportação | xlsx |
| Testes | Jest + Testing Library |

## Estrutura do Projeto

```
src/
├── __tests__/
│   └── fluxos.test.tsx       # Testes de fluxo de uso
├── components/
│   ├── DonutChart.tsx         # Gráfico donut reutilizável
│   └── KpiCard.tsx            # Card de indicador KPI
├── screens/
│   ├── DashboardScreen.tsx    # Painel principal
│   ├── VendasScreen.tsx       # Registro e histórico de vendas
│   ├── EstoqueScreen.tsx      # Gestão de estoque e produtos
│   ├── FinanceiroScreen.tsx   # Contas a receber e a pagar
│   ├── CrmScreen.tsx          # Cadastro e gestão de clientes
│   └── PedidosScreen.tsx      # Pedidos de compra
├── services/
│   ├── db.ts                  # Inicialização do banco SQLite
│   ├── ProductRepository.ts
│   ├── CustomerRepository.ts
│   ├── SaleRepository.ts
│   ├── StockMoveRepository.ts
│   ├── FinancialRepository.ts
│   ├── CategoryRepository.ts
│   ├── BrandRepository.ts
│   ├── PurchaseOrderRepository.ts
│   └── SupplierRepository.ts
├── store/
│   └── AppStore.tsx           # Estado global e regras de negócio
├── types/
│   └── models.ts              # Definições de tipos TypeScript
└── utils/
    └── format.ts              # Utilitários de formatação
App.tsx                        # Ponto de entrada e navegação
```

## Regras de Negócio Implementadas

- Venda bloqueia se o estoque for insuficiente (inclui componentes de kits)
- Entrada de estoque gera conta a pagar automaticamente com vencimento em 30 dias
- Venda a prazo gera contas a receber automaticamente para cada parcela
- O estoque de kits é calculado dinamicamente com base no componente mais restrito
- Venda de kit desconta o estoque de todos os produtos componentes
- Distribuição justa de centavos nas parcelas (sem acúmulo de arredondamento)
- Categorias e marcas são atualizadas em cascata nos produtos vinculados
- Clientes sem telefone recebem valor padrão "Nao informado"

## Como Rodar

### Pré-requisitos
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

### Instalação

```bash
npm install
```

### Executar o app

```bash
npm start
```

Abra no emulador Android/iOS ou pelo aplicativo Expo Go.

### Executar os testes

```bash
# Todos os testes
npm test

# Apenas os testes de fluxo
npm test -- fluxos

# Com cobertura
npm test -- --coverage

# Modo watch
npm test -- --watch
```

## Testes de Fluxo

O arquivo `src/__tests__/fluxos.test.tsx` cobre os seguintes cenários:

| Fluxo | Casos Testados |
|---|---|
| Cadastro de Cliente | Cadastro completo, validações, remoção, status |
| Cadastro de Produto | Cadastro com categoria/marca, validações, remoção, atualização em cascata |
| Cadastro de Kit | Criação, validações, cálculo de estoque, limitação por componente |
| Venda à Vista | Baixa de estoque, movimentação, total, validações de estoque |
| Venda a Prazo | 3x/4x/6x, parcela única, entrada, distribuição de valores, validações |
| Entrada de Estoque | Aumento de estoque, geração de conta a pagar, movimentação |
| Gestão Financeira | Baixa de recebíveis/pagáveis, cadastro manual, edição, remoção |
| Pedidos de Compra | Adição, edição, finalização parcial, remoção, histórico |
| Fluxo Integrado | Jornada completa: cadastro → estoque → venda → financeiro |

## Próximos Passos Sugeridos

- Autenticação com perfis de acesso (admin, vendedor)
- Sincronização com backend (Supabase / API REST)
- Relatórios avançados por período, produto e cliente
- Controle de cobranças com histórico de tentativas e renegociação
- Modo offline com fila de sincronização
- Notificações de vencimento de contas e estoque baixo
- Cadastro completo de fornecedores com histórico de compras
