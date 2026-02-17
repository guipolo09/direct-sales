import { getDB } from './db';
import { Receivable, Payable } from '../types/models';

export const FinancialRepository = {
    // Receivables
    async createReceivable(receivable: Receivable): Promise<void> {
        const db = await getDB();
        await db.runAsync(
            'INSERT INTO receivables (id, customerId, descricao, valor, vencimento, status, paidAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [receivable.id, receivable.customerId, receivable.descricao, receivable.valor, receivable.vencimento, receivable.status, receivable.paidAt ?? null]
        );
    },

    async createReceivables(receivables: Receivable[]): Promise<void> {
         const db = await getDB();
         await db.withTransactionAsync(async () => {
            for (const r of receivables) {
                await db.runAsync(
                    'INSERT INTO receivables (id, customerId, descricao, valor, vencimento, status, paidAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [r.id, r.customerId, r.descricao, r.valor, r.vencimento, r.status, r.paidAt ?? null]
                );
            }
         });
    },

    async updateReceivable(receivable: Receivable): Promise<void> {
        const db = await getDB();
        await db.runAsync(
            'UPDATE receivables SET descricao = ?, valor = ?, vencimento = ?, status = ?, paidAt = ? WHERE id = ?',
            [receivable.descricao, receivable.valor, receivable.vencimento, receivable.status, receivable.paidAt ?? null, receivable.id]
        );
    },

    async removeReceivable(id: string): Promise<void> {
        const db = await getDB();
        await db.runAsync('DELETE FROM receivables WHERE id = ?', [id]);
    },

    async getAllReceivables(): Promise<Receivable[]> {
        const db = await getDB();
        return await db.getAllAsync<Receivable>('SELECT * FROM receivables');
    },

    // Payables
    async createPayable(payable: Payable): Promise<void> {
        const db = await getDB();
        await db.runAsync(
            'INSERT INTO payables (id, fornecedor, descricao, valor, vencimento, status, paidAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [payable.id, payable.fornecedor, payable.descricao, payable.valor, payable.vencimento, payable.status, payable.paidAt ?? null]
        );
    },

    async updatePayable(payable: Payable): Promise<void> {
        const db = await getDB();
        await db.runAsync(
            'UPDATE payables SET fornecedor = ?, descricao = ?, valor = ?, vencimento = ?, status = ?, paidAt = ? WHERE id = ?',
            [payable.fornecedor, payable.descricao, payable.valor, payable.vencimento, payable.status, payable.paidAt ?? null, payable.id]
        );
    },

    async removePayable(id: string): Promise<void> {
        const db = await getDB();
        await db.runAsync('DELETE FROM payables WHERE id = ?', [id]);
    },

    async getAllPayables(): Promise<Payable[]> {
        const db = await getDB();
        return await db.getAllAsync<Payable>('SELECT * FROM payables');
    }
};
