/**
 * Intermediate model for schema representation
 * This decouples extraction from formatting and provides a clean data structure
 */

export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'enum'
  | 'date'
  | 'union'
  | 'discriminated-union'
  | 'record'
  | 'tuple'
  | 'any';

export interface FieldConstraint {
  type: 'min' | 'max' | 'pattern' | 'format' | 'minItems' | 'maxItems' | 'minLength' | 'maxLength';
  value: string | number;
  display?: string; // Optional custom display text
}

export interface FieldExample {
  value: unknown;
  isCorrect: boolean;
  description?: string;
}

export interface UnionVariant {
  discriminatorValue: string;
  fields: SchemaField[];
}

export interface SchemaField {
  // Core properties
  name: string;
  type: FieldType;
  isRequired: boolean;
  isNullable?: boolean;

  // Type-specific properties
  enumValues?: string[];
  arrayItemType?: FieldType | SchemaField; // For arrays
  tupleItems?: (FieldType | SchemaField)[]; // For tuples
  recordKeyType?: FieldType; // For records (usually 'string')
  recordValueType?: FieldType | SchemaField; // For records
  objectFields?: SchemaField[]; // For nested objects
  unionVariants?: UnionVariant[]; // For discriminated unions
  unionTypes?: (FieldType | SchemaField)[]; // For regular unions
  discriminatorField?: string; // Name of the discriminator field

  // Metadata
  description?: string;
  constraints?: FieldConstraint[];
  examples?: FieldExample[];
  defaultValue?: unknown;

  // Display hints for formatters
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface SchemaModel {
  fields: SchemaField[];
  metadata?: {
    title?: string;
    description?: string;
    version?: string;
    examples?: unknown[];
  };
}

/**
 * Options for extracting schema to model
 */
export interface ExtractOptions {
  maxDepth?: number;
  includeDefaults?: boolean;
}
