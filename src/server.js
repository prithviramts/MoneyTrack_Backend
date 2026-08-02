const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

let server;

async function start() {
  await connectDB();
  server = app.listen(env.port, () => {
    console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled rejection:', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down gracefully');
  if (server) server.close(() => process.exit(0));
});

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
