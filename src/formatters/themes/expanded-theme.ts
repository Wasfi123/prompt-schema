/**
 * Expanded theme with full details
 * Includes descriptions, examples, and all metadata
 */

import {
  type SchemaField,
  type SchemaModel,
  type UnionVariant,
} from '../../extractors/types';
import { BaseTheme, type ThemeOptions } from '../types';

export class ExpandedTheme extends BaseTheme {
  name = 'expanded';
  description = 'Full detail format with descriptions and examples';

  format(model: SchemaModel, options?: ThemeOptions): string {
    let output = '## Schema\n\n';

    for (const field of model.fields) {
      output += this.formatField(field, 0, options);
    }

    // Always include examples if available
    if (model.metadata?.examples?.length) {
      output += '\n## Examples\n\n';
      output += '```json\n';
      output += JSON.stringify(model.metadata.examples[0], null, 2);
      output += '\n```\n';
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

      // Add description as sub-item if present
      if (field.description) {
        output += `${indent}  - ${field.description}\n`;
      }

      // Add examples if present
      if (field.examples && field.examples.length > 0) {
        const exampleValues = field.examples
          .map((ex) => JSON.stringify(ex.value))
          .join(', ');
        output += `${indent}  - Examples: ${exampleValues}\n`;
      }

      output += `${indent}  - ${discriminatorName}: Must be one of ${discriminatorValues} (required)\n`;

      // Then show each variant
      for (const variant of field.unionVariants) {
        output += this.formatVariant(variant, field.name, depth + 2, options);
      }
    } else {
      // Format regular field
      const type = this.getTypeRepresentation(field);
      const modifiers = this.getModifiersString(field);

      // Build first line: name, type, modifiers (no description inline)
      output += `${indent}- ${field.name}: ${type}${modifiers}\n`;

      // For enum arrays, add an extra critical warning immediately
      if (
        field.type === 'array' &&
        typeof field.arrayItemType === 'object' &&
        (field.arrayItemType as SchemaField).type === 'enum'
      ) {
        const itemField = field.arrayItemType as SchemaField;
        if (itemField.enumValues) {
          output += `${indent}  - ⚠️ CRITICAL: Values MUST be from the list above. No other values are valid.\n`;
        }
      }

      // Add description as sub-item if present
      if (field.description) {
        output += `${indent}  - ${field.description}\n`;
      }

      // Add examples on separate line if present
      if (field.examples && field.examples.length > 0) {
        const correctExamples = field.examples.filter((ex) => ex.isCorrect);
        const incorrectExamples = field.examples.filter((ex) => !ex.isCorrect);

        if (correctExamples.length > 0) {
          const exampleValues = correctExamples
            .map((ex) => JSON.stringify(ex.value))
            .join(', ');
          output += `${indent}  - Examples: ${exampleValues}\n`;
        }

        if (incorrectExamples.length > 0) {
          const badExampleValues = incorrectExamples
            .map((ex) => JSON.stringify(ex.value))
            .join(', ');
          output += `${indent}  - ❌ INVALID Examples (DO NOT USE): ${badExampleValues}\n`;
        }
      }

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

          // Add description if present on the item field
          if (itemField.description) {
            output += `${indent}  - ${itemField.description}\n`;
          }

          // Add examples if present on the item field
          if (itemField.examples && itemField.examples.length > 0) {
            const exampleValues = itemField.examples
              .map((ex) => JSON.stringify(ex.value))
              .join(', ');
            output += `${indent}  - Examples: ${exampleValues}\n`;
          }

          const discriminatorValues = itemField.unionVariants
            .map((v) => v.discriminatorValue)
            .join(' | ');
          const discriminatorName = itemField.discriminatorField || 'type';
          output += `${indent}  - ${discriminatorName}: Must be one of ${discriminatorValues} (required)\n`;

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

    // Handle union - check if it contains an enum variant
    if (field.type === 'union' && field.unionTypes) {
      // Look for enum variants in the union
      const enumVariant = field.unionTypes.find(
        (t) => typeof t === 'object' && t.type === 'enum' && t.enumValues,
      );

      if (enumVariant && typeof enumVariant === 'object' && enumVariant.enumValues) {
        // Union contains enum - show enum values as the expected type
        const values = enumVariant.enumValues.join(' | ');
        return `MUST BE ONE OF [${values}]`;
      }

      // Regular union without enum
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
