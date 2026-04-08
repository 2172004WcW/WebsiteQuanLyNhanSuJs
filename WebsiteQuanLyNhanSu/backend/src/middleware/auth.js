import { verifyToken } from '../jwt.js';

function isValidTokenValue(t) {
  return t && !['null', 'undefined'].includes(String(t).toLowerCase());
}

export function extractJwt(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (isValidTokenValue(token)) return token;
  }
  const q = req.query.access_token;
  if (isValidTokenValue(q)) return String(q);
  const cookie = req.headers.cookie;
  if (cookie) {
    const m = cookie.match(/(?:^|;\s*)jwt_token=([^;]+)/);
    if (m?.[1]) {
      const v = decodeURIComponent(m[1]);
      if (isValidTokenValue(v)) return v;
    }
  }
  return null;
}

export function optionalJwt(req, _res, next) {
  const raw = extractJwt(req);
  if (!raw) return next();
  try {
    req.jwtPayload = verifyToken(raw);
  } catch {
    req.jwtPayload = null;
  }
  next();
}

export function requireJwt(req, res, next) {
  const raw = extractJwt(req);
  if (!raw) {
    res.status(401).setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify({ message: 'Chưa xác thực' }));
  }
  try {
    req.jwtPayload = verifyToken(raw);
    req.jwtToken = raw;
    next();
  } catch {
    res.status(401).setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify({ message: 'Chưa xác thực' }));
  }
}

export function requireRoles(...roles) {
  const upper = roles.map((r) => r.toUpperCase());
  return (req, res, next) => {
    const role = req.jwtPayload?.role;
    if (!role || !upper.includes(String(role).toUpperCase())) {
      res.status(403).setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(JSON.stringify({ message: 'Không đủ quyền' }));
    }
    next();
  };
}
