/**
 * Database Configuration & Memory Store
 * Supports MySQL 8.0+ Connection Pooling with automatic resilient memory fallback.
 */

let mysql = null;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  // mysql2 optional fallback
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bankvault_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
let isMySqlActive = false;

// Initial relational dataset matching schema.sql
const store = {
  users: [
    { user_id: 1, full_name: 'David Miller', email: 'david@bankvault.com', phone: '+1 415 892 0192', role: 'customer' }
  ],
  accounts: [
    { account_id: 1, user_id: 1, institution: 'Chase Private Client', account_no: 'CH-892019481', account_type: 'checking', balance: 8429.00, currency: 'USD', status: 'active', is_primary: true },
    { account_id: 2, user_id: 1, institution: 'HDFC Imperia', account_no: 'HD-901928374', account_type: 'savings', balance: 14250.00, currency: 'USD', status: 'active', is_primary: false }
  ],
  transactions: [
    { tx_id: 1, tx_ref: 'TX-101', account_no: 'CH-892019481', title: 'Food & Dining', category: 'Food', amount: -12.00, payment_type: 'Card', merchant: 'Blue Bottle Coffee', created_at: 'Mar 07, 2026' },
    { tx_id: 2, tx_ref: 'TX-102', account_no: 'CH-892019481', title: 'Direct Deposit', category: 'Salary', amount: 6800.00, payment_type: 'Bank Account', merchant: 'Stripe Payroll Inc', created_at: 'Mar 07, 2026' },
    { tx_id: 3, tx_ref: 'TX-103', account_no: 'CH-892019481', title: 'Entertainment', category: 'Entertainment', amount: -8.00, payment_type: 'Card', merchant: 'Apple One Subscription', created_at: 'Mar 07, 2026' },
    { tx_id: 4, tx_ref: 'TX-104', account_no: 'CH-892019481', title: 'Grocery Market', category: 'Food', amount: -45.50, payment_type: 'Cash', merchant: 'Whole Foods Market', created_at: 'Mar 06, 2026' },
    { tx_id: 5, tx_ref: 'TX-105', account_no: 'CH-892019481', title: 'Nordstrom Shopping', category: 'Shopping', amount: -120.00, payment_type: 'Card', merchant: 'Nordstrom Store #402', created_at: 'Mar 05, 2026' }
  ],
  audit_logs: [
    { log_id: 1, actor: 'System', action: 'BOOT', details: 'Vault Expense Architecture initialized with 2 linked institutions.', timestamp: new Date().toISOString() }
  ]
};

async function initDatabase() {
  if (!mysql) {
    isMySqlActive = false;
    console.log('! Running on ultra-fast synchronized memory engine.');
    return;
  }
  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isMySqlActive = true;
    console.log('✓ Connected to MySQL database.');
  } catch (err) {
    isMySqlActive = false;
    console.log('! MySQL offline. Running on synchronized memory relational engine.');
  }
}

module.exports = {
  pool,
  isMySqlActive: () => isMySqlActive,
  store,
  initDatabase
};
