import { zodToJsonSchema } from 'zod-to-json-schema';

import type { JsonSchema, SchemaAdapter } from '../types';

export const zodV3Adapter: SchemaAdapter = {
  name: 'zod-v3',

  canHandle: (schema: unknown): boolean => {
    return (
      typeof schema === 'object' &&
      schema !== null &&
      '_def' in schema &&
      typeof (schema as Record<string, unknown>)._def === 'object' &&
      (schema as Record<string, unknown>)._def !== null &&
      'typeName' in (schema as { _def: Record<string, unknown> })._def &&
      !('_zod' in schema)
    );
  },

  toJsonSchema: (schema: unknown, options?: unknown): JsonSchema => {
    return zodToJsonSchema(schema as never, {
      target: 'jsonSchema7',
      $refStrategy: 'none',
      strictUnions: true,
      ...(options as Record<string, unknown>),
    }) as JsonSchema;
  },
};
