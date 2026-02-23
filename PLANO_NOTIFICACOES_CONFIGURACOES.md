# Plano de Implementação — Notificações, Tempo Médio de Consumo e Configurações

> **Status:** Aguardando revisão
> **Data de criação:** 2026-02-22
> **Versão:** 1.0

---

## Sumário

1. [Tempo Médio de Consumo nos Produtos](#1-tempo-médio-de-consumo-nos-produtos)
2. [Central de Notificações](#2-central-de-notificações)
3. [Central de Configurações](#3-central-de-configurações)
4. [Mudanças no Banco de Dados](#4-mudanças-no-banco-de-dados)
5. [Mudanças nos Tipos (models.ts)](#5-mudanças-nos-tipos-modelsts)
6. [Arquivos que serão criados](#6-arquivos-que-serão-criados)
7. [Arquivos que serão modificados](#7-arquivos-que-serão-modificados)
8. [Decisões que precisam de sua confirmação](#8-decisões-que-precisam-de-sua-confirmação)

---

## 1. Tempo Médio de Consumo nos Produtos

### O que é
Campo `tempoMedioConsumo` (número inteiro, em **dias**) adicionado ao cadastro de produto. Representa o tempo médio que um cliente leva para consumir/usar aquele produto antes de precisar comprar novamente.

### Exemplos práticos
| Produto | Tempo Médio de Consumo |
|---|---|
| Perfume 100ml feminino | 90 dias |
| Óleo de barba | 30 dias |
| Shampoo 500ml | 45 dias |

### Campos adicionados ao modelo `Product`
```
tempoMedioConsumo: number | null   → tempo em dias (null = não definido)
```

### Interface no cadastro de produto (EstoqueScreen)
- Campo de texto numérico: **"Tempo médio de consumo (dias)"**
- Campo opcional — se não preenchido, não gera notificações de consumo
- Localização: abaixo de "Estoque Mínimo" no formulário de cadastro

### Lógica de uso
Quando uma venda é registrada para um cliente:
- Sistema salva a data da venda (`data`)
- Sistema calcula a **data estimada de novo pedido** = `data da venda + tempoMedioConsumo`
- Essa data é monitorada para gerar notificações

---

## 2. Central de Notificações

### O que é
Nova tela/aba no aplicativo que centraliza todas as alertas e avisos relevantes para o negócio em tempo real.

### Posição na navegação
Nova aba chamada **"Alertas"** (ícone: `bell-alert`) na barra de navegação inferior, entre "Pedidos" e "Financeiro".

> **Alternativa:** Ícone de sino com badge de contagem no header do Dashboard. Decida na seção 8.

---

### 2.1 Tipos de Notificações

#### Tipo A — Estoque Baixo
**Quando dispara:** Quando `estoqueAtual <= estoqueMinimo` de qualquer produto
**Mensagem:** `"{Nome do Produto}" está com estoque baixo. Atual: {X} | Mínimo: {Y}`
**Ação sugerida:** Botão "Fazer Pedido" → redireciona para PedidosScreen com produto pré-selecionado

#### Tipo B — Produto do Cliente Próximo do Fim
**Quando dispara:** Quando `data da última venda + tempoMedioConsumo - antecedência configurada <= hoje`
**Mensagem:** `{Nome do Cliente} deve estar precisando de "{Nome do Produto}". Último pedido: {data}. Previsão de término: {data estimada}.`
**Ação sugerida:** Botão "Entrar em Contato" → abre WhatsApp/telefone do cliente
**Requisito:** Produto precisa ter `tempoMedioConsumo` definido e o cliente precisa ter ao menos uma venda com esse produto

#### Tipo C — Contas a Receber Vencendo
**Quando dispara:** Quando o `vencimento` de uma conta a receber estiver próximo (conforme configuração) ou já vencido
**Mensagem:** `{Nome do Cliente} tem uma conta de R$ {valor} vencendo em {data}` (ou `"VENCIDA em {data}"`)
**Ação sugerida:** Botão "Ver Conta" → abre FinanceiroScreen na conta específica

#### Tipo D — Contas a Pagar Vencendo
**Quando dispara:** Quando o `vencimento` de uma conta a pagar estiver próximo (conforme configuração) ou já vencido
**Mensagem:** `Conta para {Fornecedor} de R$ {valor} vence em {data}` (ou `"VENCIDA em {data}"`)
**Ação sugerida:** Botão "Ver Conta" → abre FinanceiroScreen na conta específica

---

### 2.2 Layout da Tela de Notificações

```
┌─────────────────────────────────────┐
│  🔔 Alertas               [Filtros] │
├─────────────────────────────────────┤
│  [Todos] [Estoque] [Clientes]       │
│  [A Receber] [A Pagar]              │
├─────────────────────────────────────┤
│                                     │
│  ⚠️  ESTOQUE BAIXO                  │
│  ┌─────────────────────────────┐   │
│  │ Perfume XYZ                 │   │
│  │ Atual: 2 | Mínimo: 5        │   │
│  │           [Fazer Pedido →]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  👤 CLIENTES — TEMPO DE CONSUMO    │
│  ┌─────────────────────────────┐   │
│  │ João Silva                  │   │
│  │ Perfume ABC — vence em 3d   │   │
│  │        [Entrar em Contato]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  💰 CONTAS A RECEBER               │
│  ┌─────────────────────────────┐   │
│  │ Maria Santos — R$ 150,00    │   │
│  │ VENCIDA há 2 dias           │   │
│  │               [Ver Conta →] │   │
│  └─────────────────────────────┘   │
│                                     │
│  💸 CONTAS A PAGAR                 │
│  ┌─────────────────────────────┐   │
│  │ Fornecedor XYZ — R$ 800,00  │   │
│  │ Vence em 1 dia              │   │
│  │               [Ver Conta →] │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 2.3 Regras de prioridade e ordenação
1. Contas **já vencidas** aparecem primeiro (vermelho)
2. Itens vencendo **hoje** aparecem em seguida (laranja)
3. Itens dentro do prazo de antecedência (amarelo)
4. Dentro de cada grupo: ordem por urgência (mais próximo do vencimento primeiro)

### 2.4 Badge de contagem
- Badge numérico na aba "Alertas" indicando total de notificações ativas
- Badge vermelho quando há itens vencidos, amarelo quando há apenas avisos

---

## 3. Central de Configurações

### O que é
Nova tela acessível via ícone de engrenagem (canto superior direito) em qualquer tela, ou via aba dedicada.

### Posição na navegação
Ícone `cog` no header da navegação superior direita. Abre como modal ou nova tela.

---

### 3.1 Seção: Tema de Cores

Conjunto de paletas de cor predefinidas para o aplicativo.

| ID | Nome | Cor Primária | Cor Secundária | Preview |
|---|---|---|---|---|
| `rose` | Rosa (padrão atual) | `#be123c` | `#fda4af` | ■ |
| `blue` | Azul | `#1d4ed8` | `#93c5fd` | ■ |
| `purple` | Roxo | `#7e22ce` | `#d8b4fe` | ■ |
| `green` | Verde | `#15803d` | `#86efac` | ■ |
| `orange` | Laranja | `#c2410c` | `#fdba74` | ■ |
| `slate` | Cinza | `#334155` | `#94a3b8` | ■ |

> Você pode adicionar ou remover temas desta lista antes da implementação.

**Armazenamento:** `AsyncStorage` com chave `@settings:theme`

---

### 3.2 Seção: Configurações de Notificações

#### 3.2.1 Antecedência de avisos

Para cada tipo de notificação, definir **com quantos dias de antecedência** o alerta deve aparecer:

| Configuração | Padrão | Opções disponíveis |
|---|---|---|
| Estoque baixo | Imediato (quando atingir mínimo) | Imediato, 1 dia, 3 dias, 7 dias antes de atingir o mínimo |
| Produto do cliente | 7 dias | 1 dia, 3 dias, 7 dias, 15 dias, 30 dias |
| Contas a receber | 3 dias | Imediato (vencido), 1 dia, 3 dias, 7 dias, 15 dias |
| Contas a pagar | 7 dias | Imediato (vencido), 1 dia, 3 dias, 7 dias, 15 dias |

> Você pode ajustar os valores padrão e as opções disponíveis antes da implementação.

#### 3.2.2 Horário de verificação de notificações

Como o app não tem push notifications nativas (sem servidor), as notificações são recalculadas quando o app é aberto. Configurações disponíveis:

| Opção | Comportamento |
|---|---|
| Sempre (padrão) | Recalcula toda vez que o app abre |
| Manhã | Só exibe alerta se o app for aberto antes das 12h |
| Tarde/Noite | Só exibe alerta se o app for aberto após 12h |

> **Nota técnica:** Como o app usa SQLite local sem servidor, não há push notifications reais em background. As notificações são verificadas no momento de abertura do app. Isso pode ser melhorado no futuro com Expo Notifications.

#### 3.2.3 Ativar/Desativar tipos de notificação

Chaves liga/desliga para cada tipo:
- [ ] Ativar alertas de estoque baixo *(padrão: ligado)*
- [ ] Ativar alertas de consumo do cliente *(padrão: ligado)*
- [ ] Ativar alertas de contas a receber *(padrão: ligado)*
- [ ] Ativar alertas de contas a pagar *(padrão: ligado)*

---

### 3.3 Layout da Tela de Configurações

```
┌─────────────────────────────────────┐
│  ⚙️  Configurações                  │
├─────────────────────────────────────┤
│                                     │
│  🎨 TEMA DE CORES                  │
│  ┌─────────────────────────────┐   │
│  │  ● Rosa   ○ Azul  ○ Roxo   │   │
│  │  ○ Verde  ○ Laranja ○ Cinza │   │
│  └─────────────────────────────┘   │
│                                     │
│  🔔 NOTIFICAÇÕES                   │
│                                     │
│  Estoque baixo                      │
│  Antecedência: [Imediato    ▼]     │
│  Ativo: [   ●   ]                  │
│                                     │
│  Produto do cliente                 │
│  Antecedência: [7 dias     ▼]     │
│  Ativo: [   ●   ]                  │
│                                     │
│  Contas a receber                   │
│  Antecedência: [3 dias     ▼]     │
│  Ativo: [   ●   ]                  │
│                                     │
│  Contas a pagar                     │
│  Antecedência: [7 dias     ▼]     │
│  Ativo: [   ●   ]                  │
│                                     │
│  ⏰ HORÁRIO DE VERIFICAÇÃO         │
│  [Sempre ▼]                        │
│                                     │
│            [Salvar Configurações]   │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Mudanças no Banco de Dados

### 4.1 Tabela `products` — adicionar coluna
```sql
ALTER TABLE products ADD COLUMN tempo_medio_consumo INTEGER DEFAULT NULL;
```
- Tipo: `INTEGER` (dias inteiros)
- Padrão: `NULL` (não definido)
- Migração: adicionar coluna sem afetar dados existentes

### 4.2 Nova tabela `settings`
```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```
Usada para persistir configurações no SQLite (alternativa ao AsyncStorage).

> **Decisão:** Usar AsyncStorage (mais simples) ou SQLite (consistente com o resto do app)?
> Recomendação: **AsyncStorage** para configurações simples, já que não há relações com outras tabelas.

### 4.3 Sem novas tabelas para notificações
As notificações são **calculadas em tempo real** consultando:
- `products` (estoque baixo e tempo de consumo)
- `sales` + `sale_items` (última venda por cliente/produto)
- `receivables` (contas a receber)
- `payables` (contas a pagar)

Não é necessário persistir as notificações — elas são derivadas dos dados existentes.

---

## 5. Mudanças nos Tipos (models.ts)

### 5.1 `Product` — campo adicional
```typescript
tempoMedioConsumo?: number | null; // dias
```

### 5.2 Novo tipo `Notification`
```typescript
type NotificationType = 'estoque_baixo' | 'consumo_cliente' | 'conta_receber' | 'conta_pagar';

type NotificationPriority = 'critico' | 'aviso' | 'info';

interface AppNotification {
  id: string;                    // gerado dinamicamente
  tipo: NotificationType;
  prioridade: NotificationPriority;
  titulo: string;
  mensagem: string;
  data: string;                  // data relacionada (vencimento, previsão)
  diasRestantes: number;         // negativo = vencido
  // Dados contextuais para ações
  produtoId?: string;
  clienteId?: string;
  contaId?: string;
}
```

### 5.3 Novo tipo `AppSettings`
```typescript
interface NotificationSettings {
  ativo: boolean;
  antecedenciaDias: number;
}

interface AppSettings {
  tema: 'rose' | 'blue' | 'purple' | 'green' | 'orange' | 'slate';
  horarioVerificacao: 'sempre' | 'manha' | 'tarde';
  notificacoes: {
    estoqueBaixo: NotificationSettings;
    consumoCliente: NotificationSettings;
    contaReceber: NotificationSettings;
    contaPagar: NotificationSettings;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  tema: 'rose',
  horarioVerificacao: 'sempre',
  notificacoes: {
    estoqueBaixo:    { ativo: true, antecedenciaDias: 0  },
    consumoCliente:  { ativo: true, antecedenciaDias: 7  },
    contaReceber:    { ativo: true, antecedenciaDias: 3  },
    contaPagar:      { ativo: true, antecedenciaDias: 7  },
  },
};
```

---

## 6. Arquivos que serão criados

| Arquivo | Descrição |
|---|---|
| `src/screens/AlertasScreen.tsx` | Tela central de notificações |
| `src/screens/ConfiguracoesScreen.tsx` | Tela de configurações |
| `src/services/NotificationService.ts` | Lógica de cálculo das notificações |
| `src/services/SettingsRepository.ts` | Leitura/escrita das configurações (AsyncStorage) |
| `src/hooks/useNotifications.ts` | Hook para consumir notificações no app |
| `src/hooks/useSettings.ts` | Hook para consumir e atualizar configurações |
| `src/theme/colors.ts` | Paletas de cores por tema |
| `src/theme/ThemeContext.tsx` | Context para tema global |

---

## 7. Arquivos que serão modificados

| Arquivo | O que muda |
|---|---|
| `src/types/models.ts` | Adicionar `tempoMedioConsumo` em `Product`, novos tipos `AppNotification` e `AppSettings` |
| `src/services/db.ts` | Migração: `ALTER TABLE products ADD COLUMN tempo_medio_consumo` |
| `src/services/ProductRepository.ts` | Incluir `tempoMedioConsumo` nas queries de insert/update/select |
| `src/screens/EstoqueScreen.tsx` | Campo "Tempo médio de consumo (dias)" no formulário de produto |
| `src/store/AppStore.tsx` | Adicionar estado de settings e notifications ao contexto global |
| `App.tsx` | Adicionar aba "Alertas" e aba/ícone "Configurações" na navegação; envolver com `ThemeContext` |

---

## 8. Decisões que precisam de sua confirmação

Antes de começar a implementação, confirme os itens abaixo:

### 8.1 Posição da Central de Notificações
- **Opção A:** Nova aba "Alertas" na barra de navegação inferior *(adiciona 1 aba)*
- **Opção B:** Ícone de sino no header do Dashboard com badge e modal *(não adiciona aba)*

### 8.2 Posição das Configurações
- **Opção A:** Ícone de engrenagem no header (topo direito) em todas as telas
- **Opção B:** Nova aba "Config" na barra de navegação inferior

### 8.3 Armazenamento das configurações
- **Opção A (recomendada):** AsyncStorage — mais simples para dados chave-valor
- **Opção B:** SQLite — consistente com o restante do app

### 8.4 Unidade do Tempo Médio de Consumo
- **Opção A (recomendada):** Somente dias *(mais simples)*
- **Opção B:** Selecionar unidade (dias, semanas, meses) *(mais flexível)*

### 8.5 Temas de cores
- Os 6 temas listados na seção 3.1 estão bons ou deseja alterar algum?

### 8.6 Valores padrão de antecedência
- Os valores padrão da seção 3.2.1 estão adequados para o seu negócio?
  - Produto do cliente: **7 dias** antes do término estimado
  - Contas a receber: **3 dias** antes do vencimento
  - Contas a pagar: **7 dias** antes do vencimento

---

## Notas Técnicas

- **Sem push notifications em background:** O app usa SQLite local, sem servidor. Notificações são recalculadas quando o usuário abre o app. Para notificações reais em background seria necessário Expo Notifications + servidor.
- **Performance:** O cálculo de notificações fará `JOIN` entre `sales`, `sale_items` e `products`. Para evitar lentidão, o cálculo será feito uma vez ao abrir o app e cacheado no estado global.
- **Migração do banco:** A adição da coluna `tempo_medio_consumo` é não-destrutiva. Produtos existentes ficarão com `NULL` e não gerarão notificações de consumo até o campo ser preenchido.
