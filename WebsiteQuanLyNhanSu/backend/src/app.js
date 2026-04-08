import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { requireJwt } from './middleware/auth.js';
import { buildAuthRouter } from './authRoutes.js';
import { buildProtectedRouter } from './protectedRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['*'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const avDir = path.resolve(config.uploadAvatarDir);
  app.use('/uploads/avatars', express.static(avDir));

  app.use('/api/auth', buildAuthRouter());
  app.use('/api', requireJwt, buildProtectedRouter());

  const webDist = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(webDist, 'index.html'), (err) => {
        if (err) next();
      });
    });
  }

  return app;
}
