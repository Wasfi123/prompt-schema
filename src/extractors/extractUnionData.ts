import { findDiscriminator } from './utils/findDiscriminator';
import { getVariantType } from './utils/getVariantType';

import type { JsonSchema } from '../types';
import type { ExtractOptions, FieldType, SchemaField, UnionVariant } from './types';

export interface UnionData {
  isDiscriminated: boolean;
  variants?: UnionVariant[];
  discriminatorField?: string;
  types: string[];
  unionTypes?: (FieldType | SchemaField)[];
}

/**
 * Extract union data from a schema with oneOf/anyOf
 */

export function extractUnionData(
  schema: JsonSchema,
  extractObjectFields: (
    schema: JsonSchema,
    options: ExtractOptions,
    depth: number,
  ) => SchemaField[],
  options: ExtractOptions,
  depth: number,
): UnionData {
  const variants = schema.oneOf || schema.anyOf || [];

  // Check for discriminated union
  const discriminatorField = findDiscriminator(variants);

  if (discriminatorField) {
    const unionVariants: UnionVariant[] = [];

    for (const variant of variants) {
      const discriminatorValue = variant.properties?.[discriminatorField]?.const;
      if (discriminatorValue !== undefined) {
        unionVariants.push({
          discriminatorValue: String(discriminatorValue),
          fields: extractObjectFields(variant, options, depth + 1),
        });
      }
    }

    return {
      isDiscriminated: true,
      variants: unionVariants,
      discriminatorField,
      types: [],
    };
  }

  // Non-discriminated union - collect both type names and actual types
  const types: string[] = [];
  const unionTypes: (FieldType | SchemaField)[] = [];

  for (const variant of variants) {
    const typeName = getVariantType(variant);
    types.push(typeName);

    // Extract the actual type for proper rendering
    // Check for enum FIRST, as it may also have type: "string"
    if (variant.enum) {
      // Enum variant
      unionTypes.push({
        name: 'variant',
        type: 'enum',
        isRequired: true,
        enumValues: variant.enum.map((v: unknown) => String(v)),
      });
    } else if (variant.properties) {
      // Complex object - extract as SchemaField
      const fields = extractObjectFields(variant, options, depth + 1);
      unionTypes.push({
        name: 'variant',
        type: 'object',
        isRequired: true,
        objectFields: fields,
      });
    } else if (variant.type && typeof variant.type === 'string') {
      // Simple primitive type
      unionTypes.push(variant.type as FieldType);
    } else {
      // Fallback to type name
      unionTypes.push('any' as FieldType);
    }
  }

  return {
    isDiscriminated: false,
    types,
    unionTypes,
  };
}
