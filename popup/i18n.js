/**
 * Internationalization (i18n) module for copy2paste extension
 * Handles language detection, translation, and UI updates
 */

// Debug chrome.i18n initialization
console.log(
  "[I18N DEBUG] chrome.i18n available:",
  typeof chrome !== "undefined" && !!chrome.i18n
);
if (typeof chrome !== "undefined" && chrome.i18n) {
  console.log(
    "[I18N DEBUG] chrome.i18n.getMessage available:",
    typeof chrome.i18n.getMessage === "function"
  );
  console.log(
    "[I18N DEBUG] Test getMessage('extName'):",
    chrome.i18n.getMessage("extName")
  );
  console.log("[I18N DEBUG] Test getMessage with each supported language:");
  ["en", "es", "fr", "de", "zh_CN"].forEach((lang) => {
    console.log(
      `[I18N DEBUG] ${lang}_extName:`,
      chrome.i18n.getMessage(`${lang}_extName`)
    );
  });

  // Test common message keys
  console.log("[I18N DEBUG] Testing common message keys across languages");
  [
    "extName",
    "dragDropFiles",
    "copyAll",
    "supportedFormats",
    "processing",
    "privacyNotice",
  ].forEach((key) => {
    console.log(
      `[I18N DEBUG] Key: "${key}", Direct: "${chrome.i18n.getMessage(key)}"`
    );
  });
} else {
  console.error("[I18N DEBUG] chrome.i18n is not available!");
}

// Test function to check Chrome extension message format compatibility
function testChromeI18n() {
  try {
    console.log("[I18N TEST] Starting chrome.i18n test");

    // Get the current UI language from Chrome (not the extension's selected language)
    const uiLanguage = chrome.i18n.getUILanguage();
    console.log("[I18N TEST] Chrome UI language:", uiLanguage);

    // Test message retrieval with and without language prefixes
    const tests = [
      { key: "extName", prefix: null },
      { key: "extName", prefix: "en_" },
      { key: "extName", prefix: "es_" },
      { key: "copyAll", prefix: null },
      { key: "copyAll", prefix: "en_" },
      { key: "copyAll", prefix: "es_" },
      { key: "dragDropFiles", prefix: null },
    ];

    tests.forEach((test) => {
      const fullKey = test.prefix ? `${test.prefix}${test.key}` : test.key;
      const result = chrome.i18n.getMessage(fullKey);
      console.log(
        `[I18N TEST] getMessage("${fullKey}") => "${result || "NOT FOUND"}"`
      );
    });

    console.log("[I18N TEST] Chrome i18n test completed");
  } catch (error) {
    console.error("[I18N TEST] Error during chrome.i18n test:", error);
  }
}

// Run the test
setTimeout(testChromeI18n, 1000);

class I18nManager {
  constructor() {
    this.currentLanguage = "en";
    this.observers = [];
    this.translatedElements = new Map();
    this.translationCache = {}; // Cache for loaded translation files
    console.log(
      "[I18N] Constructor initialized with default language:",
      this.currentLanguage
    );
  }

  /**
   * Initialize i18n with the saved language or browser default
   */
  initialize() {
    // Get saved language or detect from browser
    const savedLanguage =
      localStorage.getItem("language") || this.getDefaultLanguage();
    console.log(
      "[I18N] Initializing with saved/default language:",
      savedLanguage
    );

    // Load the translations for the current language and update UI
    this.loadTranslations(savedLanguage).then(() => {
      this.setLanguage(savedLanguage);

      // Update the language dropdown to reflect the current language
      this.updateLanguageDropdown();
    });

    // Set up language change detection
    this.setupLanguageChangeObserver();

    // Initialize all elements with data-i18n attributes
    this.initializeI18nElements();

    return this.currentLanguage;
  }

  /**
   * Load translation JSON file for a specific language
   * @param {string} langCode - The language code to load
   */
  async loadTranslations(langCode) {
    if (this.translationCache[langCode]) {
      console.log(`[I18N] Translations for ${langCode} already loaded`);
      return this.translationCache[langCode];
    }

    try {
      console.log(`[I18N] Loading translations for ${langCode}`);
      const url = chrome.runtime.getURL(`_locales/${langCode}/messages.json`);
      console.log(`[I18N] Fetching from URL: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to load translations for ${langCode}: ${response.status}`
        );
      }

      const translations = await response.json();
      console.log(
        `[I18N] Loaded ${
          Object.keys(translations).length
        } translations for ${langCode}`
      );

      // Cache the translations
      this.translationCache[langCode] = translations;
      return translations;
    } catch (error) {
      console.error(
        `[I18N] Error loading translations for ${langCode}:`,
        error
      );
      // Fallback to English if available, otherwise empty object
      return this.translationCache["en"] || {};
    }
  }

  /**
   * Get default language based on browser settings
   */
  getDefaultLanguage() {
    const browserLang = navigator.language.toLowerCase();
    console.log("[I18N] Browser language detected:", browserLang);

    // Map browser language codes to our supported languages
    const langMap = {
      "zh-cn": "zh_CN",
      "zh-tw": "zh_CN", // Fallback to Simplified Chinese
      "pt-br": "pt", // Use standard Portuguese
      "pt-pt": "pt",
    };

    // Check if we have a mapping for this language
    if (langMap[browserLang]) {
      console.log("[I18N] Mapped browser language to:", langMap[browserLang]);
      return langMap[browserLang];
    }

    // Check if we support the primary language code
    const primaryLang = browserLang.split("-")[0];
    if (this.isLanguageSupported(primaryLang)) {
      console.log("[I18N] Using primary language:", primaryLang);
      return primaryLang;
    }

    // Default to English if no match found
    console.log("[I18N] No matching language found, defaulting to English");
    return "en";
  }

  /**
   * Check if a language is supported by our extension
   */
  isLanguageSupported(langCode) {
    const supportedLanguages = [
      "en",
      "es",
      "fr",
      "de",
      "zh_CN",
      "ja",
      "ko",
      "pt",
      "ru",
      "hi",
      "ar",
      "it",
      "tr",
      "nl",
      "bn",
    ];
    const isSupported = supportedLanguages.includes(langCode);
    console.log(
      "[I18N] Checking if language is supported:",
      langCode,
      isSupported
    );
    return isSupported;
  }

  /**
   * Initialize all elements with data-i18n attributes
   */
  initializeI18nElements() {
    const elements = document.querySelectorAll("[data-i18n]");
    console.log(
      "[I18N] Found elements with data-i18n attributes:",
      elements.length
    );
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      this.registerElement(element, key);
    });
  }

  /**
   * Set the current language and update the UI
   * @param {string} langCode - The language code to set (e.g., 'en', 'es')
   */
  async setLanguage(langCode) {
    console.log("[I18N] Setting language to:", langCode);
    if (this.isLanguageSupported(langCode)) {
      // Always force reload translations when changing language
      console.log(
        `[I18N] Force reloading translations for language: ${langCode}`
      );

      try {
        // Clear the cache for this language to force a reload
        delete this.translationCache[langCode];

        // Load the translations (this will fetch the file)
        await this.loadTranslations(langCode);

        this.currentLanguage = langCode;
        localStorage.setItem("language", langCode);
        document.body.setAttribute("data-language", langCode);
        console.log("[I18N] Language set successfully, updating UI elements");

        // Update the dropdown to reflect the new language
        this.updateLanguageDropdown();

        // Update all registered elements
        this.updateAllElements();

        // Notify observers
        this.notifyObservers(langCode);

        return true;
      } catch (error) {
        console.error(`[I18N] Error setting language to ${langCode}:`, error);
        return false;
      }
    }
    console.log("[I18N] Language not supported:", langCode);
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
      // Try to get translation from our loaded translations
      const translations = this.translationCache[this.currentLanguage];

      if (translations && translations[key] && translations[key].message) {
        let message = translations[key].message;
        console.log(
          `[I18N] Found translation for "${key}" in ${this.currentLanguage}: "${message}"`
        );

        // Handle placeholders if any
        if (placeholders && typeof placeholders === "object") {
          for (const placeholder in placeholders) {
            message = message.replace(
              `$${placeholder}$`,
              placeholders[placeholder]
            );
          }
        }

        return message;
      }

      // Fallback to Chrome's i18n
      console.log(
        `[I18N] No manual translation, trying Chrome i18n for "${key}"`
      );
      const chromeMessage = chrome.i18n.getMessage(key, placeholders);

      if (chromeMessage) {
        console.log(`[I18N] Found Chrome i18n translation: "${chromeMessage}"`);
        return chromeMessage;
      }

      // Last resort, use the key itself
      console.log(
        `[I18N] No translation found for "${key}", using key as fallback`
      );
      return key;
    } catch (error) {
      console.error(`[I18N] Translation error for key ${key}:`, error);
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
    console.log(
      `[I18N] Registered element for key "${key}", will update ${attribute}`
    );

    // Immediately translate the element
    const translation = this.translate(key);
    element[attribute] = translation;
    console.log(`[I18N] Element updated with translation: "${translation}"`);
  }

  /**
   * Register a function to be called when language changes
   * @param {Function} callback - Function to call when language changes
   */
  registerObserver(callback) {
    if (typeof callback === "function") {
      this.observers.push(callback);
      console.log("[I18N] Registered language change observer");
    }
  }

  /**
   * Update all registered elements with the current language
   */
  updateAllElements() {
    console.log(
      `[I18N] Updating all ${this.translatedElements.size} registered elements`
    );
    this.translatedElements.forEach((config, element) => {
      if (element && element[config.attribute] !== undefined) {
        const translation = this.translate(config.key);
        element[config.attribute] = translation;
        console.log(
          `[I18N] Updated element for key "${config.key}" with: "${translation}"`
        );
      }
    });
  }

  /**
   * Notify all registered observers of a language change
   * @param {string} langCode - The new language code
   */
  notifyObservers(langCode) {
    console.log(
      `[I18N] Notifying ${this.observers.length} observers about language change to: ${langCode}`
    );
    this.observers.forEach((callback) => {
      try {
        callback(langCode);
        console.log("[I18N] Observer callback executed successfully");
      } catch (error) {
        console.error("[I18N] Error in language change observer:", error);
      }
    });
  }

  /**
   * Set up mutation observer to watch for new elements that need translation
   */
  setupLanguageChangeObserver() {
    // Initialize language when DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
      console.log("[I18N] DOM content loaded, setting up language selector");
      const langSelector = document.getElementById("languageSelect");
      if (langSelector) {
        // Set initial dropdown value to match current language
        this.updateLanguageDropdown();

        // Set up change listener
        langSelector.addEventListener("change", (e) => {
          console.log("[I18N] Language selector changed to:", e.target.value);
          this.setLanguage(e.target.value);
        });
      } else {
        console.log("[I18N] Language selector element not found");
      }

      // Watch for new elements with data-i18n attributes
      console.log("[I18N] Setting up mutation observer for new i18n elements");
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check the added node
              if (node.hasAttribute("data-i18n")) {
                const key = node.getAttribute("data-i18n");
                console.log(`[I18N] New element with data-i18n found: ${key}`);
                this.registerElement(node, key);
              }
              // Check children of the added node
              node.querySelectorAll("[data-i18n]").forEach((element) => {
                const key = element.getAttribute("data-i18n");
                console.log(
                  `[I18N] New child element with data-i18n found: ${key}`
                );
                this.registerElement(element, key);
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
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
      { code: "en", name: "English" },
      { code: "es", name: "Español" },
      { code: "fr", name: "Français" },
      { code: "de", name: "Deutsch" },
      { code: "zh_CN", name: "中文 (简体)" },
      { code: "ja", name: "日本語" },
      { code: "ko", name: "한국어" },
      { code: "pt", name: "Português" },
      { code: "ru", name: "Русский" },
      { code: "hi", name: "हिन्दी" },
      { code: "ar", name: "العربية" },
      { code: "it", name: "Italiano" },
      { code: "tr", name: "Türkçe" },
      { code: "nl", name: "Nederlands" },
      { code: "bn", name: "বাংলা" },
    ];

    supportedLanguages.forEach((lang) => {
      result[lang.code] = lang.name;
    });

    return result;
  }

  /**
   * Update the language dropdown to reflect the current language
   */
  updateLanguageDropdown() {
    const langSelector = document.getElementById("languageSelect");
    if (langSelector) {
      console.log(
        "[I18N] Updating language dropdown to:",
        this.currentLanguage
      );
      langSelector.value = this.currentLanguage;
    } else {
      // If dropdown isn't available yet, try again when DOM is ready
      document.addEventListener("DOMContentLoaded", () => {
        const langSelector = document.getElementById("languageSelect");
        if (langSelector) {
          console.log(
            "[I18N] Setting dropdown after DOM load to:",
            this.currentLanguage
          );
          langSelector.value = this.currentLanguage;
        }
      });
    }
  }
}

// Create and export a singleton instance
const i18n = new I18nManager();
console.log("[I18N] i18n manager initialized and exported");
export default i18n;
