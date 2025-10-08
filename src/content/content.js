/* Criando uma função response que pegará os requests do popup.js
e aplicará os devidos filtros. Por isso coloquei esse parâmetro de settings
para se referir aos requests do popup. */

// Eu fui tentar fazer com um arquivo svg a parte mas não deu certo
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
    document.body.appendChild(svgContainer);
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
    if (request.settings) {
        console.log('Configurações recebidas do popup:', request.settings);
        // Garante que os filtros SVG existam na página antes de aplicá-los
        injectSvgFilters();
        applyFilters(request.settings);
    }
    sendResponse({ status: 'ok' });
});