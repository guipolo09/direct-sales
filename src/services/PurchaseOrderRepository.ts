import { getDB } from './db';
import { PurchaseOrder, PurchaseOrderItem } from '../types/models';

export const PurchaseOrderRepository = {
  async getPendingItems(): Promise<PurchaseOrderItem[]> {
    const db = await getDB();
    return await db.getAllAsync<PurchaseOrderItem>(
      'SELECT * FROM purchase_order_items ORDER BY rowid ASC'
    );
  },

  async addPendingItem(item: PurchaseOrderItem): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      'INSERT INTO purchase_order_items (id, nome, codigo, quantidade) VALUES (?, ?, ?, ?)',
      [item.id, item.nome, item.codigo, item.quantidade]
    );
  },

  async updatePendingItemQty(id: string, quantidade: number): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      'UPDATE purchase_order_items SET quantidade = ? WHERE id = ?',
      [quantidade, id]
    );
  },

  async updatePendingItem(id: string, nome: string, codigo: string): Promise<void> {
    const db = await getDB();
    await db.runAsync(
      'UPDATE purchase_order_items SET nome = ?, codigo = ? WHERE id = ?',
      [nome, codigo, id]
    );
  },

  async deletePendingItem(id: string): Promise<void> {
    const db = await getDB();
    await db.runAsync('DELETE FROM purchase_order_items WHERE id = ?', [id]);
  },

  async getAllOrders(): Promise<PurchaseOrder[]> {
    const db = await getDB();
    const orders = await db.getAllAsync<{ id: string; data: string }>(
      'SELECT * FROM purchase_orders ORDER BY data DESC'
    );
    const result: PurchaseOrder[] = [];
    for (const order of orders) {
      const itens = await db.getAllAsync<PurchaseOrderItem>(
        'SELECT * FROM purchase_order_line_items WHERE orderId = ?',
        [order.id]
      );
      result.push({ ...order, itens });
    }
    return result;
  },

  async deleteOrder(id: string): Promise<void> {
    const db = await getDB();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM purchase_order_line_items WHERE orderId = ?', [id]);
      await db.runAsync('DELETE FROM purchase_orders WHERE id = ?', [id]);
    });
  },

  async finalizeOrder(
    order: PurchaseOrder,
    itemIdsToRemove: string[]
  ): Promise<void> {
    const db = await getDB();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT INTO purchase_orders (id, data) VALUES (?, ?)',
        [order.id, order.data]
      );
      for (const item of order.itens) {
        await db.runAsync(
          'INSERT INTO purchase_order_line_items (id, orderId, nome, codigo, quantidade) VALUES (?, ?, ?, ?, ?)',
          [item.id, order.id, item.nome, item.codigo, item.quantidade]
        );
      }
      for (const itemId of itemIdsToRemove) {
        await db.runAsync(
          'DELETE FROM purchase_order_items WHERE id = ?',
          [itemId]
        );
      }
    });
  },
};
