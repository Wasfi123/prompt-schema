import { type FieldConstraint } from './types';

import type { JsonSchema } from '../types';

/**
 * Extract all constraints from a schema
 */

export function extractConstraints(schema: JsonSchema): FieldConstraint[] {
  const constraints: FieldConstraint[] = [];

  // String constraints
  if (schema.minLength !== undefined) {
    constraints.push({
      type: 'minLength',
      value: schema.minLength,
      display: `min ${schema.minLength} chars`,
    });
  }
  if (schema.maxLength !== undefined) {
    constraints.push({
      type: 'maxLength',
      value: schema.maxLength,
      display: `max ${schema.maxLength} chars`,
    });
  }
  if (schema.pattern) {
    constraints.push({
      type: 'pattern',
      value: schema.pattern,
      display: `pattern: ${schema.pattern}`,
    });
  }
  if (schema.format) {
    constraints.push({
      type: 'format',
      value: schema.format,
      display: `format: ${schema.format}`,
    });
  }

  // Number constraints
  if (schema.minimum !== undefined) {
    constraints.push({
      type: 'min',
      value: schema.minimum,
      display: `min: ${schema.minimum}`,
    });
  }
  if (schema.maximum !== undefined) {
    constraints.push({
      type: 'max',
      value: schema.maximum,
      display: `max: ${schema.maximum}`,
    });
  }

  // Array constraints
  if (schema.minItems !== undefined) {
    constraints.push({
      type: 'minItems',
      value: schema.minItems,
      display: `min ${schema.minItems} items`,
    });
  }
  if (schema.maxItems !== undefined) {
    constraints.push({
      type: 'maxItems',
      value: schema.maxItems,
      display: `max ${schema.maxItems} items`,
    });
  }

  return constraints;
}
