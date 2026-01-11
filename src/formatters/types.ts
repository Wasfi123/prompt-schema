/**
 * Interface for schema themes
 * Each theme defines how to render a schema model
 */

import type { SchemaField, SchemaModel, UnionVariant } from '../extractors/types';

export type ThemeStyle = 'condensed' | 'standard' | 'expanded' | 'json';

export interface ThemeFormatOptions {
  style?: ThemeStyle;
  indentSize?: number;
}

/**
 * Base theme interface that all themes must implement
 */
export interface SchemaTheme {
  name: string;
  description: string;

  /**
   * Format a complete schema model
   */
  format(model: SchemaModel, options?: ThemeOptions): string;

  /**
   * Format a single field
   */
  formatField(field: SchemaField, depth: number, options?: ThemeOptions): string;

  /**
   * Format a union variant
   */
  formatVariant?(
    variant: UnionVariant,
    parentName: string,
    depth: number,
    options?: ThemeOptions,
  ): string;
}

/**
 * Options that can be passed to themes
 */
export interface ThemeOptions {
  indentSize?: number;
  maxLineWidth?: number;
  [key: string]: unknown;
}

/**
 * Abstract base class providing common functionality
 */
export abstract class BaseTheme implements SchemaTheme {
  abstract name: string;
  abstract description: string;

  protected indentSize = 2;

  abstract format(model: SchemaModel, options?: ThemeOptions): string;
  abstract formatField(field: SchemaField, depth: number, options?: ThemeOptions): string;

  /**
   * Generate indentation string
   */
  protected indent(depth: number, options?: ThemeOptions): string {
    const size = options?.indentSize ?? this.indentSize;
    return ' '.repeat(depth * size);
  }

  /**
   * Format field type representation
   */
  protected formatType(field: SchemaField): string {
    if (field.type === 'enum' && field.enumValues) {
      return field.enumValues.join(' | ');
    }

    if (field.type === 'array') {
      if (typeof field.arrayItemType === 'string') {
        return `${field.arrayItemType}[]`;
      } else if (field.arrayItemType) {
        const itemField = field.arrayItemType as SchemaField;
        if (itemField.type === 'enum' && itemField.enumValues) {
          return `(${itemField.enumValues.join(' | ')})[]`;
        }
        return `${itemField.type}[]`;
      }
      return 'array';
    }

    return field.type;
  }

  /**
   * Format field modifiers (constraints, required, etc.)
   */
  protected formatModifiers(field: SchemaField, includeRequired = true): string[] {
    const modifiers: string[] = [];

    if (includeRequired && field.isRequired) {
      modifiers.push('required');
    }

    if (field.isNullable) {
      modifiers.push('nullable');
    }

    if (field.constraints) {
      for (const constraint of field.constraints) {
        modifiers.push(constraint.display || `${constraint.type}: ${constraint.value}`);
      }
    }

    return modifiers;
  }

  /**
   * Check if field has nested structure
   */
  protected hasNestedStructure(field: SchemaField): boolean {
    return !!(
      field.objectFields?.length ||
      field.unionVariants?.length ||
      (field.type === 'array' &&
        typeof field.arrayItemType === 'object' &&
        (field.arrayItemType as SchemaField).objectFields?.length)
    );
  }
}
