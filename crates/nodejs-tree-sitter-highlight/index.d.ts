export interface ParserEntry {
  language: unknown;
  highlights: string;
  injections: string;
  locals: string;
}

export type Parsers = Record<string, ParserEntry>;

export interface HighlightOptions {
  source?: string;
  file?: string;
  language: string;
  parsers: Parsers;
  theme?: Record<string, unknown>;
  format?: "html" | "latex" | "terminal";
  layout?: "document" | "line-numbers" | "fragment";
  style?: "classes" | "inline" | "minimal";
  prefix?: string;
  math_escape?: string[];
}

export function search_parsers(parsers: Record<string, unknown>): Parsers;

export function highlight(options: HighlightOptions): string;
