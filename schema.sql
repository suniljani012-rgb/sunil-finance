-- FinAura Enterprise Relational Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  otp TEXT,
  otp_expiry INTEGER,
  is_verified INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Accounts table (Bank accounts, cash wallets, cards)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,          -- e.g., 'SBI Checking', 'HDFC Credit Card', 'Cash Wallet'
  type TEXT NOT NULL,          -- 'bank', 'card', 'cash'
  balance REAL DEFAULT 0.0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payees table (Contact book for loans/udhaar and general transactions)
CREATE TABLE IF NOT EXISTS payees (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  upi_id TEXT,
  account_number TEXT,
  ifsc TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Headers table (Dynamic Income/Expense Categories)
CREATE TABLE IF NOT EXISTS headers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,          -- e.g., 'Salary', 'Rent', 'Office Supplies', 'Interest'
  type TEXT NOT NULL,          -- 'income', 'expense'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Loans table (Track active/closed debt facilities)
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,          -- e.g., 'Car Loan HDFC', 'Personal Loan Friend'
  total_amount REAL NOT NULL,
  emi_amount REAL NOT NULL,
  interest_rate REAL DEFAULT 0.0,
  tenure_months INTEGER,
  lender TEXT NOT NULL,
  start_date TEXT NOT NULL,    -- YYYY-MM-DD
  due_day INTEGER,             -- Day of month (e.g., 5 for 5th of every month)
  status TEXT DEFAULT 'active',-- 'active', 'closed'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table (General Cash Ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,          -- 'income', 'expense', 'loan_given', 'loan_taken', 'udhar_given', 'udhar_taken'
  amount REAL NOT NULL,
  category_id TEXT,            -- References headers(id)
  category TEXT,               -- Fallback text category
  description TEXT,
  person_id TEXT,              -- References payees(id)
  account_id TEXT,             -- References accounts(id)
  utr_number TEXT,             -- Bank Reference Number
  status TEXT DEFAULT 'paid',  -- 'pending', 'paid'
  due_date TEXT,               -- YYYY-MM-DD (reminders due date)
  loan_id TEXT,                -- References loans(id) (if EMI payment)
  emi_number INTEGER,          -- Number of EMI payment
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES headers(id) ON DELETE SET NULL,
  FOREIGN KEY (person_id) REFERENCES payees(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL
);

-- Payments table (Partial settlements tracking)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,  -- YYYY-MM-DD
  created_at INTEGER NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
