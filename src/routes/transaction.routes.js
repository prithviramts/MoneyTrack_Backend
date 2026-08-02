const express = require('express');
const auth = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createTransactionSchema, updateTransactionSchema } = require('../validators/transaction.validators');
const {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transaction.controller');

const router = express.Router();

router.use(auth);

router.post('/', validateBody(createTransactionSchema), createTransaction);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.patch('/:id', validateBody(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
