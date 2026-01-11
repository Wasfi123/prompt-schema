/**
 * Example schemas using Zod v3 syntax
 */

import { z } from 'zod/v3';

export const flatSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
  email: z.string().email(),
});

export const arraySchema = z.object({
  tags: z.array(z.string()).min(1).max(5),
  categories: z.array(z.enum(['tech', 'design', 'business'])),
});

export const enumSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export const nestedObjectSchema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
      zipCode: z.string().regex(/^\d{5}$/),
    }),
  }),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
  }),
});

export const discriminatedUnionSchema = z.object({
  notification: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('email'),
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    }),
    z.object({
      type: z.literal('sms'),
      phone: z.string(),
      message: z.string().max(160),
    }),
    z.object({
      type: z.literal('push'),
      deviceToken: z.string(),
      title: z.string(),
      body: z.string(),
    }),
  ]),
});

export const regularUnionSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
  data: z.union([
    z.object({ type: z.literal('text'), content: z.string() }),
    z.object({ type: z.literal('number'), value: z.number() }),
  ]),
});

export const complexArraySchema = z.object({
  teams: z.array(
    z.object({
      name: z.string(),
      members: z.array(
        z.object({
          id: z.string().uuid(),
          role: z.enum(['lead', 'member', 'viewer']),
          permissions: z.array(z.string()).optional(),
        }),
      ),
    }),
  ),
});

export const nullableOptionalSchema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  nullable: z.string().nullable(),
  optionalNullable: z.string().nullable().optional(),
  nullableOptional: z.string().optional().nullable(),
  withDefault: z.string().optional().default('default value'),
});

export const constraintsSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
  age: z.number().int().min(18).max(120),
  website: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  tags: z.array(z.string()).min(1).max(10),
});

export const tupleSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]),
  rgbColor: z.tuple([z.number(), z.number(), z.number()]),
  mixedTuple: z.tuple([z.string(), z.number(), z.boolean()]),
});

export const recordSchema = z.object({
  stringMap: z.record(z.string(), z.string()),
  numberMap: z.record(z.string(), z.number()),
  objectMap: z.record(
    z.string(),
    z.object({
      value: z.number(),
      label: z.string(),
    }),
  ),
});

// All schemas exported as a collection for easy testing
export const allV3Schemas = {
  flatSchema,
  arraySchema,
  enumSchema,
  nestedObjectSchema,
  discriminatedUnionSchema,
  regularUnionSchema,
  complexArraySchema,
  nullableOptionalSchema,
  constraintsSchema,
  tupleSchema,
  recordSchema,
};
