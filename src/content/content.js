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

// Carrega os filtros de cor compartilhados (arquivo JSON em utils)
let COLOR_FILTERS_DATA = {};
const filtersLoadedPromise = (async () => {
    try {
        const url = chrome.runtime.getURL('src/utils/filters.json');
        const res = await fetch(url);
        COLOR_FILTERS_DATA = await res.json();
        console.log('COLOR_FILTERS_DATA carregado (content)');
    } catch (err) {
        console.warn('Falha ao carregar filtros compartilhados:', err);
        COLOR_FILTERS_DATA = {};
    }
})();
console.log('ColorLens Content Script - Carregamento OK');
/* Criando uma função response que pegará os requests do popup.js
e aplicará os devidos filtros. Por isso coloquei esse parâmetro de settings
para se referir aos requests do popup. */

// Eu fui tentar fazer com um arquivo svg à parte mas não deu certo
async function injectSvgFilters() {
    // Aguarda o carregamento do JSON de filtros
    await filtersLoadedPromise;

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
        const entry = COLOR_FILTERS_DATA[key];
        if (entry && entry.svg) {
            defs.innerHTML += entry.svg;
        }
    }

    svgContainer.appendChild(defs);
    document.documentElement.appendChild(svgContainer);
}


// Substitua a função applyFilters antiga por esta:
const applyFilters = (settings) => {
    const { filter, contrast, saturation, readingMode, nightVision } = settings;

    let filterString = '';

    // Busca o filtro de cor no objeto (normaliza para lowercase id)
    const key = (filter || 'none').toLowerCase();
    const colorFilterData = COLOR_FILTERS_DATA[key] || COLOR_FILTERS_DATA['none'] || {};

    if (colorFilterData.svg) {
        filterString += `url(#${colorFilterData.id}) `;
    } else if (colorFilterData.value) {
        filterString += `${colorFilterData.value} `;
    }
    
    // 2. Ajustes do Usuário (Sliders)
    // O contraste e saturação escolhidos no popup entram aqui
    filterString += `contrast(${contrast}%) `;
    filterString += `saturate(${saturation}%) `;

    // 3. Modo Noturno (Integrado ao JS)
    // Se estiver ativo, ADICIONAMOS o escurecimento e o sepia na "receita" do filtro
    if (nightVision) {
        // brightness(80%): Escurece
        // sepia(20%): Conforto visual (amarelado)
        filterString += `brightness(80%) sepia(20%) `;
    }

    // Aplica a mistura completa no HTML
    document.documentElement.style.filter = filterString.trim();

    // Lógica para classes de estilo (Layout e Background)
    if (readingMode) {
        document.body.classList.add('colorlens-reading-mode');
    } else {
        document.body.classList.remove('colorlens-reading-mode');
    }

    if (nightVision) {
        document.documentElement.classList.add('colorlens-night-vision');
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

/**
 * Converte uma cor hexadecimal para componentes RGB normalizados (0-1).
 * @param {string} hex - Cor em formato hexadecimal (ex: "#FF0000" ou "FF0000")
 * @returns {Object} Objeto com r, g, b normalizados entre 0 e 1
 */
function hexToRgbNormalized(hex) {
    // Remove o # se presente
    hex = hex.replace('#', '');
    
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
}

/**
 * Constrói uma matriz de transformação feColorMatrix que mapeia:
 * - Canal Red original → Cor de Fundo (background)
 * - Canal Green original → Cor de Texto (text)
 * - Canal Blue original → Cor de Links (highlight)
 * 
 * A matriz feColorMatrix tem formato:
 * [R']   [a b c d e]   [R]
 * [G'] = [f g h i j] × [G]
 * [B']   [k l m n o]   [B]
 * [A']   [p q r s t]   [A]
 *                      [1]
 * 
 * @param {string} backgroundHex - Cor de fundo em hexadecimal
 * @param {string} textHex - Cor de texto em hexadecimal
 * @param {string} highlightHex - Cor de links em hexadecimal
 * @returns {string} String de valores da matriz para feColorMatrix
 */
function buildColorMatrix(backgroundHex, textHex, highlightHex) {
    const bg = hexToRgbNormalized(backgroundHex);
    const text = hexToRgbNormalized(textHex);
    const highlight = hexToRgbNormalized(highlightHex);
    
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
    return `${r1}, ${r2}, ${r3}, ${r4}, ${r5} ` +
           `${g1}, ${g2}, ${g3}, ${g4}, ${g5} ` +
           `${b1}, ${b2}, ${b3}, ${b4}, ${b5} ` +
           `${a1}, ${a2}, ${a3}, ${a4}, ${a5}`;
}

/**
 * Cria ou atualiza o filtro SVG customizado para mapeamento de cores.
 * @param {string} backgroundHex - Cor de fundo em hexadecimal
 * @param {string} textHex - Cor de texto em hexadecimal
 * @param {string} highlightHex - Cor de links em hexadecimal
 */
function injectCustomColorFilter(backgroundHex, textHex, highlightHex) {
    // Garante que o container SVG existe
    injectSvgFilters();
    
    let svgContainer = document.getElementById('colorlens-svg-filters');
    if (!svgContainer) {
        return;
    }
    
    let defs = svgContainer.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgContainer.appendChild(defs);
    }
    
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
    
    const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    feColorMatrix.setAttribute('in', 'SourceGraphic');
    feColorMatrix.setAttribute('type', 'matrix');
    feColorMatrix.setAttribute('values', matrixValues);
    
    filter.appendChild(feColorMatrix);
    defs.appendChild(filter);
}

/**
 * Aplica as cores customizadas usando transformação matricial SVG feColorMatrix.
 * Substitui a abordagem destrutiva de CSS !important por uma transformação elegante no espaço RGB.
 * 
 * @param {object} colors - O objeto { background, text, highlight } com cores em hexadecimal
 */
function applyCustomColors(colors) {
    // Se não há cores válidas, remove o filtro customizado
    if (!colors || !colors.background || !colors.text || !colors.highlight) {
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
        const currentFilter = document.documentElement.style.filter || '';
        const newFilter = currentFilter
            .replace(/url\(#colorlens-custom-color-mapping\)\s*/g, '')
            .trim();
        document.documentElement.style.filter = newFilter || '';
        return;
    }

    const { background, text, highlight } = colors;

    // Injeta o filtro SVG customizado
    injectCustomColorFilter(background, text, highlight);

    // Aplica o filtro ao elemento raiz (html)
    // O filtro será combinado com outros filtros já existentes
    const currentFilter = document.documentElement.style.filter || '';
    
    // Remove a referência anterior ao filtro customizado se existir
    let newFilter = currentFilter.replace(/url\(#colorlens-custom-color-mapping\)\s*/g, '');
    
    // Adiciona o novo filtro customizado no início (para que seja aplicado primeiro)
    newFilter = `url(#colorlens-custom-color-mapping) ${newFilter}`.trim();
    
    document.documentElement.style.filter = newFilter;
}

// Aplica as configurações salvas quando o script de conteúdo é carregado
loadSettings().then(settings => {
    if (Object.keys(settings).length > 0) {
        // Garantir que os filtros foram carregados e injetados antes de aplicar
        injectSvgFilters().then(() => {
            injectUtilityStyles();
            applyFilters(settings);
            applyCustomColors(settings.customColors);
        });
    }
});

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

// Substitua a função injectUtilityStyles antiga por esta:
function injectUtilityStyles() {
    const styleSheetId = 'colorlens-utility-styles';
    
    // Remove estilo antigo para garantir atualização
    const existingStyle = document.getElementById(styleSheetId);
    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleSheetId;

    style.textContent = `
        /* --- MODO NOTURNO (Apenas Background) --- */
        html.colorlens-night-vision {
            /* Removemos o 'filter' daqui! Agora quem manda nele é o JS. */
            /* Apenas garantimos que o fundo da página seja escuro */
            background-color: #121212 !important;
        }

        /* --- MODO DE LEITURA --- */
        body.colorlens-reading-mode {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 
                        "Segoe UI", Roboto, Helvetica, Arial, 
                        sans-serif !important;
            font-size: 1.20rem !important; 
            line-height: 1.8 !important; 
            letter-spacing: 0.05em !important;
            text-align: left !important;
            background-color: #fdf6e3 !important; 
            color: #333 !important;
            max-width: 900px !important;
            margin: 0 auto !important;
            padding: 2rem !important;
        }

        body.colorlens-reading-mode p,
        body.colorlens-reading-mode span,
        body.colorlens-reading-mode div {
            font-family: inherit !important;
            text-align: left !important;
        }
    `;

    document.head.appendChild(style);
}