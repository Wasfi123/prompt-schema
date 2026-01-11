import { describe, expect, it } from 'vitest';
import { z } from 'zod/v3';
import { zodV3Adapter } from '../src/adapters/zod-v3';
import { jsonSchemaAdapter } from '../src/adapters/json-schema';
import type { JsonSchema } from '../src/types';

describe('Adapters', () => {
  describe('Zod v3 Adapter', () => {
    it('should detect Zod v3 schemas', () => {
      const zodSchema = z.object({ name: z.string() });
      const notZodSchema = { type: 'object', properties: {} };

      expect(zodV3Adapter.canHandle(zodSchema)).toBe(true);
      expect(zodV3Adapter.canHandle(notZodSchema)).toBe(false);
      expect(zodV3Adapter.canHandle(null)).toBe(false);
      expect(zodV3Adapter.canHandle(undefined)).toBe(false);
    });

    it('should convert simple Zod v3 schema to JSON Schema', () => {
      const zodSchema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = zodV3Adapter.toJsonSchema(zodSchema);

      expect(result.type).toBe('object');
      expect(result.properties).toBeDefined();
      expect(result.properties?.name).toMatchObject({ type: 'string' });
      expect(result.properties?.age).toMatchObject({ type: 'number' });
      expect(result.required).toEqual(['name', 'age']);
    });

    it('should handle Zod string constraints', () => {
      const zodSchema = z.object({
        email: z.string().email(),
        slug: z.string().min(3).max(20),
      });

      const result = zodV3Adapter.toJsonSchema(zodSchema);

      expect(result.properties?.email.format).toBe('email');
      expect(result.properties?.slug.minLength).toBe(3);
      expect(result.properties?.slug.maxLength).toBe(20);
    });

    it('should handle Zod number constraints', () => {
      const zodSchema = z.object({
        age: z.number().min(0).max(120),
        price: z.number().positive(),
      });

      const result = zodV3Adapter.toJsonSchema(zodSchema);

      expect(result.properties?.age.minimum).toBe(0);
      expect(result.properties?.age.maximum).toBe(120);
      expect(result.properties?.price.exclusiveMinimum).toBe(0);
    });

    it('should handle optional and nullable fields', () => {
      const zodSchema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable(),
      });

      const result = zodV3Adapter.toJsonSchema(zodSchema);

      expect(result.required).toContain('required');
      expect(result.required).toContain('nullable');
      expect(result.required).not.toContain('optional');
      expect(result.properties?.nullable.type).toEqual(['string', 'null']);
    });

    it('should handle arrays', () => {
      const zodSchema = z.object({
        tags: z.array(z.string()),
        numbers: z.array(z.number()).min(1).max(5),
      });

      const result = zodV3Adapter.toJsonSchema(zodSchema);

      expect(result.properties?.tags.type).toBe('array');
      expect(result.properties?.tags.items).toMatchObject({ type: 'string' });
      expect(result.properties?.numbers.minItems).toBe(1);
      expect(result.properties?.numbers.maxItems).toBe(5);
    });

    it('should handle enums', () => {
      const zodSchema = z.object({
        status: z.enum(['active', 'inactive', 'pending']),
      });

      const result = zodV3Adapter.toJsonSchema(zodSchema);

      expect(result.properties?.status.type).toBe('string');
      expect(result.properties?.status.enum).toEqual(['active', 'inactive', 'pending']);
    });

    it('should handle discriminated unions', () => {
      const zodSchema = z.object({
        item: z.discriminatedUnion('type', [
          z.object({ type: z.literal('text'), content: z.string() }),
          z.object({ type: z.literal('image'), url: z.string() }),
        ]),
      });

      const result = zodV3Adapter.toJsonSchema(zodSchema);

      expect(result.properties?.item.anyOf).toBeDefined();
      expect(result.properties?.item.anyOf).toHaveLength(2);
    });

    it('should handle complex nested schemas', () => {
      const zodSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            age: z.number(),
            address: z.object({
              street: z.string(),
              city: z.string(),
            }),
          }),
        }),
      });

      const result = zodV3Adapter.toJsonSchema(zodSchema);
      expect(result.type).toBe('object');
      expect(result.properties?.user).toBeDefined();
    });

    it('should handle transform schemas', () => {
      const zodSchema = z.string().transform((val) => val.toUpperCase());

      // Transform schemas still convert to base type
      const result = zodV3Adapter.toJsonSchema(zodSchema);
      expect(result.type).toBe('string');
    });

    it('should handle refinement schemas', () => {
      const zodSchema = z.string().refine((val) => val.length > 5, {
        message: 'String must be longer than 5 characters',
      });

      // Refinements are not represented in JSON Schema
      const result = zodV3Adapter.toJsonSchema(zodSchema);
      expect(result.type).toBe('string');
    });

    it('should handle invalid Zod schema gracefully', () => {
      const invalidSchema = { _def: { typeName: 'ZodInvalid' } };

      // Should not throw, but return some result
      const result = zodV3Adapter.toJsonSchema(invalidSchema);
      expect(result).toBeDefined();
    });
  });

  describe('JSON Schema Adapter', () => {
    it('should detect JSON Schema objects', () => {
      const jsonSchema: JsonSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
      };

      expect(jsonSchemaAdapter.canHandle(jsonSchema)).toBe(true);
      expect(jsonSchemaAdapter.canHandle({ properties: {} })).toBe(true);
      expect(jsonSchemaAdapter.canHandle({ items: {} })).toBe(true);
      expect(jsonSchemaAdapter.canHandle({ oneOf: [] })).toBe(true);
      expect(jsonSchemaAdapter.canHandle({ $schema: '' })).toBe(true);

      expect(jsonSchemaAdapter.canHandle('not-an-object')).toBe(false);
      expect(jsonSchemaAdapter.canHandle(null)).toBe(false);
      expect(jsonSchemaAdapter.canHandle({})).toBe(false);
    });

    it('should pass through JSON Schema unchanged', () => {
      const jsonSchema: JsonSchema = {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          count: { type: 'number', minimum: 0 },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['id'],
      };

      const result = jsonSchemaAdapter.toJsonSchema(jsonSchema);

      expect(result).toBe(jsonSchema);
      expect(result).toEqual(jsonSchema);
    });

    it('should handle complex JSON Schema features', () => {
      const jsonSchema: JsonSchema = {
        type: 'object',
        properties: {
          union: {
            oneOf: [{ type: 'string' }, { type: 'number' }],
          },
          conditional: {
            anyOf: [
              { type: 'null' },
              { type: 'object', properties: { id: { type: 'string' } } },
            ],
          },
        },
        allOf: [{ required: ['union'] }],
      };

      const result = jsonSchemaAdapter.toJsonSchema(jsonSchema);

      expect(result).toBe(jsonSchema);
      expect(result.properties?.union.oneOf).toHaveLength(2);
      expect(result.properties?.conditional.anyOf).toHaveLength(2);
      expect(result.allOf).toHaveLength(1);
    });

    it('should handle schemas with $ref references', () => {
      const jsonSchema: JsonSchema = {
        type: 'object',
        properties: {
          user: { $ref: '#/definitions/User' },
        },
        definitions: {
          User: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      };

      // Passthrough - doesn't resolve refs
      const result = jsonSchemaAdapter.toJsonSchema(jsonSchema);
      expect(result).toBe(jsonSchema);
      expect(result.properties?.user.$ref).toBe('#/definitions/User');
    });

    it('should handle very large schemas', () => {
      const largeSchema: JsonSchema = {
        type: 'object',
        properties: {},
      };

      // Create 1000 properties
      for (let i = 0; i < 1000; i++) {
        largeSchema.properties![`field${i}`] = { type: 'string' };
      }

      const result = jsonSchemaAdapter.toJsonSchema(largeSchema);
      expect(result).toBe(largeSchema);
      expect(Object.keys(result.properties!).length).toBe(1000);
    });

    it('should handle malformed but detectable schemas', () => {
      const malformedSchema = {
        type: 'invalid-type',
        properties: {
          field: { type: 123 }, // Invalid type value
        },
      } as unknown as JsonSchema;

      // Should still pass through
      const result = jsonSchemaAdapter.toJsonSchema(malformedSchema);
      expect(result).toBe(malformedSchema);
    });
  });
});
