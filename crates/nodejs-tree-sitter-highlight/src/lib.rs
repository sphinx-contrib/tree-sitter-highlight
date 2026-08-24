//! Node.js bindings for `tree-sitter-highlight`.
//!
//! Exposes [`highlight`] on the `tree-sitter-highlight` module. The companion `search_parsers`
//! function lives in `index.js` (a thin CommonJS shim) because it needs `require.cache` to locate a
//! grammar package's directory — something only available from JavaScript, not the native addon
//! context. `index.js` re-exports [`highlight`] and implements `search_parsers` in JS; together they
//! expose the same API as the Python binding:
//!
//! * `search_parsers({ python: require("tree-sitter-python"), ... })` → `{ lang: { language,
//!   highlights, injections, locals } }` where `language` is the grammar's `language` object (the
//!   `napi_external` holding its `TSLanguage*`) and the query strings are read from the package's
//!   `queries/` directory. Packages without a usable `language` are skipped silently.
//! * `highlight({ source, file, language, parsers, theme, format, layout, style, prefix,
//!   math_escape })` — performs syntax highlighting and returns the rendered document as a string.
//!   `parsers` uses the same shape as `search_parsers`'s return value.

use std::collections::{HashMap, HashSet};

use napi::{Env, JsObject, JsUnknown, Result};
use napi_derive::napi;

use highlight_core::render::{RenderTheme, parse_theme};
use highlight_core::{
    CoreParserInfo, resolve_math_escape, run_highlight, parse_format, parse_layout, parse_style,
    load_default_theme,
};
use serde_json::Value as JsonValue;

mod lang;

/// Options for [`highlight`], matching the structured argument the Python binding accepts.
#[napi(object)]
pub struct HighlightOptions {
    /// Literal source text. When omitted, `file` is read instead (`"-"` means stdin).
    pub source: Option<String>,
    /// Path to a file whose contents become the source.
    pub file: Option<String>,
    /// Parser registry produced by `search_parsers`: `{ lang: { language, highlights, injections, locals } }`.
    pub parsers: JsObject,
    /// The language to highlight (a key into `parsers`).
    pub language: String,
    /// Theme as a `name -> { color, bold, ... }` object; falls back to the tree-sitter config theme.
    pub theme: Option<JsonValue>,
    /// Output format: `html` (default) | `latex` | `terminal`.
    pub format: Option<String>,
    /// HTML/LaTeX structure: `document` (default) | `line-numbers` | `fragment`.
    pub layout: Option<String>,
    /// Styling mode: `classes` (default) | `inline` | `minimal`.
    pub style: Option<String>,
    /// CSS/class prefix (default `""`).
    pub prefix: Option<String>,
    /// Highlight-scope names whose special LaTeX characters should be escaped.
    pub math_escape: Option<Vec<String>>,
}

/// `highlight(options)` — see module docs.
#[napi(js_name = "highlight")]
pub fn highlight(env: Env, options: HighlightOptions) -> Result<String> {
    let HighlightOptions {
        source,
        file,
        parsers,
        language,
        theme,
        format,
        layout,
        style,
        prefix,
        math_escape,
    } = options;

    // `source` is the literal text; when omitted, `file` is read (`"-"` means stdin).
    let source = if let Some(s) = source {
        s
    } else {
        let file = file
            .ok_or_else(|| napi::Error::new(napi::Status::InvalidArg, "`source` or `file` is required for highlight"))?;
        if file == "-" {
            use std::io::Read as _;
            let mut buf = String::new();
            std::io::stdin()
                .read_to_string(&mut buf)
                .map_err(|e| napi::Error::new(napi::Status::GenericFailure, format!("failed to read stdin: {e}")))?;
            buf
        } else {
            std::fs::read_to_string(&file)
                .map_err(|e| napi::Error::new(napi::Status::GenericFailure, format!("failed to read file '{file}': {e}")))?
        }
    };

    // Build the core language registry from the `parsers` object.
    let mut core_parsers: HashMap<String, CoreParserInfo> = HashMap::new();
    let keys = JsObject::keys(&parsers)?;
    for lang in keys {
        let entry: JsObject = match parsers.get::<_, JsObject>(&lang)? {
            Some(e) => e,
            None => {
                return Err(napi::Error::new(
                    napi::Status::InvalidArg,
                    format!("parsers['{lang}'] must be an object {{ language, highlights, injections, locals }}"),
                ));
            }
        };
        let language_obj: JsUnknown = match entry.get::<_, JsUnknown>("language")? {
            Some(v) => v,
            None => {
                return Err(napi::Error::new(
                    napi::Status::InvalidArg,
                    format!("parsers['{lang}'] missing 'language'"),
                ));
            }
        };
        let ts_language = lang::extract_language(&env, &language_obj)
            .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e.to_string()))?;
        let get = |k: &str| -> String {
            entry
                .get::<_, String>(k)
                .ok()
                .flatten()
                .unwrap_or_default()
        };
        core_parsers.insert(
            lang,
            CoreParserInfo {
                language: ts_language,
                highlights: get("highlights"),
                injections: get("injections"),
                locals: get("locals"),
            },
        );
    }
    if core_parsers.is_empty() {
        return Err(napi::Error::new(
            napi::Status::InvalidArg,
            "`parsers` is empty; nothing to highlight with",
        ));
    }

    let theme: RenderTheme = match theme {
        Some(t) if !t.is_null() => parse_theme(&t),
        _ => load_default_theme().map_err(|e| napi::Error::new(napi::Status::GenericFailure, e))?,
    };

    let format = parse_format(&format.unwrap_or_else(|| "html".into()))
        .map_err(|e| napi::Error::new(napi::Status::InvalidArg, e))?;
    let layout = parse_layout(&layout.unwrap_or_else(|| "document".into()))
        .map_err(|e| napi::Error::new(napi::Status::InvalidArg, e))?;
    let style = parse_style(&style.unwrap_or_else(|| "classes".into()))
        .map_err(|e| napi::Error::new(napi::Status::InvalidArg, e))?;
    let prefix = prefix.unwrap_or_default();

    let math_escape: HashSet<usize> = {
        let names: Vec<String> = math_escape.unwrap_or_default();
        let names_refs: Vec<&str> = names.iter().map(String::as_str).collect();
        let scopes = theme.highlight_names.clone();
        resolve_math_escape(&names_refs, &scopes)
    };

    let _ = env;

    run_highlight(
        source.as_bytes(),
        &language,
        &core_parsers,
        &theme,
        format,
        layout,
        style,
        &prefix,
        &math_escape,
    )
    .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e))
}
