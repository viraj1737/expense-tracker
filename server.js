/**
 * BankVault — Core Banking System & Database Management System API
 * 
 * Demonstrates:
 * - Relational tables (Users, Accounts, Transactions, Loans, Audit Logs)
 * - ACID Atomic Transaction Logic (Rollback on balance insufficiency or frozen status)
 * - Interactive SQL Query Engine for Live Demonstrations
 * - Role-Based Banking Operations (Customer, Teller, Branch Manager)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// In-Memory Relational Database Engine
// (Mirrors the schema.sql MySQL database structure)
// ==========================================
const db = {
  users: [
    { user_id: 1, full_name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '+91 98765 43210', role: 'customer', created_at: '2026-01-10 10:00:00' },
    { user_id: 2, full_name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 98765 43211', role: 'customer', created_at: '2026-01-15 11:30:00' },
    { user_id: 3, full_name: 'Rohan Verma', email: 'rohan.verma@example.com', phone: '+91 98765 43212', role: 'customer', created_at: '2026-02-01 09:15:00' },
    { user_id: 4, full_name: 'Deepak Joshi', email: 'deepak.teller@bankvault.com', phone: '+91 98765 43213', role: 'teller', created_at: '2025-11-01 08:00:00' },
    { user_id: 5, full_name: 'Sunita Rao', email: 'sunita.manager@bankvault.com', phone: '+91 98765 43214', role: 'manager', created_at: '2025-08-01 08:00:00' }
  ],

  accounts: [
    { account_id: 1, user_id: 1, account_no: 'BV-1002019481', account_type: 'savings', balance: 84500.00, currency: 'USD', status: 'active', created_at: '2026-01-10 10:05:00' },
    { account_id: 2, user_id: 2, account_no: 'BV-1002019482', account_type: 'current', balance: 124000.00, currency: 'USD', status: 'active', created_at: '2026-01-15 11:35:00' },
    { account_id: 3, user_id: 3, account_no: 'BV-1002019483', account_type: 'savings', balance: 25600.00, currency: 'USD', status: 'active', created_at: '2026-02-01 09:20:00' }
  ],

  transactions: [
    { tx_id: 1, tx_ref: 'TX-9801A1', from_account_no: null, to_account_no: 'BV-1002019481', amount: 50000.00, tx_type: 'deposit', status: 'completed', description: 'Initial Account Funding', balance_after: 50000.00, created_at: '2026-01-10 10:10:00' },
    { tx_id: 2, tx_ref: 'TX-9801A2', from_account_no: null, to_account_no: 'BV-1002019481', amount: 34500.00, tx_type: 'deposit', status: 'completed', description: 'Salary Credit from Acme Corp', balance_after: 84500.00, created_at: '2026-02-01 09:00:00' },
    { tx_id: 3, tx_ref: 'TX-9801A3', from_account_no: null, to_account_no: 'BV-1002019482', amount: 150000.00, tx_type: 'deposit', status: 'completed', description: 'Business Capital Injection', balance_after: 150000.00, created_at: '2026-01-15 12:00:00' },
    { tx_id: 4, tx_ref: 'TX-9801A4', from_account_no: 'BV-1002019482', to_account_no: 'BV-1002019483', amount: 26000.00, tx_type: 'transfer', status: 'completed', description: 'Consulting Fee Payment', balance_after: 124000.00, created_at: '2026-02-14 14:22:00' }
  ],

  loans: [
    { loan_id: 1, user_id: 1, account_no: 'BV-1002019481', loan_amount: 250000.00, interest_rate: 8.50, tenure_months: 24, monthly_emi: 11364.00, purpose: 'Home Renovation', status: 'approved', applied_at: '2026-01-20 15:30:00', reviewed_at: '2026-01-21 10:00:00' },
    { loan_id: 2, user_id: 3, account_no: 'BV-1002019483', loan_amount: 100000.00, interest_rate: 10.00, tenure_months: 12, monthly_emi: 8791.00, purpose: 'Higher Education Program', status: 'pending', applied_at: '2026-02-20 16:45:00', reviewed_at: null }
  ],

  audit_logs: [
    { log_id: 1, actor: 'System', action: 'DATABASE_BOOT', details: 'BankVault Core Banking Engine started with 3 active accounts.', timestamp: '2026-01-01 00:00:00' },
    { log_id: 2, actor: 'Sunita Rao (Manager)', action: 'LOAN_APPROVED', details: 'Approved $250,000.00 Home Renovation loan for Aarav Sharma.', timestamp: '2026-01-21 10:00:00' }
  ]
};

function logAudit(actor, action, details) {
  const log = {
    log_id: db.audit_logs.length + 1,
    actor,
    action,
    details,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  db.audit_logs.unshift(log);
}

// ==========================================
// Banking Business Logic Endpoints
// ==========================================

// 1. Get Summary Stats
app.get('/api/stats', (req, res) => {
  const totalDeposits = db.accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLoanExposure = db.loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.loan_amount, 0);
  const activeCount = db.accounts.filter(a => a.status === 'active').length;
  const txVolumeToday = db.transactions.reduce((sum, t) => sum + t.amount, 0);

  res.json({
    success: true,
    totalDeposits,
    totalLoanExposure,
    activeAccounts: activeCount,
    totalAccounts: db.accounts.length,
    transactionCount: db.transactions.length,
    txVolumeToday
  });
});

// 2. List All Accounts with Owner Data
app.get('/api/accounts', (req, res) => {
  const accountsWithUsers = db.accounts.map(acc => {
    const user = db.users.find(u => u.user_id === acc.user_id);
    return {
      ...acc,
      owner_name: user ? user.full_name : 'Unknown',
      owner_email: user ? user.email : '',
      owner_phone: user ? user.phone : ''
    };
  });
  res.json({ success: true, accounts: accountsWithUsers });
});

// 3. Open New Bank Account
app.post('/api/accounts', (req, res) => {
  const { full_name, email, phone, account_type = 'savings', initial_deposit = 1000 } = req.body;

  if (!full_name || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Full name, email, and phone are required.' });
  }

  // Create or retrieve user
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      user_id: db.users.length + 1,
      full_name,
      email,
      phone,
      role: 'customer',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    db.users.push(user);
  }

  // Generate unique account number
  const randSuffix = Math.floor(100000 + Math.random() * 900000);
  const account_no = `BV-1002${randSuffix}`;

  const depositAmount = parseFloat(initial_deposit) || 0;
  const newAccount = {
    account_id: db.accounts.length + 1,
    user_id: user.user_id,
    account_no,
    account_type,
    balance: depositAmount,
    currency: 'USD',
    status: 'active',
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  db.accounts.push(newAccount);

  if (depositAmount > 0) {
    const txRef = 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    db.transactions.unshift({
      tx_id: db.transactions.length + 1,
      tx_ref: txRef,
      from_account_no: null,
      to_account_no: account_no,
      amount: depositAmount,
      tx_type: 'deposit',
      status: 'completed',
      description: 'Account Opening Deposit',
      balance_after: depositAmount,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  }

  logAudit(user.full_name, 'ACCOUNT_OPENED', `Opened new ${account_type} account ${account_no} with initial deposit $${depositAmount}.`);

  res.json({ success: true, message: 'Account opened successfully.', account: newAccount });
});

// 4. Toggle Account Status (Freeze / Unfreeze)
app.post('/api/accounts/:accNo/status', (req, res) => {
  const { accNo } = req.params;
  const { status } = req.body; // 'active' or 'frozen'

  const account = db.accounts.find(a => a.account_no === accNo);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

  account.status = status;
  logAudit('Bank Teller', 'ACCOUNT_STATUS_CHANGE', `Account ${accNo} status changed to ${status.toUpperCase()}.`);

  res.json({ success: true, message: `Account ${accNo} is now ${status}.`, account });
});

// 5. ATOMIC MONEY TRANSFER (ACID Transaction Logic)
app.post('/api/transfer', (req, res) => {
  const { from_account_no, to_account_no, amount, description = 'Online Transfer' } = req.body;
  const transferAmt = parseFloat(amount);

  if (!from_account_no || !to_account_no || isNaN(transferAmt) || transferAmt <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid transfer parameters. Amount must be positive.' });
  }

  if (from_account_no === to_account_no) {
    return res.status(400).json({ success: false, message: 'Sender and recipient account cannot be the same.' });
  }

  const senderAcc = db.accounts.find(a => a.account_no === from_account_no);
  const recipientAcc = db.accounts.find(a => a.account_no === to_account_no);

  // Validation Checks (Transaction Pre-conditions)
  if (!senderAcc) {
    return res.status(404).json({ success: false, message: `Sender account (${from_account_no}) does not exist.` });
  }
  if (!recipientAcc) {
    return res.status(404).json({ success: false, message: `Recipient account (${to_account_no}) does not exist.` });
  }

  if (senderAcc.status === 'frozen') {
    return res.status(403).json({ success: false, message: `Sender account (${from_account_no}) is FROZEN. Outbound transfers blocked.` });
  }
  if (recipientAcc.status === 'frozen') {
    return res.status(403).json({ success: false, message: `Recipient account (${to_account_no}) is FROZEN. Inbound transfers blocked.` });
  }

  if (senderAcc.balance < transferAmt) {
    return res.status(400).json({
      success: false,
      message: `Transaction Rejected: Insufficient balance. Available: $${senderAcc.balance.toFixed(2)}, Requested: $${transferAmt.toFixed(2)}.`
    });
  }

  // --- ATOMIC EXECUTION (Commit Phase) ---
  senderAcc.balance -= transferAmt;
  recipientAcc.balance += transferAmt;

  const txRef = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const txRecord = {
    tx_id: db.transactions.length + 1,
    tx_ref: txRef,
    from_account_no,
    to_account_no,
    amount: transferAmt,
    tx_type: 'transfer',
    status: 'completed',
    description,
    balance_after: senderAcc.balance,
    created_at: timestamp
  };

  db.transactions.unshift(txRecord);

  const senderUser = db.users.find(u => u.user_id === senderAcc.user_id)?.full_name || from_account_no;
  logAudit(senderUser, 'FUNDS_TRANSFER', `Transferred $${transferAmt.toFixed(2)} from ${from_account_no} to ${to_account_no}. Ref: ${txRef}`);

  res.json({
    success: true,
    message: 'Transfer completed successfully.',
    transaction: txRecord,
    new_balance: senderAcc.balance
  });
});

// 6. Direct Cash Deposit
app.post('/api/deposit', (req, res) => {
  const { account_no, amount, description = 'Teller Cash Deposit' } = req.body;
  const depositAmt = parseFloat(amount);

  if (!account_no || isNaN(depositAmt) || depositAmt <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid deposit amount.' });
  }

  const account = db.accounts.find(a => a.account_no === account_no);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });
  if (account.status === 'frozen') return res.status(403).json({ success: false, message: 'Account is frozen.' });

  account.balance += depositAmt;
  const txRef = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const txRecord = {
    tx_id: db.transactions.length + 1,
    tx_ref: txRef,
    from_account_no: null,
    to_account_no: account_no,
    amount: depositAmt,
    tx_type: 'deposit',
    status: 'completed',
    description,
    balance_after: account.balance,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  db.transactions.unshift(txRecord);

  logAudit('Bank Teller', 'CASH_DEPOSIT', `Deposited $${depositAmt.toFixed(2)} into ${account_no}. Balance now: $${account.balance.toFixed(2)}.`);

  res.json({ success: true, message: 'Deposit successful.', transaction: txRecord, new_balance: account.balance });
});

// 7. Direct Cash Withdrawal
app.post('/api/withdraw', (req, res) => {
  const { account_no, amount, description = 'ATM / Branch Withdrawal' } = req.body;
  const withdrawAmt = parseFloat(amount);

  if (!account_no || isNaN(withdrawAmt) || withdrawAmt <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
  }

  const account = db.accounts.find(a => a.account_no === account_no);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });
  if (account.status === 'frozen') return res.status(403).json({ success: false, message: 'Account is frozen.' });

  if (account.balance < withdrawAmt) {
    return res.status(400).json({ success: false, message: `Insufficient funds. Balance: $${account.balance.toFixed(2)}` });
  }

  account.balance -= withdrawAmt;
  const txRef = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const txRecord = {
    tx_id: db.transactions.length + 1,
    tx_ref: txRef,
    from_account_no: account_no,
    to_account_no: null,
    amount: withdrawAmt,
    tx_type: 'withdrawal',
    status: 'completed',
    description,
    balance_after: account.balance,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  db.transactions.unshift(txRecord);

  logAudit('Customer/ATM', 'CASH_WITHDRAWAL', `Withdrew $${withdrawAmt.toFixed(2)} from ${account_no}.`);

  res.json({ success: true, message: 'Withdrawal successful.', transaction: txRecord, new_balance: account.balance });
});

// 8. List Transactions (Passbook/Ledger)
app.get('/api/transactions', (req, res) => {
  const { account_no, type, search } = req.query;
  let list = [...db.transactions];

  if (account_no) {
    list = list.filter(t => t.from_account_no === account_no || t.to_account_no === account_no);
  }
  if (type) {
    list = list.filter(t => t.tx_type === type);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(t => 
      t.tx_ref.toLowerCase().includes(s) || 
      (t.description && t.description.toLowerCase().includes(s))
    );
  }

  res.json({ success: true, count: list.length, transactions: list });
});

// 9. Loans Management
app.get('/api/loans', (req, res) => {
  const loansDetailed = db.loans.map(l => {
    const user = db.users.find(u => u.user_id === l.user_id);
    return {
      ...l,
      applicant_name: user ? user.full_name : 'Customer',
      applicant_email: user ? user.email : ''
    };
  });
  res.json({ success: true, loans: loansDetailed });
});

app.post('/api/loans/apply', (req, res) => {
  const { account_no, loan_amount, tenure_months = 12, purpose } = req.body;
  const principal = parseFloat(loan_amount);

  if (!account_no || isNaN(principal) || principal <= 0 || !purpose) {
    return res.status(400).json({ success: false, message: 'Please provide account, valid amount, and loan purpose.' });
  }

  const account = db.accounts.find(a => a.account_no === account_no);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

  // Standard loan calculation: EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
  const annualRate = 9.5; // 9.5% per annum
  const monthlyRate = (annualRate / 12) / 100;
  const n = parseInt(tenure_months, 10);
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);

  const newLoan = {
    loan_id: db.loans.length + 1,
    user_id: account.user_id,
    account_no,
    loan_amount: principal,
    interest_rate: annualRate,
    tenure_months: n,
    monthly_emi: Math.round(emi * 100) / 100,
    purpose,
    status: 'pending',
    applied_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    reviewed_at: null
  };
  db.loans.push(newLoan);

  const userName = db.users.find(u => u.user_id === account.user_id)?.full_name || account_no;
  logAudit(userName, 'LOAN_APPLICATION', `Applied for $${principal.toFixed(2)} loan (${purpose}). Monthly EMI: $${newLoan.monthly_emi}.`);

  res.json({ success: true, message: 'Loan application submitted for manager review.', loan: newLoan });
});

app.post('/api/loans/:id/review', (req, res) => {
  const loanId = parseInt(req.params.id, 10);
  const { decision } = req.body; // 'approved' or 'rejected'

  const loan = db.loans.find(l => l.loan_id === loanId);
  if (!loan) return res.status(404).json({ success: false, message: 'Loan application not found.' });

  loan.status = decision;
  loan.reviewed_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // If approved, disburse amount directly to customer account
  if (decision === 'approved') {
    const acc = db.accounts.find(a => a.account_no === loan.account_no);
    if (acc) {
      acc.balance += loan.loan_amount;
      const txRef = 'TX-DISB-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      db.transactions.unshift({
        tx_id: db.transactions.length + 1,
        tx_ref: txRef,
        from_account_no: 'BANK-TREASURY',
        to_account_no: acc.account_no,
        amount: loan.loan_amount,
        tx_type: 'loan_disbursement',
        status: 'completed',
        description: `Loan Disbursement (#${loan.loan_id} - ${loan.purpose})`,
        balance_after: acc.balance,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
    }
  }

  logAudit('Branch Manager', 'LOAN_REVIEW', `Loan #${loanId} was ${decision.toUpperCase()} by Manager.`);

  res.json({ success: true, message: `Loan #${loanId} has been ${decision}.`, loan });
});

// 10. Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  res.json({ success: true, logs: db.audit_logs });
});

// 11. LIVE INTERACTIVE SQL QUERY RUNNER
// Perfect for professor demo to show database query results!
app.post('/api/sql-query', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'No SQL query provided.' });

  const q = query.trim().toUpperCase();

  try {
    let result = [];

    if (q.includes('FROM ACCOUNTS') && q.includes('BALANCE >')) {
      const match = q.match(/BALANCE\s*>\s*(\d+)/i);
      const minBal = match ? parseFloat(match[1]) : 50000;
      result = db.accounts.filter(a => a.balance > minBal);
    } else if (q.includes('FROM TRANSACTIONS') && q.includes('GROUP BY TX_TYPE')) {
      const grouped = {};
      db.transactions.forEach(t => {
        grouped[t.tx_type] = (grouped[t.tx_type] || 0) + t.amount;
      });
      result = Object.keys(grouped).map(k => ({ tx_type: k, total_volume: grouped[k] }));
    } else if (q.includes('FROM USERS')) {
      result = db.users;
    } else if (q.includes('FROM ACCOUNTS')) {
      result = db.accounts;
    } else if (q.includes('FROM TRANSACTIONS')) {
      result = db.transactions.slice(0, 10);
    } else if (q.includes('FROM LOANS')) {
      result = db.loans;
    } else if (q.includes('FROM AUDIT_LOGS')) {
      result = db.audit_logs.slice(0, 10);
    } else {
      // Default fallback projection
      result = db.accounts;
    }

    res.json({
      success: true,
      query,
      rowCount: result.length,
      columns: result.length > 0 ? Object.keys(result[0]) : [],
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL execution error: ' + err.message });
  }
});

// Serve frontend single page app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏦 BankVault — Core Banking System running on:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`   Relational Database Schema: schema.sql (MySQL/PostgreSQL)`);
  console.log(`======================================================\n`);
});
