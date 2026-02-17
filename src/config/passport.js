const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { User } = require('../models');
const { oauthLogin } = require('../services/authentication.js');
require('dotenv').config();

// ─── JWT Strategy ─────────────────────────────────────────────────────────────
// Validates Bearer token on protected routes

passport.use(new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
        try {
            const user = await User.findByPk(payload.id);
            if (!user) return done(null, false);
            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    }
));

// ─── Google OAuth 2.0 Strategy ────────────────────────────────────────────────

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const { tokens, user } = await oauthLogin({
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
            });
            return done(null, { user, tokens });
        } catch (err) {
            return done(err, false);
        }
    }
));

module.exports = passport;