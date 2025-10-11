export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' }
];

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: 'Sun' },
  { value: 'dark', label: 'Dark', icon: 'Moon' },
  { value: 'auto', label: 'Auto', icon: 'Globe' }
];

export const NOTIFICATION_TYPES = {
  email: { label: 'Email Notifications', description: 'Receive notifications via email' },
  push: { label: 'Push Notifications', description: 'Receive push notifications in app' },
  marketing: { label: 'Marketing Emails', description: 'Receive marketing and promotional emails' },
  security: { label: 'Security Alerts', description: 'Receive important security alerts' }
};

export const SETTINGS_ENDPOINTS = {
  SECURITY: {
    PASSWORD: '/settings/security/password',
    TWO_FACTOR: '/settings/security/two-factor',
    TWO_FACTOR_SETUP: '/settings/security/two-factor/setup',
    GET: '/settings/security'
  },
  APPEARANCE: {
    THEME: '/settings/appearance/theme',
    LANGUAGE: '/settings/appearance/language',
    GET: '/settings/appearance'
  },
  NOTIFICATIONS: {
    UPDATE: '/settings/notifications',
    GET: '/settings/notifications'
  },
  ACCOUNT: {
    EMAIL: '/settings/account/email',
    GET: '/settings/account',
    DELETE: '/settings/account'
  }
};
