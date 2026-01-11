import type { JsonSchema } from '../../types';

/**
 * Unwrap nullable types to get the actual schema and nullability flag
 */

export function unwrapNullable(schema: JsonSchema): {
  actualSchema: JsonSchema;
  isNullable: boolean;
} {
  // Check for nullable pattern: anyOf with null type
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const hasNull = schema.anyOf.some((s: JsonSchema) => s.type === 'null');
    const nonNullSchemas = schema.anyOf.filter((s: JsonSchema) => s.type !== 'null');

    if (hasNull && nonNullSchemas.length === 1) {
      let actualSchema = nonNullSchemas[0];

      // Handle nested anyOf (from optional + nullable)
      if (actualSchema.anyOf && Array.isArray(actualSchema.anyOf)) {
        const innerActual = actualSchema.anyOf.find((s: JsonSchema) => !s.not);
        if (innerActual) {
          actualSchema = innerActual;
        }
      }

      return { actualSchema, isNullable: true };
    }
  }

  // Check for type array with null
  if (Array.isArray(schema.type) && schema.type.includes('null')) {
    const nonNullTypes = schema.type.filter((t: string) => t !== 'null');
    return {
      actualSchema: {
        ...schema,
        type: nonNullTypes.length === 1 ? nonNullTypes[0] : nonNullTypes,
      },
      isNullable: true,
    };
  }

  return { actualSchema: schema, isNullable: false };
}
