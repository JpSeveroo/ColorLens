/* Criando uma função response que pegará os requests do popup.js
e aplicará os devidos filtros. Por isso coloquei esse parâmetro de settings
para se referir aos requests do popup. */

const applyFilters = (settings) =>{
    //Passando os requests para o parâmetro em questão
    const {filter, contrast, saturation, readingMode, nightVision } = settings;

    let filterString = '';

    // Adiciona os filtros de ajuste (sempre aplicados, se não forem os valores padrão)
    filterString += `contrast(${contrast}%) `;
    filterString += `saturate(${saturation}%) `;

    //Se for modo noturno, aplicamos a inversão de cores e ajuste de matriz
    if (nightVision){
        filterString += `invert(1) hue-rotate(180deg)`; //Ajeitar essa budega aqui que ta horrivel
    }
    //Testando um tipo de filtro padrão para pessoas que possuem ACHROMATOPSIA(preto e branco)

    if (filter === 'Achromatopsia'){
        filterString += `grayscale(100%)`
    }
    //Adicionar outros filtros aqui

    // Isso garante que tudo (incluindo imagens, vídeos, etc.) seja afetado.
    document.documentElement.style.filter = filterString.trim();

    //criando ja a parte de leitura
    if (readingMode) {
    document.body.classList.add('colorlens-reading-mode');
  } else {
    document.body.classList.remove('colorlens-reading-mode');
  }
}

//É esse bixo aqui que vai até a API do google pra explicar como a página deve funcionar
browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
if (request.settings) {
    // É do background.js que vem o request.settings
    console.log('Configurações recebidas do background:', request.settings);
    applyFilters(request.settings);
}
    
sendResponse({ status: 'ok' });
});