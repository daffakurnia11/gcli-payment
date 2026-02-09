import { z } from 'zod';

export const createPaymentSchema = z.object({
  order: z.record(z.string(), z.unknown()).optional(),
  payment: z.record(z.string(), z.unknown()).optional(),
  customer: z.record(z.string(), z.unknown()).optional(),
  invoice_number: z.string().min(1).optional(),
  amount: z.number().positive().optional()
});

export const modifyPaymentSchema = createPaymentSchema.extend({
  invoice_number: z.string().min(1)
});

export const cancelPaymentSchema = z.object({
  invoice_number: z.string().min(1),
  reason: z.string().min(1).optional()
});

export const scheduleCancelSchema = z.object({
  cancel_at: z.iso.datetime(),
  payload: cancelPaymentSchema
});
