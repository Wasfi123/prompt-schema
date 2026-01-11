import { detectFieldType } from './utils/detectFieldType';
import { unwrapNullable } from './utils/unwrapNullable';
import { extractArrayItemType } from './extractArrayItemType';
import { extractConstraints } from './extractConstraints';
import { extractObjectFields } from './extractObjectFields';
import { extractUnionData } from './extractUnionData';

import type { JsonSchema } from '../types';
import type { ExtractOptions, FieldExample, FieldType, SchemaField } from './types';

export function extractField(
  name: string,
  schema: JsonSchema,
  isRequired: boolean,
  options: ExtractOptions,
  depth: number,
): SchemaField {
  // Preserve top-level properties before unwrapping
  const topLevelDescription = schema.description;
  const topLevelExamples = schema.examples;

  // Handle nullable types
  const { actualSchema, isNullable } = unwrapNullable(schema);

  const field: SchemaField = {
    name,
    type: detectFieldType(actualSchema),
    isRequired,
    isNullable,
    description: topLevelDescription || actualSchema.description,
  };

  // Extract constraints
  field.constraints = extractConstraints(actualSchema);

  // Extract examples (prefer top-level, fall back to unwrapped schema)
  const examples = topLevelExamples || actualSchema.examples;
  const badExamples = (schema.badExamples || actualSchema.badExamples) as unknown[] | undefined;

  const allExamples: FieldExample[] = [];

  if (examples && Array.isArray(examples)) {
    allExamples.push(
      ...examples.map((value) => ({
        value,
        isCorrect: true,
      })),
    );
  }

  if (badExamples && Array.isArray(badExamples)) {
    allExamples.push(
      ...badExamples.map((value) => ({
        value,
        isCorrect: false,
      })),
    );
  }

  if (allExamples.length > 0) {
    field.examples = allExamples;
  }

  // Extract type-specific properties
  if (actualSchema.enum) {
    field.type = 'enum';
    field.enumValues = actualSchema.enum.map((v) => String(v));
  } else if (actualSchema.const !== undefined) {
    // Discriminator field
    field.type = 'enum';
    field.enumValues = [String(actualSchema.const)];
    field.discriminatorField = name;
  } else if (field.type === 'record' && actualSchema.additionalProperties) {
    // Extract record key/value types
    field.recordKeyType = 'string'; // Records always have string keys in JSON Schema
    const valueSchema = actualSchema.additionalProperties as JsonSchema;

    if (valueSchema.properties) {
      // Complex object value
      field.recordValueType = {
        name: 'value',
        type: 'object',
        isRequired: true,
        objectFields: extractObjectFields(valueSchema, options, depth + 1),
      };
    } else if (valueSchema.type && typeof valueSchema.type === 'string') {
      // Simple type value
      field.recordValueType = valueSchema.type as FieldType;
    } else {
      field.recordValueType = 'any';
    }
  } else if (field.type === 'object' && depth < (options.maxDepth || 3)) {
    if (actualSchema.properties) {
      field.objectFields = extractObjectFields(actualSchema, options, depth + 1);
    }
  } else if (field.type === 'tuple' && Array.isArray(actualSchema.items)) {
    // Extract tuple items
    field.tupleItems = actualSchema.items.map((item: JsonSchema) =>
      extractArrayItemType(item, options, depth),
    );
  } else if (field.type === 'array' && actualSchema.items) {
    field.arrayItemType = extractArrayItemType(actualSchema.items, options, depth);
  } else if (Array.isArray(actualSchema.type) && actualSchema.type.length > 1) {
    // Handle type arrays (union of primitives like ["string", "number"])
    field.type = 'union';
    field.unionTypes = actualSchema.type.map((t: string) => t as FieldType);
  } else if ((actualSchema.oneOf || actualSchema.anyOf) && depth < (options.maxDepth || 3)) {
    const unionData = extractUnionData(actualSchema, extractObjectFields, options, depth);
    if (unionData.isDiscriminated) {
      field.type = 'discriminated-union';
      field.unionVariants = unionData.variants;
      field.discriminatorField = unionData.discriminatorField;
    } else {
      field.type = 'union';
      field.unionTypes = unionData.unionTypes;
      // For simple unions, describe the types
      field.description = `Union of ${unionData.types.join(', ')}`;
    }
  }

  // Extract default value if requested
  if (options.includeDefaults && actualSchema.default !== undefined) {
    field.defaultValue = actualSchema.default;
  }

  return field;
}
