import { zodV3Adapter } from './adapters/zod-v3';
import { zodV4Adapter } from './adapters/zod-v4';
import { jsonSchemaAdapter } from './adapters/json-schema';
import { type ContextOptions, PromptSchema } from './PromptSchema';

export { PromptSchema, zodV3Adapter, zodV4Adapter, jsonSchemaAdapter };
export type { ContextOptions };
export type { SchemaAdapter, JsonSchema } from './types';

export function getPrompts(schema: unknown, options?: ContextOptions): string {
  const converter = new PromptSchema();

  if (typeof schema === 'object' && schema !== null && '_zod' in schema) {
    converter.registerAdapter(zodV4Adapter);
  } else {
    converter.registerAdapter(zodV3Adapter);
  }

  try {
    return converter.toPrompt(schema, options);
  } catch (error) {
    if (options?.safe) {
      console.warn('Failed to convert schema:', error);
      return '## Schema\n\nProvide valid JSON matching the expected structure.';
    }
    throw error;
  }
}
