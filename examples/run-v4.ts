#!/usr/bin/env tsx
/**
 * Test runner for Zod v4 schemas
 * Usage: tsx lib/prompt-schema/examples/run-v4.ts [schema-name] [format]
 */

import { getPrompts } from '../src';

import { allV4Schemas } from './schemas-v4';

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
  printDivider(`Zod v4: ${name}`);
  console.log(`Format: ${format}\n`);

  const prompts = getPrompts(schema, {
    theme: format,
  });

  console.log(prompts);
}

// Run specific schema or all schemas
if (schemaName === 'all') {
  console.log('🔍 Running all Zod v4 schema examples\n');
  Object.entries(allV4Schemas).forEach(([name, schema]) => {
    printSchema(name, schema);
  });
} else if (schemaName in allV4Schemas) {
  const schema = allV4Schemas[schemaName as keyof typeof allV4Schemas];
  printSchema(schemaName, schema);
} else {
  console.error(`❌ Schema "${schemaName}" not found`);
  console.log('\nAvailable schemas:');
  console.log('  - all (run all schemas)');
  Object.keys(allV4Schemas).forEach((name) => {
    console.log(`  - ${name}`);
  });
  console.log('\nFormats: standard | expanded | condensed');
  console.log('\nUsage: tsx lib/prompt-schema/examples/run-v4.ts [schema-name] [format]');
  process.exit(1);
}

printDivider();
console.log(
  `\n✅ Complete! Tested ${schemaName === 'all' ? Object.keys(allV4Schemas).length : 1} schema(s)\n`,
);
