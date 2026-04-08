import http from 'http';
import { createApp } from './app.js';
import { connectDb } from './db.js';
import { config } from './config.js';
import { SITE_TITLE } from './constants/brand.js';
import { initSocketServer } from './socketService.js';

await connectDb();
const app = createApp();
const httpServer = http.createServer(app);
initSocketServer(httpServer, config.corsOrigins);

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[server] Cổng ${config.port} đang được dùng (EADDRINUSE). ` +
        'Thường do đã có một backend đang chạy — tắt terminal đó hoặc dừng tiến trình node trùng cổng.'
    );
    console.error(
      '  PowerShell xem PID: Get-NetTCPConnection -LocalPort ' +
        `${config.port} | Select-Object OwningProcess`
    );
    console.error(
      '  Hoặc đổi cổng (nhớ sửa proxy Vite /api trong frontend/vite.config.js cho khớp):'
    );
    console.error(`  $env:PORT=8082; npm run dev`);
    process.exit(1);
    return;
  }
  console.error('[server]', err);
  process.exit(1);
});

httpServer.listen(config.port, () => {
  console.log(`${SITE_TITLE} — API (MongoDB) http://localhost:${config.port}`);
});
