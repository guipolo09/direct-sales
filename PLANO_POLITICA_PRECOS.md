# Plano de Implementação — Política de Preços

> Documento de análise e planejamento. Revise e sugira ajustes antes da implementação.

---

## 1. Os 4 Tipos de Preço e Onde Cada Um Vive

| Tipo | Campo | Onde pertence | Quem preenche |
|------|-------|--------------|---------------|
| Preço de Custo | `precoCusto` | Entrada de estoque / Pedido de compra | Você, ao registrar a compra |
| Preço de Tabela | `precoTabela` | Cadastro do produto (campo opcional) | Você, ao cadastrar ou editar o produto |
| Preço Promocional | `precoPromocional` | Cadastro do produto (campo opcional) | Você, ao cadastrar ou editar o produto |
| Preço de Venda | `precoVenda` | Cadastro do produto + ajustável na venda | Você, ao cadastrar ou editar o produto |

**Princípio:** cada preço aparece apenas no contexto onde faz sentido. O cadastro de produto continua leve.

---

## 2. O Valor Final — Composição de Itens Extras

O **Valor Final** é o preço real que o cliente paga quando o produto é entregue com embalagem e outros itens adicionais. Ele é composto por:

```
Valor Final = Preço de Venda + Extras selecionados
```

**Extras possíveis:**
- Embalagem (ex: caixa, sacola)
- Fita
- Bilhetinho / cartão
- Frete (variável, digitado na hora)

Os valores padrão dos extras (embalagem, fita, bilhetinho) são **configurados uma única vez** numa tela de configurações. Na hora da venda, o usuário só marca quais quer incluir — sem precisar digitar valores repetidamente.

---

## 3. Como Cada Fluxo Permanece Fluído

### 3.1 Fluxo de Cadastro de Produto (Estoque)

**Situação atual:** Nome → Categoria → Marca → Preço de Venda → Estoque → Mínimo

**Proposta:** manter exatamente igual, com uma seção expansível opcional no final.

```
[ Nome do Produto        ]
[ Categoria ▼            ]
[ Marca ▼                ]
[ Preço de Venda   R$___ ]   ← já existe
[ Estoque atual    ___   ]
[ Estoque mínimo   ___   ]

▶ Preços de Referência (opcional)  ← seção colapsada por padrão
    [ Preço de Tabela   R$___ ]
    [ Preço Promocional R$___ ]
```

> O `precoCusto` **não entra aqui** — ele é registrado na entrada de estoque, que já tem contexto de compra (valor pago, fornecedor, data). Isso é mais correto semanticamente e não carrega o cadastro de produto.

### 3.2 Fluxo de Entrada de Estoque / Pedido de Compra

Aqui é onde `precoCusto` já tem seu lugar natural.

```
[ Produto ▼              ]
[ Quantidade   ___       ]
[ Preço de Custo  R$___ ]   ← novo campo, aqui faz sentido
[ Fornecedor ▼           ]
[ Data         ___       ]
```

> Se o produto já tem um `precoCusto` registrado anteriormente, ele aparece pré-preenchido como sugestão, podendo ser alterado. Isso mantém o histórico de variação de custo.

### 3.3 Fluxo de Venda

**Situação atual:** Cliente → Produto → Qtd → Carrinho → Pagamento

**Proposta:** adicionar um passo leve de "Extras" por item, que pode ser pulado rapidamente.

```
[ Cliente ▼              ]

[ Produto ▼              ]
[ Quantidade   ___       ]
[ Preço de Venda: R$ 120 ]  ← mostra o precoVenda padrão
  (se precoPromocional ativo, mostra os dois com destaque)

  + Extras para este item (opcionais):
    ☐ Embalagem  +R$ 8,00
    ☐ Fita       +R$ 2,00
    ☐ Bilhetinho +R$ 1,50
    ☐ Frete      +R$____   ← campo livre, só aparece se marcado

  Valor Final: R$ 120,00

[ Adicionar ao Carrinho  ]
```

Se o usuário não quiser extras, ele toca "Adicionar ao Carrinho" diretamente — o passo de extras é visível mas não bloqueia o fluxo.

### 3.4 Configuração de Extras (nova tela nas Configurações)

Uma única tela simples onde o usuário define os valores padrão:

```
Configurar Extras Padrão

Embalagem    R$____
Fita         R$____
Bilhetinho   R$____

[Salvar]
```

Esses valores alimentam os checkboxes na tela de venda automaticamente.

---

## 4. Onde o Preço Promocional é Ativado

Duas opções — escolher uma:

**Opção A (Simples):** campo `precoPromocional` no produto. Quando preenchido, aparece como "preço em promoção" na venda. O vendedor decide usar ou não.

**Opção B (Com controle de período):** campo `precoPromocional` + campos `promocaoInicio` e `promocaoFim`. O sistema ativa automaticamente o preço promocional quando a data da venda está dentro do período.

> **Recomendação inicial:** Opção A. Mais simples de implementar e suficiente para o fluxo descrito. A Opção B pode ser adicionada depois se necessário.

---

## 5. Mudanças nos Modelos de Dados

### Product (tipos/models.ts)

```typescript
type Product = {
  // campos existentes — sem alteração
  id: string;
  nome: string;
  tipo: 'produto' | 'kit';
  categoria: string;
  marca: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  precoVenda: number;

  // novos campos — todos opcionais para não quebrar dados existentes
  precoCusto?: number;         // último custo registrado (referência rápida)
  precoTabela?: number;        // preço sugerido pela marca
  precoPromocional?: number;   // preço promocional ativo (quando preenchido)
};
```

### SaleItem (tipos/models.ts)

```typescript
type SaleItem = {
  // campos existentes
  productId: string;
  quantidade: number;
  valorUnitario: number;       // preço praticado na venda

  // novos campos opcionais
  extras?: {
    embalagem: number;         // 0 se não incluído
    fita: number;
    bilhetinho: number;
    frete: number;
  };
  valorFinal?: number;         // valorUnitario + soma dos extras
};
```

### AppConfig (novo, armazenado localmente)

```typescript
type AppConfig = {
  extrasPrecos: {
    embalagem: number;
    fita: number;
    bilhetinho: number;
  };
};
```

### Banco de Dados (db.ts)

```sql
-- products: adicionar colunas
ALTER TABLE products ADD COLUMN precoCusto REAL DEFAULT NULL;
ALTER TABLE products ADD COLUMN precoTabela REAL DEFAULT NULL;
ALTER TABLE products ADD COLUMN precoPromocional REAL DEFAULT NULL;

-- sale_items: adicionar colunas
ALTER TABLE sale_items ADD COLUMN extras_embalagem REAL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN extras_fita REAL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN extras_bilhetinho REAL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN extras_frete REAL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN valorFinal REAL DEFAULT NULL;

-- app_config: nova tabela
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## 6. Impacto nas Telas Existentes

| Tela | Mudança | Impacto |
|------|---------|---------|
| `EstoqueScreen` | Adicionar seção "Preços de Referência" colapsada | Baixo — seção opcional |
| `VendasScreen` | Adicionar bloco de Extras por item | Médio — novo componente |
| `PedidosScreen` | Adicionar campo `precoCusto` na entrada | Baixo — novo campo simples |
| `DashboardScreen` | Potencial: exibir margem de lucro | Baixo — cálculo opcional |
| Nova tela `ConfigScreen` | Configuração de extras padrão | Novo componente simples |

---

## 7. O que Não Muda

- O fluxo principal de venda (cliente → produto → qtd → pagamento) permanece igual
- O cadastro de produto continua com os mesmos campos obrigatórios
- Dados existentes não são afetados (novos campos são todos opcionais/nullable)
- Kits continuam funcionando da mesma forma

---

## 8. Sequência de Implementação Sugerida

1. **Migração do banco** — adicionar colunas novas (sem breaking changes)
2. **Atualizar modelos TypeScript** — campos opcionais em `Product` e `SaleItem`
3. **Repositórios** — atualizar queries de insert/select/update
4. **Configuração de Extras** — nova tabela `app_config` + tela de configuração
5. **EstoqueScreen** — seção colapsada de "Preços de Referência"
6. **PedidosScreen** — campo `precoCusto` na entrada de estoque
7. **VendasScreen** — bloco de Extras por item de venda
8. **Testes** — validar que fluxos existentes continuam funcionando

---

## 9. Pontos Abertos para Decisão

> Responda estes pontos antes de iniciar a implementação.

- [ ] **Preço Promocional:** Opção A (manual, sem período) ou Opção B (com datas de início/fim)?
- [ ] **Valor Final no total da venda:** o `total` da venda deve ser a soma dos `valorFinal` (incluindo extras) ou a soma dos `valorUnitario` (sem extras)? Os extras entram no financeiro?
- [ ] **precoCusto no produto:** guardar apenas o último custo como referência, ou manter histórico por entrada de estoque? (histórico completo seria na tabela de movimentos de estoque)
- [ ] **Tela de Configurações:** já existe uma ou precisará ser criada? Onde ela ficaria na navegação?
- [ ] **Frete:** o frete é sempre por item ou pode ser um valor único para toda a venda?

---

*Documento criado em 21/02/2026 — aguardando revisão e feedback antes da implementação.*
