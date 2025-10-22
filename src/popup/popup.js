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

// Aguarda o conteúdo do HTML ser totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Seleção dos Elementos da Interface (UI) ---
    const optionsButton = document.getElementById('options');
    const tabs = document.querySelectorAll('.tab-btn'); // NOVO: Seleciona todos os botões de aba
    const sections = document.querySelectorAll('.tab-section'); // NOVO: Seleciona todas as seções de aba

    const contrastSlider = document.getElementById('contrast');
    const contrastValue = document.getElementById('contrast-value');
    
    const saturationSlider = document.getElementById('saturation');
    const saturationValue = document.getElementById('saturation-value');

    const filterButtons = document.querySelectorAll('.filter-btn');
    const resetButton = document.querySelector('.reset-btn');
    const readingModeToggle = document.getElementById('reading-mode');
    const nightVisionToggle = document.getElementById('night-vision');

    // Color picker elements
    const customBg = document.getElementById('customBg');
    const customText = document.getElementById('customText');
    const customHighlight = document.getElementById('customHighlight');
    const customResetBtn = document.getElementById('customResetBtn');

    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // --- NOVO: Lógica de Troca de Abas ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 1. Desativa todas as abas e esconde todas as seções
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            // 2. Ativa a aba clicada
            tab.classList.add('active');

            // 3. Mostra a seção correspondente
            const target = tab.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.remove('hidden');
        });
    });
    // --- FIM DA LÓGICA NOVA ---

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
        
        // --- REVERTIDO CONFORME SOLICITADO ---
        // As linhas abaixo, que redefinem os toggles,
        // foram removidas.
        // readingModeToggle.checked = false;
        // nightVisionToggle.checked = false;
        // --- FIM DA REVERSÃO ---

        updateSliderLook(contrastSlider, contrastValue);
        updateSliderLook(saturationSlider, saturationValue);
        gatherAndSendState();
    });

    // Usando 'change' que é o evento padrão para checkboxes
    readingModeToggle.addEventListener('change', gatherAndSendState);
    nightVisionToggle.addEventListener('change', gatherAndSendState);

    // Color picker functionality
    const colorPickers = [
        { input: customBg, default: '#ffffff' },
        { input: customText, default: '#000000' },
        { input: customHighlight, default: '#0000ff' }
    ];

    colorPickers.forEach(picker => {
        picker.input.addEventListener('input', () => {
            gatherAndSendState();
        });
    });

    customResetBtn.addEventListener('click', () => {
        colorPickers.forEach(picker => {
            picker.input.value = picker.default;
        });
        gatherAndSendState();
    });

    // --- Função para Atualizar a Aparência dos Sliders ---
    function updateSliderLook(slider, valueDisplay) {
        const min = slider.min;
        const max = slider.max;
        const value = slider.value;
        
        valueDisplay.textContent = `${value}%`;
        
        const percentage = ((value - min) / (max - min)) * 100;
        
        // Cor consistente com o tema do popup.css
        slider.style.background = `linear-gradient(to right, #7B4EAC ${percentage}%, #44475a ${percentage}%)`;
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
        // ATUALIZAÇÃO CRÍTICA: Garante que apenas a aba padrão (Filtros) seja mostrada ao carregar
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.add('hidden'));
        document.querySelector('.tab-btn[data-tab="filters"]').classList.add('active');
        document.getElementById('tab-filters').classList.remove('hidden');
        
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
            
            readingModeToggle.checked = settings.readingMode || false;
            nightVisionToggle.checked = settings.nightVision || false;

            // Load custom colors
            if (settings.customColors) {
                customBg.value = settings.customColors.background || '#ffffff';
                customText.value = settings.customColors.text || '#000000';
                customHighlight.value = settings.customColors.highlight || '#0000ff';
            }

            updateSliderLook(contrastSlider, contrastValue);
            updateSliderLook(saturationSlider, saturationValue);
            
            // Não chame gatherAndSendState() aqui durante o carregamento inicial
            // a menos que você queira forçar uma nova gravação no storage.
            // Os valores já estão aplicados, e o content script
            // deve carregar seu próprio estado do storage.
            
        } else {
            // Se não houver configurações salvas, envia o estado padrão
             gatherAndSendState(); 
        }
    });

    async function gatherAndSendState() {
        const activeFilter = document.querySelector('.filter-btn.active');

        const settings = {
            filter: activeFilter ? activeFilter.textContent : 'none',
            contrast: contrastSlider.value,
            saturation: saturationSlider.value,
            readingMode: readingModeToggle.checked,
            nightVision: nightVisionToggle.checked,
            customColors: {
                background: customBg.value,
                text: customText.value,
                highlight: customHighlight.value
            }
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
            console.log('Resposta do script de conteúdo:', response);
            
        } catch (error) {
            const isConnectionError = error.message.includes('Could not establish connection') || error.message.includes('Receiving end does not exist');
            
            // Registra um aviso apenas se NÃO for o erro comum de conexão,
            // ou se o objeto de erro em si estiver ausente (o que não deveria acontecer com async/await).
            if (error.message && !isConnectionError) {
                 console.error(`[Unexpected Error] Failed to send direct message. Error: ${error.message}`);
            }
            
            // Se o caminho rápido falhou, SEMPRE fazemos fallback para o Worker de Background.
            
            // VERIFICAÇÃO CRÍTICA: Garante que 'tab' existe antes de ler seu ID.
            if (!tab || !tab.id) {
                console.error("Não é possível enviar mensagem de fallback: Tab ID indisponível.");
                return; // Sair limpo
            }
            
            console.warn(`[Fallback] Comunicação falhou, delegando para o Worker de Background para injeção.`);
            
            chrome.runtime.sendMessage({ 
                action: 'injectAndApplySettings', // Usando a ação do background.js
                tabId: tab.id, 
                settings: settings 
            });
        }
    };

    // NOTA: Removi a chamada gatherAndSendState() do final do 'DOMContentLoaded'
    // O 'loadSettings().then(...)' já lida com o estado inicial
    // Chamar aqui é redundante e pode causar uma "piscada" (flash)
    // ao salvar desnecessariamente um estado padrão antes do carregamento.
});