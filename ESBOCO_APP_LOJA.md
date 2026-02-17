# Esboço do App Mobile - Loja de Perfumes e Cosméticos

## 1. Objetivo do aplicativo
Criar um aplicativo mobile para administrar a loja com foco em:
- Controle de estoque
- CRM de clientes e vendas
- Gestão financeira
- Cobranças a receber
- Contas a pagar

## 2. Perfil de uso
- Usuário principal: proprietário(a)/gestor(a) da loja
- Uso diário no celular para registrar vendas, atualizar estoque e acompanhar finanças

## 3. Funcionalidades principais (MVP)

### 3.1 Autenticação e acesso
- Login com e-mail e senha
- Recuperação de senha
- Perfis de acesso (futuro: admin, vendedor)

### 3.2 Cadastro base
- Produtos (perfumes, cosméticos, kits)
- Categorias e marcas
- Clientes
- Fornecedores
- Formas de pagamento

### 3.3 Controle de estoque
- Cadastro de entradas (compras/reposição)
- Registro de saídas (vendas/perdas)
- Ajuste manual de estoque
- Alerta de estoque baixo
- Histórico de movimentações por produto

### 3.4 CRM e vendas
- Cadastro completo de clientes (contato, preferências, histórico)
- Registro de vendas por cliente
- Status de atendimento (novo, recorrente, inativo)
- Lembretes de contato/retorno
- Histórico de interações (mensagens, observações, negociações)

### 3.5 Financeiro
- Fluxo de caixa (entradas e saídas)
- Contas a receber (parcelas, vencimentos, status)
- Contas a pagar (fornecedores, despesas fixas/variáveis)
- Conciliação manual de pagamentos
- Visão mensal de lucro/prejuízo

### 3.6 Cobranças
- Lista de clientes inadimplentes
- Controle de tentativas de cobrança
- Registro de acordo e renegociação
- Alertas de vencimento e atraso

### 3.7 Relatórios e indicadores
- Vendas por período
- Produtos mais vendidos
- Ticket médio
- Clientes que mais compram
- Resumo financeiro mensal

## 4. Estrutura de telas sugerida
- Login
- Dashboard principal
- Estoque (lista + detalhes + movimentações)
- Clientes/CRM
- Vendas
- Financeiro
- Contas a receber
- Contas a pagar
- Relatórios
- Configurações

## 5. Regras de negócio iniciais
- Toda venda deve baixar estoque automaticamente
- Venda com pagamento a prazo deve gerar conta a receber
- Compra de fornecedor deve gerar conta a pagar
- Não permitir estoque negativo (ou pedir confirmação com permissão)
- Marcar cobranças por status: pendente, em contato, negociada, paga

## 6. Estrutura de dados (rascunho)
- Usuario
- Produto
- Categoria
- Cliente
- Fornecedor
- Venda
- ItemVenda
- MovimentoEstoque
- ContaReceber
- ContaPagar
- Cobranca
- TransacaoFinanceira

## 7. Tecnologias a definir antes de iniciar
- Framework mobile (ex.: Flutter ou React Native)
- Backend (ex.: Firebase, Supabase ou API própria)
- Banco de dados
- Estratégia de backup e segurança
- Integrações futuras (WhatsApp, gateways de pagamento, emissão fiscal)

## 8. Fases sugeridas de desenvolvimento

### Fase 1 - Fundacao
- Definição técnica
- Protótipo de telas
- Configuração do projeto

### Fase 2 - MVP funcional
- Cadastro base
- Estoque
- Vendas + CRM básico
- Financeiro básico

### Fase 3 - Operação real
- Cobranças
- Relatórios
- Melhorias de usabilidade
- Ajustes de regras de negócio

### Fase 4 - Expansão
- Multiusuário avançado
- Automações
- Integrações externas

## 9. Pontos para sua revisão antes de codar
- Quais funcionalidades são obrigatórias no primeiro lançamento?
- O app será usado por mais de uma pessoa ao mesmo tempo?
- Precisa funcionar offline?
- Haverá integração com WhatsApp para cobranças?
- Precisa emitir recibo ou nota fiscal?
- Quais relatórios são essenciais para sua rotina?

## 10. Critérios de sucesso do MVP
- Registrar uma venda completa em menos de 1 minuto
- Atualização de estoque em tempo real após venda
- Visualizar contas vencidas e a vencer na tela inicial
- Saber resultado financeiro do mês em poucos toques
