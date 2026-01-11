import type { JsonSchema } from '../../types';

/**
 * Get a human-readable type name for a variant
 */

export function getVariantType(schema: JsonSchema): string {
  if (schema.type === 'string') return 'string';
  if (schema.type === 'number') return 'number';
  if (schema.type === 'integer') return 'integer';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'object') return 'object';
  if (schema.type === 'array') return 'array';
  if (schema.enum) return 'enum';
  return 'unknown';
}
