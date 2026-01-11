/**
 * Theme registry and exports
 */

import { ThemeRegistry } from './ThemeRegistry';

// Export theme classes
export { CondensedTheme } from './themes/condensed-theme';
export { ExpandedTheme } from './themes/expanded-theme';
export { JSONTheme } from './themes/json-theme';
export { StandardTheme } from './themes/standard-theme';

// Create and export default registry
export const defaultRegistry = new ThemeRegistry();
