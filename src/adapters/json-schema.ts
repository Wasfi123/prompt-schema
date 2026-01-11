/**
 * JSON Schema passthrough adapter
 */

import type { JsonSchema, SchemaAdapter } from '../types';

export const jsonSchemaAdapter: SchemaAdapter<JsonSchema> = {
  name: 'json-schema',

  canHandle: (schema: unknown): boolean => {
    if (!schema || typeof schema !== 'object') return false;

    return (
      'type' in schema ||
      'properties' in schema ||
      'items' in schema ||
      'oneOf' in schema ||
      'anyOf' in schema ||
      'allOf' in schema ||
      '$schema' in schema ||
      '$ref' in schema
    );
  },

  toJsonSchema: (schema: JsonSchema) => {
    return schema;
  },
};
