import type { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    rawBody?: string;
  }
}

export type RequestWithRawBody = Request & { rawBody?: string };
