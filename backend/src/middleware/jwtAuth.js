const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Validates the Authorization: Bearer <token> header using the secret
 * from the JWT_SECRET environment variable.
 * On success attaches the decoded payload (wallet, role, exp, etc.) to req.user.
 */
function jwtAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.slice(7).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Configuration error – treat as server error but do not expose secret
    return res.status(500).json({ error: 'JWT secret not configured' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    // Attach only relevant fields (wallet, role, exp) to req.user
    const { wallet, role, exp } = decoded;
    req.user = { wallet, role, exp };
    next();
  } catch (err) {
    // jwt.verify throws for invalid signature, expired token, etc.
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = jwtAuthMiddleware;
