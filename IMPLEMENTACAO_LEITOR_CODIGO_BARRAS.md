# Implementação: Leitor de Código de Barras para Cadastro de Produtos

## 1. Visão Geral

Adicionar suporte a leitura de código de barras no fluxo de cadastro e entrada de estoque de produtos. Se o código já existir no banco, o produto é carregado para atualização de quantidade. Se não existir, o formulário de cadastro é aberto pré-preenchido com o código lido.

---

## 2. Biblioteca Recomendada

### `expo-camera` (nativo do Expo SDK 54+)

**Por que esta escolha:**
- O projeto já usa **Expo SDK 54**, e o `expo-barcode-scanner` foi **removido no SDK 52**
- O `expo-camera` já inclui leitura de código de barras via componente `CameraView` com a prop `barcodeScannerSettings`
- Sem dependência externa extra — apenas uma instalação adicional do pacote `expo-camera` que provavelmente já está disponível no SDK

**Formatos suportados relevantes:**
| Formato | Uso comum |
|--------|-----------|
| `ean13` | Produtos de varejo (código de barras padrão BR) |
| `ean8` | Produtos menores |
| `upc_a` / `upc_e` | Produtos importados |
| `qr` | QR Codes |
| `code128` | Logística, etiquetas internas |
| `code39` | Industrial/patrimônio |

**Instalação:**
```bash
npx expo install expo-camera
```

---

## 3. Alterações no Modelo de Dados

### 3.1 Tipo `Product` (`src/types/models.ts`)

Adicionar campo `codigoBarras` opcional e único por produto:

```typescript
type Product = {
  id: string;
  nome: string;
  tipo: 'produto' | 'kit';
  categoria: string;
  marca: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  precoVenda: number;
  tempoMedioConsumo?: number | null;
  codigoBarras?: string | null;   // <-- NOVO campo
  kitItens?: Array<{
    productId: string;
    quantidade: number;
  }>;
};
```

### 3.2 Schema do Banco de Dados (`src/services/db.ts`)

**Tabela `products` — adicionar coluna `codigoBarras`:**

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  marca TEXT NOT NULL,
  estoqueAtual INTEGER NOT NULL DEFAULT 0,
  estoqueMinimo INTEGER NOT NULL DEFAULT 0,
  precoVenda REAL NOT NULL,
  tempoMedioConsumo INTEGER DEFAULT NULL,
  codigoBarras TEXT UNIQUE DEFAULT NULL   -- <-- NOVO campo (UNIQUE garante unicidade)
);
```

> **Nota sobre migração:** Como o banco já existe nos dispositivos com dados reais, é necessário adicionar um script de migração que execute `ALTER TABLE products ADD COLUMN codigoBarras TEXT UNIQUE DEFAULT NULL` ao invés de recriar a tabela.

---

## 4. Alterações nos Serviços

### 4.1 `ProductRepository.ts`

Novos métodos a adicionar:

```typescript
// Busca produto pelo código de barras
async getByBarcode(codigoBarras: string): Promise<Product | null>

// Verifica se um código já está em uso (para validação no formulário)
async isBarcodeInUse(codigoBarras: string, excludeId?: string): Promise<boolean>
```

Métodos existentes a **atualizar** para incluir o campo `codigoBarras`:
- `create(product)` — incluir campo na query INSERT
- `update(product)` — incluir campo na query UPDATE
- `getAll()` — incluir campo no SELECT e mapeamento
- `getById(id)` — incluir campo no SELECT e mapeamento

---

## 5. Novo Componente: `BarcodeScannerModal`

**Localização:** `src/components/BarcodeScannerModal.tsx`

**Responsabilidades:**
- Exibir câmera em modal fullscreen
- Solicitar permissão de câmera ao montar
- Disparar callback `onScan(code: string)` ao detectar um código
- Evitar disparos múltiplos (debounce após primeira leitura)
- Botão para fechar / cancelar

**Interface:**
```typescript
type BarcodeScannerModalProps = {
  visible: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
};
```

**Fluxo interno:**
```
Abrir modal
  → Verificar permissão de câmera
    → Se negada: mostrar mensagem + botão para abrir configurações
    → Se concedida: exibir CameraView com overlay de mira
      → Ao detectar código:
        → Desabilitar scanner (evitar dupla leitura)
        → Chamar onScan(code)
        → Fechar modal
```

---

## 6. Alterações na `EstoqueScreen.tsx`

### 6.1 Formulário de Cadastro de Produto

Adicionar:
- Campo de texto `codigoBarras` (digitável manualmente)
- Botão com ícone de câmera ao lado do campo para abrir o `BarcodeScannerModal`
- Validação: se código informado, verificar unicidade antes de salvar

### 6.2 Novo Fluxo: "Entrada por Código de Barras"

Adicionar botão de ação destacado na tela principal de Estoque:

```
[ Leitura de Código de Barras ]
```

Ao acionar:
1. Abre `BarcodeScannerModal`
2. Após leitura do código, executa `getByBarcode(code)`:

```
Produto ENCONTRADO?
  → SIM: Abrir painel de "Entrada de Estoque" com produto pré-selecionado
          O usuário digita a quantidade a adicionar e confirma
  → NÃO: Abrir formulário de "Novo Produto" com campo codigoBarras pré-preenchido
          O usuário completa os demais dados e cadastra
```

### 6.3 Diagrama de Fluxo

```
[Tela Estoque]
     │
     ▼
[Botão: Ler Código de Barras]
     │
     ▼
[BarcodeScannerModal] ──── cancelar ────► [Tela Estoque]
     │
     │ código lido
     ▼
[getByBarcode(code)]
     │
     ├── ENCONTRADO ──────► [Modal/Form: Entrada de Estoque]
     │                           │ informe quantidade
     │                           ▼
     │                      [addStockEntry()]
     │                           │
     │                           ▼
     │                      [Estoque atualizado ✓]
     │
     └── NÃO ENCONTRADO ──► [Form: Cadastro de Produto]
                                 │ codigoBarras pré-preenchido
                                 │ preencha demais campos
                                 ▼
                            [addProduct()]
                                 │
                                 ▼
                            [Produto cadastrado ✓]
```

---

## 7. Alterações no `AppStore.tsx`

As funções `addProduct` e `addKit` já existem. Serão ajustadas para:
- Aceitar `codigoBarras` no payload
- Validar unicidade do código antes de persistir (usando `isBarcodeInUse`)
- Retornar erro descritivo se código já estiver em uso

Exemplo de payload atualizado:
```typescript
type AddProductPayload = {
  nome: string;
  tipo: 'produto';
  categoria: string;
  marca: string;
  estoqueInicial: number;
  estoqueMinimo: number;
  precoVenda: number;
  tempoMedioConsumo?: number | null;
  codigoBarras?: string | null;   // <-- NOVO campo
};
```

---

## 8. Permissões

**Android (`app.json` / `app.config.js`):**
```json
"android": {
  "permissions": ["CAMERA"]
}
```

**iOS (`app.json` / `app.config.js`):**
```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "Necessário para leitura de códigos de barras dos produtos."
  }
}
```

---

## 9. Arquivos Impactados

| Arquivo | Tipo de Alteração |
|---|---|
| `src/types/models.ts` | Adicionar campo `codigoBarras` ao tipo `Product` |
| `src/services/db.ts` | Adicionar coluna + script de migração |
| `src/services/ProductRepository.ts` | Novos métodos + atualizar queries existentes |
| `src/store/AppStore.tsx` | Atualizar payloads e validações |
| `src/screens/EstoqueScreen.tsx` | Novo campo no form + novo fluxo de leitura |
| `src/components/BarcodeScannerModal.tsx` | **Novo arquivo** |
| `app.json` | Adicionar permissão de câmera |

---

## 10. Fora do Escopo (Implementação Futura)

- Leitura de código de barras na tela de **Vendas / PDV**
- Impressão de etiquetas com código de barras
- Geração automática de código de barras interno
- Leitura em lote (múltiplos produtos de uma vez)

---

## 11. Considerações Técnicas

- **Unicidade do código:** garantida tanto via `UNIQUE` no banco quanto via validação na camada de serviço, evitando erros silenciosos
- **Campo opcional:** o código de barras é opcional — produtos existentes sem código continuam funcionando normalmente
- **Kits:** o campo `codigoBarras` estará disponível também para kits, mas o fluxo de leitura por câmera é focado em produtos simples inicialmente
- **Scan manual:** o campo aceita digitação manual para casos onde a câmera não está disponível ou o código está danificado
- **Migração segura:** usar `ALTER TABLE` em vez de `DROP + CREATE` para não perder dados existentes

Sources:
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [expo-barcode-scanner → expo-camera migration guide](https://github.com/expo/fyi/blob/main/barcode-scanner-to-expo-camera.md)
- [Building a Professional Barcode & QR Scanner with Expo Camera (2026)](https://anytechie.medium.com/building-a-professional-barcode-qr-scanner-with-expo-camera-57e014382000)
- [Comparing React Native barcode scanner libraries - Scanbot](https://scanbot.io/blog/react-native-vision-camera-vs-expo-camera/)
