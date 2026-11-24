const { store } = require('../config/db');

exports.executeQuery = (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query cannot be empty.' });

  const q = query.trim().toUpperCase();

  try {
    let result = [];
    if (q.includes('FROM ACCOUNTS')) {
      result = store.accounts;
    } else if (q.includes('FROM TRANSACTIONS')) {
      result = store.transactions;
    } else if (q.includes('FROM USERS')) {
      result = store.users;
    } else if (q.includes('FROM AUDIT_LOGS')) {
      result = store.audit_logs;
    } else {
      result = store.transactions.slice(0, 5);
    }

    res.json({
      success: true,
      query,
      rowCount: result.length,
      columns: result.length > 0 ? Object.keys(result[0]) : [],
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'SQL syntax error: ' + err.message });
  }
};
