import { Router } from 'express';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

const router = Router();

const auditLogRepository = new AuditLogRepository();
const webhookService = new WebhookService(auditLogRepository);
const webhookController = new WebhookController(webhookService);

router.post('/doku', webhookController.handleDokuWebhook);

export { router as webhookRoutes };
