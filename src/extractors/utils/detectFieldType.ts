import type { JsonSchema } from '../../types';
import type { FieldType } from '../types';

/**
 * Detect the field type from a JSON Schema
 */

export function detectFieldType(schema: JsonSchema): FieldType {
  if (schema.enum) return 'enum';
  if (schema.const !== undefined) return 'enum';
  if (schema.oneOf || schema.anyOf) return 'union';
  if (schema.allOf) return 'object'; // Intersection treated as object

  // Handle type arrays (union of primitives)
  if (Array.isArray(schema.type) && schema.type.length > 1) {
    return 'union';
  }

  if (schema.type === 'object') {
    if (schema.additionalProperties && !schema.properties) {
      return 'record';
    }
    return 'object';
  }

  if (schema.type === 'array') {
    if (Array.isArray(schema.items)) {
      return 'tuple';
    }
    return 'array';
  }

  if (schema.type === 'string' && schema.format === 'date-time') {
    return 'date';
  }

  if (schema.type === 'integer') return 'integer';
  if (schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'string') return 'string';

  return 'any';
}
