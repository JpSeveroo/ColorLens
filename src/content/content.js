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

    // Aplica a string final de filtros ao elemento raiz do HTML
    document.documentElement.style.filter = filterString.trim();

    // Lógica para o modo de leitura
    if (readingMode) {
        document.body.classList.add('colorlens-reading-mode');
    } else {
        document.body.classList.remove('colorlens-reading-mode');
    }

    if (nightVision) {
        // Usamos essa bomba: documentElement (o <html>) para garantir que a página inteira inverta
        document.documentElement.classList.add('colorlens-night-vision')
    } else {
        document.documentElement.classList.remove('colorlens-night-vision');
    }
}

// Listener para mensagens da extensão
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // Verifica se a ação é 'applySettings'
    if (request.action === 'applySettings' && request.settings) {
        console.log('Configurações recebidas do popup:', request.settings);
        // Garante que os filtros SVG existam na página antes de aplicá-los
        injectSvgFilters();
        injectUtilityStyles();
        applyFilters(request.settings);
        applyCustomColors(request.settings.customColors);
        sendResponse({ status: 'settings applied' });
    } else {
        sendResponse({ status: 'ignoring message' });
    }
});

//Id para a Style a seguir (Eu não faço a mínima eideia de como essa função ta funcionando)
const CUSTOM_STYLE_ID = 'colorlens-custom-colors-style';

/**
 * Aplica as cores base (Fundo, Texto, Links) injetando CSS na página.
 * @param {object} colors - O objeto { background, text, highlight }
 */
function applyCustomColors(colors) {
    let styleTag = document.getElementById(CUSTOM_STYLE_ID);
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = CUSTOM_STYLE_ID;
        document.head.appendChild(styleTag);
    }

    // Se o objeto de cores não for válido (ex: no reset), 
    // limpamos o conteúdo da tag e saímos
    if (!colors || !colors.background) {
        styleTag.textContent = '';
        return;
    }

    const { background, text, highlight } = colors;

    // Criamos as regras de CSS. O !important é CRUCIAL
    // para sobrescrever o CSS de qualquer site.
    styleTag.textContent = `
        /* 1. Fundo (Aplicado no HTML) */
        html {
            background-color: ${background} !important;
        }
        
        /* 2. Fundo (Aplicado no Body, e remove imagem de fundo) */
        body {
            background-color: ${background} !important;
            background-image: none !important;
        }

        /* 3. Texto (Aplicado de forma geral) */
        /* Usamos seletores comuns para garantir a cobertura */
        body, p, span, div, h1, h2, h3, h4, h5, h6, li, th, td, label {
            color: ${text} !important;
        }

        /* 4. Links (Sobrescreve a regra de texto) */
        /* Incluímos 'a *' para pegar links com <span> ou <div> dentro */
        a, a:visited, a *, a:visited * {
            color: ${highlight} !important;
        }
    `;
}

// Aplica as configurações salvas quando o script de conteúdo é carregado
loadSettings().then(settings => {
    if (Object.keys(settings).length > 0) {
        injectSvgFilters();
        injectUtilityStyles();
        applyFilters(settings);
        applyCustomColors(settings.customColors);
    }
});

function injectUtilityStyles() {
    const styleSheetId = 'colorlens-utility-styles';
    if (document.getElementById(styleSheetId)) {
        return; // Já foi injetado
    }

    const style = document.createElement('style');
    style.id = styleSheetId;

    /*Isso aqui foi pura IA papo reto, moh preguiça estudar coloração/fonte de sites*/
    style.textContent = `
        /* --- MODO NOTURNO (O MÉTODO CORRETO) --- */

        /* 1. Aplica a inversão no HTML (página inteira) */
        html.colorlens-night-vision {
            background-color: #111 !important;
            filter: invert(1) hue-rotate(180deg) !important;
        }

        /* 2. "Des-inverte" mídias para que não fiquem parecendo negativos */
        html.colorlens-night-vision img,
        html.colorlens-night-vision video,
        html.colorlens-night-vision iframe,
        html.colorlens-night-vision [style*="background-image"] {
            filter: invert(1) hue-rotate(180deg) !important;
        }
        
        /* --- MODO DE LEITURA --- */
        body.colorlens-reading-mode {
            /* Força uma fonte limpa, sem viadagem. */
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 
                        "Segoe UI", Roboto, Helvetica, Arial, 
                        sans-serif !important;

            font-size: 1.15rem !important; 
            line-height: 1.8 !important; 
            letter-spacing: 0.03em !important;

            text-align: left !important;
        }

        body.colorlens-reading-mode p,
        body.colorlens-reading-mode span,
        body.colorlens-reading-mode div {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 
                        "Segoe UI", Roboto, Helvetica, Arial, 
                        sans-serif !important;
            text-align: left !important;
        }

    `;

    document.head.appendChild(style);
}