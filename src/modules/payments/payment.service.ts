import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { SchedulerService } from '../../services/scheduler.service';
import { DokuService } from '../../services/doku.service';
import { HttpError } from '../../utils/http-error';

export class PaymentService {
  constructor(
    private readonly dokuService: DokuService,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly schedulerService: SchedulerService
  ) {}

  async createPayment(payload: Record<string, unknown>): Promise<{ status: number; data: unknown }> {
    const response = await this.dokuService.createPayment(payload);

    await this.auditLogRepository.create({
      kind: 'payment_create',
      requestId: response.requestId,
      endpoint: '/checkout/v1/payment',
      payload,
      responsePayload: response.data,
      statusCode: response.status,
      invoiceNumber: String(payload.invoice_number ?? '') || undefined
    });

    return {
      status: response.status,
      data: response.data
    };
  }

  async modifyPayment(invoiceNumber: string, payload: Record<string, unknown>): Promise<{ status: number; data: unknown }> {
    const mergedPayload = {
      ...payload,
      invoice_number: invoiceNumber
    };

    const response = await this.dokuService.modifyPayment(mergedPayload);

    await this.auditLogRepository.create({
      kind: 'payment_modify',
      requestId: response.requestId,
      endpoint: response.endpoint,
      payload: mergedPayload,
      responsePayload: response.data,
      statusCode: response.status,
      invoiceNumber
    });

    return {
      status: response.status,
      data: response.data
    };
  }

  async cancelPayment(payload: Record<string, unknown>): Promise<{ status: number; data: unknown }> {
    const response = await this.dokuService.cancelPayment(payload);

    await this.auditLogRepository.create({
      kind: 'payment_cancel',
      requestId: response.requestId,
      endpoint: 'configured cancel endpoint',
      payload,
      responsePayload: response.data,
      statusCode: response.status,
      invoiceNumber: String(payload.invoice_number ?? '') || undefined
    });

    return {
      status: response.status,
      data: response.data
    };
  }

  async getPaymentStatus(invoiceNumber: string): Promise<{ status: number; data: unknown }> {
    const response = await this.dokuService.getPaymentStatus(invoiceNumber);

    await this.auditLogRepository.create({
      kind: 'payment_status_check',
      requestId: response.requestId,
      endpoint: `/orders/v1/status/${invoiceNumber}`,
      payload: { invoice_number: invoiceNumber },
      responsePayload: response.data,
      statusCode: response.status,
      invoiceNumber
    });

    return {
      status: response.status,
      data: response.data
    };
  }

  async scheduleCancel(cancelAt: string, payload: Record<string, unknown>): Promise<{ message: string }> {
    const cancelDate = new Date(cancelAt);

    if (Number.isNaN(cancelDate.getTime())) {
      throw new HttpError(400, 'Invalid cancel_at date format');
    }

    const invoiceNumber = String(payload.invoice_number ?? '');

    if (!invoiceNumber) {
      throw new HttpError(400, 'invoice_number is required in payload');
    }

    const scheduleId = `cancel:${invoiceNumber}`;

    this.schedulerService.schedule({
      id: scheduleId,
      runAt: cancelDate,
      handler: async () => {
        await this.cancelPayment(payload);
      }
    });

    await this.auditLogRepository.create({
      kind: 'payment_schedule_cancel',
      requestId: scheduleId,
      endpoint: '/api/payments/cancel/schedule',
      payload: {
        cancel_at: cancelAt,
        payload
      },
      statusCode: 202,
      invoiceNumber,
      note: 'Scheduled cancellation'
    });

    return {
      message: `Cancellation scheduled for ${cancelDate.toISOString()}`
    };
  }
}
