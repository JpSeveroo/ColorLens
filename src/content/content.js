const saveSettings = async (settings) => {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ colorLensSettings: settings }, () => {
            resolve();
        });
    });
};

const loadSettings = async () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['colorLensSettings'], (result) => {
            resolve(result.colorLensSettings || {});
        });
    });
};

const COLOR_FILTERS_DATA = {
    'Protanopia': {
        id: 'protanopia',
        svg: `
            <filter id="protanopia">
                <feColorMatrix in="SourceGraphic" type="matrix"
                    values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0"/>
            </filter>
        `
    },
    'Deuteranopia': {
        id: 'deuteranopia',
        svg: `
            <filter id="deuteranopia">
                <feColorMatrix in="SourceGraphic" type="matrix"
                    values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0"/>
            </filter>
        `
    },
    'Tritanopia': {
        id: 'tritanopia',
        svg: `
            <filter id="tritanopia">
                <feColorMatrix in="SourceGraphic" type="matrix"
                    values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0"/>
            </filter>
        `
    },
    'Protanomalia': {
        id: 'protanomaly',
        svg: `
            <filter id="protanomaly">
                <feColorMatrix in="SourceGraphic" type="matrix"
                    values="0.817, 0.183, 0, 0, 0 0.333, 0.667, 0, 0, 0 0, 0.125, 0.875, 0, 0 0, 0, 0, 1, 0"/>
            </filter>
        `
    },
    'Deuteranomalia': {
        id: 'deuteranomaly',
        svg: `
            <filter id="deuteranomaly">
                <feColorMatrix in="SourceGraphic" type="matrix"
                    values="0.8, 0.2, 0, 0, 0 0.258, 0.742, 0, 0, 0 0, 0.142, 0.858, 0, 0 0, 0, 0, 1, 0"/>
            </filter>
        `
    },
    'Tritanomalia': {
        id: 'tritanomaly',
        svg: `
            <filter id="tritanomaly">
                <feColorMatrix in="SourceGraphic" type="matrix"
                    values="0.967, 0.033, 0, 0, 0 0, 0.733, 0.267, 0, 0 0, 0.183, 0.817, 0, 0 0, 0, 0, 1, 0"/>
            </filter>
        `
    },
    'Achromatopsia': { id: 'achromatopsia', value: 'grayscale(100%)' },
    'Monocromia': { id: 'monocromia', value: 'grayscale(100%)' },
    'none': { id: 'none', value: '' }
};

console.log('ColorLens Content Script - Carregamento OK');

function injectSvgFilters() {
    if (document.getElementById('colorlens-svg-filters')) {
        return Promise.resolve();
    }

    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.id = 'colorlens-svg-filters';
    svgContainer.style.display = 'none';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    for (const key in COLOR_FILTERS_DATA) {
        if (COLOR_FILTERS_DATA[key].svg) {
            defs.innerHTML += COLOR_FILTERS_DATA[key].svg;
        }
    }

    svgContainer.appendChild(defs);
    document.documentElement.appendChild(svgContainer);
    return Promise.resolve();
}

const applyFilters = (settings) => {

    const { filter, contrast, saturation, nightVision } = settings;

    let filterString = '';

    const key = (filter || 'none');
    const colorFilterData = COLOR_FILTERS_DATA[key] || COLOR_FILTERS_DATA['none'];

    if (colorFilterData.svg) {
        filterString += `url(#${colorFilterData.id}) `;
    } else if (colorFilterData.value) {
        filterString += `${colorFilterData.value} `;
    }
    
    filterString += `contrast(${contrast}%) `;
    filterString += `saturate(${saturation}%) `;

    if (nightVision) {
        filterString += `brightness(80%) sepia(20%) `;
    }

    document.documentElement.style.filter = filterString.trim();

    if (nightVision) {
        document.documentElement.classList.add('colorlens-night-vision');
    } else {
        document.documentElement.classList.remove('colorlens-night-vision');
    }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'applySettings' && request.settings) {
        console.log('Configurações recebidas:', request.settings);
        
        injectSvgFilters().then(() => {
            injectUtilityStyles();
            applyFilters(request.settings);
            applyCustomColors(request.settings.customColors);
        });
        
        sendResponse({ status: 'settings applied' });
    } else {
        sendResponse({ status: 'ignoring message' });
    }
});

function hexToRgbNormalized(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r: r / 255, g: g / 255, b: b / 255 };
}

function buildColorMatrix(backgroundHex, textHex, highlightHex) {
    const bg = hexToRgbNormalized(backgroundHex);
    const text = hexToRgbNormalized(textHex);
    const highlight = hexToRgbNormalized(highlightHex);
    
    const r1 = bg.r; const r2 = text.r; const r3 = highlight.r; const r4 = 0; const r5 = 0;
    const g1 = bg.g; const g2 = text.g; const g3 = highlight.g; const g4 = 0; const g5 = 0;
    const b1 = bg.b; const b2 = text.b; const b3 = highlight.b; const b4 = 0; const b5 = 0;
    const a1 = 0;    const a2 = 0;    const a3 = 0;    const a4 = 1; const a5 = 0;
    
    return `${r1}, ${r2}, ${r3}, ${r4}, ${r5} ` +
           `${g1}, ${g2}, ${g3}, ${g4}, ${g5} ` +
           `${b1}, ${b2}, ${b3}, ${b4}, ${b5} ` +
           `${a1}, ${a2}, ${a3}, ${a4}, ${a5}`;
}

function injectCustomColorFilter(backgroundHex, textHex, highlightHex) {
    injectSvgFilters();
    let svgContainer = document.getElementById('colorlens-svg-filters');
    if (!svgContainer) return;
    let defs = svgContainer.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgContainer.appendChild(defs);
    }
    const existingFilter = defs.querySelector('#colorlens-custom-color-mapping');
    if (existingFilter) defs.removeChild(existingFilter);
    
    const matrixValues = buildColorMatrix(backgroundHex, textHex, highlightHex);
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'colorlens-custom-color-mapping');
    const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    feColorMatrix.setAttribute('in', 'SourceGraphic');
    feColorMatrix.setAttribute('type', 'matrix');
    feColorMatrix.setAttribute('values', matrixValues);
    filter.appendChild(feColorMatrix);
    defs.appendChild(filter);
}

function applyCustomColors(colors) {
    if (!colors || !colors.background || !colors.text || !colors.highlight) {
        const currentFilter = document.documentElement.style.filter || '';
        const newFilter = currentFilter.replace(/url\(#colorlens-custom-color-mapping\)\s*/g, '').trim();
        document.documentElement.style.filter = newFilter || '';
        return;
    }
    const { background, text, highlight } = colors;
    injectCustomColorFilter(background, text, highlight);
    const currentFilter = document.documentElement.style.filter || '';
    let newFilter = currentFilter.replace(/url\(#colorlens-custom-color-mapping\)\s*/g, '');
    newFilter = `url(#colorlens-custom-color-mapping) ${newFilter}`.trim();
    document.documentElement.style.filter = newFilter;
}

loadSettings().then(settings => {
    if (Object.keys(settings).length > 0) {
        injectSvgFilters().then(() => {
            injectUtilityStyles();
            applyFilters(settings);
            applyCustomColors(settings.customColors);
        });
    }
});

function injectUtilityStyles() {
    const styleSheetId = 'colorlens-utility-styles';
    const existingStyle = document.getElementById(styleSheetId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleSheetId;

    style.textContent = `
        /* Suaviza transições */
        html {
            transition: filter 0.3s ease-in-out, background-color 0.3s ease;
        }

        /* --- MODO NOTURNO (Apenas Background Suave) --- */
        html.colorlens-night-vision {
            background-color: #121212 !important;
            scrollbar-color: #454a4d #202324 !important;
        }

        /* REMOVIDO: Estilos do Modo Leitura */
    `;

    document.head.appendChild(style);
}