// src/i18n/index.js
// Lightweight i18n engine — no external dependency needed.
// Works identically in both Vite (web) and Expo (mobile).


import en from "./en.js";
import fr from "./fr.js";

const TRANSLATIONS = { en, fr };
const SUPPORTED    = ["en", "fr"];
const FALLBACK     = "en";

// ── Language persistence ──────────────────────────────

let _current = FALLBACK;


function detectLanguage() {
  try {
    // Web: check localStorage
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("tradie_language");
      if (stored && SUPPORTED.includes(stored)) return stored;
    }
    // Browser locale detection
    const locale = (
      (typeof navigator !== "undefined" && (navigator.language || navigator.languages?.[0])) ||
      FALLBACK
    );
    const lang = locale.split("-")[0].toLowerCase();
    return SUPPORTED.includes(lang) ? lang : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

_current = detectLanguage();

// ── Core API ──────────────────────────────────────────

/** Get current language code ("en" | "fr") */
export function getLanguage() {
  return _current;
}

/** Switch language — persists to localStorage on web */
export function setLanguage(lang) {
  if (!SUPPORTED.includes(lang)) {
    console.warn(`[i18n] Unsupported language: ${lang}. Supported: ${SUPPORTED.join(", ")}`);
    return;
  }
  _current = lang;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("tradie_language", lang);
    }
  } catch { /* SSR or storage blocked */ }
}

/** All supported language codes */
export const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "fr", label: "French",  nativeLabel: "Français" },
];

// ── Translation lookup ────────────────────────────────

/**
 * Translate a dot-notation key with optional interpolation.
 *
 * @param {string} key     - e.g. "common.save", "dashboard.greeting"
 * @param {object} [vars]  - e.g. { name: "Jake", count: 3 }
 * @returns {string}       - Translated string, falls back to English,
 *                           then to the key itself if not found.
 *
 * Interpolation syntax: {{varName}}
 * e.g. t("dashboard.greeting", { name: "Jake" })
 *   → "Good morning, Jake 👋" (en)
 *   → "Bonjour, Jake 👋"      (fr)
 */
export function t(key, vars) {
  const result = lookup(_current, key) ?? lookup(FALLBACK, key) ?? key;
  return interpolate(result, vars);
}

function lookup(lang, key) {
  const dict = TRANSLATIONS[lang];
  if (!dict) return undefined;
  return key.split(".").reduce((obj, k) => (obj && typeof obj === "object" ? obj[k] : undefined), dict);
}

function interpolate(str, vars) {
  if (!vars || typeof str !== "string") return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{{${k}}}`));
}

// ── React hook (web — Vite) ───────────────────────────

import { useState, useEffect, useCallback } from "react";

let _listeners = new Set();

function _notifyListeners() {
  _listeners.forEach(fn => fn(_current));
}

const _originalSetLanguage = setLanguage;
// Wrap setLanguage to notify React listeners
export function useTranslation() {
  const [lang, setLang] = useState(_current);

  useEffect(() => {
    const handler = (newLang) => setLang(newLang);
    _listeners.add(handler);
    return () => _listeners.delete(handler);
  }, []);

  const changeLanguage = useCallback((newLang) => {
    _originalSetLanguage(newLang);
    _notifyListeners();
  }, []);

  // Return t scoped to current lang (reactive)
  const tl = useCallback((key, vars) => {
    const result = lookup(lang, key) ?? lookup(FALLBACK, key) ?? key;
    return interpolate(result, vars);
  }, [lang]);

  return { t: tl, lang, setLanguage: changeLanguage, languages: LANGUAGES };
}

