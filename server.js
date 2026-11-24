/**
 * Expense Tracker & Core Wealth System
 * Clean Modular Architecture Server Entry Point
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./src/config/db');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mount Clean API Routes
app.use('/api', apiRoutes);

// Single Page Application Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🌱 Expense Tracker API & Web App running on:`);
    console.log(`   👉 http://localhost:${PORT}`);
    console.log(`   Architecture: MVC (Controllers, Services, Routes, Models)`);
    console.log(`======================================================\n`);
  });
});
