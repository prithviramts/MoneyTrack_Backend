const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const { signup, login, refresh, me } = require('../controllers/auth.controller');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' }
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.get('/me', auth, me);

module.exports = router;
