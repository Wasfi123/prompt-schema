import { type SchemaModel } from '../extractors/types';

import { defaultRegistry } from './index';

import type { ThemeOptions } from './types';
import type { ThemeFormatOptions } from './types';

const DEFALUT_OPTIONS: ThemeFormatOptions = {
  style: 'standard',
  indentSize: 2,
};

export function formatModel(model: SchemaModel, options?: ThemeFormatOptions): string {
  const opts = { ...DEFALUT_OPTIONS, ...options };

  const themeName = opts.style || 'standard';

  const themeOptions: ThemeOptions = {
    indentSize: opts.indentSize,
  };

  return defaultRegistry.format(model, themeName, themeOptions);
}
