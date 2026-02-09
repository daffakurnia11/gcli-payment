import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { MariaDbPool } from './database/mariadb';

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`);
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Closing server.`);
  server.close(async () => {
    await MariaDbPool.close();
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
