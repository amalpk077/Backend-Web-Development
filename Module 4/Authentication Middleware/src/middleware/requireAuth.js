const jwt = require('jsonwebtoken');
module.exports = function requireAuth(req, res, next) {
// ── Extract ──────────────────────────────────────────────
const authHeader = req.headers.authorization ?? '';
const match = /^Bearer ([^\s]+)$/i.exec(authHeader);
const token = match ? match[1] : null;
if (!token) {
return res.status(401).json({
error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
}); // EXIT A: missing / wrong scheme
}
// ── Verify ───────────────────────────────────────────────
try {
const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
req.user = payload;
next(); // EXIT B: verified — route handler runs
} catch (_error) {
return res.status(401).json({
error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
}); // EXIT C: expired / invalid / malformed — same body as EXIT A
}
}