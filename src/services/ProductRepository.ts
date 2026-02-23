import { getDB } from './db';
import { Product } from '../types/models';

export const ProductRepository = {
    async create(product: Product): Promise<void> {
        const db = await getDB();
        await db.withTransactionAsync(async () => {
            await db.runAsync(
                'INSERT INTO products (id, nome, tipo, categoria, marca, estoqueAtual, estoqueMinimo, precoVenda, tempoMedioConsumo, codigoBarras) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [product.id, product.nome, product.tipo, product.categoria, product.marca, product.estoqueAtual, product.estoqueMinimo, product.precoVenda, product.tempoMedioConsumo ?? null, product.codigoBarras ?? null]
            );

            if (product.kitItens && product.kitItens.length > 0) {
                for (const item of product.kitItens) {
                    await db.runAsync(
                        'INSERT INTO kit_items (kitId, productId, quantidade) VALUES (?, ?, ?)',
                        [product.id, item.productId, item.quantidade]
                    );
                }
            }
        });
    },

    async update(product: Product): Promise<void> {
        const db = await getDB();
        await db.withTransactionAsync(async () => {
            await db.runAsync(
                'UPDATE products SET nome = ?, tipo = ?, categoria = ?, marca = ?, estoqueAtual = ?, estoqueMinimo = ?, precoVenda = ?, tempoMedioConsumo = ?, codigoBarras = ? WHERE id = ?',
                [product.nome, product.tipo, product.categoria, product.marca, product.estoqueAtual, product.estoqueMinimo, product.precoVenda, product.tempoMedioConsumo ?? null, product.codigoBarras ?? null, product.id]
            );

            // Update kit items if needed (delete all and recreate is easiest for now)
            if (product.tipo === 'kit') {
                await db.runAsync('DELETE FROM kit_items WHERE kitId = ?', [product.id]);
                if (product.kitItens && product.kitItens.length > 0) {
                    for (const item of product.kitItens) {
                         await db.runAsync(
                            'INSERT INTO kit_items (kitId, productId, quantidade) VALUES (?, ?, ?)',
                            [product.id, item.productId, item.quantidade]
                        );
                    }
                }
            }
        });
    },

    async delete(id: string): Promise<void> {
        const db = await getDB();
        await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
    },

    async getAll(): Promise<Product[]> {
        const db = await getDB();
        const products = await db.getAllAsync<Product>('SELECT * FROM products');

        for (const product of products) {
            if (product.tipo === 'kit') {
                product.kitItens = await db.getAllAsync<{ productId: string; quantidade: number }>(
                    'SELECT productId, quantidade FROM kit_items WHERE kitId = ?',
                    [product.id]
                );
            }
        }
        return products;
    },

    async getById(id: string): Promise<Product | null> {
        const db = await getDB();
        const product = await db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', [id]);
        if (!product) return null;

        if (product.tipo === 'kit') {
             product.kitItens = await db.getAllAsync<{ productId: string; quantidade: number }>(
                'SELECT productId, quantidade FROM kit_items WHERE kitId = ?',
                [product.id]
            );
        }
        return product;
    },

    async getByBarcode(codigoBarras: string): Promise<Product | null> {
        const db = await getDB();
        const product = await db.getFirstAsync<Product>(
            'SELECT * FROM products WHERE codigoBarras = ?',
            [codigoBarras]
        );
        if (!product) return null;

        if (product.tipo === 'kit') {
            product.kitItens = await db.getAllAsync<{ productId: string; quantidade: number }>(
                'SELECT productId, quantidade FROM kit_items WHERE kitId = ?',
                [product.id]
            );
        }
        return product;
    },

    // Helper to update stock specifically (more efficient than full update)
    async updateStock(id: string, newQuantity: number): Promise<void> {
        const db = await getDB();
         await db.runAsync(
            'UPDATE products SET estoqueAtual = ? WHERE id = ?',
            [newQuantity, id]
        );
    }
};
