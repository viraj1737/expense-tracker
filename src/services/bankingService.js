/**
 * Banking & Financial Core Service
 * Encapsulates ACID transaction execution, calculation formulas, real bank linking, and CSV statement parsing.
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
    const primaryAccount = store.accounts[0] || { currency: '₹' };

    return {
      income,
      spent,
      totalLiquidity,
      currency: primaryAccount.currency || '₹',
      netSavings: income - spent,
      savingsRate: income > 0 ? Math.round(((income - spent) / income) * 100) : 0,
      activeAccounts: store.accounts.length
    };
  }

  // Get current user profile
  static getUserProfile() {
    return {
      user: store.users[0],
      accounts: store.accounts
    };
  }

  // Set up user's real bank account details
  static setupRealAccount({ full_name = 'Viraj Kumar', bank_name = 'HDFC Bank', account_no = '501002948192', initial_balance = 50000.00, currency = '₹' }) {
    // 1. Update user identity
    if (store.users.length > 0) {
      store.users[0].full_name = full_name;
    }

    const bal = parseFloat(initial_balance) || 0;

    // 2. Configure primary real account
    const cleanAccountNo = account_no.replace(/\s+/g, '');
    const realAccount = {
      account_id: 1,
      user_id: 1,
      institution: bank_name,
      account_no: cleanAccountNo,
      account_type: 'savings',
      balance: bal,
      currency: currency || '₹',
      status: 'active',
      is_primary: true
    };

    store.accounts[0] = realAccount;

    // 3. Clear mock data and initialize with real opening balance
    store.transactions = [
      {
        tx_id: 1,
        tx_ref: 'TX-OPEN-' + Math.floor(1000 + Math.random() * 9000),
        account_no: cleanAccountNo,
        title: 'Opening Bank Balance',
        category: 'Salary',
        amount: bal,
        payment_type: 'Bank Transfer',
        merchant: `${bank_name} Real Account Sync`,
        created_at: 'Today'
      }
    ];

    return {
      user: store.users[0],
      account: realAccount,
      transactions: store.transactions
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

  // Auto-categorize merchant to Apple HIG icons & tags
  static categorizeMerchant(merchantName = '') {
    const m = (merchantName || '').toLowerCase();
    if (/swiggy|zomato|starbucks|mcdonald|kfc|burger|pizza|domino|cafe|coffee|chai|tea|blinkit|zepto|instamart|bigbasket|grofers|restaurant|dining|food|bakery|dunkin|haldiram|subway|biryani/i.test(m)) {
      return 'Food';
    }
    if (/uber|ola|rapido|metro|petrol|fuel|diesel|indian oil|bpcl|hpcl|shell|toll|fastag|irctc|flight|air|train|indigo|spicejet|vistara|travel|redbus/i.test(m)) {
      return 'Travel';
    }
    if (/amazon|flipkart|myntra|ajio|zara|h&m|uniqlo|apple|croma|reliance|mall|shopping|retail|store|dmart|nykaa|tata cliq/i.test(m)) {
      return 'Shopping';
    }
    if (/netflix|spotify|prime|hotstar|bookmyshow|pvr|inox|movie|cinema|youtube|gaming|steam|playstation|disney|entertainment/i.test(m)) {
      return 'Entertainment';
    }
    if (/salary|payroll|wage|dividend|interest credit|cashback|refund|credited|income/i.test(m)) {
      return 'Salary';
    }
    return 'Transfer';
  }

  // Smart Parser for Bank Statements & UPI Export text (CSV, TSV, Pipe, or Narration)
  static parseRawStatementText(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const items = [];

    for (const line of lines) {
      if (/^(date|tx|transaction|timestamp|merchant|description|narration)/i.test(line)) {
        continue;
      }

      let parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 2) parts = line.split('\t').map(s => s.trim());
      if (parts.length < 2) parts = line.split('|').map(s => s.trim());

      let date = 'Today';
      let merchant = 'Payment';
      let category = '';
      let amount = 0;
      let payment_type = 'UPI';

      if (parts.length >= 4) {
        date = parts[0];
        merchant = parts[1];
        category = parts[2];
        amount = parseFloat(parts[3].replace(/[^0-9.-]/g, ''));
      } else if (parts.length === 3) {
        const maybeAmt = parseFloat(parts[2].replace(/[^0-9.-]/g, ''));
        if (!isNaN(maybeAmt)) {
          date = parts[0];
          merchant = parts[1];
          amount = maybeAmt;
        } else {
          merchant = parts[0];
          category = parts[1];
          amount = parseFloat(parts[2].replace(/[^0-9.-]/g, ''));
        }
      } else if (parts.length === 2) {
        merchant = parts[0];
        amount = parseFloat(parts[1].replace(/[^0-9.-]/g, ''));
      }

      if (isNaN(amount) || amount === 0) continue;

      if (!category) {
        category = this.categorizeMerchant(merchant);
      }

      // If it's an expense and positive without a credit tag, make it negative
      if (category !== 'Salary' && amount > 0 && !line.includes('+') && !/cr|credit/i.test(line)) {
        amount = -Math.abs(amount);
      }

      items.push({
        date,
        merchant,
        category,
        amount,
        payment_type
      });
    }

    return items;
  }

  // Bulk Import Statement (CSV or array of transactions)
  static importStatement(itemsOrRaw) {
    let items = itemsOrRaw;
    if (typeof itemsOrRaw === 'string') {
      items = this.parseRawStatementText(itemsOrRaw);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('No valid transaction items could be parsed from the statement.');
    }

    const acc = store.accounts[0];
    let count = 0;

    items.forEach(item => {
      let amt = parseFloat(item.amount);
      if (!isNaN(amt)) {
        const cat = item.category || this.categorizeMerchant(item.merchant);
        if (cat !== 'Salary' && amt > 0 && !item.isCredit) {
          amt = -Math.abs(amt);
        }
        acc.balance += amt;
        store.transactions.unshift({
          tx_id: store.transactions.length + 1,
          tx_ref: 'TX-IMP-' + Math.floor(1000 + Math.random() * 9000),
          account_no: acc.account_no,
          title: cat,
          category: cat,
          amount: amt,
          payment_type: item.payment_type || 'UPI',
          merchant: item.merchant || 'Statement Entry',
          created_at: item.date || 'Today'
        });
        count++;
      }
    });

    return { importedCount: count, newBalance: acc.balance };
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
      currency: store.accounts[0]?.currency || '₹',
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
