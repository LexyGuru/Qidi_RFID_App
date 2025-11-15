// Wait for Tauri API to be available
let invoke;

function waitForTauri() {
    return new Promise((resolve) => {
        // Check multiple possible locations for Tauri API
        if (window.__TAURI_INVOKE__) {
            invoke = window.__TAURI_INVOKE__;
            console.log('Tauri API loaded from __TAURI_INVOKE__');
            resolve();
        } else if (window.__TAURI__ && window.__TAURI__.tauri && window.__TAURI__.tauri.invoke) {
            invoke = window.__TAURI__.tauri.invoke;
            console.log('Tauri API loaded from __TAURI__.tauri');
            resolve();
        } else {
            console.log('Waiting for Tauri API...', {
                hasTauri: !!window.__TAURI__,
                hasInvoke: !!window.__TAURI_INVOKE__
            });
            setTimeout(() => waitForTauri().then(resolve), 100);
        }
    });
}

// Initialize Tauri API
waitForTauri().then(() => {
    console.log('Script loaded, Tauri API available:', !!invoke);
    // Initialize app after Tauri is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    console.log('Setting up tab button:', btn.getAttribute('data-tab'));
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        console.log('Tab clicked:', tabId);
        
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        btn.classList.add('active');
        const content = document.getElementById(tabId);
        if (content) {
            content.classList.add('active');
            console.log('Tab activated:', tabId);
        } else {
            console.error('Tab content not found:', tabId);
        }
    });
});

// Load technical specs
async function loadSpecs() {
    try {
        // Set loading text
        const loadingText = window.i18n ? window.i18n.t('specs.loading') : 'Loading...';
        document.getElementById('protocol').textContent = loadingText;
        document.getElementById('frequency').textContent = loadingText;
        document.getElementById('baud-rate').textContent = loadingText;
        document.getElementById('distance').textContent = loadingText;
        document.getElementById('encryption').textContent = loadingText;
        
        const specs = await invoke('get_rfid_specs');
        document.getElementById('protocol').textContent = specs.protocol;
        document.getElementById('frequency').textContent = specs.frequency;
        document.getElementById('baud-rate').textContent = specs.baud_rate;
        document.getElementById('distance').textContent = specs.operating_distance;
        document.getElementById('encryption').textContent = specs.encryption;
    } catch (error) {
        console.error('Error loading specs:', error);
        const errorText = window.i18n ? window.i18n.t('errors.readError') : 'Error loading';
        document.getElementById('protocol').textContent = errorText;
        document.getElementById('frequency').textContent = errorText;
        document.getElementById('baud-rate').textContent = errorText;
        document.getElementById('distance').textContent = errorText;
        document.getElementById('encryption').textContent = errorText;
    }
}

// Load material codes
async function loadMaterials() {
    try {
        const materials = await invoke('get_material_codes');
        const grid = document.getElementById('materials-grid');
        grid.innerHTML = '';
        
        materials.forEach(material => {
            const card = document.createElement('div');
            card.className = 'material-card';
            card.innerHTML = `
                <div class="code">${material.code}</div>
                <div class="name">${material.name}</div>
            `;
            grid.appendChild(card);
        });
        
        // Setup search
        setupMaterialSearch(materials);
    } catch (error) {
        console.error('Error loading materials:', error);
    }
}

// Load color codes
async function loadColors() {
    try {
        const colors = await invoke('get_color_codes');
        const grid = document.getElementById('colors-grid');
        grid.innerHTML = '';
        
        colors.forEach(color => {
            const card = document.createElement('div');
            card.className = 'color-card';
            card.innerHTML = `
                <div class="code">${color.code}</div>
                <div class="name">${color.name}</div>
                <div class="color-preview" style="background-color: ${color.hex}"></div>
                <div class="hex">${color.hex}</div>
            `;
            grid.appendChild(card);
        });
        
        // Setup search
        setupColorSearch(colors);
    } catch (error) {
        console.error('Error loading colors:', error);
    }
}

// Material search
let allMaterials = [];
function setupMaterialSearch(materials) {
    allMaterials = materials;
    const searchInput = document.getElementById('material-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const grid = document.getElementById('materials-grid');
        grid.innerHTML = '';
        
        const filtered = materials.filter(m => 
            m.name.toLowerCase().includes(query) || 
            m.code.toString().includes(query)
        );
        
        filtered.forEach(material => {
            const card = document.createElement('div');
            card.className = 'material-card';
            card.innerHTML = `
                <div class="code">${material.code}</div>
                <div class="name">${material.name}</div>
            `;
            grid.appendChild(card);
        });
    });
}

// Color search
let allColors = [];
function setupColorSearch(colors) {
    allColors = colors;
    const searchInput = document.getElementById('color-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const grid = document.getElementById('colors-grid');
        grid.innerHTML = '';
        
        const filtered = colors.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.code.toString().includes(query) ||
            c.hex.toLowerCase().includes(query)
        );
        
        filtered.forEach(color => {
            const card = document.createElement('div');
            card.className = 'color-card';
            card.innerHTML = `
                <div class="code">${color.code}</div>
                <div class="name">${color.name}</div>
                <div class="color-preview" style="background-color: ${color.hex}"></div>
                <div class="hex">${color.hex}</div>
            `;
            grid.appendChild(card);
        });
    });
}

// Reader status
let allColorsForWrite = [];

async function checkReaderStatus() {
    console.log('checkReaderStatus called');
    try {
        console.log('Invoking check_reader_status...');
        const status = await invoke('check_reader_status');
        console.log('Reader status received:', status);
        
        const connectedEl = document.getElementById('status-connected');
        const readerEl = document.getElementById('status-reader');
        const cardEl = document.getElementById('status-card');
        const errorEl = document.getElementById('status-error');
        
        console.log('Status elements found:', {
            connected: !!connectedEl,
            reader: !!readerEl,
            card: !!cardEl,
            error: !!errorEl
        });
        
        if (status.connected) {
            connectedEl.textContent = window.i18n.t('write.readerStatus.connected');
            connectedEl.className = 'status-value connected';
            readerEl.textContent = status.reader_name || '-';
            if (status.card_present) {
                cardEl.textContent = window.i18n.t('write.readerStatus.cardPresent');
                cardEl.className = 'status-value connected';
            } else {
                cardEl.textContent = window.i18n.t('write.readerStatus.noCard');
                cardEl.className = 'status-value disconnected';
            }
            if (status.error) {
                errorEl.textContent = status.error;
                errorEl.style.display = 'block';
            } else {
                errorEl.style.display = 'none';
            }
        } else {
            connectedEl.textContent = window.i18n.t('write.readerStatus.disconnected');
            connectedEl.className = 'status-value disconnected';
            readerEl.textContent = '-';
            cardEl.textContent = '-';
            if (status.error) {
                errorEl.textContent = status.error;
                errorEl.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error checking reader status:', error);
        const errorEl = document.getElementById('status-error');
        if (errorEl) {
            errorEl.textContent = `${window.i18n.t('write.write.error')} ${error}`;
            errorEl.style.display = 'block';
        }
    }
}

// Read chip
async function readChip() {
    console.log('readChip called');
    const readBtn = document.getElementById('read-btn');
    const resultBox = document.getElementById('read-result');
    
    if (!readBtn) {
        console.error('read-btn not found!');
        return;
    }
    
    if (!resultBox) {
        console.error('read-result not found!');
        return;
    }
    
    readBtn.disabled = true;
    readBtn.textContent = window.i18n.t('write.read.reading');
    resultBox.style.display = 'none';
    
    try {
        console.log('Invoking read_chip...');
        const data = await invoke('read_chip');
        console.log('Chip data received:', data);
        
        // Find material name
        const materials = await invoke('get_material_codes');
        const material = materials.find(m => m.code === data.material_code);
        
        // Find color name
        const colors = await invoke('get_color_codes');
        const color = colors.find(c => c.code === data.color_code);
        
        document.getElementById('read-material').textContent = 
            `${data.material_code}${material ? ' - ' + material.name : ''}`;
        document.getElementById('read-color').textContent = 
            `${data.color_code}${color ? ' - ' + color.name : ''}`;
        document.getElementById('read-manufacturer').textContent = data.manufacturer_code.toString();
        document.getElementById('read-uid').textContent = data.uid || window.i18n.t('write.read.results.notAvailable');
        
        resultBox.style.display = 'block';
        resultBox.className = 'result-box success';
    } catch (error) {
        resultBox.style.display = 'block';
        resultBox.className = 'result-box error';
        resultBox.innerHTML = `<strong>${window.i18n.t('write.write.error')}</strong> ${error}`;
    } finally {
        readBtn.disabled = false;
        readBtn.textContent = window.i18n.t('write.read.button');
    }
}

// Write chip
async function writeChip() {
    console.log('writeChip called');
    const writeBtn = document.getElementById('write-btn');
    const resultBox = document.getElementById('write-result');
    const manufacturerInput = document.getElementById('manufacturer-input');
    
    if (!writeBtn || !resultBox || !materialSelectControl || !colorSelectControl || !manufacturerInput) {
        console.error('Required elements not found:', {
            writeBtn: !!writeBtn,
            resultBox: !!resultBox,
            materialSelectControl: !!materialSelectControl,
            colorSelectControl: !!colorSelectControl,
            manufacturerInput: !!manufacturerInput
        });
        return;
    }
    
    const materialCode = parseInt(materialSelectControl.getValue());
    const colorCode = parseInt(colorSelectControl.getValue());
    const manufacturerCode = manufacturerInput.value ? parseInt(manufacturerInput.value) : null;
    
    console.log('Write parameters:', { materialCode, colorCode, manufacturerCode });
    
    if (!materialCode || !colorCode) {
        console.warn('Missing material or color code');
        resultBox.style.display = 'block';
        resultBox.className = 'result-box error';
        resultBox.innerHTML = `<strong>${window.i18n.t('write.write.error')}</strong> ${window.i18n.t('write.write.errorSelectMaterialColor')}`;
        return;
    }
    
    writeBtn.disabled = true;
    writeBtn.textContent = window.i18n.t('write.write.writing');
    resultBox.style.display = 'none';
    
    try {
        console.log('Invoking write_chip with:', { materialCode, colorCode, manufacturerCode });
        const result = await invoke('write_chip', {
            materialCode,
            colorCode,
            manufacturerCode
        });
        console.log('Write result:', result);
        
        // Parse result to extract values
        const match = result.match(/Material=(\d+), Color=(\d+), Manufacturer=(\d+)/);
        const successMsg = match ? window.i18n.t('success.writeSuccess', {
            material: match[1],
            color: match[2],
            manufacturer: match[3]
        }) : result;
        
        resultBox.style.display = 'block';
        resultBox.className = 'result-box success';
        resultBox.innerHTML = `<strong>${window.i18n.t('write.write.success')}</strong> ${successMsg}`;
        
        // Auto-read after write
        setTimeout(() => {
            readChip();
        }, 500);
    } catch (error) {
        resultBox.style.display = 'block';
        resultBox.className = 'result-box error';
        resultBox.innerHTML = `<strong>${window.i18n.t('write.write.error')}</strong> ${error}`;
    } finally {
        writeBtn.disabled = false;
        writeBtn.textContent = window.i18n.t('write.write.button');
    }
}

// Custom Select Component
function initCustomSelect(selectElement, options, onSelect) {
    const trigger = selectElement.querySelector('.custom-select-trigger');
    const valueSpan = trigger.querySelector('.custom-select-value');
    const optionsContainer = selectElement.querySelector('.custom-select-options');
    let selectedValue = null;
    let selectedText = valueSpan.textContent;

    // Populate options
    options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'custom-select-option';
        optionElement.textContent = option.text;
        optionElement.dataset.value = option.value;
        
        optionElement.addEventListener('click', () => {
            selectedValue = option.value;
            selectedText = option.text;
            valueSpan.textContent = selectedText;
            
            // Update selected state
            optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            optionElement.classList.add('selected');
            
            // Close dropdown
            selectElement.classList.remove('active');
            
            // Call callback
            if (onSelect) {
                onSelect(selectedValue, selectedText);
            }
        });
        
        optionsContainer.appendChild(optionElement);
    });

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = selectElement.classList.contains('active');
        
        // Close all other selects
        document.querySelectorAll('.custom-select').forEach(sel => {
            if (sel !== selectElement) {
                sel.classList.remove('active');
            }
        });
        
        selectElement.classList.toggle('active', !isActive);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!selectElement.contains(e.target)) {
            selectElement.classList.remove('active');
        }
    });

    // Return getter function
    return {
        getValue: () => selectedValue,
        setValue: (value) => {
            const option = options.find(opt => opt.value == value);
            if (option) {
                selectedValue = option.value;
                selectedText = option.text;
                valueSpan.textContent = selectedText;
                
                // Update selected state
                optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
                    opt.classList.toggle('selected', opt.dataset.value == value);
                });
            }
        },
        getOptions: () => options
    };
}

// Populate material and color selects
let materialSelectControl, colorSelectControl;

async function populateSelects() {
    console.log('populateSelects called');
    try {
        console.log('Getting material codes...');
        const materials = await invoke('get_material_codes');
        console.log('Materials received:', materials.length);
        
        console.log('Getting color codes...');
        const colors = await invoke('get_color_codes');
        console.log('Colors received:', colors.length);
        
        allColorsForWrite = colors;
        
        const materialSelect = document.getElementById('material-select');
        const colorSelect = document.getElementById('color-select');
        
        if (!materialSelect || !colorSelect) {
            console.error('Select elements not found!', {
                materialSelect: !!materialSelect,
                colorSelect: !!colorSelect
            });
            return;
        }
        
        // Prepare material options
        const materialOptions = materials.map(material => ({
            value: material.code,
            text: `${material.code} - ${material.name}`
        }));
        
        // Prepare color options
        const colorOptions = colors.map(color => ({
            value: color.code,
            text: `${color.code} - ${color.name}`
        }));
        
        // Initialize custom selects
        materialSelectControl = initCustomSelect(materialSelect, materialOptions);
        colorSelectControl = initCustomSelect(colorSelect, colorOptions, (value, text) => {
            console.log('Color select changed:', value);
            const colorCode = parseInt(value);
            const color = colors.find(c => c.code === colorCode);
            const preview = document.getElementById('color-preview');
            if (color) {
                console.log('Setting preview color:', color.hex);
                preview.style.backgroundColor = color.hex;
                preview.style.display = 'block';
            } else {
                console.log('Hiding preview');
                preview.style.display = 'none';
            }
        });
        
        console.log('Custom selects initialized');
    } catch (error) {
        console.error('Error in populateSelects:', error);
    }
}

// Initialize language selector
async function initLanguageSelector() {
    try {
        // Verify language files exist
        const verified = await window.i18n.verifyLanguageFiles();
        if (!verified) {
            console.warn('Some language files are missing. Check languages.json configuration.');
        }
        
        const availableLanguages = await window.i18n.initI18n();
        const languageSelect = document.getElementById('language-select');
        
        if (!languageSelect) {
            console.error('Language select not found!');
            return;
        }
        
        // Only show languages that are actually available
        if (availableLanguages.length === 0) {
            console.error('No languages available!');
            languageSelect.style.display = 'none';
            return;
        }
        
        const languageOptions = availableLanguages.map(lang => ({
            value: lang,
            text: window.i18n.getAvailableLanguages().find(l => l.code === lang)?.name || lang.toUpperCase()
        }));
        
        const languageSelectControl = initCustomSelect(languageSelect, languageOptions, (value) => {
            console.log('Language changed to:', value);
            window.i18n.setLanguage(value);
        });
        
        // Set current language
        const currentLang = window.i18n.getCurrentLanguage();
        languageSelectControl.setValue(currentLang);
        
        console.log(`Language selector initialized with ${availableLanguages.length} language(s)`);
    } catch (error) {
        console.error('Error initializing language selector:', error);
    }
}

// Initialize app function
async function initApp() {
    console.log('DOM Content Loaded and Tauri ready');
    
    try {
        // Initialize i18n first
        console.log('Initializing i18n...');
        await initLanguageSelector();
        
        console.log('Loading specs...');
        loadSpecs();
        
        console.log('Loading materials...');
        loadMaterials();
        
        console.log('Loading colors...');
        loadColors();
        
        console.log('Populating selects...');
        populateSelects();
        
        console.log('Checking reader status...');
        checkReaderStatus();
        
        // Event listeners
        const checkStatusBtn = document.getElementById('check-status-btn');
        const readBtn = document.getElementById('read-btn');
        const writeBtn = document.getElementById('write-btn');
        
        if (checkStatusBtn) {
            console.log('Setting up check-status button');
            checkStatusBtn.addEventListener('click', () => {
                console.log('Check status button clicked');
                checkReaderStatus();
            });
        } else {
            console.error('check-status-btn not found!');
        }
        
        if (readBtn) {
            console.log('Setting up read button');
            readBtn.addEventListener('click', () => {
                console.log('Read button clicked');
                readChip();
            });
        } else {
            console.error('read-btn not found!');
        }
        
        if (writeBtn) {
            console.log('Setting up write button');
            writeBtn.addEventListener('click', () => {
                console.log('Write button clicked');
                writeChip();
            });
        } else {
            console.error('write-btn not found!');
        }
        
        // Auto-refresh status every 5 seconds
        setInterval(() => {
            console.log('Auto-refreshing reader status...');
            checkReaderStatus();
        }, 5000);
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

