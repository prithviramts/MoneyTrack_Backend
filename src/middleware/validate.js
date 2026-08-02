const ApiError = require('../utils/ApiError');

function validateBody(schema) {
  return function validate(req, res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map(
        (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`
      );
      throw ApiError.badRequest('Validation failed', details);
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
