'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations, Language } from '@/translations'

type TranslationType = typeof translations.en

interface LanguageContextType {
  language: Language
  t: TranslationType
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: translations.en,
  toggleLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('nestcare-language') as Language | null
    if (saved === 'en' || saved === 'de') {
      setLanguage(saved)
    }
  }, [])

  function toggleLanguage() {
    const next = language === 'en' ? 'de' : 'en'
    setLanguage(next)
    localStorage.setItem('nestcare-language', next)
  }

  const value: LanguageContextType = {
    language,
    t: translations[language] as TranslationType,
    toggleLanguage,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}