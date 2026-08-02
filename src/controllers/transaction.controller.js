const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

function balanceDelta(type, amount) {
  return type === 'income' ? amount : -amount;
}

async function createTransaction(req, res) {
  const { accountId, type, amount, category, date } = req.body;

  if (!accountId || !type || amount === undefined) {
    throw ApiError.badRequest('accountId, type and amount are required');
  }
  if (!['income', 'expense'].includes(type)) {
    throw ApiError.badRequest("type must be 'income' or 'expense'");
  }
  if (typeof amount !== 'number' || amount <= 0) {
    throw ApiError.badRequest('amount must be a positive number');
  }

  const session = await mongoose.startSession();
  try {
    let transaction;
    await session.withTransaction(async () => {
      const account = await Account.findOne({ _id: accountId, userId: req.user.id }).session(
        session
      );
      if (!account) throw ApiError.notFound('Account not found');

      account.balance += balanceDelta(type, amount);
      await account.save({ session });

      const created = await Transaction.create(
        [{ userId: req.user.id, accountId, type, amount, category, date }],
        { session }
      );
      transaction = created[0];
    });

    res.status(201).json({ success: true, data: { transaction } });
  } finally {
    session.endSession();
  }
}

async function getTransactions(req, res) {
  const { accountId, type, category, from, to, page = 1, limit = 20 } = req.query;

  const filter = { userId: req.user.id };
  if (accountId) filter.accountId = accountId;
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Transaction.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: { transactions },
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
}

async function getTransaction(req, res) {
  const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
  if (!transaction) throw ApiError.notFound('Transaction not found');
  res.status(200).json({ success: true, data: { transaction } });
}

async function updateTransaction(req, res) {
  const { type, amount, category, date } = req.body;

  if (type && !['income', 'expense'].includes(type)) {
    throw ApiError.badRequest("type must be 'income' or 'expense'");
  }
  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    throw ApiError.badRequest('amount must be a positive number');
  }

  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user.id
      }).session(session);
      if (!transaction) throw ApiError.notFound('Transaction not found');

      const account = await Account.findOne({
        _id: transaction.accountId,
        userId: req.user.id
      }).session(session);
      if (!account) throw ApiError.notFound('Account not found');

      // Reverse the original effect on the account balance.
      account.balance -= balanceDelta(transaction.type, transaction.amount);

      const newType = type || transaction.type;
      const newAmount = amount !== undefined ? amount : transaction.amount;

      // Apply the new effect.
      account.balance += balanceDelta(newType, newAmount);
      await account.save({ session });

      transaction.type = newType;
      transaction.amount = newAmount;
      if (category !== undefined) transaction.category = category;
      if (date !== undefined) transaction.date = date;
      await transaction.save({ session });

      updated = transaction;
    });

    res.status(200).json({ success: true, data: { transaction: updated } });
  } finally {
    session.endSession();
  }
}

async function deleteTransaction(req, res) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user.id
      }).session(session);
      if (!transaction) throw ApiError.notFound('Transaction not found');

      const account = await Account.findOne({
        _id: transaction.accountId,
        userId: req.user.id
      }).session(session);
      if (account) {
        account.balance -= balanceDelta(transaction.type, transaction.amount);
        await account.save({ session });
      }

      await transaction.deleteOne({ session });
    });

    res.status(200).json({ success: true, message: 'Transaction deleted' });
  } finally {
    session.endSession();
  }
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction
};
