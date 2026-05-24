const passport = require('../config/passport');

// Verifies JWT is valid — use on any protected route
const requireAuth = passport.authenticate('jwt', { session: false });

// Verifies JWT + checks for ADMIN role
const requireAdmin = [
  requireAuth,
  (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  }
];

module.exports = { requireAuth, requireAdmin };