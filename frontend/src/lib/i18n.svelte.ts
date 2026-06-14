import { browser } from '$app/environment';
import tr from './locales/tr.json';
import en from './locales/en.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import fr from './locales/fr.json';
import uk from './locales/uk.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import pt from './locales/pt.json';

export const languageDetails = [
    { code: 'tr', flag: '🇹🇷' },
    { code: 'en', flag: '🇺🇸' },
    { code: 'de', flag: '🇩🇪' },
    { code: 'zh', flag: '🇨🇳' },
    { code: 'fr', flag: '🇫🇷' },
    { code: 'uk', flag: '🇺🇦' },
    { code: 'es', flag: '🇪🇸' },
    { code: 'ja', flag: '🇯🇵' },
    { code: 'ko', flag: '🇰🇷' },
    { code: 'it', flag: '🇮🇹' },
    { code: 'ru', flag: '🇷🇺' },
    { code: 'pt', flag: '🇵🇹' },
];

const translations: Record<string, any> = {
    tr,
    en,
    de,
    zh,
    fr,
    uk,
    es,
    ja,
    ko,
    it,
    ru,
    pt,
};

let _currentLanguage = $state('tr');

export const currentLanguage = {
    get value() { return _currentLanguage; }
};

export const t = {
    get brand() { return translations[_currentLanguage].brand; },
    get nav() { return translations[_currentLanguage].nav; },
    get languages() { return translations[_currentLanguage].languages; },
    get home() { return translations[_currentLanguage].home; },
    get about() { return translations[_currentLanguage].about; },
    get games() { return translations[_currentLanguage].games; },
    get community() { return translations[_currentLanguage].community; },
    get alerts() { return translations[_currentLanguage].alerts; },
    get footer() { return translations[_currentLanguage].footer; },
    get news() { return translations[_currentLanguage].news; },
};

export function setLanguage(lang: string) {
    if (translations[lang]) {
        _currentLanguage = lang;
        if (browser) {
            localStorage.setItem('preferredLanguage', lang);
            document.documentElement.lang = lang;
        }
    }
}

// Load preferred language if available
if (browser) {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && translations[savedLang]) {
        _currentLanguage = savedLang;
        document.documentElement.lang = savedLang;
    }
}
