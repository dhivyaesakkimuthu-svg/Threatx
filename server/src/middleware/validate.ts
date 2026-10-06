import type { Request, Response, NextFunction } from 'express';
import { z, ZodError, type ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid request body' });
    }
  };
}

export const createServerSchema = z.object({
  name: z.string().min(1, 'Server name is required'),
  hostname: z.string().min(1, 'Hostname is required'),
  os: z.string().optional(),
  ipAddress: z.string().optional(),
});

export const ingestLogSchema = z.object({
  userId: z.string().optional(),
  username: z.string().optional(),
  eventType: z.string().optional(),
  ipAddress: z.string().optional(),
  device: z.string().optional(),
  userAgent: z.string().optional(),
  location: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      ip: z.string().optional(),
    })
    .optional(),
  filePath: z.string().optional(),
  success: z.boolean().optional(),
  timestamp: z.string().optional(),
  telemetry: z.any().optional(),
});

export const ingestPayloadSchema = z.union([
  z.object({
    agentVersion: z.string().optional(),
    logs: z.array(ingestLogSchema).optional(),
  }),
  ingestLogSchema,
]);

export const updateIncidentSchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  assignedTo: z.string().optional(),
});

export const addIncidentNoteSchema = z.object({
  action: z.string().optional(),
  analyst: z.string().optional(),
  notes: z.string().min(1, 'Notes cannot be empty'),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
});

export const blockUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

