const express = require('express');
const auth = require('../middleware/auth');
const {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount
} = require('../controllers/account.controller');

const router = express.Router();

router.use(auth);

router.post('/', createAccount);
router.get('/', getAccounts);
router.get('/:id', getAccount);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);

module.exports = router;
