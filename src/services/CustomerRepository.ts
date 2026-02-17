import { getDB } from './db';
import { Customer } from '../types/models';

export const CustomerRepository = {
    async create(customer: Customer): Promise<void> {
        const db = await getDB();
        await db.runAsync(
            'INSERT INTO customers (id, nome, telefone, status, createdAt, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
            [customer.id, customer.nome, customer.telefone, customer.status, customer.createdAt, customer.observacoes ?? null]
        );
    },

    async update(customer: Customer): Promise<void> {
        const db = await getDB();
        await db.runAsync(
            'UPDATE customers SET nome = ?, telefone = ?, status = ?, observacoes = ? WHERE id = ?',
            [customer.nome, customer.telefone, customer.status, customer.observacoes ?? null, customer.id]
        );
    },

    async delete(id: string): Promise<void> {
        const db = await getDB();
        await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
    },

    async getAll(): Promise<Customer[]> {
        const db = await getDB();
        return await db.getAllAsync<Customer>('SELECT * FROM customers');
    },

    async getById(id: string): Promise<Customer | null> {
        const db = await getDB();
        return await db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
    }
};
