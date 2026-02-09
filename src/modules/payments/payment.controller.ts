import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { HttpError } from '../../utils/http-error';
import {
  cancelPaymentSchema,
  createPaymentSchema,
  modifyPaymentSchema,
  scheduleCancelSchema
} from './payment.schema';
import { PaymentService } from './payment.service';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  private readParam(value: string | string[] | undefined, name: string): string {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    throw new HttpError(400, `${name} path param is required`);
  }

  createPayment = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const result = await this.paymentService.createPayment(parsed.data);
    res.status(result.status).json(result.data);
  });

  modifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const invoiceNumber = this.readParam(req.params.invoiceNumber, 'invoiceNumber');
    const parsed = modifyPaymentSchema.safeParse({
      ...req.body,
      invoice_number: invoiceNumber
    });

    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const result = await this.paymentService.modifyPayment(invoiceNumber, parsed.data);
    res.status(result.status).json(result.data);
  });

  cancelPayment = asyncHandler(async (req: Request, res: Response) => {
    const parsed = cancelPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const result = await this.paymentService.cancelPayment(parsed.data);
    res.status(result.status).json(result.data);
  });

  getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const invoiceNumber = this.readParam(req.params.invoiceNumber, 'invoiceNumber');

    const result = await this.paymentService.getPaymentStatus(invoiceNumber);
    res.status(result.status).json(result.data);
  });

  scheduleCancel = asyncHandler(async (req: Request, res: Response) => {
    const parsed = scheduleCancelSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const result = await this.paymentService.scheduleCancel(parsed.data.cancel_at, parsed.data.payload);
    res.status(202).json(result);
  });
}
