import React, { createContext, useContext, useState, useEffect } from 'react';

type Direction = 'ltr' | 'rtl';
type Language = {
  code: string;
  name: string;
  nativeName: string;
  dir: Direction;
};

// Comprehensive list of languages
export const languages: Language[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl' },
  // Add more as needed...
];

interface LanguageContextType {
  language: Language;
  setLanguage: (code: string) => void;
  direction: Direction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Arabic as per the user's apparent preference in previous prompts, or English
  const [language, setLanguageState] = useState<Language>(languages[0]); // Defaulting to Arabic for "Nav Right" feel initially

  useEffect(() => {
    const savedLang = localStorage.getItem('novii-lang');
    if (savedLang) {
      const found = languages.find(l => l.code === savedLang);
      if (found) setLanguageState(found);
    }
  }, []);

  const setLanguage = (code: string) => {
    const found = languages.find(l => l.code === code);
    if (found) {
      setLanguageState(found);
      localStorage.setItem('novii-lang', code);
      // Update document direction for global CSS support
      document.documentElement.dir = found.dir;
      document.documentElement.lang = found.code;
    }
  };

  // Initialize document dir on mount
  useEffect(() => {
    document.documentElement.dir = language.dir;
    document.documentElement.lang = language.code;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguage, direction: language.dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
