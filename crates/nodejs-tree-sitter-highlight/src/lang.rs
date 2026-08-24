//! Converting a Node.js `tree-sitter` language capsule into a Rust [`tree_sitter::Language`].
//!
//! A `tree-sitter` grammar package (e.g. `tree-sitter-python`) exposes its language as
//! `module.language`, which node-tree-sitter and the grammar's own `binding.cc` create with
//! `Napi::External<TSLanguage>::New(env, tree_sitter_python())` — an `napi_external` whose stored
//! data pointer *is* the grammar's static `TSLanguage*`. We recover that pointer with
//! `napi_get_value_external` and wrap it as a Rust `Language`.
//!
//! # Lifetime / safety
//!
//! The grammar's `TSLanguage` is **static** memory (embedded in the compiled `.node`). node-tree-sitter
//! attaches no finalizer to the external, so the GC never frees it. `Language`'s `Drop` calls
//! `ts_language_delete`, which is a no-op for native (non-WASM) grammars, so holding the static
//! pointer in a `Language` and letting it drop is safe. We still route through `ts_language_copy`
//! (also a no-op for native grammars) so construction is correct for any grammar variant without
//! relying on the no-op behavior.

use napi::sys as napi_sys;
use napi::{Env, JsObject, JsUnknown, NapiRaw, NapiValue};
use tree_sitter::ffi as ts_ffi;

/// Extract a raw `TSLanguage*` from a Node.js value that represents a tree-sitter language.
///
/// Accepts:
/// * a grammar-package module (e.g. `require("tree-sitter-python")`) — the value's `.language`
///   property is read first, or
/// * a bare language capsule (`module.language` directly).
///
/// In both cases the relevant value is an `napi_external` holding the grammar's `TSLanguage*`.
fn language_ptr(env: &Env, value: &JsUnknown) -> napi::Result<*const ts_ffi::TSLanguage> {
    // A grammar module object: unwrap its `.language` property if present. `JsUnknown` is not
    // `Clone`, so we reinterpret the same raw value as a `JsObject` (no copy is made — both views
    // reference the identical underlying JS value).
    let raw_val = unsafe { NapiRaw::raw(value) };
    if let Ok(obj) = unsafe { JsObject::from_raw(env.raw(), raw_val) } {
        if let Some(lang) = obj.get::<_, JsUnknown>("language")? {
            return language_ptr(env, &lang);
        }
    }

    // A bare `napi_external` holding the `TSLanguage*`.
    let napi_env = env.raw();
    let mut raw: *mut std::ffi::c_void = std::ptr::null_mut();
    let status = unsafe { napi_sys::napi_get_value_external(napi_env, raw_val, &mut raw) };
    if status != napi_sys::Status::napi_ok {
        return Err(napi::Error::new(
            napi::Status::GenericFailure,
            "language value is not a valid tree-sitter external",
        ));
    }
    if raw.is_null() {
        return Err(napi::Error::new(
            napi::Status::GenericFailure,
            "language external holds a null pointer",
        ));
    }
    Ok(raw as *const ts_ffi::TSLanguage)
}

/// Build an owned Rust [`tree_sitter::Language`] from a Node.js language object.
///
/// Accepts either a grammar package module or a bare language capsule. The grammar's `TSLanguage`
/// is static, so we copy it (no-op for native grammars) before wrapping, guaranteeing `Drop` never
/// frees the grammar's memory regardless of which shape produced it.
pub fn extract_language(env: &Env, value: &JsUnknown) -> napi::Result<tree_sitter::Language> {
    let raw = language_ptr(env, value)?;

    // Verify the pointer actually points at a tree-sitter language of a compatible ABI version.
    let version = unsafe { ts_ffi::ts_language_abi_version(raw) };
    if version < ts_ffi::TREE_SITTER_MIN_COMPATIBLE_LANGUAGE_VERSION
        || version > ts_ffi::TREE_SITTER_LANGUAGE_VERSION
    {
        return Err(napi::Error::new(
            napi::Status::GenericFailure,
            format!(
                "incompatible language version: got {version}, expected {}..={}",
                ts_ffi::TREE_SITTER_MIN_COMPATIBLE_LANGUAGE_VERSION,
                ts_ffi::TREE_SITTER_LANGUAGE_VERSION
            ),
        ));
    }

    // `ts_language_copy` retains (WASM) or is a no-op (native) and returns the same pointer.
    let copied = unsafe { ts_ffi::ts_language_copy(raw) };
    // Reconstruct an owned `Language` from the (copied) raw pointer. The grammar's memory is
    // static and `Drop`/`ts_language_delete` are no-ops for native grammars.
    let language = unsafe { tree_sitter::Language::from_raw(copied) };
    Ok(language)
}
