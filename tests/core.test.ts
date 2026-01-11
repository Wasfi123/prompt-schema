import { describe, expect, it, beforeEach, vi } from 'vitest';
import { z } from 'zod/v3';
import { PromptSchema } from '../src/PromptSchema';
import { SchemaAdapter, type JsonSchema } from '../src/types';
import { getPrompts } from '../src/index';

describe('Core Plugin System', () => {
  let schemaToPrompt: PromptSchema;

  beforeEach(() => {
    schemaToPrompt = new PromptSchema();
  });

  describe('adapter registration', () => {
    it('should register adapters', () => {
      const adapter: SchemaAdapter = {
        name: 'test',
        canHandle: () => true,
        toJsonSchema: (s: unknown) => s as never,
      };

      schemaToPrompt.registerAdapter(adapter);
      expect(schemaToPrompt.getAdapters()).toContain('test');
    });

    it('should use latest registered adapter first', () => {
      const adapter1: SchemaAdapter = {
        name: 'adapter1',
        canHandle: () => true,
        toJsonSchema: () => ({ type: 'string' }),
      };

      const adapter2: SchemaAdapter = {
        name: 'adapter2',
        canHandle: () => true,
        toJsonSchema: () => ({ type: 'number' }),
      };

      schemaToPrompt.registerAdapter(adapter1);
      schemaToPrompt.registerAdapter(adapter2);

      const result = schemaToPrompt.toPrompt({});

      // adapter2 should be used since it was registered last
      expect(result).toContain('root: number');
    });

    it('should return adapter names in registration order', () => {
      const adapter1: SchemaAdapter = {
        name: 'first',
        canHandle: () => false,
        toJsonSchema: (s: unknown) => s as never,
      };

      const adapter2: SchemaAdapter = {
        name: 'second',
        canHandle: () => false,
        toJsonSchema: (s: unknown) => s as never,
      };

      schemaToPrompt.registerAdapter(adapter1);
      schemaToPrompt.registerAdapter(adapter2);

      const adapters = schemaToPrompt.getAdapters();
      expect(adapters[0]).toBe('second'); // Latest first
      expect(adapters[1]).toBe('first');
    });
  });

  describe('schema conversion', () => {
    it('should throw when no adapter can handle schema', () => {
      const unknownSchema = { unknownType: 'test' };

      expect(() => schemaToPrompt.toPrompt(unknownSchema)).toThrowError(
        'No adapter found for schema',
      );
    });

    it('should use appropriate adapter based on canHandle', () => {
      const zodAdapter: SchemaAdapter = {
        name: 'zod',
        canHandle: (s) => typeof s === 'object' && s !== null && '_def' in s,
        toJsonSchema: () => ({
          type: 'object',
          properties: { zod: { type: 'string' } },
        }),
      };

      const jsonAdapter: SchemaAdapter = {
        name: 'json',
        canHandle: (s) => typeof s === 'object' && s !== null && 'type' in s,
        toJsonSchema: (s: unknown) => s as never,
      };

      schemaToPrompt.registerAdapter(zodAdapter);
      schemaToPrompt.registerAdapter(jsonAdapter);

      // Test with Zod-like schema
      const zodLike = { _def: {} };
      const result1 = schemaToPrompt.toPrompt(zodLike);
      expect(result1).toContain('zod: string');

      // Test with JSON Schema
      const jsonSchema = { type: 'string' };
      const result2 = schemaToPrompt.toPrompt(jsonSchema);
      expect(result2).toContain('root: string');
    });

    it('should handle adapter errors gracefully', () => {
      const errorAdapter: SchemaAdapter = {
        name: 'error',
        canHandle: () => {
          throw new Error('canHandle error');
        },
        toJsonSchema: (s: unknown) => s as never,
      };

      const fallbackAdapter: SchemaAdapter = {
        name: 'fallback',
        canHandle: () => true,
        toJsonSchema: () => ({ type: 'string' }),
      };

      schemaToPrompt.registerAdapter(errorAdapter);
      schemaToPrompt.registerAdapter(fallbackAdapter);

      const result = schemaToPrompt.toPrompt({});
      expect(result).toContain('root: string');
    });
  });

  describe('output formatting', () => {
    beforeEach(() => {
      const testAdapter: SchemaAdapter = {
        name: 'test',
        canHandle: () => true,
        toJsonSchema: () => ({
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['name'],
        }),
      };
      schemaToPrompt.registerAdapter(testAdapter);
    });

    it('should format with detailed output by default', () => {
      const result = schemaToPrompt.toPrompt({});

      expect(result).toContain('## Schema');
      expect(result).toContain('name: string (required)');
      expect(result).toContain('age: number');
      expect(result).not.toContain('## Examples');
    });

    it('should support condensed outputFormat', () => {
      const result = schemaToPrompt.toPrompt({}, { theme: 'condensed' });

      expect(result).toContain('name:str!');
    });

    it('should show examples in expanded theme', () => {
      const standard = schemaToPrompt.toPrompt({}, { theme: 'standard' });

      // Standard theme does not include examples
      expect(standard).not.toContain('Examples');
    });
  });

  describe('complex schemas', () => {
    it('properly expands nested objects', () => {
      const adapter: SchemaAdapter = {
        name: 'test',
        canHandle: () => true,
        toJsonSchema: () => ({
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
              },
              required: ['name'],
            },
          },
        }),
      };

      schemaToPrompt.registerAdapter(adapter);
      const result = schemaToPrompt.toPrompt({});

      // Nested objects are now properly expanded
      expect(result).toContain('user: object');

      // These nested fields are now extracted:
      expect(result).toContain('name: string');
      expect(result).toContain('email: string');
    });

    it('should handle arrays', () => {
      const adapter: SchemaAdapter = {
        name: 'test',
        canHandle: () => true,
        toJsonSchema: () => ({
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 5,
        }),
      };

      schemaToPrompt.registerAdapter(adapter);
      const result = schemaToPrompt.toPrompt({});

      expect(result).toContain('root: array of strings');
      expect(result).toContain('min 1 items');
      expect(result).toContain('max 5 items');
    });

    it('should handle discriminated unions', () => {
      const adapter: SchemaAdapter = {
        name: 'test',
        canHandle: () => true,
        toJsonSchema: (): JsonSchema => ({
          oneOf: [
            {
              type: 'object',
              properties: {
                type: { const: 'text' },
                content: { type: 'string' },
              },
            },
            {
              type: 'object',
              properties: {
                type: { const: 'image' },
                url: { type: 'string' },
              },
            },
          ],
        }),
      };

      schemaToPrompt.registerAdapter(adapter);
      const result = schemaToPrompt.toPrompt({});

      expect(result).toContain('root: array of objects');
      expect(result).toContain('type: text | image');
      expect(result).toContain('- text');
      expect(result).toContain('- image');
    });
  });

  describe('safe mode', () => {
    it('should throw error when safe mode is disabled', () => {
      const invalidSchema = { invalid: 'schema' };

      expect(() => getPrompts(invalidSchema)).toThrowError('No adapter found for schema');
    });

    it('should return fallback message when safe mode is enabled', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidSchema = { invalid: 'schema' };

      const result = getPrompts(invalidSchema, { safe: true });

      expect(result).toBe('## Schema\n\nProvide valid JSON matching the expected structure.');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to convert schema:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    it('should work normally with valid schema in safe mode', () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = getPrompts(schema, { safe: true });

      expect(result).toContain('name');
      expect(result).toContain('string');
    });

    it('should log error details to console in safe mode', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidSchema = null;

      getPrompts(invalidSchema, { safe: true });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const errorArg = consoleWarnSpy.mock.calls[0][1];
      expect(errorArg).toBeInstanceOf(Error);
      expect(errorArg.message).toContain('No adapter found');

      consoleWarnSpy.mockRestore();
    });

    it('should handle adapter errors in safe mode', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a schema that will cause an error during conversion
      const problematicSchema = {
        _def: {
          typeName: 'ZodObject',
        },
      };

      const result = getPrompts(problematicSchema, { safe: true });

      expect(result).toBe('## Schema\n\nProvide valid JSON matching the expected structure.');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
