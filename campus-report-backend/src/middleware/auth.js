import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = verifyToken(token);
    req.user = payload; // { id }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
