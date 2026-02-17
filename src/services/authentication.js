const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

// ─── Token Generators ─────────────────────────────────────────────────────────

const generateAccessToken = (user) => {
    console.log("jwt secret", process.env.JWT_SECRET);

    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
};

const generateRefreshToken = (user) => {
    console.log("jwt refresh secret", process.env.JWT_REFRESH_SECRET);

    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || refreshToken,
        { expiresIn: '7d' }
    );
};

// ─── Register ─────────────────────────────────────────────────────────────────

const registerUser = async ({ name, email, password }) => {
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new Error('Email already in use.');

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // persist refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    return { user: sanitizeUser(user), accessToken, refreshToken };
};

// ─── Local Login ──────────────────────────────────────────────────────────────

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('Invalid email or password.');
    if (!user.password) throw new Error('Please login with Google.');

    const valid = await user.validatePassword(password);
    if (!valid) throw new Error('Invalid email or password.');

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { user: sanitizeUser(user), accessToken, refreshToken };
};

// ─── OAuth Login (Google) ─────────────────────────────────────────────────────

const oauthLogin = async ({ googleId, email, name }) => {
    let user = await User.findOne({ where: { email } });

    if (!user) {
        // first time Google login → create account
        user = await User.create({ googleId, email, name, isVerified: true });
    } else if (!user.googleId) {
        // existing local account → link Google to it
        user.googleId = googleId;
        await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { user: sanitizeUser(user), accessToken, refreshToken };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

const refreshAccessToken = async (token) => {
    if (!token) throw new Error('Refresh token missing.');

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
        throw new Error('Invalid or expired refresh token.');
    }

    const user = await User.findByPk(payload.id);
    if (!user || user.refreshToken !== token) {
        throw new Error('Refresh token mismatch. Please login again.');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logoutUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (user) {
        user.refreshToken = null;
        await user.save();
    }
};

// ─── Helper ───────────────────────────────────────────────────────────────────

// strips sensitive fields before sending user data to client
const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
});

module.exports = {
    registerUser,
    loginUser,
    oauthLogin,
    refreshAccessToken,
    logoutUser,
    generateAccessToken,
};