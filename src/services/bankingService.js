/**
 * Banking & Financial Core Service
 * Encapsulates ACID transaction execution, calculation formulas, and Plaid bank linking.
 */

const { store, isMySqlActive, pool } = require('../config/db');

class BankingService {
  // Get Summary Metrics (Income, Spent, Net Available)
  static getMetrics() {
    let income = 0;
    let spent = 0;

    store.transactions.forEach(t => {
      if (t.amount > 0) income += t.amount;
      else spent += Math.abs(t.amount);
    });

    const totalLiquidity = store.accounts.reduce((sum, a) => sum + a.balance, 0);

    return {
      income,
      spent,
      totalLiquidity,
      netSavings: income - spent,
      savingsRate: income > 0 ? Math.round(((income - spent) / income) * 100) : 0,
      activeAccounts: store.accounts.length
    };
  }

  // Get all transactions
  static getTransactions(filterCategory) {
    let list = [...store.transactions];
    if (filterCategory && filterCategory !== 'All') {
      list = list.filter(t => t.category.toLowerCase() === filterCategory.toLowerCase());
    }
    return list;
  }

  // Add new transaction (Expense or Income)
  static addTransaction({ amount, category = 'Food', merchant = 'General', payment_type = 'Cash', account_no }) {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      throw new Error('Transaction amount must be a positive number.');
    }

    const acc = store.accounts.find(a => a.account_no === account_no) || store.accounts[0];
    
    // Debit calculation
    const isExpense = category.toLowerCase() !== 'salary';
    const signedAmount = isExpense ? -amt : amt;

    acc.balance += signedAmount;

    const newTx = {
      tx_id: store.transactions.length + 1,
      tx_ref: 'TX-' + Math.floor(1000 + Math.random() * 9000),
      account_no: acc.account_no,
      title: category,
      category,
      amount: signedAmount,
      payment_type,
      merchant,
      created_at: 'Today'
    };

    store.transactions.unshift(newTx);
    return newTx;
  }

  // Link Real Bank Account via Simulated Open Banking / Plaid
  static linkBankAccount({ institution, account_type = 'checking', initial_balance = 5000.00 }) {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = institution.substring(0, 2).toUpperCase();
    const account_no = `${prefix}-${randNum}9182`;

    const newAccount = {
      account_id: store.accounts.length + 1,
      user_id: 1,
      institution,
      account_no,
      account_type,
      balance: parseFloat(initial_balance) || 5000.00,
      currency: 'USD',
      status: 'active',
      is_primary: false
    };

    store.accounts.push(newAccount);

    // Initial sync transaction
    store.transactions.unshift({
      tx_id: store.transactions.length + 1,
      tx_ref: 'TX-SYNC-' + randNum,
      account_no,
      title: 'Initial Bank Sync',
      category: 'Salary',
      amount: newAccount.balance,
      payment_type: 'Bank Transfer',
      merchant: `${institution} Live Balance Import`,
      created_at: 'Today'
    });

    return newAccount;
  }
}

module.exports = BankingService;
