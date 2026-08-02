const express = require('express');
const auth = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createAccountSchema, updateAccountSchema } = require('../validators/account.validators');
const {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount
} = require('../controllers/account.controller');

const router = express.Router();

router.use(auth);

router.post('/', validateBody(createAccountSchema), createAccount);
router.get('/', getAccounts);
router.get('/:id', getAccount);
router.patch('/:id', validateBody(updateAccountSchema), updateAccount);
router.delete('/:id', deleteAccount);

module.exports = router;
