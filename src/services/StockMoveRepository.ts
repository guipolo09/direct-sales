import { getDB } from './db';
import { StockMove } from '../types/models';

export const StockMoveRepository = {
    async create(move: StockMove): Promise<void> {
        const db = await getDB();
        await db.runAsync(
            'INSERT INTO stock_moves (id, productId, tipo, quantidade, data, origem) VALUES (?, ?, ?, ?, ?, ?)',
            [move.id, move.productId, move.tipo, move.quantidade, move.data, move.origem]
        );
    },

    async createBatch(moves: StockMove[]): Promise<void> {
        const db = await getDB();
        await db.withTransactionAsync(async () => {
             for (const move of moves) {
                await db.runAsync(
                    'INSERT INTO stock_moves (id, productId, tipo, quantidade, data, origem) VALUES (?, ?, ?, ?, ?, ?)',
                    [move.id, move.productId, move.tipo, move.quantidade, move.data, move.origem]
                );
             }
        });
    },

    async getAll(): Promise<StockMove[]> {
        const db = await getDB();
        return await db.getAllAsync<StockMove>('SELECT * FROM stock_moves');
    }
};
