import { extractToModel } from './extractors/extractToModel';
import { formatModel } from './formatters/formatModel';

import type { ThemeStyle } from './formatters/types';
import type { JsonSchema, SchemaAdapter } from './types';

export interface PromptOptions {
  theme?: ThemeStyle;
  maxDepth?: number;
  safe?: boolean;
}

interface ProcessOptions {
  safe?: boolean;
}

export interface ContextOptions extends PromptOptions, ProcessOptions {}

export class PromptSchema {
  private adapters: SchemaAdapter[] = [];

  registerAdapter(adapter: SchemaAdapter): this {
    this.adapters.unshift(adapter);
    return this;
  }

  toPrompt(schema: unknown, options: PromptOptions = {}): string {
    const adapter = this.adapters.find((a) => {
      try {
        return a.canHandle(schema);
      } catch {
        return false;
      }
    });

    if (!adapter) {
      throw new Error(
        `No adapter found for schema. Registered adapters: ${this.adapters.map((a) => a.name).join(', ')}`,
      );
    }

    const jsonSchema = adapter.toJsonSchema(schema);
    return this.formatWithModel(jsonSchema, options);
  }

  private formatWithModel(schema: JsonSchema, options: PromptOptions): string {
    const model = extractToModel(schema, {
      maxDepth: options.maxDepth,
    });

    const style: ThemeStyle = options.theme || 'standard';

    return formatModel(model, {
      style,
    });
  }

  getAdapters(): string[] {
    return this.adapters.map((a) => a.name);
  }
}
