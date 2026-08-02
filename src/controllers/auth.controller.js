const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');

function issueTokens(userId) {
  const accessToken = signAccessToken({ sub: userId.toString() });
  const refreshToken = signRefreshToken({ sub: userId.toString() });
  return { accessToken, refreshToken };
}

async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('name, email and password are required');
  }
  if (password.length < 8 || password.length > 128) {
    throw ApiError.badRequest('password must be between 8 and 128 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const user = await User.create({ name, email, password });
  const tokens = issueTokens(user._id);

  res.status(201).json({
    success: true,
    data: { user, ...tokens }
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokens = issueTokens(user._id);

  res.status(200).json({
    success: true,
    data: { user, ...tokens }
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw ApiError.badRequest('refreshToken is required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  const tokens = issueTokens(user._id);
  res.status(200).json({ success: true, data: tokens });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  res.status(200).json({ success: true, data: { user } });
}

module.exports = { signup, login, refresh, me };
