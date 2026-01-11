import type { JsonSchema } from '../../types';

/**
 * Find the discriminator field in a union of schemas
 */

export function findDiscriminator(variants: JsonSchema[]): string | null {
  // Check common discriminator field names
  for (const fieldName of ['type', 'kind', 'discriminator']) {
    if (variants.every((v) => v.properties?.[fieldName]?.const !== undefined)) {
      return fieldName;
    }
  }
  return null;
}
