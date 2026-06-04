-- D1 Database Schema for Sunil Finance App

-- Users table for registration, login, and email OTP verification
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

-- Transactions table for Income, Expense, Loans, and Udhaar
-- type can be: 'income', 'expense', 'loan_given', 'loan_taken', 'udhar_given', 'udhar_taken'
-- status can be: 'pending', 'paid'
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  person TEXT, -- Name of the person for loan/udhar
  status TEXT DEFAULT 'paid', -- 'pending' or 'paid' (default to paid for income/expense)
  due_date TEXT, -- YYYY-MM-DD format for reminders
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table to track settlements or partial payments against loans/udhaar
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL, -- YYYY-MM-DD format
  created_at INTEGER NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
