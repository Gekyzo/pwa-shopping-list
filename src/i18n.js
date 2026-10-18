import ca from '#locales/ca';
import de from '#locales/de';
import en from '#locales/en';
import es from '#locales/es';
import fr from '#locales/fr';
import it from '#locales/it';
import pt from '#locales/pt';

export const CATALOGS = { ca, de, en, es, fr, it, pt };
export const LANGUAGES = Object.keys(CATALOGS);
export const FALLBACK = 'en';
// The name of each language, in that language.
export const LANGUAGE_NAMES = {
  ca: 'Català',
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
};

// The tag that `Intl` gets for a language. `pt` alone is Brazilian Portuguese there: zero is
// singular and the date has another form. The catalog is European Portuguese.
const INTL_TAGS = { pt: 'pt-PT' };
export const intlTag = (lang) => INTL_TAGS[lang] ?? lang;

const base = (tag) => String(tag ?? '').toLowerCase().split('-')[0];

// The language to show: `stored` when it is supported, else the first supported base language of
// `preferred` (the value of `navigator.languages`), else the fallback.
export const resolveLanguage = (preferred, stored) => {
  if (LANGUAGES.includes(stored)) return stored;
  return [preferred ?? []].flat().map(base).find((lang) => LANGUAGES.includes(lang)) ?? FALLBACK;
};

// One pass, with a function: a parameter that holds `{name}` or `$&` goes in as typed.
const fill = (text, params) =>
  text.replace(/\{(\w+)\}/g, (match, name) => (Object.hasOwn(params, name) ? String(params[name]) : match));

// The pseudo-locale: a text with accented vowels, in `[ ]`, padded with `~` to 1.4 times its length,
// so a layout check sees clipped and overflowing text. A `{name}` stays as it is.
const ACCENTS = { a: 'ä', e: 'é', i: 'î', o: 'ö', u: 'ü', A: 'Ä', E: 'É', I: 'Î', O: 'Ö', U: 'Ü' };
export const PSEUDO = 'pseudo';
export const pseudo = (text) =>
  `[${text.replace(/\{\w+\}|[aeiouAEIOU]/g, (match) => ACCENTS[match] ?? match)}`.padEnd(
    Math.ceil(text.length * 1.4) - 1,
    '~',
  ) + ']';

// `t(key, params)` for one language. An entry is a text, or `{ one, other }` selected by `params.count`.
export const translator = (lang, catalogs = CATALOGS) => {
  const isPseudo = lang === PSEUDO;
  const source = isPseudo ? 'es' : lang;
  const rules = new Intl.PluralRules(intlTag(source));
  return (key, params = {}) => {
    const entry = catalogs[source]?.[key] ?? catalogs[FALLBACK]?.[key];
    if (entry === undefined) return key;
    const text = typeof entry === 'string' ? entry : entry[rules.select(Number(params.count))] ?? entry.other;
    return fill(isPseudo ? pseudo(text) : text, params);
  };
};
