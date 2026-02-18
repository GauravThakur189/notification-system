const express = require('express');
// const passport = require('../config/passport.js')
const {
    register,
    login,
    googleCallback,
    refresh,
    logout,
    getMe,
    googleRedirect,
} = require('../controllers/authController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

// ─── Local Auth ───────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// ─── Google OAuth 2.0 (Manual) ────────────────────────────────────────────────
router.get('/google', googleRedirect);

router.get('/google/callback', googleCallback);

router.get('/failure', (req, res) => {
    res.status(401).json({ success: false, message: 'Google authentication failed.' });
});

module.exports = router;