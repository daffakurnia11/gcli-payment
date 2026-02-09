import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { swaggerDocument } from './config/swagger';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { apiRoutes } from './routes';
import swaggerUi from 'swagger-ui-express';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
          remotePort: req.remotePort
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode
        };
      }
    }
  })
);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as { rawBody?: string }).rawBody = buf.toString();
    }
  })
);

app.use('/api', apiRoutes);
app.get('/api/docs.json', (_req, res) => {
  res.status(200).json(swaggerDocument);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(notFoundMiddleware);
app.use(errorMiddleware);
