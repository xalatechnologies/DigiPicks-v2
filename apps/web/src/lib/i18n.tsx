import React from 'react';
import { useQuery } from 'convex/react';
import {
  createI18n,
  type DictionaryKey,
  type LocaleCode,
} from '@digipicks/shared';
import { api } from '../../../../convex/_generated/api';

// =============================================================================
// apps/web i18n provider (Phase 15e). Reads the calling user's locale from
// api.users.meSafe and exposes `t(key)` via React context.
//
// Usage:
//   import { useT } from '@/lib/i18n';
//   const t = useT();
//   <span>{t('nav.home')}</span>
//
// Falls back to English when no user is signed in or the locale is unset.
// =============================================================================

type Translator = (key: DictionaryKey) => string;

interface I18nValue {
  locale: LocaleCode;
  t: Translator;
}

const I18nContext = React.createContext<I18nValue>({
  locale: 'en',
  t: createI18n('en'),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const me = useQuery(api.users.meSafe);
  const locale: LocaleCode = me?.locale === 'nb' ? 'nb' : 'en';
  const t = React.useMemo(() => createI18n(locale), [locale]);
  const value = React.useMemo(() => ({ locale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): Translator {
  return React.useContext(I18nContext).t;
}

export function useLocale(): LocaleCode {
  return React.useContext(I18nContext).locale;
}
