import { Router } from 'express';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { DokuService } from '../../services/doku.service';
import { SchedulerService } from '../../services/scheduler.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

const router = Router();

const dokuService = new DokuService();
const auditLogRepository = new AuditLogRepository();
const schedulerService = new SchedulerService();
const paymentService = new PaymentService(dokuService, auditLogRepository, schedulerService);
const paymentController = new PaymentController(paymentService);

router.post('/', paymentController.createPayment);
router.patch('/:invoiceNumber', paymentController.modifyPayment);
router.post('/cancel', paymentController.cancelPayment);
router.post('/cancel/schedule', paymentController.scheduleCancel);
router.get('/:invoiceNumber/status', paymentController.getPaymentStatus);

export { router as paymentRoutes };
