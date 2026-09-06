const passport = require('passport');

/**
 * Protect a route — requires a valid JWT or session.
 * Sets req.user if authenticated.
 */
function authenticate(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Not authenticated. Please log in.',
      });
    }
    req.user = user;
    next();
  })(req, res, next);
}

/**
 * Optional auth — doesn't fail if not logged in,
 * but sets req.user if available.
 */
function optionalAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    req.user = user || null;
    next();
  })(req, res, next);
}

/**
 * Require specific role(s)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, requireRole };
