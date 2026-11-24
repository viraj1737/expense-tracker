-- =======================================================
-- BankVault: Core Banking System Database Schema
-- Compatible with MySQL 8.0+ / MariaDB / PostgreSQL
-- =======================================================

CREATE DATABASE IF NOT EXISTS bankvault_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bankvault_db;

-- 1. Users Table (Customers, Tellers, Branch Managers)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  role ENUM('customer', 'teller', 'manager') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  account_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_no VARCHAR(16) UNIQUE NOT NULL,
  account_type ENUM('savings', 'current', 'fixed_deposit') DEFAULT 'savings',
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('active', 'frozen', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_positive_balance CHECK (balance >= 0.00)
) ENGINE=InnoDB;

-- 3. Transactions Table (Immutable Ledger)
CREATE TABLE IF NOT EXISTS transactions (
  tx_id INT AUTO_INCREMENT PRIMARY KEY,
  tx_ref VARCHAR(36) UNIQUE NOT NULL,
  from_account_no VARCHAR(16) NULL,
  to_account_no VARCHAR(16) NULL,
  amount DECIMAL(15, 2) NOT NULL,
  tx_type ENUM('deposit', 'withdrawal', 'transfer', 'loan_disbursement') NOT NULL,
  status ENUM('completed', 'failed', 'pending') DEFAULT 'completed',
  description VARCHAR(255) NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_from_acc (from_account_no),
  INDEX idx_to_acc (to_account_no),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- 4. Loans Table
CREATE TABLE IF NOT EXISTS loans (
  loan_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  account_no VARCHAR(16) NOT NULL,
  loan_amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL, -- Annual percentage
  tenure_months INT NOT NULL,
  monthly_emi DECIMAL(10, 2) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'repaid') DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (account_no) REFERENCES accounts(account_no)
) ENGINE=InnoDB;

-- 5. Audit Security Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  actor VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) DEFAULT '127.0.0.1',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =======================================================
-- Helpful Analytical Views
-- =======================================================
CREATE OR REPLACE VIEW view_customer_portfolio AS
SELECT 
  u.user_id,
  u.full_name,
  u.email,
  u.phone,
  a.account_no,
  a.account_type,
  a.balance,
  a.status AS account_status,
  COALESCE(SUM(l.loan_amount), 0) AS total_borrowed
FROM users u
JOIN accounts a ON u.user_id = a.user_id
LEFT JOIN loans l ON a.account_no = l.account_no AND l.status = 'approved'
GROUP BY u.user_id, a.account_id;

-- =======================================================
-- Initial Seed Data
-- =======================================================
INSERT INTO users (user_id, full_name, email, phone, role) VALUES
  (1, 'Aarav Sharma', 'aarav.sharma@example.com', '+919876543210', 'customer'),
  (2, 'Priya Patel', 'priya.patel@example.com', '+919876543211', 'customer'),
  (3, 'Rohan Verma', 'rohan.verma@example.com', '+919876543212', 'customer'),
  (4, 'Deepak Joshi', 'deepak.teller@bankvault.com', '+919876543213', 'teller'),
  (5, 'Sunita Rao', 'sunita.manager@bankvault.com', '+919876543214', 'manager')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

INSERT INTO accounts (account_id, user_id, account_no, account_type, balance, status) VALUES
  (1, 1, 'BV-1002019481', 'savings', 84500.00, 'active'),
  (2, 2, 'BV-1002019482', 'current', 124000.00, 'active'),
  (3, 3, 'BV-1002019483', 'savings', 25600.00, 'active')
ON DUPLICATE KEY UPDATE balance=VALUES(balance);

INSERT INTO transactions (tx_ref, from_account_no, to_account_no, amount, tx_type, status, description, balance_after) VALUES
  ('TX-9801A1', NULL, 'BV-1002019481', 50000.00, 'deposit', 'completed', 'Initial Account Funding', 50000.00),
  ('TX-9801A2', NULL, 'BV-1002019481', 34500.00, 'deposit', 'completed', 'Salary Credit', 84500.00),
  ('TX-9801A3', NULL, 'BV-1002019482', 150000.00, 'deposit', 'completed', 'Business Capital', 150000.00),
  ('TX-9801A4', 'BV-1002019482', 'BV-1002019483', 26000.00, 'transfer', 'completed', 'Vendor Payment', 124000.00)
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO loans (loan_id, user_id, account_no, loan_amount, interest_rate, tenure_months, monthly_emi, purpose, status) VALUES
  (1, 1, 'BV-1002019481', 250000.00, 8.50, 24, 11364.00, 'Home Renovation', 'approved'),
  (2, 3, 'BV-1002019483', 100000.00, 10.00, 12, 8791.00, 'Higher Education', 'pending')
ON DUPLICATE KEY UPDATE loan_amount=VALUES(loan_amount);

INSERT INTO audit_logs (actor, action, details) VALUES
  ('System', 'INITIALIZATION', 'BankVault core ledger initialized with 3 customer accounts.'),
  ('Sunita Rao', 'LOAN_APPROVAL', 'Approved loan ID #1 for Aarav Sharma amount $250,000.00');
