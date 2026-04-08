import jwt from 'jsonwebtoken';
import { config } from './config.js';

export function generateToken(username, role) {
  return jwt.sign({ sub: username, role }, config.jwtSecret, {
    expiresIn: '24h',
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
}

export function extractUsername(payload) {
  return payload?.sub;
}
