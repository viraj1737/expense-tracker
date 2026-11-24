const { store } = require('../config/db');
const BankingService = require('../services/bankingService');

exports.getMetrics = (req, res) => {
  const metrics = BankingService.getMetrics();
  res.json({ success: true, metrics });
};

exports.getAccounts = (req, res) => {
  res.json({ success: true, accounts: store.accounts });
};
