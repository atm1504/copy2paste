/**
 * Internationalization (i18n) module for copy2paste extension
 * Handles language detection, translation, and UI updates
 */

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
    const savedLanguage = localStorage.getItem("language") || this.getDefaultLanguage();
    this.setLanguage(savedLanguage);

    // Set up language change detection
    this.setupLanguageChangeObserver();

    // Initialize all elements with data-i18n attributes
    this.initializeI18nElements();

    return this.currentLanguage;
  }

  /**
   * Get default language based on browser settings
   */
  getDefaultLanguage() {
    const browserLang = navigator.language.toLowerCase();
    
    // Map browser language codes to our supported languages
    const langMap = {
      'zh-cn': 'zh_CN',
      'zh-tw': 'zh_CN', // Fallback to Simplified Chinese
      'pt-br': 'pt',    // Use standard Portuguese
      'pt-pt': 'pt'
    };

    // Check if we have a mapping for this language
    if (langMap[browserLang]) {
      return langMap[browserLang];
    }

    // Check if we support the primary language code
    const primaryLang = browserLang.split('-')[0];
    if (this.isLanguageSupported(primaryLang)) {
      return primaryLang;
    }

    // Default to English if no match found
    return 'en';
  }

  /**
   * Check if a language is supported by our extension
   */
  isLanguageSupported(langCode) {
    const supportedLanguages = [
      'en', 'es', 'fr', 'de', 'zh_CN', 'ja', 'ko', 
      'pt', 'ru', 'hi', 'ar', 'it', 'tr', 'nl', 'bn'
    ];
    return supportedLanguages.includes(langCode);
  }

  /**
   * Initialize all elements with data-i18n attributes
   */
  initializeI18nElements() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      this.registerElement(element, key);
    });
  }

  /**
   * Set the current language and update the UI
   * @param {string} langCode - The language code to set (e.g., 'en', 'es')
   */
  setLanguage(langCode) {
    if (this.isLanguageSupported(langCode)) {
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
    try {
      let message = chrome.i18n.getMessage(key, placeholders);
      
      // If message is not found, try with the current language prefix
      if (!message) {
        message = chrome.i18n.getMessage(`${this.currentLanguage}_${key}`, placeholders);
      }
      
      // If still not found, fallback to English
      if (!message) {
        message = chrome.i18n.getMessage(`en_${key}`, placeholders) || key;
      }

      return message;
    } catch (error) {
      console.error(`Translation error for key ${key}:`, error);
      return key;
    }
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

      // Watch for new elements with data-i18n attributes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check the added node
              if (node.hasAttribute('data-i18n')) {
                const key = node.getAttribute('data-i18n');
                this.registerElement(node, key);
              }
              // Check children of the added node
              node.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                this.registerElement(element, key);
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
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
    const supportedLanguages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'zh_CN', name: '中文 (简体)' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'pt', name: 'Português' },
      { code: 'ru', name: 'Русский' },
      { code: 'hi', name: 'हिन्दी' },
      { code: 'ar', name: 'العربية' },
      { code: 'it', name: 'Italiano' },
      { code: 'tr', name: 'Türkçe' },
      { code: 'nl', name: 'Nederlands' },
      { code: 'bn', name: 'বাংলা' }
    ];

    supportedLanguages.forEach(lang => {
      result[lang.code] = lang.name;
    });

    return result;
  }
}

// Create and export a singleton instance
const i18n = new I18nManager();
export default i18n;
