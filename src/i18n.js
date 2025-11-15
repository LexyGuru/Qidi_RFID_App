// Internationalization (i18n) System
let currentLanguage = 'hu';
let translations = {};
let availableLanguages = [];

// Language names mapping
const languageNames = {
    'hu': 'Magyar',
    'en': 'English',
    'de': 'Deutsch',
    'fr': 'Français',
    'es': 'Español',
    'it': 'Italiano',
    'pl': 'Polski',
    'ro': 'Română',
    'cs': 'Čeština',
    'sk': 'Slovenčina'
};

// Discover available languages from languages.json config file
async function discoverLanguages() {
    try {
        // First, try to load the languages.json config file
        const configResponse = await fetch('language/languages.json');
        if (configResponse.ok) {
            const config = await configResponse.json();
            const languagesFromConfig = config.availableLanguages || [];
            
            // Verify that each language file actually exists
            const verifiedLanguages = [];
            const verificationPromises = languagesFromConfig.map(async (lang) => {
                try {
                    const response = await fetch(`language/${lang}.json`, { method: 'HEAD' });
                    if (response.ok) {
                        return lang;
                    }
                } catch (e) {
                    console.warn(`Language file not found: ${lang}.json`);
                }
                return null;
            });
            
            const results = await Promise.all(verificationPromises);
            const verified = results.filter(lang => lang !== null);
            
            if (verified.length > 0) {
                availableLanguages = verified;
                console.log('Available languages loaded from config:', availableLanguages);
                return availableLanguages;
            }
        }
        
        // Fallback: try to verify default languages exist
        console.warn('languages.json not found or invalid, checking default languages...');
        const defaultLanguages = ['hu', 'en', 'de'];
        const foundLanguages = [];
        
        for (const lang of defaultLanguages) {
            try {
                const response = await fetch(`language/${lang}.json`, { method: 'HEAD' });
                if (response.ok) {
                    foundLanguages.push(lang);
                } else {
                    console.warn(`Default language file not found: ${lang}.json`);
                }
            } catch (e) {
                console.warn(`Error checking language file ${lang}.json:`, e);
            }
        }
        
        if (foundLanguages.length === 0) {
            console.error('No language files found! Using fallback defaults.');
            foundLanguages.push('hu', 'en', 'de');
        }
        
        availableLanguages = foundLanguages;
        console.log('Available languages (fallback):', availableLanguages);
        return availableLanguages;
    } catch (error) {
        console.error('Error discovering languages:', error);
        // Final fallback to default languages
        availableLanguages = ['hu', 'en', 'de'];
        console.warn('Using hardcoded fallback languages:', availableLanguages);
        return availableLanguages;
    }
}

// Load language file
async function loadLanguage(lang) {
    try {
        const response = await fetch(`language/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Language file not found: ${lang}.json`);
        }
        const data = await response.json();
        translations[lang] = data;
        console.log(`Language loaded: ${lang}`);
        return data;
    } catch (error) {
        console.error(`Error loading language ${lang}:`, error);
        // Try to load fallback language
        if (lang !== 'hu') {
            return loadLanguage('hu');
        }
        throw error;
    }
}

// Get translation by key path (e.g., "write.title" or "tabs.write")
function t(key, params = {}) {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }
    }
    
    if (typeof value !== 'string') {
        console.warn(`Translation value is not a string for key: ${key}`);
        return key;
    }
    
    // Replace parameters in format {param}
    if (params && Object.keys(params).length > 0) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey] !== undefined ? params[paramKey] : match;
        });
    }
    
    return value || key;
}

// Set current language and update UI
async function setLanguage(lang) {
    if (!availableLanguages.includes(lang)) {
        console.warn(`Language ${lang} not available`);
        return;
    }
    
    // Load language if not already loaded
    if (!translations[lang]) {
        await loadLanguage(lang);
    }
    
    currentLanguage = lang;
    document.documentElement.lang = lang;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        // Handle HTML content
        if (element.hasAttribute('data-i18n-html')) {
            element.innerHTML = translation;
        } else {
            // Don't update if it's a custom select value (will be updated separately)
            if (!element.closest('.custom-select-trigger') || element.classList.contains('custom-select-arrow')) {
                element.textContent = translation;
            }
        }
    });
    
    // Update placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    
    // Update title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });
    
    // Update custom select placeholders
    const materialSelect = document.getElementById('material-select');
    const colorSelect = document.getElementById('color-select');
    if (materialSelect) {
        const materialValue = materialSelect.querySelector('.custom-select-value');
        if (materialValue && !materialSelectControl?.getValue()) {
            materialValue.textContent = t('write.write.materialPlaceholder');
        }
    }
    if (colorSelect) {
        const colorValue = colorSelect.querySelector('.custom-select-value');
        if (colorValue && !colorSelectControl?.getValue()) {
            colorValue.textContent = t('write.write.colorPlaceholder');
        }
    }
    
    // Save to localStorage
    localStorage.setItem('preferredLanguage', lang);
    
    console.log(`Language changed to: ${lang}`);
}

// Initialize i18n system
async function initI18n() {
    // Discover available languages
    await discoverLanguages();
    
    // Verify we have at least one language
    if (availableLanguages.length === 0) {
        console.error('No languages available!');
        throw new Error('No languages available');
    }
    
    // Load preferred language from localStorage or get default from config
    let defaultLang = 'hu';
    try {
        const configResponse = await fetch('language/languages.json');
        if (configResponse.ok) {
            const config = await configResponse.json();
            defaultLang = config.defaultLanguage || availableLanguages[0];
        }
    } catch (e) {
        console.warn('Could not load languages.json for default language');
    }
    
    const savedLang = localStorage.getItem('preferredLanguage') || defaultLang;
    const langToLoad = availableLanguages.includes(savedLang) ? savedLang : availableLanguages[0];
    
    // Load default language
    await loadLanguage(langToLoad);
    await setLanguage(langToLoad);
    
    console.log(`i18n initialized with ${availableLanguages.length} language(s):`, availableLanguages);
    return availableLanguages;
}

// Get available languages with their display names
function getAvailableLanguages() {
    return availableLanguages.map(lang => ({
        code: lang,
        name: languageNames[lang] || lang.toUpperCase()
    }));
}

// Verify language files exist
async function verifyLanguageFiles() {
    try {
        // Load config
        const configResponse = await fetch('language/languages.json');
        if (!configResponse.ok) {
            console.warn('languages.json not found');
            return false;
        }
        
        const config = await configResponse.json();
        const languages = config.availableLanguages || [];
        
        if (languages.length === 0) {
            console.warn('No languages configured in languages.json');
            return false;
        }
        
        // Verify each language file exists
        const missing = [];
        const verificationPromises = languages.map(async (lang) => {
            try {
                const response = await fetch(`language/${lang}.json`, { method: 'HEAD' });
                if (!response.ok) {
                    missing.push(lang);
                    return false;
                }
                return true;
            } catch (e) {
                missing.push(lang);
                return false;
            }
        });
        
        await Promise.all(verificationPromises);
        
        if (missing.length > 0) {
            console.warn('Missing language files:', missing);
            return false;
        }
        
        console.log(`All ${languages.length} language file(s) verified`);
        return true;
    } catch (error) {
        console.error('Error verifying language files:', error);
        return false;
    }
}

// Export for use in other scripts
window.i18n = {
    t,
    setLanguage,
    initI18n,
    getAvailableLanguages,
    getCurrentLanguage: () => currentLanguage,
    getAvailableLanguagesList: () => availableLanguages,
    verifyLanguageFiles
};

