const express = require('express');
const router = express.Router();

const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const bankConnectController = require('../controllers/bankConnectController');
const sqlController = require('../controllers/sqlController');

// Financial Metrics & Accounts
router.get('/metrics', accountController.getMetrics);
router.get('/accounts', accountController.getAccounts);

// Transactions Feed
router.get('/transactions', transactionController.getAll);
router.post('/transactions', transactionController.create);

// Backward Compatibility Aliases
router.get('/stats', accountController.getMetrics);
router.post('/withdraw', transactionController.create);

// Open Banking / Plaid Simulated Connection
router.post('/bank/link', bankConnectController.linkBank);

// Interactive SQL Terminal
router.post('/sql-query', sqlController.executeQuery);

module.exports = router;
