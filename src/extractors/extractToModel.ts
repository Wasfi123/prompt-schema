import { extractArrayField } from './extractArrayField';
import { extractField } from './extractField';
import { extractObjectFields } from './extractObjectFields';
import { extractUnionField } from './extractUnionField';

import type { JsonSchema } from '../types';
import type { ExtractOptions, SchemaModel } from './types';

const OPTIONS: ExtractOptions = {
  maxDepth: 3,
  includeDefaults: false,
};

export function extractToModel(schema: JsonSchema, options?: ExtractOptions): SchemaModel {
  const opts = { ...OPTIONS, ...options };

  const model: SchemaModel = {
    fields: [],
    metadata: {
      title: schema.title,
      description: schema.description,
      examples: schema.examples,
    },
  };

  // Extract root-level fields
  if (schema.type === 'object' && schema.properties) {
    model.fields = extractObjectFields(schema, opts, 0);
  } else if (schema.type === 'array' && schema.items) {
    // Root array
    const arrayField = extractArrayField('root', schema, true, opts, 0);
    model.fields = [arrayField];
  } else if (schema.oneOf || schema.anyOf) {
    // Root union
    const unionField = extractUnionField('root', schema, true, opts, 0);
    model.fields = [unionField];
  } else {
    // Primitive root
    const field = extractField('root', schema, true, opts, 0);
    model.fields = [field];
  }

  return model;
}
