const express = require('express');
const authRoutes = require('./auth.routes');
const accountRoutes = require('./account.routes');
const transactionRoutes = require('./transaction.routes');

const router = express.Router();

router.get('/health', (req, res) => res.status(200).json({ success: true, message: 'OK' }));

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;
