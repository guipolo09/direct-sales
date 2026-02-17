import { getDB } from './db';
import { Sale, SaleItem } from '../types/models';

export const SaleRepository = {
    async create(sale: Sale): Promise<void> {
        const db = await getDB();
        
        await db.withTransactionAsync(async () => {
            await db.runAsync(
                'INSERT INTO sales (id, customerId, total, valorEntrada, data, formaPagamento) VALUES (?, ?, ?, ?, ?, ?)',
                [sale.id, sale.customerId, sale.total, sale.valorEntrada, sale.data, sale.formaPagamento]
            );

            for (const item of sale.itens) {
                await db.runAsync(
                    'INSERT INTO sale_items (saleId, productId, quantidade, valorUnitario) VALUES (?, ?, ?, ?)',
                    [sale.id, item.productId, item.quantidade, item.valorUnitario]
                );
            }
        });
    },

    async getAll(): Promise<Sale[]> {
        const db = await getDB();
        const sales = await db.getAllAsync<Sale>('SELECT * FROM sales');
        
        for (const sale of sales) {
             sale.itens = await db.getAllAsync<SaleItem>('SELECT productId, quantidade, valorUnitario FROM sale_items WHERE saleId = ?', [sale.id]);
        }
        return sales;
    },

    async getById(id: string): Promise<Sale | null> {
        const db = await getDB();
        const sale = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
        if (!sale) return null;
        
        sale.itens = await db.getAllAsync<SaleItem>('SELECT productId, quantidade, valorUnitario FROM sale_items WHERE saleId = ?', [sale.id]);
        return sale;
    }
};
