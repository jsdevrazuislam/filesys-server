import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SaaS File Management System API',
      version: '1.0.0',
      description:
        'A comprehensive API documentation for the SaaS File Management System.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Package: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            maxFolders: { type: 'integer' },
            maxNesting: { type: 'integer' },
            allowedTypes: { type: 'array', items: { type: 'string' } },
            maxFileSize: { type: 'string', description: 'BigInt as string' },
            storageLimit: { type: 'string', description: 'BigInt as string' },
            totalFiles: { type: 'integer' },
            filesPerFolder: { type: 'integer' },
            price: { type: 'number' },
          },
        },
        Folder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            parentId: { type: 'string', format: 'uuid', nullable: true },
            depthLevel: { type: 'integer' },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            size: { type: 'string', description: 'BigInt as string' },
            mimeType: { type: 'string' },
            s3Key: { type: 'string' },
          },
        },
        CheckoutSession: {
          type: 'object',
          properties: {
            url: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            stack: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/app.ts', './src/modules/**/*.ts'], // Look for annotations in app.ts and modules
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
