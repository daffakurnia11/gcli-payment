import { Router } from 'express';
import { paymentRoutes } from '../modules/payments/payment.routes';
import { webhookRoutes } from '../modules/webhooks/webhook.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    message: 'ok'
  });
});

router.use('/payments', paymentRoutes);
router.use('/webhooks', webhookRoutes);

export { router as apiRoutes };
