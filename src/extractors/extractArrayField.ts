import { extractArrayItemType } from './extractArrayItemType';
import { extractConstraints } from './extractConstraints';

import type { JsonSchema } from '../types';
import type { ExtractOptions, SchemaField } from './types';

export function extractArrayField(
  name: string,
  schema: JsonSchema,
  isRequired: boolean,
  options: ExtractOptions,
  depth: number,
): SchemaField {
  const field: SchemaField = {
    name,
    type: 'array',
    isRequired,
    description: schema.description,
  };

  field.constraints = extractConstraints(schema);

  if (schema.items) {
    field.arrayItemType = extractArrayItemType(schema.items, options, depth);
  }

  return field;
}
