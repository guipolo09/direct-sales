# Sales Store App (MVP)

Aplicativo mobile para gestão de loja de perfumes e cosmeticos.

## O que foi implementado
- Dashboard com indicadores de vendas, contas e estoque baixo.
- Controle de estoque com entrada rapida e historico de movimentacoes.
- CRM basico com clientes e status.
- Registro de vendas com:
  - baixa automatica de estoque
  - bloqueio de estoque insuficiente
  - geracao de conta a receber para venda a prazo
- Financeiro com:
  - contas a receber
  - contas a pagar
  - marcacao manual de pagamento/recebimento
- Regra de reposicao:
  - entrada de estoque gera conta a pagar automaticamente

## Stack
- Expo
- React Native
- TypeScript
- React Navigation (abas)
- Estado local com Context API

## Como rodar
1. Instale dependencias:

```bash
npm install
```

2. Rode o app:

```bash
npm start
```

3. Abra no emulador Android/iOS ou pelo Expo Go.

## Estrutura
- `App.tsx`: navegacao principal
- `src/store/AppStore.tsx`: estado global e regras de negocio
- `src/types/models.ts`: tipos de dados
- `src/screens/*`: telas do MVP
- `src/components/KpiCard.tsx`: componente de indicador

## Proximos passos sugeridos
- Persistencia real de dados (Supabase/Firebase/API propria)
- Autenticacao real com perfis de acesso
- Cadastro completo (fornecedores, categorias, formas de pagamento)
- Cobrancas com historico de tentativas e renegociacao
- Relatorios avancados por periodo/produto/cliente
- Modo offline com sincronizacao
