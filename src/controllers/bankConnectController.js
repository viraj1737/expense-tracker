const BankingService = require('../services/bankingService');

// Simulates Plaid / SaltEdge Open Banking Secure Authorization
exports.linkBank = (req, res) => {
  const { institution = 'Chase Bank', account_type = 'checking', initial_balance = 7500.00 } = req.body;
  try {
    const linkedAccount = BankingService.linkBankAccount({ institution, account_type, initial_balance });
    res.json({
      success: true,
      message: `Successfully linked ${institution} via Open Banking API. Live feed synced.`,
      account: linkedAccount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bank linking failed: ' + err.message });
  }
};
