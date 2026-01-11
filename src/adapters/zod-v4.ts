import { toJSONSchema } from 'zod/v4/core';

import type { JsonSchema, SchemaAdapter } from '../types';

export const zodV4Adapter: SchemaAdapter = {
  name: 'zod-v4',

  canHandle: (schema: unknown): boolean => {
    return typeof schema === 'object' && schema !== null && '_zod' in schema;
  },

  toJsonSchema: (schema: unknown): JsonSchema => {
    return toJSONSchema(schema as never) as JsonSchema;
  },
};
