# BankVault — Core Banking System & Database Management System (DBMS)

BankVault is a full-stack database-driven banking application with a rich Graphical User Interface (GUI), relational schema, ACID transaction enforcement, and an embedded interactive SQL query runner.

---

## 🚀 Live Demo & Access

The server is currently running locally at:
👉 **[http://localhost:4000](http://localhost:4000)**

---

## 📁 Project Structure

```
bankvault/
├── schema.sql             # Complete DDL for MySQL 8+ / PostgreSQL with constraints, foreign keys, and seeds
├── server.js               # Express API with atomic transactions, rollback protection & SQL runner
├── package.json            # Node.js dependencies
└── public/
    └── index.html          # Modern, responsive single-page GUI (Customer, Teller, Ledger, SQL Lab)
```

---

## 🏦 Core Database & GUI Modules

### 1. Customer Banking Portal
* **Virtual Platinum Card:** Real-time balance indicator, account number, status badge (`ACTIVE` / `FROZEN`), and owner name.
* **Account Switcher:** Seamlessly switch between different customer profiles (`Aarav Sharma`, `Priya Patel`, `Rohan Verma`).
* **Instant Money Transfer:** Atomic transfer between accounts with balance verification and frozen account protection.
* **Cash Deposit & Withdrawal:** Direct balance updates with transaction ledger entry.
* **Passbook Statement:** Filterable transaction history showing debit/credit sign, transaction reference, and post-transaction balance.

### 2. Teller & Branch Manager Operations
* **Account Management:** View all accounts, customer details, and balances.
* **Freeze / Unfreeze Controls:** Prevent fraudulent or overdraft accounts from performing transfers with a single click.
* **Open New Account:** Complete form creating a new customer record and initializing their balance.
* **Loan Approval Desk:** Review loan applications with calculated monthly EMI; approving a loan automatically disburses the funds directly into the applicant's account.

### 3. Immutable Master Ledger & Security Audit Trail
* **Master Transaction Log:** Every financial event is permanently logged with unique reference IDs.
* **Security Audit Trail:** Tracks all administrative actions (account creations, freeze status changes, loan approvals) with timestamps.

### 4. Interactive SQL Query Lab (Live Demonstration)
* Execute live SQL queries directly from the GUI (e.g. `SELECT * FROM accounts WHERE balance > 50000;`, `SELECT tx_type, SUM(amount) FROM transactions GROUP BY tx_type;`).
* Dynamic table rendering of result sets—ideal for demonstrating database concepts to professors and evaluators!

---

## 🗄️ Relational Schema Highlights (`schema.sql`)

* **`users` Table:** Primary key `user_id`, stores personal details and roles (`customer`, `teller`, `manager`).
* **`accounts` Table:** Foreign key to `users`, unique `account_no`, `status` (`active`, `frozen`), check constraint `balance >= 0.00`.
* **`transactions` Table:** Immutable ledger with foreign key references, transaction types (`deposit`, `withdrawal`, `transfer`, `loan_disbursement`), and `balance_after`.
* **`loans` Table:** Tracks loan principal, annual interest rate, tenure, and monthly EMI.
* **`audit_logs` Table:** Compliance tracking for security and administrative actions.
* **`view_customer_portfolio` View:** Relational view joining users, accounts, and active loan exposure.
