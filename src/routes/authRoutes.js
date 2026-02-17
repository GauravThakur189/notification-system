const express = require('express');
const passport = require('../config/passport');
const {
    register,
    login,
    googleCallback,
    refresh,
    logout,
    getMe,
} = require('../controllers/authController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

// ─── Local Auth ───────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// ─── Google OAuth 2.0 ─────────────────────────────────────────────────────────
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
    googleCallback
);

router.get('/failure', (req, res) => {
    res.status(401).json({ success: false, message: 'Google authentication failed.' });
});

module.exports = router;