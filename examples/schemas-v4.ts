/**
 * Example schemas using Zod v4 syntax with .meta() for examples
 */

import { z } from 'zod/v4';

export const flatSchemaV4 = z
  .object({
    name: z.string(),
    age: z.number().min(0),
    email: z.string().email(),
  })
  .meta({
    examples: [
      { name: 'John Doe', age: 30, email: 'john@example.com' },
      { name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    ],
  });

export const arraySchemaV4 = z
  .object({
    tags: z.array(z.string()).min(1).max(5),
    categories: z.array(z.enum(['tech', 'design', 'business'])),
  })
  .meta({
    examples: [
      {
        tags: ['typescript', 'react', 'nodejs'],
        categories: ['tech', 'design'],
      },
    ],
  });

export const enumSchemaV4 = z
  .object({
    status: z.enum(['active', 'inactive', 'pending']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
  })
  .meta({
    examples: [
      { status: 'active', priority: 'high' },
      { status: 'pending', priority: 'medium' },
    ],
  });

export const nestedObjectSchemaV4 = z
  .object({
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
  })
  .meta({
    examples: [
      {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            street: '123 Main St',
            city: 'San Francisco',
            country: 'USA',
            zipCode: '94105',
          },
        },
        metadata: {
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T15:45:00Z',
        },
      },
    ],
  });

export const discriminatedUnionSchemaV4 = z
  .object({
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
  })
  .meta({
    examples: [
      {
        notification: {
          type: 'email',
          to: 'user@example.com',
          subject: 'Welcome!',
          body: 'Thanks for signing up.',
        },
      },
      {
        notification: {
          type: 'sms',
          phone: '+1234567890',
          message: 'Your verification code is 123456',
        },
      },
    ],
  });

export const regularUnionSchemaV4 = z
  .object({
    value: z.union([z.string(), z.number(), z.boolean()]),
    data: z.union([
      z.object({ type: z.literal('text'), content: z.string() }),
      z.object({ type: z.literal('number'), value: z.number() }),
    ]),
  })
  .meta({
    examples: [
      {
        value: 'hello',
        data: { type: 'text', content: 'example text' },
      },
      {
        value: 42,
        data: { type: 'number', value: 123 },
      },
    ],
  });

export const complexArraySchemaV4 = z
  .object({
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
  })
  .meta({
    examples: [
      {
        teams: [
          {
            name: 'Engineering',
            members: [
              {
                id: '550e8400-e29b-41d4-a716-446655440000',
                role: 'lead',
                permissions: ['write', 'admin'],
              },
              {
                id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                role: 'member',
                permissions: ['read', 'write'],
              },
            ],
          },
        ],
      },
    ],
  });

export const nullableOptionalSchemaV4 = z
  .object({
    required: z.string(),
    optional: z.string().optional(),
    nullable: z.string().nullable(),
    optionalNullable: z.string().nullable().optional(),
    nullableOptional: z.string().optional().nullable(),
    withDefault: z.string().optional().default('default value'),
  })
  .meta({
    examples: [
      {
        required: 'value',
        optional: 'present',
        nullable: null,
        optionalNullable: 'value',
      },
      {
        required: 'value',
        nullable: 'not null',
        nullableOptional: null,
        withDefault: 'custom',
      },
    ],
  });

export const constraintsSchemaV4 = z
  .object({
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
  })
  .meta({
    examples: [
      {
        username: 'john_doe',
        password: 'SecureP@ss123',
        age: 28,
        website: 'https://johndoe.com',
        bio: 'Software engineer passionate about TypeScript',
        tags: ['typescript', 'react', 'nodejs'],
      },
    ],
  });

export const tupleSchemaV4 = z
  .object({
    coordinates: z.tuple([z.number(), z.number()]),
    rgbColor: z.tuple([z.number(), z.number(), z.number()]),
    mixedTuple: z.tuple([z.string(), z.number(), z.boolean()]),
  })
  .meta({
    examples: [
      {
        coordinates: [40.7128, -74.006],
        rgbColor: [255, 128, 0],
        mixedTuple: ['active', 42, true],
      },
    ],
  });

export const recordSchemaV4 = z
  .object({
    stringMap: z.record(z.string(), z.string()),
    numberMap: z.record(z.string(), z.number()),
    objectMap: z.record(
      z.string(),
      z.object({
        value: z.number(),
        label: z.string(),
      }),
    ),
  })
  .meta({
    examples: [
      {
        stringMap: { en: 'Hello', es: 'Hola', fr: 'Bonjour' },
        numberMap: { price: 99.99, discount: 10, tax: 8.5 },
        objectMap: {
          small: { value: 1, label: 'Small' },
          medium: { value: 2, label: 'Medium' },
          large: { value: 3, label: 'Large' },
        },
      },
    ],
  });

// All v4 schemas exported as a collection for easy testing
export const allV4Schemas = {
  flatSchemaV4,
  arraySchemaV4,
  enumSchemaV4,
  nestedObjectSchemaV4,
  discriminatedUnionSchemaV4,
  regularUnionSchemaV4,
  complexArraySchemaV4,
  nullableOptionalSchemaV4,
  constraintsSchemaV4,
  tupleSchemaV4,
  recordSchemaV4,
};
