import type MarkdownIt from 'markdown-it';

export interface MarkdownItTreeSitterOptions {
  /** Directory whose `node_modules` is scanned for `tree-sitter-*` grammars. Default: `process.cwd()`. */
  basedir?: string;
  /** Highlight theme: scope name -> `{ color, bold, italic, ... }`. Falls back to the default theme. */
  theme?: Record<string, { color?: string; bold?: boolean; italic?: boolean; underline?: boolean }>;
  /** Output layout: `'fragment'` (default) | `'document'` | `'line-numbers'`. */
  layout?: 'fragment' | 'document' | 'line-numbers';
  /** Styling mode: `'inline'` (default) | `'classes'` | `'minimal'`. */
  style?: 'inline' | 'classes' | 'minimal';
}

declare function markdownItTreeSitter(
  md: MarkdownIt,
  options?: MarkdownItTreeSitterOptions,
): void;

export default markdownItTreeSitter;
export { markdownItTreeSitter };
