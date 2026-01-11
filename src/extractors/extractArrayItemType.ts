import { extractObjectFields } from './extractObjectFields';
import { extractUnionField } from './extractUnionField';

import type { JsonSchema } from '../types';
import type { ExtractOptions, FieldType, SchemaField } from './types';

export function extractArrayItemType(
  itemSchema: JsonSchema,
  options: ExtractOptions,
  depth: number,
): FieldType | SchemaField {
  // Handle union types first - check if it contains an enum
  if (itemSchema.oneOf || itemSchema.anyOf) {
    const unionField = extractUnionField('item', itemSchema, true, options, depth + 1);

    // If this union contains an enum, extract it for display
    if (unionField.type === 'union' && unionField.unionTypes) {
      const enumVariant = unionField.unionTypes.find(
        (t) => typeof t === 'object' && t.type === 'enum' && t.enumValues,
      );

      if (enumVariant && typeof enumVariant === 'object' && enumVariant.enumValues) {
        // Return the enum variant so it displays prominently
        return {
          name: 'item',
          type: 'enum' as FieldType,
          enumValues: enumVariant.enumValues,
          isRequired: true,
        };
      }
    }

    return unionField;
  }

  // Simple types
  if (itemSchema.type && typeof itemSchema.type === 'string' && !itemSchema.properties) {
    if (itemSchema.enum) {
      return {
        name: 'item',
        type: 'enum' as FieldType,
        enumValues: itemSchema.enum.map((v) => String(v)),
        isRequired: true,
      };
    }
    return itemSchema.type as FieldType;
  }

  // Complex types - return full SchemaField
  if (itemSchema.type === 'object' || itemSchema.properties) {
    return {
      name: 'item',
      type: 'object',
      isRequired: true,
      objectFields: extractObjectFields(itemSchema, options, depth + 1),
    };
  }

  return 'any';
}
