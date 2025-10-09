// Storage utilities (copied from utils/storage.js to avoid import issues)
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

// Aguarda o conteúdo do HTML ser totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Seleção dos Elementos da Interface (UI) ---
    const optionsButton = document.getElementById('options')

    const contrastSlider = document.getElementById('contrast');
    const contrastValue = document.getElementById('contrast-value');
    
    const saturationSlider = document.getElementById('saturation');
    const saturationValue = document.getElementById('saturation-value');

    const filterButtons = document.querySelectorAll('.filter-btn');
    const resetButton = document.querySelector('.reset-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');
    console.log('Mode buttons found:', modeButtons);

    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // --- Lógica dos Botões de Filtro ---
    // Adiciona um evento de clique a cada botão de filtro.
    filterButtons.forEach(button => {
        button.addEventListener('click', (event) => {
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

    contrastSlider.addEventListener('input', () => {
        updateSliderLook(contrastSlider, contrastValue);
        gatherAndSendState();
    });

    saturationSlider.addEventListener('input', () => {
        updateSliderLook(saturationSlider, saturationValue);
        gatherAndSendState();
    });

    // Configura a aparência inicial dos sliders e envia o estado padrão ao abrir o popup
    updateSliderLook(contrastSlider, contrastValue);
    updateSliderLook(saturationSlider, saturationValue);

    // Adiciona esta chamada para carregar as configurações ao iniciar o popup
    loadSettings().then(settings => {
        if (Object.keys(settings).length > 0) {
            // Aplica as configurações salvas aos elementos da UI
            if (settings.filter && settings.filter !== 'none') {
                const activeFilterButton = Array.from(filterButtons).find(btn => btn.textContent === settings.filter);
                if (activeFilterButton) {
                    activeFilterButton.classList.add('active');
                }
            }
            contrastSlider.value = settings.contrast || 100;
            saturationSlider.value = settings.saturation || 100;
            
            if (settings.readingMode) {
                document.getElementById('reading-mode').classList.add('active');
            }
            if (settings.nightVision) {
                document.getElementById('night-vision').classList.add('active');
            }
            updateSliderLook(contrastSlider, contrastValue);
            updateSliderLook(saturationSlider, saturationValue);
            gatherAndSendState(); // Envia o estado carregado para o content script
        } else {
            gatherAndSendState(); // Se não houver configurações salvas, envia o estado padrão
        }
    });

    async function gatherAndSendState() {
        const activeFilter = document.querySelector('.filter-btn.active');

        const settings = {
            filter: activeFilter ? activeFilter.textContent : 'none',
            contrast: contrastSlider.value,
            saturation: saturationSlider.value,
            readingMode: document.getElementById('reading-mode').classList.contains('active'),
            nightVision: document.getElementById('night-vision').classList.contains('active')
        }


        await saveSettings(settings);
        
        console.log("Enviando estado para a página:", settings);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) return;
        
        const messagePayload = {
            action: 'applySettings',
            settings: settings 
        };

        try {
            // Tenta o envio direto (Caminho rápido)
            const response = await chrome.tabs.sendMessage(tab.id, messagePayload);
            console.log('Resposta do content script:', response);
            
        } catch (error) {
            const isConnectionError = error.message.includes('Could not establish connection') || error.message.includes('Receiving end does not exist');
            
            // Log a warning only if it's NOT the common connection error, 
            // or if the error object itself is missing (which shouldn't happen with async/await).
            if (error.message && !isConnectionError) {
                 console.error(`[Unexpected Error] Failed to send direct message. Error: ${error.message}`);
            }
            
            // If the fast path failed, we ALWAYS fall back to the Background Worker.
            
            // CRITICAL CHECK: Ensure 'tab' exists before reading its ID.
            if (!tab || !tab.id) {
                console.error("Não é possível enviar mensagem de fallback: Tab ID indisponível.");
                return; // Exit cleanly
            }
            
            console.warn(`[Fallback] Communication failed, delegating to Background Worker for injection.`);
            
            // Fire-and-Forget to the Background Worker
            chrome.runtime.sendMessage({ 
                action: 'injectAndApplySettings', 
                tabId: tab.id, 
                settings: settings 
            });
        }
    };

    // Garante que o estado seja enviado ao content script imediatamente após o carregamento do popup.
    // Isso também acionará o salvamento inicial das configurações se nenhuma estiver presente.
    gatherAndSendState();
});