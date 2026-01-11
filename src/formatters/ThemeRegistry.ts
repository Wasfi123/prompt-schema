import { type SchemaModel } from '../extractors/types';

import { CondensedTheme } from './themes/condensed-theme';
import { ExpandedTheme } from './themes/expanded-theme';
import { JSONTheme } from './themes/json-theme';
import { StandardTheme } from './themes/standard-theme';

import type { SchemaTheme, ThemeOptions } from './types';

/**
 * Registry for managing schema themes
 */

export class ThemeRegistry {
  private themes = new Map<string, SchemaTheme>();

  constructor() {
    // Register default themes
    this.register(new StandardTheme());
    this.register(new ExpandedTheme());
    this.register(new CondensedTheme());
    this.register(new JSONTheme());
  }

  /**
   * Register a new theme
   */
  register(theme: SchemaTheme): this {
    this.themes.set(theme.name, theme);
    return this;
  }

  /**
   * Get a theme by name
   */
  get(name: string): SchemaTheme | undefined {
    return this.themes.get(name);
  }

  /**
   * Check if a theme exists
   */
  has(name: string): boolean {
    return this.themes.has(name);
  }

  /**
   * List all registered theme names
   */
  list(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * Format a model using a specific theme
   */
  format(model: SchemaModel, themeName: string, options?: ThemeOptions): string {
    const theme = this.get(themeName);
    if (!theme) {
      throw new Error(`Theme '${themeName}' not found. Available: ${this.list().join(', ')}`);
    }
    return theme.format(model, options);
  }
}
