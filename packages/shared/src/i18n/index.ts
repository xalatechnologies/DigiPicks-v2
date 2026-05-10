// =============================================================================
// @digipicks/shared/i18n — Tiny dictionary lookup with static type safety.
//
// Usage in apps/web:
//   import { createI18n } from '@digipicks/shared/i18n';
//   const t = createI18n(me?.locale ?? 'en');
//   <span>{t('nav.home')}</span>
//
// Why not react-intl? It pulls in 80kB+ for ICU formatting we don't need
// yet. When ICU plurals/dates land, swap in the bigger lib without
// changing call sites — same `t('a.b.c')` API.
// =============================================================================

import { en } from './en';
import { nb } from './nb';
import type { Dictionary, LocaleCode } from './dict';

export type { Dictionary, LocaleCode } from './dict';

const DICTIONARIES: Record<LocaleCode, Dictionary> = { en, nb };

export const SUPPORTED_LOCALES: LocaleCode[] = ['en', 'nb'];

/**
 * Build dot-path keys from the Dictionary shape. Compile-time safe —
 * t('nav.home') works, t('nav.bogus') errors.
 */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends object
      ? Leaves<T[K], `${P}${K}.`>
      : never;
}[keyof T & string];

export type DictionaryKey = Leaves<Dictionary>;

export function createI18n(locale: LocaleCode = 'en') {
  const dict = DICTIONARIES[locale] ?? en;
  return function t(key: DictionaryKey): string {
    const parts = key.split('.');
    let cur: unknown = dict;
    for (const p of parts) {
      if (!cur || typeof cur !== 'object') return key;
      cur = (cur as Record<string, unknown>)[p];
    }
    return typeof cur === 'string' ? cur : key;
  };
}
