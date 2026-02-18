const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    oauthLogin, // Ensure this is imported
} = require('../services/authentication.js');
const { getGoogleAuthURL, getGoogleTokens, getGoogleUser } = require('../services/oauth.js');
require('dotenv').config();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setRefreshTokenCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,      // not accessible via JS (XSS protection)
        secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in ms
    });
};

// ─── Register ─────────────────────────────────────────────────────────────────

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const { user, accessToken, refreshToken } = await registerUser({ name, email, password });

        setRefreshTokenCookie(res, refreshToken);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: { user, accessToken },
        });
    } catch (err) {
        return res.status(409).json({ success: false, message: err.message });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        console.log(email, password);
        const { user, accessToken, refreshToken } = await loginUser({ email, password });
        console.log("user", user, "accessToken", accessToken, "refreshToken", refreshToken);
        setRefreshTokenCookie(res, refreshToken);

        return res.status(200).json({
            success: true,
            message: 'Logged in successfully.',
            data: { user, accessToken },
        });
    } catch (err) {
        return res.status(401).json({ success: false, message: err.message });
    }
};

// ─── Google OAuth Redirect ────────────────────────────────────────────────────

const googleRedirect = (req, res) => {
    const url = getGoogleAuthURL();
    res.redirect(url);
};


// ─── Google OAuth Callback (Manual) ───────────────────────────────────────────

const googleCallback = async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ message: 'Authorization code missing' });
    }

    try {
        // 1. Exchange code for tokens
        const { id_token, access_token } = await getGoogleTokens(code);

        // 2. Get user info from Google
        const googleUser = await getGoogleUser({ id_token, access_token });

        if (!googleUser.verified_email) {
            return res.status(403).json({ message: 'Google email not verified' });
        }

        // 3. Login or Register in our DB
        const { user, tokens } = await oauthLogin({
            googleId: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
        });

        setRefreshTokenCookie(res, tokens.refreshToken);

        // 4. Redirect to Frontend
        return res.redirect(
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${tokens.accessToken}`
        );
    } catch (err) {
        console.error('Google Auth Error:', err);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/failure`);
    }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        const { accessToken, refreshToken } = await refreshAccessToken(token);

        setRefreshTokenCookie(res, refreshToken);   // rotate refresh token

        return res.status(200).json({
            success: true,
            data: { accessToken },
        });
    } catch (err) {
        return res.status(403).json({ success: false, message: err.message });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (req, res) => {
    try {
        await logoutUser(req.user.id);  // clear refresh token from DB

        res.clearCookie('refreshToken');

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Get Current User ─────────────────────────────────────────────────────────

const getMe = (req, res) => {
    return res.status(200).json({
        success: true,
        data: { user: req.user },
    });
};

module.exports = { register, login, googleCallback, refresh, logout, getMe, googleRedirect };