const { store } = require('../config/db');
const BankingService = require('../services/bankingService');

exports.getMetrics = (req, res) => {
  const metrics = BankingService.getMetrics();
  res.json({ success: true, metrics });
};

exports.getAccounts = (req, res) => {
  res.json({ success: true, accounts: store.accounts });
};

exports.getProfile = (req, res) => {
  const profile = BankingService.getUserProfile();
  res.json({ success: true, profile });
};

exports.setupRealAccount = (req, res) => {
  try {
    const { full_name, bank_name, account_no, initial_balance, balance, currency } = req.body;
    const finalBalance = initial_balance !== undefined ? initial_balance : balance;
    const result = BankingService.setupRealAccount({
      full_name,
      bank_name,
      account_no,
      initial_balance: finalBalance,
      currency
    });
    res.json({
      success: true,
      message: `Real bank account configured for ${bank_name} (${result.account.account_no}). Balance initialized.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
