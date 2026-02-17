import { getDB } from './db';

export const CategoryRepository = {
    async add(name: string): Promise<void> {
        const db = await getDB();
        await db.runAsync('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name]);
    },

    async getAll(): Promise<string[]> {
        const db = await getDB();
        const result = await db.getAllAsync<{ name: string }>('SELECT name FROM categories');
        return result.map(r => r.name);
    },
    
    async remove(name: string): Promise<void> {
        const db = await getDB();
        await db.runAsync('DELETE FROM categories WHERE name = ?', [name]);
    },

    async update(oldName: string, newName: string): Promise<void> {
        const db = await getDB();
         await db.withTransactionAsync(async () => {
             await db.runAsync('UPDATE categories SET name = ? WHERE name = ?', [newName, oldName]);
             // Also update products that use this category
             await db.runAsync('UPDATE products SET categoria = ? WHERE categoria = ?', [newName, oldName]);
         });
    }
};
