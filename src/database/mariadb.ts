import mariadb, { type Pool } from 'mariadb';
import { env } from '../config/env';

export class MariaDbPool {
  private static instance: Pool;

  static getInstance(): Pool {
    if (!MariaDbPool.instance) {
      MariaDbPool.instance = mariadb.createPool({
        host: env.MARIADB_HOST,
        port: env.MARIADB_PORT,
        user: env.MARIADB_USER,
        password: env.MARIADB_PASSWORD,
        database: env.MARIADB_DATABASE,
        connectionLimit: env.MARIADB_POOL_LIMIT,
        multipleStatements: false,
        timezone: 'Z'
      });
    }

    return MariaDbPool.instance;
  }

  static async close(): Promise<void> {
    if (MariaDbPool.instance) {
      await MariaDbPool.instance.end();
    }
  }
}
