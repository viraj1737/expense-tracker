const BankingService = require('../services/bankingService');

exports.getAll = (req, res) => {
  const { category } = req.query;
  const transactions = BankingService.getTransactions(category);
  res.json({ success: true, transactions });
};

exports.create = (req, res) => {
  try {
    const { amount, category, merchant, payment_type, account_no } = req.body;
    const tx = BankingService.addTransaction({ amount, category, merchant, payment_type, account_no });
    res.json({ success: true, message: 'Transaction recorded.', transaction: tx });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.importStatement = (req, res) => {
  try {
    const { items } = req.body;
    const result = BankingService.importStatement(items);
    res.json({
      success: true,
      message: `Successfully parsed and imported ${result.importedCount} transactions from statement.`,
      result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
