/**
 * Standard theme for clean, minimal schema documentation
 * No descriptions or examples - just the essential schema structure
 */

import { BaseTheme, type ThemeOptions } from '../types';

import type { SchemaField, SchemaModel, UnionVariant } from '../../extractors/types';

export class StandardTheme extends BaseTheme {
  name = 'standard';
  description = 'Clean, minimal format for schema documentation';

  format(model: SchemaModel, options?: ThemeOptions): string {
    let output = '## Schema\n\n';

    for (const field of model.fields) {
      output += this.formatField(field, 0, options);
    }

    return output.trim();
  }

  formatField(field: SchemaField, depth: number, options?: ThemeOptions): string {
    const indent = this.indent(depth, options);
    let output = '';

    if (field.type === 'discriminated-union' && field.unionVariants) {
      // Handle discriminated unions - first show the discriminator field with all possible values
      const discriminatorValues = field.unionVariants
        .map((v) => v.discriminatorValue)
        .join(' | ');
      const discriminatorName = field.discriminatorField || 'type';
      const modifiers = this.getModifiersString(field);

      output += `${indent}- ${field.name}: array of objects${modifiers}\n`;
      output += `${indent}  - ${discriminatorName}: ${discriminatorValues} (required)\n`;

      // Then show each variant
      for (const variant of field.unionVariants) {
        output += this.formatVariant(variant, field.name, depth + 2, options);
      }
    } else {
      // Format regular field
      const type = this.getTypeRepresentation(field);
      const modifiers = this.getModifiersString(field);

      output += `${indent}- ${field.name}: ${type}${modifiers}\n`;

      // Add nested fields
      if (field.objectFields) {
        for (const nested of field.objectFields) {
          output += this.formatField(nested, depth + 1, options);
        }
      } else if (
        field.type === 'record' &&
        typeof field.recordValueType === 'object' &&
        field.recordValueType.objectFields
      ) {
        // Show record value structure
        for (const nested of field.recordValueType.objectFields) {
          output += this.formatField(nested, depth + 1, options);
        }
      } else if (field.type === 'array' && typeof field.arrayItemType === 'object') {
        const itemField = field.arrayItemType as SchemaField;
        if (itemField.objectFields) {
          for (const nested of itemField.objectFields) {
            output += this.formatField(nested, depth + 1, options);
          }
        } else if (itemField.unionVariants && itemField.type === 'discriminated-union') {
          // Handle array of discriminated unions - show discriminator values upfront
          const discriminatorValues = itemField.unionVariants
            .map((v) => v.discriminatorValue)
            .join(' | ');
          const discriminatorName = itemField.discriminatorField || 'type';
          output += `${indent}  - ${discriminatorName}: ${discriminatorValues} (required)\n`;

          for (const variant of itemField.unionVariants) {
            output += this.formatVariant(variant, field.name, depth + 2, options);
          }
        } else if (itemField.unionVariants) {
          for (const variant of itemField.unionVariants) {
            output += this.formatVariant(variant, field.name, depth + 1, options);
          }
        }
      }
    }

    return output;
  }

  formatVariant(
    variant: UnionVariant,
    _parentName: string,
    depth: number,
    options?: ThemeOptions,
  ): string {
    const indent = this.indent(depth, options);
    let output = `${indent}- ${variant.discriminatorValue}\n`;

    for (const field of variant.fields) {
      output += this.formatField(field, depth + 1, options);
    }

    return output;
  }

  private getTypeRepresentation(field: SchemaField): string {
    // Handle enum
    if (field.type === 'enum' && field.enumValues) {
      if (field.enumValues.length === 1) {
        return field.enumValues[0];
      }
      // Use clearer formatting for enums to emphasize constraint
      const values = field.enumValues.join(' | ');
      return `MUST BE ONE OF [${values}]`;
    }

    // Handle union
    if (field.type === 'union' && field.unionTypes) {
      return field.unionTypes
        .map((t) => (typeof t === 'string' ? t : t.type))
        .join(' | ');
    }

    // Handle tuple
    if (field.type === 'tuple' && field.tupleItems) {
      const items = field.tupleItems
        .map((t) => (typeof t === 'string' ? t : t.type))
        .join(', ');
      return `[${items}]`;
    }

    // Handle record
    if (field.type === 'record' && field.recordKeyType && field.recordValueType) {
      const valueType =
        typeof field.recordValueType === 'string'
          ? field.recordValueType
          : field.recordValueType.type;
      return `Record<${field.recordKeyType}, ${valueType}>`;
    }

    // Handle array
    if (field.type === 'array') {
      if (typeof field.arrayItemType === 'string') {
        const plural = this.getPluralType(field.arrayItemType);
        return `array of ${plural}`;
      } else if (field.arrayItemType) {
        const itemField = field.arrayItemType as SchemaField;
        if (itemField.type === 'enum' && itemField.enumValues) {
          // Use maximally clear wording with explicit "EACH item MUST BE ONE OF"
          const values = itemField.enumValues.join(', ');
          return `array where EACH item MUST BE ONE OF [${values}]`;
        } else if (itemField.type === 'object') {
          return 'array of objects';
        } else if (
          itemField.type === 'discriminated-union' &&
          itemField.discriminatorField
        ) {
          return `array of objects (${itemField.discriminatorField} as discriminator)`;
        }
      }
      return 'array';
    }

    // Handle other types
    if (field.type === 'discriminated-union') {
      return 'union';
    }

    return field.type;
  }

  private getPluralType(type: string): string {
    const pluralMap: Record<string, string> = {
      string: 'strings',
      number: 'numbers',
      integer: 'integers',
      boolean: 'booleans',
      object: 'objects',
      array: 'arrays',
      any: 'any',
    };
    return pluralMap[type] || type;
  }

  private getModifiersString(field: SchemaField): string {
    const modifiers = this.formatModifiers(field);
    return modifiers.length > 0 ? ` (${modifiers.join(' • ')})` : '';
  }
}
