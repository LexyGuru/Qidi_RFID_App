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

// Discover available languages from language folder
async function discoverLanguages() {
    try {
        // Try to fetch the language directory listing
        // Since we can't directly list files, we'll try common language codes
        const commonLanguages = ['hu', 'en', 'de', 'fr', 'es', 'it', 'pl', 'ro', 'cs', 'sk', 'ru', 'ja', 'zh', 'ko'];
        const foundLanguages = [];
        
        // Try to fetch each language file
        const fetchPromises = commonLanguages.map(async (lang) => {
            try {
                const response = await fetch(`language/${lang}.json`, { method: 'HEAD' });
                if (response.ok) {
                    return lang;
                }
            } catch (e) {
                // Language file doesn't exist, skip
            }
            return null;
        });
        
        const results = await Promise.all(fetchPromises);
        const found = results.filter(lang => lang !== null);
        
        // If no languages found with HEAD, try GET
        if (found.length === 0) {
            for (const lang of ['hu', 'en', 'de']) {
                try {
                    const response = await fetch(`language/${lang}.json`);
                    if (response.ok) {
                        foundLanguages.push(lang);
                    }
                } catch (e) {
                    // Skip
                }
            }
            
            // If still nothing, use defaults
            if (foundLanguages.length === 0) {
                foundLanguages.push('hu', 'en', 'de');
            }
        } else {
            foundLanguages.push(...found);
        }
        
        availableLanguages = foundLanguages;
        console.log('Available languages discovered:', availableLanguages);
        return foundLanguages;
    } catch (error) {
        console.error('Error discovering languages:', error);
        // Fallback to default languages
        availableLanguages = ['hu', 'en', 'de'];
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
    
    // Load preferred language from localStorage or default to 'hu'
    const savedLang = localStorage.getItem('preferredLanguage') || 'hu';
    const langToLoad = availableLanguages.includes(savedLang) ? savedLang : availableLanguages[0];
    
    // Load default language
    await loadLanguage(langToLoad);
    await setLanguage(langToLoad);
    
    return availableLanguages;
}

// Get available languages with their display names
function getAvailableLanguages() {
    return availableLanguages.map(lang => ({
        code: lang,
        name: languageNames[lang] || lang.toUpperCase()
    }));
}

// Export for use in other scripts
window.i18n = {
    t,
    setLanguage,
    initI18n,
    getAvailableLanguages,
    getCurrentLanguage: () => currentLanguage,
    getAvailableLanguagesList: () => availableLanguages
};

