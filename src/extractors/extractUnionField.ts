import { extractObjectFields } from './extractObjectFields';
import { extractUnionData } from './extractUnionData';

import type { JsonSchema } from '../types';
import type { ExtractOptions, SchemaField } from './types';

export function extractUnionField(
  name: string,
  schema: JsonSchema,
  isRequired: boolean,
  options: ExtractOptions,
  depth: number,
): SchemaField {
  const unionData = extractUnionData(schema, extractObjectFields, options, depth);

  if (unionData.isDiscriminated) {
    return {
      name,
      type: 'discriminated-union',
      isRequired,
      unionVariants: unionData.variants,
      discriminatorField: unionData.discriminatorField,
    };
  }

  return {
    name,
    type: 'union',
    isRequired,
    unionTypes: unionData.unionTypes,
    description: `Union of ${unionData.types.join(', ')}`,
  };
}
