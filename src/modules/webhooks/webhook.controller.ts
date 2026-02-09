import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { HttpError } from '../../utils/http-error';
import { dokuWebhookSchema } from './webhook.schema';
import { WebhookService } from './webhook.service';

export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  handleDokuWebhook = asyncHandler(async (req: Request, res: Response) => {
    const parsed = dokuWebhookSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const clientId = req.get('Client-Id') ?? req.get('client-id');
    const requestId = req.get('Request-Id') ?? req.get('request-id');
    const requestTimestamp = req.get('Request-Timestamp') ?? req.get('request-timestamp');
    const signature = req.get('Signature') ?? req.get('signature') ?? req.get('x-signature');

    if (!clientId || !requestId || !requestTimestamp || !signature) {
      throw new HttpError(400, 'Missing required DOKU headers');
    }

    const result = await this.webhookService.handleWebhook({
      body: parsed.data,
      rawBody: req.rawBody ?? JSON.stringify(parsed.data),
      headers: {
        clientId,
        requestId,
        requestTimestamp,
        signature
      }
    });

    res.status(200).json(result);
  });
}
