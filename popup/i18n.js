/**
 * Internationalization (i18n) module for copy2paste extension
 * Handles language detection, translation, and UI updates
 */

import { languages, getDefaultLanguage } from "./languages.js";

class I18nManager {
  constructor() {
    this.currentLanguage = "en";
    this.observers = [];
    this.translatedElements = new Map();
  }

  /**
   * Initialize i18n with the saved language or browser default
   */
  initialize() {
    // Get saved language or detect from browser
    const savedLanguage =
      localStorage.getItem("language") || getDefaultLanguage();
    this.setLanguage(savedLanguage);

    // Set up language change detection
    this.setupLanguageChangeObserver();

    return this.currentLanguage;
  }

  /**
   * Set the current language and update the UI
   * @param {string} langCode - The language code to set (e.g., 'en', 'es')
   */
  setLanguage(langCode) {
    if (languages[langCode]) {
      this.currentLanguage = langCode;
      localStorage.setItem("language", langCode);
      document.body.setAttribute("data-language", langCode);

      // Update all registered elements
      this.updateAllElements();

      // Notify observers
      this.notifyObservers(langCode);

      return true;
    }
    return false;
  }

  /**
   * Get translation for a key in the current language
   * @param {string} key - The translation key
   * @param {Object} placeholders - Optional placeholder values for variable substitution
   * @returns {string} The translated text
   */
  translate(key, placeholders = {}) {
    const translations = languages[this.currentLanguage] || languages["en"];

    // Handle nested keys with dot notation (e.g., 'errors.fileNotFound')
    const keyParts = key.split(".");
    let result = translations;

    for (const part of keyParts) {
      if (result && result[part] !== undefined) {
        result = result[part];
      } else {
        // Fallback to English if key not found
        let englishResult = languages["en"];
        for (const part of keyParts) {
          if (englishResult && englishResult[part] !== undefined) {
            englishResult = englishResult[part];
          } else {
            return key; // Key not found in any language
          }
        }
        result = englishResult;
      }
    }

    // Return directly if not a string (handles nested objects)
    if (typeof result !== "string") {
      return result;
    }

    // Replace placeholders: {name} becomes the value of placeholders.name
    return result.replace(/{(\w+)}/g, (match, placeholder) => {
      return placeholders[placeholder] !== undefined
        ? placeholders[placeholder]
        : match;
    });
  }

  /**
   * Register an element to be automatically updated when language changes
   * @param {HTMLElement} element - The DOM element to update
   * @param {string} key - The translation key
   * @param {string} attribute - Optional attribute to update (defaults to textContent)
   */
  registerElement(element, key, attribute = "textContent") {
    if (!element) return;

    this.translatedElements.set(element, { key, attribute });

    // Immediately translate the element
    element[attribute] = this.translate(key);
  }

  /**
   * Register a function to be called when language changes
   * @param {Function} callback - Function to call when language changes
   */
  registerObserver(callback) {
    if (typeof callback === "function") {
      this.observers.push(callback);
    }
  }

  /**
   * Update all registered elements with the current language
   */
  updateAllElements() {
    this.translatedElements.forEach((config, element) => {
      if (element && element[config.attribute] !== undefined) {
        element[config.attribute] = this.translate(config.key);
      }
    });
  }

  /**
   * Notify all registered observers of a language change
   * @param {string} langCode - The new language code
   */
  notifyObservers(langCode) {
    this.observers.forEach((callback) => {
      try {
        callback(langCode);
      } catch (error) {
        console.error("Error in language change observer:", error);
      }
    });
  }

  /**
   * Set up mutation observer to watch for new elements that need translation
   */
  setupLanguageChangeObserver() {
    // Initialize language when DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
      const langSelector = document.getElementById("languageSelect");
      if (langSelector) {
        langSelector.value = this.currentLanguage;
        langSelector.addEventListener("change", (e) => {
          this.setLanguage(e.target.value);
        });
      }
    });
  }

  /**
   * Get the current language code
   * @returns {string} The current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get list of available languages
   * @returns {Object} Object with language codes as keys and language names as values
   */
  getAvailableLanguages() {
    const result = {};
    Object.keys(languages).forEach((code) => {
      result[code] = languages[code].language || code.toUpperCase();
    });
    return result;
  }
}

// Create and export a singleton instance
const i18n = new I18nManager();
export default i18n;
