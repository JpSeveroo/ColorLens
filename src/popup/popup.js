// Utilitários de armazenamento (copiados de utils/storage.js para evitar problemas de importação)
const saveSettings = async (settings) => {
    return new Promise((resolve) => {
        // Nota: Mantenho o sync para o ColorLensSettings, mas userProfiles usa local.
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

const loadCustomProfiles = async () => {
    return new  Promise((resolve) => {
        // User profiles are stored in chrome.storage.local under the key 'userProfiles'
        chrome.storage.local.get(['userProfiles'], (result) => {
            resolve(result.userProfiles || []);
        });
    });
};

const CUSTOM_PROFILE_CLASS = 'custom-profile-btn';

/**
 * Aplica os dados de um perfil salvo (criado na options.js) aos elementos de UI do popup.
 * @param {object} profileData - O objeto de perfil completo.
 * @param {object} controllers - Os objetos controladores para atualização visual.
 */
const applyProfileToUI = (profileData, controllers) => {
    // 1. Atualiza Sliders e Inputs de Ajuste
    const visualContrast = mapFunctionalToVisual(profileData.contrast || 100);
    document.getElementById('contrast').value = visualContrast;
    document.getElementById('contrast-input').value = visualContrast;

    // Saturação continua normal
    document.getElementById('saturation').value = profileData.saturation || 100;
    document.getElementById('saturation-input').value = profileData.saturation || 100;

    // 2. Atualiza Modos
    document.getElementById('reading-mode').checked = profileData.readingMode || false;
    document.getElementById('night-vision').checked = profileData.nightVision || false;

    // 3. Atualiza Cores Base (Mismatch: Mapeando colorMap.red/green/blue para customBg/Text/Highlight)
    if (profileData.colorMap) {
        document.getElementById('customBg').value = profileData.colorMap.red || '#ff0000'; 
        document.getElementById('customText').value = profileData.colorMap.green || '#00ff00';
        document.getElementById('customHighlight').value = profileData.colorMap.blue || '#0000ff';
    }
    
    // Rerun UI updates for the controllers
    if (controllers && controllers.contrastController && controllers.saturationController) {
        controllers.contrastController.updateUI();
        controllers.saturationController.updateUI();
    }
};

/**
 * Renderiza os botões de filtro personalizado e anexa os listeners.
 * @param {Array<object>} profiles - Lista de perfis de usuário.
 */
const renderCustomFilters = (profiles) => {
    const grid = document.getElementById('custom-filters-grid');
    if (!grid) return;

    grid.innerHTML = ''; 

    profiles.forEach(profile => {
        const button = document.createElement('button');
        button.className = `filter-btn ${CUSTOM_PROFILE_CLASS}`; // Adiciona classe para identificação
        button.textContent = profile.name;
        button.profileData = profile; // Anexa o objeto de dados ao elemento do DOM
        
        grid.appendChild(button);
    });

    // O listener é anexado no DOMContentLoaded
};

/**
 * Anexa o listener de clique para a grade de filtros personalizados.
 */
const attachCustomFilterListener = (grid, standardFilterButtons, customProfileButtons, controllers, stateUpdater) => {
    if (!grid) return;

    grid.addEventListener('click', (event) => {
        const button = event.target.closest(`.${CUSTOM_PROFILE_CLASS}`);
        if (!button || !button.profileData) return;

        // 1. Desativa todos os filtros padrão
        standardFilterButtons.forEach(btn => btn.classList.remove('active'));
        
        // 2. Ativa/Desativa o botão customizado
        const isActive = button.classList.contains('active');
        customProfileButtons.forEach(btn => btn.classList.remove('active'));

        if (!isActive) {
            button.classList.add('active');
            // 3. Aplica os dados do perfil salvo na UI do popup
            applyProfileToUI(button.profileData, controllers);
        } else {
            // Se já estava ativo e foi clicado, desativa. A UI fica com os últimos valores.
        }

        if (typeof stateUpdater === 'function') {
            stateUpdater();
        }
    });
};

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

/**
 * Traduz o valor VISUAL (0-200) do slider para o valor FUNCIONAL (50-200).
 * @param {number} visualValue O valor do slider (0-200).
 * @returns {number} O valor para o CSS (50-200).
 */
function mapContrastToFunctional(visualValue) {
    const val = Number(visualValue);
    
    // Mapeia a primeira metade do slider (0-100) para o intervalo (50-100)
    if (val <= 100) {
        // (visualValue / 100) -> 0 a 1
        // (visualValue / 100) * 50 -> 0 a 50
        // 50 + (visualValue / 100) * 50 -> 50 a 100
        return 50 + (val / 100) * 50;
    }
    
    // Mapeia a segunda metade do slider (100-200) para o intervalo (100-200)
    // (val - 100) -> 0 a 100
    // ((val - 100) / 100) * 100 -> 0 a 100
    // 100 + ((val - 100) / 100) * 100 -> 100 a 200
    // Simplificando:
    return val;
}

/**
 * Traduz o valor FUNCIONAL (50-200) salvo para o valor VISUAL (0-200) do slider.
 * @param {number} functionalValue O valor salvo (50-200).
 * @returns {number} O valor para o slider (0-200).
 */
function mapFunctionalToVisual(functionalValue) {
    const val = Number(functionalValue);

    // Mapeia o intervalo (50-100) de volta para (0-100)
    if (val < 100) {
        // (val - 50) -> 0 a 50
        // (val - 50) / 50 -> 0 a 1
        // ((val - 50) / 50) * 100 -> 0 a 100
        return ((val - 50) / 50) * 100;
    }
    
    // O intervalo (100-200) é o mesmo
    return val;
}
// --- FIM DO NOVO SLIDER CONTROLLER ---


// Aguarda o conteúdo do HTML ser totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Seleção dos Elementos da Interface (UI) ---
    const optionsButton = document.getElementById('options');
    const tabs = document.querySelectorAll('.tab-btn'); 
    const sections = document.querySelectorAll('.tab-section'); 

    const contrastSlider = document.getElementById('contrast');
    const contrastInput = document.getElementById('contrast-input');
    const saturationSlider = document.getElementById('saturation');
    const saturationInput = document.getElementById('saturation-input');

    const standardFilterButtons = document.querySelectorAll('#tab-filters .filter-btn'); // Seleciona apenas os botões da aba de filtros padrão
    const resetButton = document.querySelector('.reset-btn');
    const adjustmentsResetBtn = document.getElementById('adjustmentsResetBtn');
    const readingModeToggle = document.getElementById('reading-mode');
    const nightVisionToggle = document.getElementById('night-vision');

    // Color picker elements
    const customBg = document.getElementById('customBg');
    const customText = document.getElementById('customText');
    const customHighlight = document.getElementById('customHighlight');
    const customResetBtn = document.getElementById('customResetBtn');

    // --- NOVO: Inicialização dos Controladores de Slider ---
    // Mantendo os controladores em escopo acessível
    const contrastController = initializeSliderController('contrast', 'contrast-input', gatherAndSendState);
    const saturationController = initializeSliderController('saturation', 'saturation-input', gatherAndSendState);

    const controllers = { contrastController, saturationController };

    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // --- Lógica de Troca de Abas ---
    // ... (unmodified tab logic) ...
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            tab.classList.add('active');

            const target = tab.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.remove('hidden');
        });
    });
    // --- FIM DA LÓGICA NOVA ---
    
    // --- NOVO: Carregar e Ligar Perfis Customizados ---
    let customProfiles = [];
    try {
        customProfiles = await loadCustomProfiles();
    } catch (e) {
        console.error("Failed to load custom profiles:", e);
    }
    renderCustomFilters(customProfiles);
    const customProfileButtons = document.querySelectorAll(`.${CUSTOM_PROFILE_CLASS}`); // Seleciona os botões recém-renderizados
    attachCustomFilterListener(document.getElementById('custom-filters-grid'), standardFilterButtons, customProfileButtons, controllers, gatherAndSendState);


    // --- MODIFICADA: Lógica dos Botões de Filtro Padrão ---
    standardFilterButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Desativa todos os botões de perfil personalizado quando um filtro padrão é selecionado
            customProfileButtons.forEach(btn => btn.classList.remove('active'));

            standardFilterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            gatherAndSendState();
        });
    });

    // --- MODIFICADA: Lógica do Botão de Reset ---
    resetButton.addEventListener('click', () => {
        // Ação: Limpa apenas os botões de filtro padrão
        standardFilterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Ação: Limpa apenas os botões de filtro personalizados (na outra aba)
        customProfileButtons.forEach(btn => btn.classList.remove('active')); 

        // Envia o estado (agora sem filtro ativo)
        gatherAndSendState();
    });

    // Lógica do Botão de Reset (Aba Ajustes) ---
    adjustmentsResetBtn.addEventListener('click', () => {
        
        // Seta os valores padrão nos elementos de ajuste
        contrastSlider.value = 100;
        saturationSlider.value = 100;
        contrastInput.value = 100;
        saturationInput.value = 100;
        readingModeToggle.checked = false;
        nightVisionToggle.checked = false;

        // Chama o método de atualização da UI dos controladores
        if (controllers.contrastController) controllers.contrastController.updateUI();
        if (controllers.saturationController) controllers.saturationController.updateUI();

        // Envia o novo estado
        gatherAndSendState();
    });

    // ... (unmodified toggle and color picker logic) ...
    readingModeToggle.addEventListener('change', gatherAndSendState);
    nightVisionToggle.addEventListener('change', gatherAndSendState);

    const colorPickers = [
        { input: customBg, default: '#ff0000' }, // Alterado de #ffffff para #ff0000
        { input: customText, default: '#00ff00' }, // Alterado de #000000 para #00ff00
        { input: customHighlight, default: '#0000ff' } // Azul permanece
    ];

    colorPickers.forEach(picker => {
        picker.input.addEventListener('input', () => {
            // NOVO: Desativa qualquer perfil customizado ao alterar uma cor manualmente
            customProfileButtons.forEach(btn => btn.classList.remove('active'));
            gatherAndSendState();
        });
    });

    customResetBtn.addEventListener('click', () => {
        // NOVO: Desativa qualquer perfil customizado ao resetar as cores
        customProfileButtons.forEach(btn => btn.classList.remove('active'));
        colorPickers.forEach(picker => {
            picker.input.value = picker.default;
        });
        gatherAndSendState();
    });
    // --- FIM DA LÓGICA NÃO MODIFICADA ---
    

    // Adiciona esta chamada para carregar as configurações ao iniciar o popup
    loadSettings().then(settings => {
        // ATUALIZAÇÃO CRÍTICA: Garante que apenas a aba padrão (Filtros) seja mostrada ao carregar
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.add('hidden'));
        
        // Ativa a aba inicial com base em onde o filtro está ativo
        let initialTab = 'filters';
        
        if (settings.filter && settings.filter !== 'none') {
            initialTab = 'filters';
        } else if (settings.activeProfileName) { // Prioriza a aba customizada se houver um perfil ativo
            initialTab = 'custom';
        } else if (settings.contrast !== 100 || settings.saturation !== 100 || settings.readingMode || settings.nightVision) {
            initialTab = 'adjustments';
        }
        
        document.querySelector(`.tab-btn[data-tab="${initialTab}"]`).classList.add('active');
        document.getElementById(`tab-${initialTab}`).classList.remove('hidden');


        if (Object.keys(settings).length > 0) {
            
            if (settings.activeProfileName) {
                const activeProfileButton = Array.from(customProfileButtons).find(btn => btn.textContent === settings.activeProfileName);
                if (activeProfileButton) {
                    activeProfileButton.classList.add('active');
                }
            } else if (settings.filter && settings.filter !== 'none') {
                // Se um filtro padrão estava ativo
                const activeFilterButton = Array.from(standardFilterButtons).find(btn => btn.textContent === settings.filter);
                if (activeFilterButton) {
                    activeFilterButton.classList.add('active');
                }
            }
            
            // --- INÍCIO DA MODIFICAÇÃO ---
            
            // 1. Pega o valor FUNCIONAL salvo (ex: 50 a 200)
            const functionalContrast = settings.contrast || 100;
            
            // 2. Traduz para o valor VISUAL (ex: 0 a 200)
            const visualContrast = mapFunctionalToVisual(functionalContrast);

            // 3. Aplica o valor VISUAL (traduzido) aos elementos da UI
            contrastSlider.value = visualContrast;
            contrastInput.value = visualContrast;

            // --- FIM DA MODIFICAÇÃO ---

            // O resto permanece o mesmo
            saturationSlider.value = settings.saturation || 100;
            saturationInput.value = settings.saturation || 100;
            
            readingModeToggle.checked = settings.readingMode || false;
            nightVisionToggle.checked = settings.nightVision || false;

            // Load custom colors
            if (settings.customColors) {
                // FALLBACKS atualizados
                customBg.value = settings.customColors.background || '#ff0000';
                customText.value = settings.customColors.text || '#00ff00';
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

    // --- MODIFICADA: gatherAndSendState function ---
    async function gatherAndSendState() {
        const activeStandardFilter = document.querySelector('#tab-filters .filter-btn.active');
        const activeCustomProfile = document.querySelector(`.${CUSTOM_PROFILE_CLASS}.active`);
        
        const settings = {
            // Se um perfil customizado estiver ativo, a UI já foi atualizada com seus dados. 
            // O Content Script precisará de todo o objeto 'settings' para aplicar o filtro base e o mapeamento de cores.
            // Para o campo 'filter', priorizamos o filtro padrão se ele estiver ativo.
            filter: activeStandardFilter ? activeStandardFilter.textContent : 'none',
            activeProfileName: activeCustomProfile ? activeCustomProfile.textContent : null, // NOVO: Salva o nome do perfil
            
            contrast: mapContrastToFunctional(contrastSlider.value),
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