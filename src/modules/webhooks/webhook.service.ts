import { env } from '../../config/env';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { verifyDokuSignature } from '../../utils/doku-signature';
import { HttpError } from '../../utils/http-error';

interface HandleWebhookPayload {
  body: Record<string, unknown>;
  rawBody: string;
  headers: {
    clientId: string;
    requestId: string;
    requestTimestamp: string;
    signature: string;
  };
}

export class WebhookService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  private getTransactionStatus(payload: Record<string, unknown>): string | undefined {
    const transaction = payload.transaction;

    if (
      transaction &&
      typeof transaction === 'object' &&
      'status' in transaction &&
      typeof transaction.status === 'string'
    ) {
      return transaction.status.toUpperCase();
    }

    return undefined;
  }

  private getInvoiceNumber(payload: Record<string, unknown>): string | undefined {
    const topLevel = payload.invoice_number;

    if (typeof topLevel === 'string' && topLevel.length > 0) {
      return topLevel;
    }

    const order = payload.order;

    if (
      order &&
      typeof order === 'object' &&
      'invoice_number' in order &&
      typeof order.invoice_number === 'string'
    ) {
      return order.invoice_number;
    }

    return undefined;
  }

  private async notifyLeagueJoinPaid(params: {
    invoiceNumber: string;
    status: string;
    payload: Record<string, unknown>;
    requestId: string;
  }): Promise<void> {
    if (
      !env.GCLI_NEXT_BASE_URL ||
      !params.invoiceNumber.toUpperCase().startsWith('LEAGUE-')
    ) {
      return;
    }

    const endpoint = `${env.GCLI_NEXT_BASE_URL.replace(/\/$/, '')}/api/internal/payments/league/success`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (env.INTERNAL_PAYMENT_WEBHOOK_TOKEN) {
      headers['x-internal-token'] = env.INTERNAL_PAYMENT_WEBHOOK_TOKEN;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        invoiceNumber: params.invoiceNumber,
        transactionStatus: params.status,
        providerPayload: params.payload
      })
    });

    const responseBody = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    await this.auditLogRepository.create({
      kind: 'webhook',
      requestId: params.requestId,
      endpoint,
      payload: {
        invoiceNumber: params.invoiceNumber,
        status: params.status
      },
      responsePayload: responseBody ?? { status: response.status },
      statusCode: response.status,
      note: response.ok
        ? 'League join callback delivered'
        : 'League join callback failed',
      invoiceNumber: params.invoiceNumber
    });
  }

  async handleWebhook(payload: HandleWebhookPayload): Promise<{ message: string }> {
    const validSignature = verifyDokuSignature({
      clientId: payload.headers.clientId,
      requestId: payload.headers.requestId,
      requestTimestamp: payload.headers.requestTimestamp,
      requestTarget: env.DOKU_WEBHOOK_PATH,
      body: payload.rawBody,
      secretKey: env.DOKU_SECRET_KEY,
      signature: payload.headers.signature
    });

    if (!validSignature) {
      await this.auditLogRepository.create({
        kind: 'webhook',
        requestId: payload.headers.requestId,
        endpoint: env.DOKU_WEBHOOK_PATH,
        payload: payload.body,
        statusCode: 401,
        note: 'Rejected invalid signature',
        invoiceNumber: this.getInvoiceNumber(payload.body)
      });

      throw new HttpError(401, 'Invalid webhook signature');
    }

    const status = this.getTransactionStatus(payload.body);
    const note =
      status === 'FAILED'
        ? 'Transaction failed notification'
        : status === 'SUCCESS' || status === 'PAID'
          ? 'Transaction already paid notification'
          : 'Webhook accepted';

    await this.auditLogRepository.create({
      kind: 'webhook',
      requestId: payload.headers.requestId,
      endpoint: env.DOKU_WEBHOOK_PATH,
      payload: payload.body,
      statusCode: 200,
      note,
      invoiceNumber: this.getInvoiceNumber(payload.body)
    });

    const invoiceNumber = this.getInvoiceNumber(payload.body);
    if (invoiceNumber && (status === 'SUCCESS' || status === 'PAID')) {
      try {
        await this.notifyLeagueJoinPaid({
          invoiceNumber,
          status,
          payload: payload.body,
          requestId: payload.headers.requestId
        });
      } catch (error) {
        await this.auditLogRepository.create({
          kind: 'webhook',
          requestId: payload.headers.requestId,
          endpoint: env.DOKU_WEBHOOK_PATH,
          payload: payload.body,
          statusCode: 500,
          note:
            error instanceof Error
              ? `League join callback exception: ${error.message}`
              : 'League join callback exception',
          invoiceNumber
        });
      }
    }

    return {
      message: 'Webhook processed'
    };
  }
}
