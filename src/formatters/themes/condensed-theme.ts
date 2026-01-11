/**
 * Condensed theme for minimal token usage
 */

import {
  type SchemaField,
  type SchemaModel,
  type UnionVariant,
} from '../../extractors/types';
import { BaseTheme, type ThemeOptions } from '../types';

export class CondensedTheme extends BaseTheme {
  name = 'condensed';
  description = 'Ultra-compact format for minimal token usage in AI prompts';

  format(model: SchemaModel, options?: ThemeOptions): string {
    let output = '';

    for (const field of model.fields) {
      output += this.formatField(field, 0, options);
    }

    return output.trim();
  }

  formatField(field: SchemaField, depth: number, options?: ThemeOptions): string {
    const indent = this.indent(depth, options);
    let output = '';

    if (field.type === 'discriminated-union' && field.unionVariants) {
      // Compact discriminated union representation
      const discriminatorValues = field.unionVariants
        .map((v) => v.discriminatorValue)
        .join('|');
      const discriminatorName = field.discriminatorField || 'type';
      const req = field.isRequired ? '!' : '?';

      output += `${indent}${field.name}:obj[]${req}\n`;
      output += `${indent}  ${discriminatorName}:${discriminatorValues}!\n`;

      for (const variant of field.unionVariants) {
        output += this.formatVariant(variant, field.name, depth + 2, options);
      }
    } else {
      // Ultra-compact field representation
      const type = this.getCompactType(field);
      const req = field.isRequired ? '!' : '?';
      output += `${indent}${field.name}:${type}${req}`;

      // Add critical constraints inline
      const constraints = this.getCriticalConstraints(field);
      if (constraints) {
        output += `[${constraints}]`;
      }
      output += '\n';

      // Nested fields with minimal indentation
      if (field.objectFields) {
        for (const nested of field.objectFields) {
          output += this.formatField(nested, depth + 1, options);
        }
      } else if (field.type === 'array' && typeof field.arrayItemType === 'object') {
        const itemField = field.arrayItemType as SchemaField;
        if (itemField.objectFields) {
          for (const nested of itemField.objectFields) {
            output += this.formatField(nested, depth + 1, options);
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
    let output = `${indent}=${variant.discriminatorValue}:\n`;

    for (const field of variant.fields) {
      output += this.formatField(field, depth + 1, options);
    }

    return output;
  }

  private getCompactType(field: SchemaField): string {
    // Ultra-compact type representations
    if (field.type === 'string') return 'str';
    if (field.type === 'number') return 'num';
    if (field.type === 'integer') return 'int';
    if (field.type === 'boolean') return 'bool';
    if (field.type === 'object') return 'obj';
    if (field.type === 'date') return 'date';
    if (field.type === 'any') return 'any';

    if (field.type === 'union' && field.unionTypes) {
      return field.unionTypes
        .map((t) => (typeof t === 'string' ? this.getCompactPrimitive(t) : t.type))
        .join('|');
    }

    if (field.type === 'tuple' && field.tupleItems) {
      const items = field.tupleItems
        .map((t) => (typeof t === 'string' ? this.getCompactPrimitive(t) : t.type))
        .join(',');
      return `[${items}]`;
    }

    if (field.type === 'record' && field.recordKeyType && field.recordValueType) {
      const valueType =
        typeof field.recordValueType === 'string'
          ? this.getCompactPrimitive(field.recordValueType)
          : field.recordValueType.type;
      return `Rec<${this.getCompactPrimitive(field.recordKeyType)},${valueType}>`;
    }

    if (field.type === 'enum' && field.enumValues) {
      if (field.enumValues.length === 1) {
        return field.enumValues[0];
      }
      // Show first few values for enums
      const values = field.enumValues.slice(0, 3).join('|');
      return field.enumValues.length > 3 ? `${values}...` : values;
    }

    if (field.type === 'array') {
      if (typeof field.arrayItemType === 'string') {
        return `${this.getCompactPrimitive(field.arrayItemType)}[]`;
      }
      const itemField = field.arrayItemType as SchemaField;
      if (itemField?.type === 'enum' && itemField.enumValues) {
        const values = itemField.enumValues.slice(0, 2).join('|');
        return itemField.enumValues.length > 2 ? `[${values}...]` : `[${values}]`;
      }
      return itemField ? `${itemField.type}[]` : 'arr';
    }

    return field.type;
  }

  private getCompactPrimitive(type: string): string {
    const map: Record<string, string> = {
      string: 'str',
      number: 'num',
      integer: 'int',
      boolean: 'bool',
      object: 'obj',
    };
    return map[type] || type;
  }

  private getCriticalConstraints(field: SchemaField): string {
    const critical: string[] = [];

    if (field.constraints) {
      for (const c of field.constraints) {
        // Only include critical numeric constraints
        if (c.type === 'min' || c.type === 'minLength' || c.type === 'minItems') {
          critical.push(`≥${c.value}`);
        } else if (c.type === 'max' || c.type === 'maxLength' || c.type === 'maxItems') {
          critical.push(`≤${c.value}`);
        } else if (c.type === 'format' && c.value === 'email') {
          critical.push('@');
        } else if (c.type === 'format' && c.value === 'uri') {
          critical.push('url');
        }
      }
    }

    return critical.join(',');
  }
}
