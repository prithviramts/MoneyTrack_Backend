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

  const existing = await User.findOne({ email });
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

  const user = await User.findOne({ email }).select('+password');
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
