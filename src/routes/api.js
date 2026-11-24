const express = require('express');
const router = express.Router();

const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const bankConnectController = require('../controllers/bankConnectController');
const sqlController = require('../controllers/sqlController');

// Financial Metrics & Profile
router.get('/metrics', accountController.getMetrics);
router.get('/accounts', accountController.getAccounts);
router.get('/user/profile', accountController.getProfile);
router.post('/user/setup-real-account', accountController.setupRealAccount);
router.post('/setup-real-account', accountController.setupRealAccount);

// Transactions Feed & Bulk Statement Import
router.get('/transactions', transactionController.getAll);
router.post('/transactions', transactionController.create);
router.post('/transactions/import-statement', transactionController.importStatement);

// Backward Compatibility Aliases
router.get('/stats', accountController.getMetrics);
router.post('/withdraw', transactionController.create);

// Open Banking / Plaid Simulated Connection
router.post('/bank/link', bankConnectController.linkBank);

// Interactive SQL Terminal
router.post('/sql-query', sqlController.executeQuery);

module.exports = router;
