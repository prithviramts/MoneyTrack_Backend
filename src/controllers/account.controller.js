const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

async function createAccount(req, res) {
  const { name, type, balance, creditLimit, billingCycleDate, dueDate } = req.body;

  const account = await Account.create({
    userId: req.user.id,
    name,
    type,
    balance: balance || 0,
    creditLimit,
    billingCycleDate,
    dueDate
  });

  res.status(201).json({ success: true, data: { account } });
}

async function getAccounts(req, res) {
  const accounts = await Account.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { accounts } });
}

async function getAccount(req, res) {
  const account = await Account.findOne({ _id: req.params.id, userId: req.user.id });
  if (!account) throw ApiError.notFound('Account not found');
  res.status(200).json({ success: true, data: { account } });
}

async function updateAccount(req, res) {
  const allowedFields = ['name', 'creditLimit', 'billingCycleDate', 'dueDate'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    updates,
    { new: true, runValidators: true }
  );
  if (!account) throw ApiError.notFound('Account not found');

  res.status(200).json({ success: true, data: { account } });
}

async function deleteAccount(req, res) {
  const account = await Account.findOne({ _id: req.params.id, userId: req.user.id });
  if (!account) throw ApiError.notFound('Account not found');

  const transactionCount = await Transaction.countDocuments({ accountId: account._id });
  if (transactionCount > 0) {
    throw ApiError.badRequest(
      'Cannot delete an account with existing transactions. Delete its transactions first.'
    );
  }

  await account.deleteOne();
  res.status(200).json({ success: true, message: 'Account deleted' });
}

module.exports = { createAccount, getAccounts, getAccount, updateAccount, deleteAccount };
