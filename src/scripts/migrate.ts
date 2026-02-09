import { logger } from '../config/logger';
import { MariaDbPool } from '../database/mariadb';

const migrate = async (): Promise<void> => {
  const pool = MariaDbPool.getInstance();
  const conn = await pool.getConnection();

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_audit_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        kind VARCHAR(64) NOT NULL,
        request_id VARCHAR(128) NOT NULL,
        invoice_number VARCHAR(128) NULL,
        endpoint VARCHAR(255) NOT NULL,
        payload LONGTEXT NOT NULL,
        response_payload LONGTEXT NULL,
        status_code INT NULL,
        note VARCHAR(255) NULL,
        created_at DATETIME NOT NULL
      ) ENGINE=InnoDB;
    `);

    logger.info('Migration executed successfully');
  } finally {
    conn.release();
    await MariaDbPool.close();
  }
};

void migrate();
