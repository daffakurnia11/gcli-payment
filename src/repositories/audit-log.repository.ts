import { MariaDbPool } from '../database/mariadb';

export type AuditLogKind =
  | 'payment_create'
  | 'payment_modify'
  | 'payment_cancel'
  | 'payment_schedule_cancel'
  | 'payment_status_check'
  | 'webhook';

interface CreateAuditLogPayload {
  kind: AuditLogKind;
  requestId: string;
  invoiceNumber?: string;
  endpoint: string;
  payload: unknown;
  responsePayload?: unknown;
  statusCode?: number;
  note?: string;
}

export class AuditLogRepository {
  async create(payload: CreateAuditLogPayload): Promise<void> {
    const pool = MariaDbPool.getInstance();
    const conn = await pool.getConnection();

    try {
      await conn.query(
        `
        INSERT INTO payment_audit_logs
        (kind, request_id, invoice_number, endpoint, payload, response_payload, status_code, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
        `,
        [
          payload.kind,
          payload.requestId,
          payload.invoiceNumber ?? null,
          payload.endpoint,
          JSON.stringify(payload.payload ?? {}),
          JSON.stringify(payload.responsePayload ?? {}),
          payload.statusCode ?? null,
          payload.note ?? null
        ]
      );
    } finally {
      conn.release();
    }
  }
}
