import * as SQLite from 'expo-sqlite';

const dbName = 'salesStore_v2.db';

let _db: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync(dbName);
  }
  return _db;
};

export const initDB = async () => {
    const db = await getDB();

    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    await db.execAsync(`PRAGMA foreign_keys = ON;`);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        categoria TEXT NOT NULL,
        marca TEXT NOT NULL,
        estoqueAtual INTEGER NOT NULL DEFAULT 0,
        estoqueMinimo INTEGER NOT NULL DEFAULT 0,
        precoVenda REAL NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS kit_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kitId TEXT NOT NULL,
        productId TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        FOREIGN KEY (kitId) REFERENCES products(id),
        FOREIGN KEY (productId) REFERENCES products(id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        telefone TEXT,
        status TEXT,
        createdAt TEXT,
        observacoes TEXT
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        customerId TEXT,
        total REAL NOT NULL,
        valorEntrada REAL DEFAULT 0,
        data TEXT NOT NULL,
        formaPagamento TEXT,
        FOREIGN KEY (customerId) REFERENCES customers(id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        saleId TEXT NOT NULL,
        productId TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        valorUnitario REAL NOT NULL,
        FOREIGN KEY (saleId) REFERENCES sales(id),
        FOREIGN KEY (productId) REFERENCES products(id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stock_moves (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        tipo TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        data TEXT NOT NULL,
        origem TEXT,
        FOREIGN KEY (productId) REFERENCES products(id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS receivables (
        id TEXT PRIMARY KEY,
        customerId TEXT NOT NULL,
        descricao TEXT,
        valor REAL NOT NULL,
        vencimento TEXT NOT NULL,
        status TEXT NOT NULL,
        paidAt TEXT,
        FOREIGN KEY (customerId) REFERENCES customers(id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payables (
        id TEXT PRIMARY KEY,
        fornecedor TEXT,
        descricao TEXT,
        valor REAL NOT NULL,
        vencimento TEXT NOT NULL,
        status TEXT NOT NULL,
        paidAt TEXT
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        name TEXT PRIMARY KEY
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS brands (
        name TEXT PRIMARY KEY
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        codigo TEXT NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 1
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS purchase_order_line_items (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        nome TEXT NOT NULL,
        codigo TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        FOREIGN KEY (orderId) REFERENCES purchase_orders(id)
      );
    `);

    console.log('Database v2 initialized successfully');
};
