const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

module.exports = auth;
