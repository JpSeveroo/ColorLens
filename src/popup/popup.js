// Aguarda o conteúdo do HTML ser totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', () => {
    const optionsButton = document.getElementById('options')

    // --- Seleção dos Elementos da Interface (UI) ---
    const contrastSlider = document.getElementById('contrast');
    const contrastValue = document.getElementById('contrast-value');
    
    const saturationSlider = document.getElementById('saturation');
    const saturationValue = document.getElementById('saturation-value');

    const filterButtons = document.querySelectorAll('.filter-btn');
    const resetButton = document.querySelector('.reset-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');

    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // --- Lógica dos Botões de Filtro ---
    // Adiciona um evento de clique a cada botão de filtro.
    filterButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Garante que apenas um filtro esteja ativo por vez.
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            gatherAndSendState();
        });
    });

    resetButton.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        contrastSlider.value = 100;
        saturationSlider.value = 100;
        updateSliderLook(contrastSlider, contrastValue);
        updateSliderLook(saturationSlider, saturationValue);
        gatherAndSendState();
});

    modeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            console.log('A mode button foi clicada!');
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

    async function gatherAndSendState() {
        const activeFilter = document.querySelector('.filter-btn.active');

        const settings = {
            filter: activeFilter ? activeFilter.textContent : 'none',
            contrast: contrastSlider.value,
            saturation: saturationSlider.value,
            readingMode: document.getElementById('reading-mode').classList.contains('active'),
            nightVision: document.getElementById('night-vision').classList.contains('active')
        }
        console.log("Enviando estado para a página:", settings);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) return;

        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['src/content/content.js']
            });

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'applySettings',
                settings: settings 
            });

            console.log('Resposta do content script:', response);
            
        } catch (error) {
            console.error('Erro ao injetar script ou enviar mensagem', error);
        }

        // calma calabresio
        // // 1. chrome.tabs.query: Não sabia massss, isso aqui encontra a aba que está ativa na janela atual.
        // // 2. tabs[0].id: Pega o ID da aba encontrada.
        // // 3. chrome.tabs.sendMessage: Envia o objeto 'settings' para o content script daquela aba.
        //  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        //     if (tabs[0]) {
        //         //Resumindo a linha de baixo: tabs[0] é o endereço, settings:settings é tipo a etiqueta do objeto sendo criado
        //         //E o response é o parâmetro de recebimento.
        //         chrome.tabs.sendMessage(tabs[0].id, { settings: settings }, (response) => {
        //             if (chrome.runtime.lastError) {
        //                 // Trata casos onde o content script não responde.
        //                 console.warn("Erro ao enviar mensagem: ", chrome.runtime.lastError.message);
        //             } else {
        //                 console.log('Resposta do content script:', response.status);
        //             }
        //         });
        //     }
        // });
    };
});