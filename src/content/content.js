// Utilitários de armazenamento
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

// Dados dos filtros de cor
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
<<<<<<< HEAD
    
=======

    // Pega todas as definições de filtro do nosso objeto e as adiciona ao SVG
>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
    for (const key in COLOR_FILTERS_DATA) {
        if (COLOR_FILTERS_DATA[key].svg) {
            defs.innerHTML += COLOR_FILTERS_DATA[key].svg;
        }
    }

    svgContainer.appendChild(defs);
<<<<<<< HEAD
=======

    // CORREÇÃO: Usar document.documentElement (o elemento <html>) é mais robusto
    // para injetar recursos globais como definições de filtros SVG, garantindo que
    // eles estejam disponíveis para o CSS antes que o <body> esteja totalmente carregado.
>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
    document.documentElement.appendChild(svgContainer);
    return Promise.resolve();
}

<<<<<<< HEAD
=======
// Função que aplica os estilos com base nas configurações recebidas
>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
const applyFilters = (settings) => {
    // REMOVIDO: readingMode
    const { filter, contrast, saturation, nightVision } = settings;

    let filterString = '';

<<<<<<< HEAD
    const key = (filter || 'none');
    const colorFilterData = COLOR_FILTERS_DATA[key] || COLOR_FILTERS_DATA['none'];

    if (colorFilterData.svg) {
        filterString += `url(#${colorFilterData.id}) `;
    } else if (colorFilterData.value) {
        filterString += `${colorFilterData.value} `;
    }
    
    // Ajustes
    filterString += `contrast(${contrast}%) `;
    filterString += `saturate(${saturation}%) `;

    // Modo Noturno Suave (Sepia 20%)
    if (nightVision) {
        filterString += `brightness(80%) sepia(20%) `;
    }

    document.documentElement.style.filter = filterString.trim();

    // REMOVIDO: Lógica de classe 'colorlens-reading-mode'
    if (nightVision) {
        document.documentElement.classList.add('colorlens-night-vision');
    } else {
        document.documentElement.classList.remove('colorlens-night-vision');
    }
=======
    // 1. Busca o filtro de cor no objeto (Daltonismo)
    const colorFilterData = COLOR_FILTERS_DATA[filter] || COLOR_FILTERS_DATA['none'];

    // Se for um filtro SVG
    if (colorFilterData.svg) {
        filterString += `url(#${colorFilterData.id}) `;
    } 
    // Se for um valor CSS direto (como grayscale)
    else if (colorFilterData.value) {
        filterString += `${colorFilterData.value} `;
    }
    
    // 2. Adiciona os filtros de ajuste (Contraste e Saturação)
    filterString += `contrast(${contrast}%) `;
    filterString += `saturate(${saturation}%) `;

    // 3. Lógica do Modo Noturno (INTEGRADA AO JS)
    // Removemos o isPageAlreadyDark(). O usuário tem o controle total agora.
    if (nightVision) {
        // Adiciona a inversão na mesma string de filtros
        filterString += 'invert(1) hue-rotate(180deg) ';
        
        // Adiciona a classe APENAS para corrigir imagens e fundo, 
        // não para aplicar o filtro principal.
        document.documentElement.classList.add('colorlens-night-vision');
    } else {
        document.documentElement.classList.remove('colorlens-night-vision');
    }

    // 4. Aplica a string final de filtros ao elemento raiz
    document.documentElement.style.filter = filterString.trim();

    // Lógica para o modo de leitura
    if (readingMode) {
        document.body.classList.add('colorlens-reading-mode');
    } else {
        document.body.classList.remove('colorlens-reading-mode');
    }
>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
}

// Listener
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
<<<<<<< HEAD
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r: r / 255, g: g / 255, b: b / 255 };
=======

    // Converte para inteiros 0-255
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Normaliza para 0-1
    return {
        r: r / 255,
        g: g / 255,
        b: b / 255
    };
>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
}

function buildColorMatrix(backgroundHex, textHex, highlightHex) {
    const bg = hexToRgbNormalized(backgroundHex);
    const text = hexToRgbNormalized(textHex);
    const highlight = hexToRgbNormalized(highlightHex);
<<<<<<< HEAD
    
    const r1 = bg.r; const r2 = text.r; const r3 = highlight.r; const r4 = 0; const r5 = 0;
    const g1 = bg.g; const g2 = text.g; const g3 = highlight.g; const g4 = 0; const g5 = 0;
    const b1 = bg.b; const b2 = text.b; const b3 = highlight.b; const b4 = 0; const b5 = 0;
    const a1 = 0;    const a2 = 0;    const a3 = 0;    const a4 = 1; const a5 = 0;
    
=======

    // Matriz de transformação que mapeia canais RGB originais para cores completas:
    // 
    // R original (alto) → Cor de Fundo completa (bg.r, bg.g, bg.b)
    // G original (alto) → Cor de Texto completa (text.r, text.g, text.b)
    // B original (alto) → Cor de Links completa (highlight.r, highlight.g, highlight.b)
    //
    // Para cada canal do resultado (R', G', B'), combinamos os canais originais:
    // R' = R_original × bg.r + G_original × text.r + B_original × highlight.r
    // G' = R_original × bg.g + G_original × text.g + B_original × highlight.g
    // B' = R_original × bg.b + G_original × text.b + B_original × highlight.b

    // Linha 1 (R' do resultado): Combinação dos canais originais mapeados para R de cada cor
    const r1 = bg.r;        // R original → R de fundo
    const r2 = text.r;      // G original → R de texto
    const r3 = highlight.r; // B original → R de links
    const r4 = 0;           // Alpha preservado
    const r5 = 0;           // Offset

    // Linha 2 (G' do resultado): Combinação dos canais originais mapeados para G de cada cor
    const g1 = bg.g;        // R original → G de fundo
    const g2 = text.g;      // G original → G de texto
    const g3 = highlight.g; // B original → G de links
    const g4 = 0;           // Alpha preservado
    const g5 = 0;           // Offset

    // Linha 3 (B' do resultado): Combinação dos canais originais mapeados para B de cada cor
    const b1 = bg.b;        // R original → B de fundo
    const b2 = text.b;      // G original → B de texto
    const b3 = highlight.b; // B original → B de links
    const b4 = 0;           // Alpha preservado
    const b5 = 0;           // Offset

    // Linha 4 (A'): Preserva o alpha original
    const a1 = 0;
    const a2 = 0;
    const a3 = 0;
    const a4 = 1;           // Alpha inalterado
    const a5 = 0;           // Offset

    // Formata a matriz como string para feColorMatrix
    // Os valores são separados por espaços e vírgulas alternadamente
>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
    return `${r1}, ${r2}, ${r3}, ${r4}, ${r5} ` +
        `${g1}, ${g2}, ${g3}, ${g4}, ${g5} ` +
        `${b1}, ${b2}, ${b3}, ${b4}, ${b5} ` +
        `${a1}, ${a2}, ${a3}, ${a4}, ${a5}`;
}

function injectCustomColorFilter(backgroundHex, textHex, highlightHex) {
    injectSvgFilters();
<<<<<<< HEAD
    let svgContainer = document.getElementById('colorlens-svg-filters');
    if (!svgContainer) return;
=======

    let svgContainer = document.getElementById('colorlens-svg-filters');
    if (!svgContainer) {
        return;
    }

>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
    let defs = svgContainer.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgContainer.appendChild(defs);
    }
<<<<<<< HEAD
    const existingFilter = defs.querySelector('#colorlens-custom-color-mapping');
    if (existingFilter) defs.removeChild(existingFilter);
    
    const matrixValues = buildColorMatrix(backgroundHex, textHex, highlightHex);
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'colorlens-custom-color-mapping');
=======

    // Remove o filtro customizado anterior se existir
    const existingFilter = defs.querySelector('#colorlens-custom-color-mapping');
    if (existingFilter) {
        defs.removeChild(existingFilter);
    }

    // Constrói a matriz de transformação
    const matrixValues = buildColorMatrix(backgroundHex, textHex, highlightHex);

    // Cria o elemento filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'colorlens-custom-color-mapping');

>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
    const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    feColorMatrix.setAttribute('in', 'SourceGraphic');
    feColorMatrix.setAttribute('type', 'matrix');
    feColorMatrix.setAttribute('values', matrixValues);
<<<<<<< HEAD
=======

>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
    filter.appendChild(feColorMatrix);
    defs.appendChild(filter);
}

function applyCustomColors(colors) {
    if (!colors || !colors.background || !colors.text || !colors.highlight) {
<<<<<<< HEAD
=======
        const svgContainer = document.getElementById('colorlens-svg-filters');
        if (svgContainer) {
            const defs = svgContainer.querySelector('defs');
            if (defs) {
                const existingFilter = defs.querySelector('#colorlens-custom-color-mapping');
                if (existingFilter) {
                    defs.removeChild(existingFilter);
                }
            }
        }

        // Remove o filtro do elemento raiz
>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
        const currentFilter = document.documentElement.style.filter || '';
        const newFilter = currentFilter.replace(/url\(#colorlens-custom-color-mapping\)\s*/g, '').trim();
        document.documentElement.style.filter = newFilter || '';
        return;
    }
    const { background, text, highlight } = colors;
    injectCustomColorFilter(background, text, highlight);
    const currentFilter = document.documentElement.style.filter || '';
<<<<<<< HEAD
    let newFilter = currentFilter.replace(/url\(#colorlens-custom-color-mapping\)\s*/g, '');
    newFilter = `url(#colorlens-custom-color-mapping) ${newFilter}`.trim();
=======

    // Remove a referência anterior ao filtro customizado se existir
    let newFilter = currentFilter.replace(/url\(#colorlens-custom-color-mapping\)\s*/g, '');

    // Adiciona o novo filtro customizado no início (para que seja aplicado primeiro)
    newFilter = `url(#colorlens-custom-color-mapping) ${newFilter}`.trim();

>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
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

<<<<<<< HEAD
=======
/**
 * Verifica se a página já possui um fundo escuro.
 * Retorna true se for escura, false se for clara.
 */
function isPageAlreadyDark() {
    // 1. Verifica se o site respeita a preferência do sistema (Maneira mais rápida)
    // Se o sistema do usuário é Dark e o site responde a isso, assumimos que é dark.
    /* Nota: Isso pode falhar se o usuário tiver sistema Dark mas forçar o site Light. 
       Se quiser ser mais preciso, pode remover esse bloco e confiar só na cor. */
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Verifica se o site não tem background branco explícito definindo uma regra de exceção
        // Mas geralmente, confiar na cor computada abaixo é mais seguro.
    }

    // 2. Análise da cor computada (Maneira mais precisa)
    const body = document.body;
    const html = document.documentElement;

    if (!body) return false;

    // Pega a cor de fundo do body e do html
    const bgBody = window.getComputedStyle(body).backgroundColor;
    const bgHtml = window.getComputedStyle(html).backgroundColor;

    // Função auxiliar para extrair números do rgb(r, g, b)
    const parseColor = (colorStr) => {
        // Se for transparente, retorna null
        if (colorStr === 'rgba(0, 0, 0, 0)' || colorStr === 'transparent') return null;

        const match = colorStr.match(/\d+/g);
        if (!match) return null;
        return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
    };

    // Tenta pegar a cor do body, se for transparente, tenta do html
    const color = parseColor(bgBody) || parseColor(bgHtml);

    // Se tudo for transparente, o navegador renderiza branco por padrão.
    // Então a página NÃO é escura.
    if (!color) return false;

    // Fórmula de luminância padrão (percepção humana)
    // Y = 0.299*R + 0.587*G + 0.114*B
    const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;

    // Se o brilho for menor que 128 (metade de 255), é considerado escuro.
    // Vamos ser conservadores e usar 50 para garantir que é REALMENTE escuro.
    return brightness < 50;
}

>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
function injectUtilityStyles() {
    const styleSheetId = 'colorlens-utility-styles';
    const existingStyle = document.getElementById(styleSheetId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleSheetId;

<<<<<<< HEAD
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
=======
    /* AQUI ESTÁ O ERRO ANTERIOR:
       Antes você definia background-color: #121212 (Escuro).
       Quando o filtro invert(1) rodava, #121212 virava #EDEDED (Claro).
       
       CORREÇÃO:
       Definimos o fundo como BRANCO (#FFFFFF). 
       O filtro invert(1) transformará isso em PRETO (#000000).
    */

    style.textContent = `
        /* --- MODO NOTURNO AUXILIAR (CSS) --- */
        
        html.colorlens-night-vision {
            background-color: #FFFFFF !important; /* Fundo base CLARO para ser invertido para ESCURO */
            scrollbar-color: #454a4d #e0e0e0 !important;
            color: #000000 !important; /* Texto base PRETO para ser invertido para BRANCO */
        }

        /* Proteção contra inversão dupla: "Des-inverte" mídias para voltarem ao normal */
        html.colorlens-night-vision img,
        html.colorlens-night-vision video,
        html.colorlens-night-vision iframe,
        html.colorlens-night-vision canvas,
        html.colorlens-night-vision svg,
        html.colorlens-night-vision :not(object):not(body)[style*="background-image"] {
            filter: invert(1) hue-rotate(180deg) !important;
        }

        /* Corrige sombras que ficam estranhas invertidas */
        html.colorlens-night-vision * {
            box-shadow: none !important;
            text-shadow: none !important;
        }

        body.colorlens-reading-mode p,
        body.colorlens-reading-mode span,
        body.colorlens-reading-mode div {
            font-family: 'Inter', sans-serif !important;
            line-height: 1.6 !important;
            letter-spacing: 0.5px !important;
        }
>>>>>>> 8c4871f6225ba0ebc7833b51281627610c77cb1e
    `;

    document.head.appendChild(style);
}