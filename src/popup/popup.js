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

// --- NOVO: SLIDER CONTROLLER UTILITY (Single Responsibility Principle) ---
/**
 * Encapsulates the logic for synchronizing a range slider and its corresponding number input.
 * @param {string} rangeId - The ID of the input type="range" element.
 * @param {string} numberId - The ID of the input type="number" element.
 * @param {function} updateCallback - Function to call when value changes (e.g., gatherAndSendState).
 */
const initializeSliderController = (rangeId, numberId, updateCallback) => {
    const rangeSlider = document.getElementById(rangeId);
    const numberInput = document.getElementById(numberId);

    if (!rangeSlider || !numberInput) return;

    const min = parseInt(rangeSlider.min);
    const max = parseInt(rangeSlider.max);
    
    // Fallback if CSS variables aren't available, but uses the same logic as CSS for consistency
    const TRACK_COLOR = '#44475a'; 
    const ACTIVE_COLOR = '#7B4EAC';

    // Function to visually update the slider's gradient track
    const updateSliderLook = (value) => {
        const percentage = ((value - min) / (max - min)) * 100;
        // Use the same variable names for background gradient colors as defined in popup.css
        rangeSlider.style.background = `linear-gradient(to right, ${ACTIVE_COLOR} ${percentage}%, ${TRACK_COLOR} ${percentage}%)`;
    };

    // 1. Range Slider: Updates number input and visual look
    rangeSlider.addEventListener('input', () => {
        const value = rangeSlider.value;
        numberInput.value = value;
        updateSliderLook(value);
        updateCallback(); 
    });

    // 2. Number Input: Updates range slider, clamps value, and visual look
    numberInput.addEventListener('input', () => {
        let value = parseInt(numberInput.value) || min;
        
        // Clamping the value to the defined min/max range
        value = Math.min(Math.max(value, min), max); 

        numberInput.value = value;
        rangeSlider.value = value;
        updateSliderLook(value);
        updateCallback();
    });

    // Initial setup
    updateSliderLook(rangeSlider.value);
    
    // Expose a function to allow external UI update (e.g., after loading/resetting)
    return { 
        updateUI: () => updateSliderLook(rangeSlider.value)
    };
};
// --- FIM DO NOVO SLIDER CONTROLLER ---


// Aguarda o conteúdo do HTML ser totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Seleção dos Elementos da Interface (UI) ---
    const optionsButton = document.getElementById('options');
    const tabs = document.querySelectorAll('.tab-btn'); 
    const sections = document.querySelectorAll('.tab-section'); 

    const contrastSlider = document.getElementById('contrast');
    const contrastInput = document.getElementById('contrast-input');
    const saturationSlider = document.getElementById('saturation');
    const saturationInput = document.getElementById('saturation-input');

    const filterButtons = document.querySelectorAll('.filter-btn');
    const resetButton = document.querySelector('.reset-btn');
    const readingModeToggle = document.getElementById('reading-mode');
    const nightVisionToggle = document.getElementById('night-vision');

    // Color picker elements
    const customBg = document.getElementById('customBg');
    const customText = document.getElementById('customText');
    const customHighlight = document.getElementById('customHighlight');
    const customResetBtn = document.getElementById('customResetBtn');

    // --- NOVO: Inicialização dos Controladores de Slider ---
    // Substitui toda a lógica repetitiva de sincronização
    const contrastController = initializeSliderController('contrast', 'contrast-input', gatherAndSendState);
    const saturationController = initializeSliderController('saturation', 'saturation-input', gatherAndSendState);

    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // --- Lógica de Troca de Abas ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // ... (unmodified tab logic) ...
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            tab.classList.add('active');

            const target = tab.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.remove('hidden');
        });
    });
    // --- FIM DA LÓGICA NOVA ---

    // --- Lógica dos Botões de Filtro ---
    filterButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            gatherAndSendState();
        });
    });

    // --- Lógica do Botão de Reset ---
    resetButton.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Seta os valores padrão nos elementos
        contrastSlider.value = 100;
        saturationSlider.value = 100;
        contrastInput.value = 100;
        saturationInput.value = 100;

        // NOVO: Chama o método de atualização da UI dos controladores
        contrastController.updateUI();
        saturationController.updateUI();

        gatherAndSendState();
    });

    // ... (unmodified toggle and color picker logic) ...
    readingModeToggle.addEventListener('change', gatherAndSendState);
    nightVisionToggle.addEventListener('change', gatherAndSendState);

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
    // --- FIM DA LÓGICA NÃO MODIFICADA ---

    // --- REMOVIDA: A função updateSliderLook original foi removida, 
    //              pois agora está encapsulada no initializeSliderController.

    // --- REMOVIDOS: Os antigos event listeners repetitivos foram removidos.
    //              A lógica está agora no initializeSliderController.
    

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
            
            // NOVO: Os number inputs também devem ser sincronizados do storage
            contrastInput.value = settings.contrast || 100;
            saturationInput.value = settings.saturation || 100;
            
            readingModeToggle.checked = settings.readingMode || false;
            nightVisionToggle.checked = settings.nightVision || false;

            // Load custom colors
            if (settings.customColors) {
                customBg.value = settings.customColors.background || '#ffffff';
                customText.value = settings.customColors.text || '#000000';
                customHighlight.value = settings.customColors.highlight || '#0000ff';
            }

            // NOVO: Chama o método de atualização da UI do controller APENAS UMA VEZ após carregar settings.
            contrastController.updateUI();
            saturationController.updateUI();
            
        } else {
            // Se não houver configurações salvas, envia o estado padrão
             gatherAndSendState(); 
        }
    });

    // ... (unmodified gatherAndSendState function) ...
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
            
            if (error.message && !isConnectionError) {
                 console.error(`[Unexpected Error] Failed to send direct message. Error: ${error.message}`);
            }
            
            if (!tab || !tab.id) {
                console.error("Não é possível enviar mensagem de fallback: Tab ID indisponível.");
                return; 
            }
            
            console.warn(`[Fallback] Comunicação falhou, delegando para o Worker de Background para injeção.`);
            
            chrome.runtime.sendMessage({ 
                action: 'injectAndApplySettings', 
                tabId: tab.id, 
                settings: settings 
            });
        }
    };
});