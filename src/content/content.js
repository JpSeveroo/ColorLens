// Utilitários de armazenamento (copiados de utils/storage.js para evitar problemas de importação)
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

// Dados dos filtros de cor (copiados de utils/filters.js para evitar problemas de importação)
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
    // Filtros que não dependem de SVG
    'Achromatopsia': { id: 'achromatopsia', value: 'grayscale(100%)' },
    'Monocromia': { id: 'monocromia', value: 'grayscale(100%)' },
    'none': { id: 'none', value: '' }
};
console.log('ColorLens Content Script - Carregamento OK');
/* Criando uma função response que pegará os requests do popup.js
e aplicará os devidos filtros. Por isso coloquei esse parâmetro de settings
para se referir aos requests do popup. */

// Eu fui tentar fazer com um arquivo svg à parte mas não deu certo
function injectSvgFilters() {
    // Verifica se os filtros já foram injetados pra não duplicar
    if (document.getElementById('colorlens-svg-filters')) {
        return;
    }

    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.id = 'colorlens-svg-filters';
    svgContainer.style.display = 'none'; // O SVG fica invisível

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Pega todas as definições de filtro do nosso objeto e as adiciona ao SVG
    for (const key in COLOR_FILTERS_DATA) {
        if (COLOR_FILTERS_DATA[key].svg) {
            defs.innerHTML += COLOR_FILTERS_DATA[key].svg;
        }
    }

    svgContainer.appendChild(defs);
    
    // CORREÇÃO: Usar document.documentElement (o elemento <html>) é mais robusto
    // para injetar recursos globais como definições de filtros SVG, garantindo que
    // eles estejam disponíveis para o CSS antes que o <body> esteja totalmente carregado.
    document.documentElement.appendChild(svgContainer);
}


// Função que aplica os estilos com base nas configurações recebidas
const applyFilters = (settings) => {
    const { filter, contrast, saturation, readingMode, nightVision } = settings;

    let filterString = '';

    // Busca o filtro de cor no objeto
    const colorFilterData = COLOR_FILTERS_DATA[filter] || COLOR_FILTERS_DATA['none'];

    // Se for um filtro SVG, usa a sintaxe de URL com o ID (#)
    if (colorFilterData.svg) {
        filterString += `url(#${colorFilterData.id}) `;
    } 
    // Se for um valor CSS direto (como grayscale), usa o valor
    else if (colorFilterData.value) {
        filterString += `${colorFilterData.value} `;
    }
    
    // Adiciona os filtros de ajuste
    filterString += `contrast(${contrast}%) `;
    filterString += `saturate(${saturation}%) `;
    
    if (nightVision) {
        filterString += `invert(1) hue-rotate(180deg)`;
    }

    // Aplica a string final de filtros ao elemento raiz do HTML
    document.documentElement.style.filter = filterString.trim();

    // Lógica para o modo de leitura
    if (readingMode) {
        document.body.classList.add('colorlens-reading-mode');
    } else {
        document.body.classList.remove('colorlens-reading-mode');
    }
}

// Listener para mensagens da extensão
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // Verifica se a ação é 'applySettings'
    if (request.action === 'applySettings' && request.settings) {
        console.log('Configurações recebidas do popup:', request.settings);
        // Garante que os filtros SVG existam na página antes de aplicá-los
        injectSvgFilters();
        applyFilters(request.settings);
        sendResponse({ status: 'settings applied' });
    } else {
        sendResponse({ status: 'ignoring message' });
    }
});

// Aplica as configurações salvas quando o script de conteúdo é carregado
loadSettings().then(settings => {
    if (Object.keys(settings).length > 0) {
        injectSvgFilters();
        applyFilters(settings);
    }
});