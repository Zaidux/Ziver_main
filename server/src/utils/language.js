class LanguageUtils {
  static getSupportedLanguages() {
    return {
      'en': { name: 'English', nativeName: 'English', rtl: false },
      'es': { name: 'Spanish', nativeName: 'Español', rtl: false },
      'fr': { name: 'French', nativeName: 'Français', rtl: false },
      'de': { name: 'German', nativeName: 'Deutsch', rtl: false },
      'zh': { name: 'Chinese', nativeName: '中文', rtl: false },
      'ar': { name: 'Arabic', nativeName: 'العربية', rtl: true },
      'ru': { name: 'Russian', nativeName: 'Русский', rtl: false }
    };
  }

  static isValidLanguage(language) {
    const supported = this.getSupportedLanguages();
    return Object.keys(supported).includes(language);
  }

  static getLanguageInfo(language) {
    const supported = this.getSupportedLanguages();
    return supported[language] || supported['en'];
  }

  static getDefaultLanguage() {
    return 'en';
  }
}

module.exports = LanguageUtils;