import { z } from 'zod';

export const dokuWebhookSchema = z.object({
  invoice_number: z.string().optional(),
  transaction: z
    .object({
      status: z.string().optional()
    })
    .optional(),
  order: z
    .object({
      invoice_number: z.string().optional()
    })
    .optional(),
  message: z.string().optional()
});
