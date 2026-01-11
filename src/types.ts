export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  description?: string;
  title?: string;
  examples?: unknown[];
  default?: unknown;
  $schema?: string;
  $ref?: string;
  definitions?: Record<string, JsonSchema>;
  not?: JsonSchema;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalProperties?: JsonSchema;
  [key: string]: unknown;
}

export interface SchemaAdapter<T = unknown> {
  name: string;
  canHandle: (schema: unknown) => boolean;
  toJsonSchema: (schema: T, options?: unknown) => JsonSchema;
}
