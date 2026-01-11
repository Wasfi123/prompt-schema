/**
 * Integration tests that verify actual prompts and expose current limitations
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod/v3';
import { getPrompts } from '../src';

describe('Integration Tests - Real Output Verification', () => {
  describe('What Currently Works', () => {
    it('should handle flat schemas correctly', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().min(0),
        email: z.string().email(),
      });

      const prompts = getPrompts(schema);

      expect(prompts).toContain('## Schema');
      expect(prompts).toContain('name: string (required)');
      expect(prompts).toContain('age: number (required • min: 0)');
      expect(prompts).toContain('email: string (required • format: email)');
      expect(prompts).not.toContain('## Examples');
    });

    it('should handle arrays with constraints', () => {
      const schema = z.object({
        tags: z.array(z.string()).min(1).max(5),
      });

      const prompts = getPrompts(schema);

      expect(prompts).toContain('tags: array of strings');
      expect(prompts).toContain('min 1 items');
      expect(prompts).toContain('max 5 items');
    });

    it('should handle enums correctly', () => {
      const schema = z.object({
        status: z.enum(['active', 'inactive', 'pending']),
      });

      const prompts = getPrompts(schema);

      expect(prompts).toContain('status: MUST BE ONE OF [active | inactive | pending]');
    });

    it('should handle discriminated unions', () => {
      const schema = z.object({
        notification: z.discriminatedUnion('type', [
          z.object({ type: z.literal('email'), to: z.string().email() }),
          z.object({ type: z.literal('sms'), phone: z.string() }),
        ]),
      });

      const prompts = getPrompts(schema);

      expect(prompts).toContain('notification: array of objects');
      expect(prompts).toContain('type: email | sms');
    });
  });

  describe('Advanced Features', () => {
    it('nested objects are now properly expanded', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
          address: z.object({
            street: z.string(),
            city: z.string(),
            country: z.string(),
          }),
        }),
      });

      const prompts = getPrompts(schema);

      // Nested structure is now properly extracted:
      expect(prompts).toContain('user: object');
      expect(prompts).toContain('name: string');
      expect(prompts).toContain('email: string');
      expect(prompts).toContain('street: string');
      expect(prompts).toContain('address: object');

      // Debug prompts:
      console.log('Nested object prompts:');
      console.log(prompts);
    });

    it('should handle regular unions with primitive types', () => {
      const schema = z.object({
        value: z.union([z.string(), z.number(), z.boolean()]),
      });

      const prompts = getPrompts(schema, { theme: 'standard' });

      // Should show union as "type1 | type2 | type3"
      expect(prompts).toContain('string | number | boolean');

      console.log('Union prompts:');
      console.log(prompts);
    });

    it('should handle regular unions with complex objects', () => {
      const schema = z.object({
        data: z.union([
          z.object({ type: z.literal('text'), content: z.string() }),
          z.object({ type: z.literal('number'), value: z.number() }),
        ]),
      });

      const prompts = getPrompts(schema, { theme: 'standard' });

      // Should expand the union variants
      expect(prompts).toContain('text');
      expect(prompts).toContain('number');

      console.log('Complex union prompts:');
      console.log(prompts);
    });

    it('should handle tuples with fixed types', () => {
      const schema = z.object({
        coordinates: z.tuple([z.number(), z.number()]),
        rgbColor: z.tuple([z.number(), z.number(), z.number()]),
        mixedTuple: z.tuple([z.string(), z.number(), z.boolean()]),
      });

      const prompts = getPrompts(schema, { theme: 'standard' });

      // Should show tuple as [type1, type2, ...]
      expect(prompts).toContain('[number, number]');
      expect(prompts).toContain('[number, number, number]');
      expect(prompts).toContain('[string, number, boolean]');

      console.log('Tuple prompts:');
      console.log(prompts);
    });

    it('should handle records with dynamic keys', () => {
      const schema = z.object({
        stringMap: z.record(z.string(), z.string()),
        numberMap: z.record(z.string(), z.number()),
      });

      const prompts = getPrompts(schema, { theme: 'standard' });

      // Should show record as Record<keyType, valueType>
      expect(prompts).toContain('Record<string, string>');
      expect(prompts).toContain('Record<string, number>');

      console.log('Record prompts:');
      console.log(prompts);
    });

    it('should handle records with complex value types', () => {
      const schema = z.object({
        objectMap: z.record(
          z.string(),
          z.object({
            value: z.number(),
            label: z.string(),
          }),
        ),
      });

      const prompts = getPrompts(schema, { theme: 'standard' });

      // Should show record and expand the object structure
      expect(prompts).toContain('Record<string, object>');
      expect(prompts).toContain('value');
      expect(prompts).toContain('label');

      console.log('Complex record prompts:');
      console.log(prompts);
    });

    it('intersection types are not handled', () => {
      const PersonSchema = z.object({ name: z.string() });
      const EmployeeSchema = z.object({ employeeId: z.number() });
      const schema = z.intersection(PersonSchema, EmployeeSchema);

      // Intersection types are not properly supported
      const prompts = getPrompts(schema);

      console.log('Intersection prompts:');
      console.log(prompts);

      // Results in fallback behavior, not combined fields
      expect(prompts).toBeTruthy(); // Just checking it doesn't crash
    });

    it('omits examples when none are provided', () => {
      const schema = z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        age: z.number().min(18).max(100),
        website: z.string().url(),
      });

      const prompts = getPrompts(schema);

      expect(prompts).not.toContain('## Examples');
      expect(prompts).not.toContain('"firstName"');
    });

    it('deeply nested arrays of objects are expanded', () => {
      const schema = z.object({
        teams: z.array(
          z.object({
            name: z.string(),
            members: z.array(
              z.object({
                id: z.string(),
                role: z.enum(['lead', 'member']),
              }),
            ),
          }),
        ),
      });

      const prompts = getPrompts(schema);

      expect(prompts).toContain('teams: array of objects');
      expect(prompts).toContain('members: array of objects');
      expect(prompts).toContain('name: string');
      expect(prompts).toContain('role: MUST BE ONE OF [lead | member]');

      console.log('Nested array prompts:');
      console.log(prompts);
    });

    it('nullable and optional combinations', () => {
      const schema = z.object({
        field1: z.string().optional(),
        field2: z.string().nullable(),
        field3: z.string().nullable().optional(),
        field4: z.string().optional().nullable(),
      });

      const prompts = getPrompts(schema);

      console.log('Nullable/optional prompts:');
      console.log(prompts);

      // Verify field modifiers:
      expect(prompts).toContain('field1: string');
      expect(prompts).toContain('field2: string (required • nullable)');
      expect(prompts).toContain('field3: string (nullable)');
      expect(prompts).toContain('field4: string (nullable)');
    });
  });

  describe('Output Format Completeness', () => {
    it('should show full detailed prompts', () => {
      const schema = z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100),
        tags: z.array(z.string()).optional().default([]),
      });

      const prompts = getPrompts(schema, {
        theme: 'expanded',
      });

      expect(prompts).toContain('## Schema');
      expect(prompts).toContain('id: string (required • format: uuid)');
      expect(prompts).toContain('name: string (required • min 1 chars • max 100 chars)');
      expect(prompts).toContain('tags: array of strings');
      expect(prompts).not.toContain('## Examples');

      console.log('FULL DETAILED OUTPUT:');
      console.log(prompts);
    });

    it('should show condensed prompts', () => {
      const schema = z.object({
        id: z.string(),
        count: z.number(),
      });

      const prompts = getPrompts(schema, { theme: 'condensed' });

      expect(prompts).toContain('id:str!');
      expect(prompts).toContain('count:num!');

      console.log('CONDENSED OUTPUT:');
      console.log(prompts);
    });

    it('should show standard prompts', () => {
      const schema = z.object({
        id: z.string(),
        count: z.number(),
      });

      const prompts = getPrompts(schema, { theme: 'standard' });

      expect(prompts).toContain('## Schema');
      expect(prompts).not.toContain('## Examples');

      console.log('STANDARD OUTPUT:');
      console.log(prompts);
    });
  });
});
