import { getDB } from './db';

export interface Supplier {
    id?: number;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
}

export const SupplierRepository = {
    async create(supplier: Supplier): Promise<number> {
        const db = await getDB();
        const result = await db.runAsync(
            'INSERT INTO suppliers (name, contactName, phone, email) VALUES (?, ?, ?, ?)',
            [supplier.name, supplier.contactName ?? null, supplier.phone ?? null, supplier.email ?? null]
        );
        return result.lastInsertRowId;
    },

    async update(supplier: Supplier): Promise<void> {
        const db = await getDB();
        await db.runAsync(
            'UPDATE suppliers SET name = ?, contactName = ?, phone = ?, email = ? WHERE id = ?',
            [supplier.name, supplier.contactName ?? null, supplier.phone ?? null, supplier.email ?? null, supplier.id!]
        );
    },

    async delete(id: number): Promise<void> {
        const db = await getDB();
        await db.runAsync('DELETE FROM suppliers WHERE id = ?', [id]);
    },

    async getAll(): Promise<Supplier[]> {
        const db = await getDB();
        return await db.getAllAsync<Supplier>('SELECT * FROM suppliers');
    },

    async getById(id: number): Promise<Supplier | null> {
        const db = await getDB();
        return await db.getFirstAsync<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id]);
    }
};
