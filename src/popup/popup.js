// Aguarda o conteúdo do HTML ser totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', () => {

    // --- Seleção dos Elementos da Interface (UI) ---
    const contrastSlider = document.getElementById('contrast');
    const contrastValue = document.getElementById('contrast-value');
    
    const saturationSlider = document.getElementById('saturation');
    const saturationValue = document.getElementById('saturation-value');

    const filterButtons = document.querySelectorAll('.filter-btn');
    const resetButton = document.querySelector('.reset-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');

    // --- Lógica dos Botões de Filtro ---
    // Adiciona um evento de clique a cada botão de filtro.
    filterButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Garante que apenas um filtro esteja ativo por vez.
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            gatherAndSendState(); // Envia o estado atualizado.
        });
    });

    // --- Lógica do Botão de Reset ---
    // Reseta todas as configurações para o valor padrão.
    resetButton.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active')); // Remove filtro ativo.
        contrastSlider.value = 100; // Reseta contraste.
        saturationSlider.value = 100; // Reseta saturação.
        updateSliderLook(contrastSlider, contrastValue);
        updateSliderLook(saturationSlider, saturationValue);
        gatherAndSendState();
    });

    // --- Lógica dos Botões de Modo (Ex: Modo Leitura) ---
    // Alterna o estado de 'ativo' para os botões de modo.
    modeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            console.log('Um botão de modo foi clicado!'); // Log para depuração.
            event.target.classList.toggle('active');
            gatherAndSendState();
        });
    });

    // --- Função para Atualizar a Aparência dos Sliders ---
    function updateSliderLook(slider, valueDisplay) {
        const min = slider.min;
        const max = slider.max;
        const value = slider.value;
        
        valueDisplay.textContent = `${value}%`;
        
        const percentage = ((value - min) / (max - min)) * 100;

        slider.style.background = `linear-gradient(to right, #66d9ef ${percentage}%, #44475a ${percentage}%)`;
    }

    // --- Lógica dos Sliders ---
    // Adiciona eventos que disparam enquanto o usuário arrasta o controle
    contrastSlider.addEventListener('input', () => {
        updateSliderLook(contrastSlider, contrastValue);
        gatherAndSendState();
    });

    saturationSlider.addEventListener('input', () => {
        updateSliderLook(saturationSlider, saturationValue);
        gatherAndSendState();
    });

    // --- Inicialização ---
    // Configura a aparência inicial dos sliders e envia o estado padrão ao abrir o popup
    updateSliderLook(contrastSlider, contrastValue);
    updateSliderLook(saturationSlider, saturationValue);
    gatherAndSendState();

    
    //  Reúne todas as configurações atuais em um único objeto e o envia
    //  para um content script que aplicará os estilos na página
     
    function gatherAndSendState() {
        const activeFilter = document.querySelector('.filter-btn.active');

        const settings = {
            filter: activeFilter ? activeFilter.textContent : 'none',
            contrast: contrastSlider.value,
            saturation: saturationSlider.value,
            readingMode: document.getElementById('reading-mode').classList.contains('active'),
            nightVision: document.getElementById('night-vision').classList.contains('active')
        };
        // Aqui, o objeto 'settings' seria enviado para outra parte da extensão.
        // Ex: chrome.tabs.sendMessage(tabId, { settings });


        // 1. chrome.tabs.query: Não sabia massss, isso aqui encontra a aba que está ativa na janela atual.
        // 2. tabs[0].id: Pega o ID da aba encontrada.
        // 3. chrome.tabs.sendMessage: Envia o objeto 'settings' para o content script daquela aba.
         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                //Resumindo a linha de baixo: tabs[0] é o endereço, settings:settings é tipo a etiqueta do objeto sendo criado
                //E o response é o parâmetro de recebimento.
                chrome.tabs.sendMessage(tabs[0].id, { settings: settings }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Trata casos onde o content script não responde.
                        console.warn("Erro ao enviar mensagem: ", chrome.runtime.lastError.message);
                    } else {
                        console.log('Resposta do content script:', response.status);
                    }
                });
            }
        });
    };
});