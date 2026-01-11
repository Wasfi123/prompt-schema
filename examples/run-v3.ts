#!/usr/bin/env tsx
/**
 * Test runner for Zod v3 schemas
 * Usage: tsx lib/prompt-schema/examples/run-v3.ts [schema-name] [format]
 */

import { getPrompts } from '../src';

import { allV3Schemas } from './schemas-v3';

// Get schema name from CLI argument
const schemaName = process.argv[2] || 'all';
const format = (process.argv[3] || 'standard') as 'standard' | 'expanded' | 'condensed';

function printDivider(title?: string) {
  console.log('\n' + '='.repeat(80));
  if (title) {
    console.log(`  ${title}`);
    console.log('='.repeat(80));
  }
}

function printSchema(name: string, schema: unknown) {
  printDivider(`Zod v3: ${name}`);
  console.log(`Format: ${format}\n`);

  const prompts = getPrompts(schema, {
    theme: format,
  });

  console.log(prompts);
}

// Run specific schema or all schemas
if (schemaName === 'all') {
  console.log('🔍 Running all Zod v3 schema examples\n');
  Object.entries(allV3Schemas).forEach(([name, schema]) => {
    printSchema(name, schema);
  });
} else if (schemaName in allV3Schemas) {
  const schema = allV3Schemas[schemaName as keyof typeof allV3Schemas];
  printSchema(schemaName, schema);
} else {
  console.error(`❌ Schema "${schemaName}" not found`);
  console.log('\nAvailable schemas:');
  console.log('  - all (run all schemas)');
  Object.keys(allV3Schemas).forEach((name) => {
    console.log(`  - ${name}`);
  });
  console.log('\nFormats: standard | expanded | condensed');
  console.log('\nUsage: tsx lib/prompt-schema/examples/run-v3.ts [schema-name] [format]');
  process.exit(1);
}

printDivider();
console.log(
  `\n✅ Complete! Tested ${schemaName === 'all' ? Object.keys(allV3Schemas).length : 1} schema(s)\n`,
);
