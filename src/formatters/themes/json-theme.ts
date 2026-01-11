/**
 * JSON theme for programmatic schema output
 * Includes all available data (descriptions, examples, defaults)
 */

import { BaseTheme, type ThemeOptions } from '../types';

import type { SchemaField, SchemaModel, UnionVariant } from '../../extractors/types';

export class JSONTheme extends BaseTheme {
  name = 'json';
  description = 'Structured JSON output for programmatic consumption';

  format(model: SchemaModel, options?: ThemeOptions): string {
    const output = this.modelToJson(model);
    const indent = options?.indentSize ?? 2;
    return JSON.stringify(output, null, indent);
  }

  formatField(field: SchemaField, _depth: number, options?: ThemeOptions): string {
    // For JSON theme, we convert directly to object
    const fieldObj = this.fieldToJson(field);
    const indent = options?.indentSize ?? 2;
    return JSON.stringify(fieldObj, null, indent);
  }

  private modelToJson(model: SchemaModel): unknown {
    return {
      schema: {
        fields: model.fields.map((f) => this.fieldToJson(f)),
        metadata: model.metadata,
      },
    };
  }

  private fieldToJson(field: SchemaField): Record<string, unknown> {
    const obj: Record<string, unknown> = {
      name: field.name,
      type: this.getJsonType(field),
      required: field.isRequired,
    };

    // Add nullable if true
    if (field.isNullable) {
      obj.nullable = true;
    }

    // Always include description if present
    if (field.description) {
      obj.description = field.description;
    }

    // Add constraints
    if (field.constraints && field.constraints.length > 0) {
      obj.constraints = {};
      for (const c of field.constraints) {
        (obj.constraints as Record<string, unknown>)[c.type] = c.value;
      }
    }

    // Add enum values
    if (field.enumValues) {
      obj.enum = field.enumValues;
    }

    // Add examples
    if (field.examples) {
      obj.examples = field.examples;
    }

    // Add nested fields
    if (field.objectFields) {
      obj.properties = {};
      for (const nested of field.objectFields) {
        (obj.properties as Record<string, unknown>)[nested.name] = this.fieldToJson(nested);
      }
    }

    // Handle arrays
    if (field.type === 'array' && field.arrayItemType) {
      if (typeof field.arrayItemType === 'string') {
        obj.items = { type: field.arrayItemType };
      } else {
        obj.items = this.fieldToJson(field.arrayItemType as SchemaField);
      }
    }

    // Handle tuples
    if (field.type === 'tuple' && field.tupleItems) {
      obj.items = field.tupleItems.map((t) =>
        typeof t === 'string' ? { type: t } : this.fieldToJson(t as SchemaField),
      );
    }

    // Handle records
    if (field.type === 'record' && field.recordValueType) {
      obj.additionalProperties =
        typeof field.recordValueType === 'string'
          ? { type: field.recordValueType }
          : this.fieldToJson(field.recordValueType as SchemaField);
    }

    // Handle discriminated unions
    if (field.unionVariants) {
      obj.oneOf = field.unionVariants.map((v) => this.variantToJson(v, field.discriminatorField));
      if (field.discriminatorField) {
        obj.discriminator = field.discriminatorField;
      }
    }

    // Handle regular unions
    if (field.unionTypes) {
      obj.anyOf = field.unionTypes.map((t) =>
        typeof t === 'string' ? { type: t } : this.fieldToJson(t as SchemaField),
      );
    }

    // Add default value if present
    if (field.defaultValue !== undefined) {
      obj.default = field.defaultValue;
    }

    return obj;
  }

  private variantToJson(
    variant: UnionVariant,
    discriminatorField?: string,
  ): Record<string, unknown> {
    const obj: Record<string, unknown> = {
      type: 'object',
      properties: {},
    };

    if (discriminatorField) {
      (obj.properties as Record<string, unknown>)[discriminatorField] = {
        const: variant.discriminatorValue,
      };
    }

    for (const field of variant.fields) {
      // Skip the discriminator field itself
      if (field.name === discriminatorField) {
        continue;
      }
      (obj.properties as Record<string, unknown>)[field.name] = this.fieldToJson(field);
    }

    obj.required = variant.fields
      .filter((f) => f.isRequired && f.name !== discriminatorField)
      .map((f) => f.name);

    if (discriminatorField && !(obj.required as string[]).includes(discriminatorField)) {
      (obj.required as string[]).unshift(discriminatorField);
    }

    return obj;
  }

  private getJsonType(field: SchemaField): string {
    if (field.type === 'enum') {
      return field.enumValues?.length === 1 ? 'const' : 'enum';
    }

    if (field.type === 'discriminated-union') {
      return 'oneOf';
    }

    const typeMap: Record<string, string> = {
      integer: 'integer',
      number: 'number',
      string: 'string',
      boolean: 'boolean',
      object: 'object',
      array: 'array',
      date: 'string',
      record: 'object',
      tuple: 'array',
      any: 'any',
      union: 'anyOf',
    };

    return typeMap[field.type] || field.type;
  }
}
