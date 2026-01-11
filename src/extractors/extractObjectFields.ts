import { extractField } from './extractField';

import type { JsonSchema } from '../types';
import type { ExtractOptions, SchemaField } from './types';

export function extractObjectFields(
  schema: JsonSchema,
  options: ExtractOptions,
  depth: number,
): SchemaField[] {
  const fields: SchemaField[] = [];
  const required = new Set(schema.required || []);

  if (schema.properties) {
    for (const [name, fieldSchema] of Object.entries(schema.properties)) {
      const field = extractField(name, fieldSchema, required.has(name), options, depth);
      fields.push(field);
    }
  }

  // Sort: discriminator fields first, then required, then optional
  fields.sort((a, b) => {
    if (a.discriminatorField && !b.discriminatorField) return -1;
    if (!a.discriminatorField && b.discriminatorField) return 1;
    if (a.isRequired && !b.isRequired) return -1;
    if (!a.isRequired && b.isRequired) return 1;
    return 0;
  });

  return fields;
}
