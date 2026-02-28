import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config';
import swaggerSpec from './config/swagger';
import { globalErrorHandler } from './middlewares/errorMiddleware';
import routes from './routes';
import { AppError } from './utils/AppError';
import logger from './utils/logger';

const app: Application = express();

interface BigIntWithToJSON {
  toJSON(): string;
}

(BigInt.prototype as unknown as BigIntWithToJSON).toJSON = function () {
  return (this as unknown as bigint).toString();
};

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(
  express.json({
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Centralized Logging with Morgan & Winston
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }),
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /:
 *   get:
 *     summary: Welcome to the API
 *     description: Returns a welcome message.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
// Root Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the SaaS File Management System API',
  });
});

// Feature Routes
app.use('/api', routes);

// 404 Handler
app.all('*path', (req: Request, _res: Response, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
