const passport = require('../config/passport');

// ─── Protect Routes (JWT) ─────────────────────────────────────────────────────

const protect = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });

        req.user = user;  // attach user to request
        next();
    })(req, res, next);
};

// ─── Role-Based Access Control ────────────────────────────────────────────────

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}.`,
            });
        }
        next();
    };
};

module.exports = { protect, restrictTo };