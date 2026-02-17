import { getDB } from './db';

export const BrandRepository = {
    async add(name: string): Promise<void> {
        const db = await getDB();
        await db.runAsync('INSERT OR IGNORE INTO brands (name) VALUES (?)', [name]);
    },

    async getAll(): Promise<string[]> {
        const db = await getDB();
        const result = await db.getAllAsync<{ name: string }>('SELECT name FROM brands');
        return result.map(r => r.name);
    },

    async remove(name: string): Promise<void> {
        const db = await getDB();
        await db.runAsync('DELETE FROM brands WHERE name = ?', [name]);
    },

    async update(oldName: string, newName: string): Promise<void> {
        const db = await getDB();
        await db.withTransactionAsync(async () => {
             await db.runAsync('UPDATE brands SET name = ? WHERE name = ?', [newName, oldName]);
             // Also update products that use this brand
             await db.runAsync('UPDATE products SET marca = ? WHERE marca = ?', [newName, oldName]);
         });
    }
};
