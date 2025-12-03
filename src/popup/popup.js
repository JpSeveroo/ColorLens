
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

const loadCustomProfiles = async () => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['userProfiles'], (result) => {
            resolve(result.userProfiles || []);
        });
    });
};

const CUSTOM_PROFILE_CLASS = 'custom-profile-btn';

const applyProfileToUI = (profileData, controllers) => {
    const visualContrast = mapFunctionalToVisual(profileData.contrast || 100);
    document.getElementById('contrast').value = visualContrast;
    document.getElementById('contrast-input').value = visualContrast;
    document.getElementById('saturation').value = profileData.saturation || 100;
    document.getElementById('saturation-input').value = profileData.saturation || 100;
    document.getElementById('night-vision').checked = profileData.nightVision || false;

    if (profileData.colorMap) {
        document.getElementById('customBg').value = profileData.colorMap.red || '#ff0000'; 
        document.getElementById('customText').value = profileData.colorMap.green || '#00ff00';
        document.getElementById('customHighlight').value = profileData.colorMap.blue || '#0000ff';
    }
    
    if (controllers && controllers.contrastController && controllers.saturationController) {
        controllers.contrastController.updateUI();
        controllers.saturationController.updateUI();
    }
};

const renderCustomFilters = (profiles) => {
    const grid = document.getElementById('custom-filters-grid');
    if (!grid) return;

    grid.innerHTML = ''; 

    profiles.forEach(profile => {
        const button = document.createElement('button');
        button.className = `filter-btn ${CUSTOM_PROFILE_CLASS}`; 
        button.textContent = profile.name;
        button.profileData = profile; 
        
        grid.appendChild(button);
    });

};

const attachCustomFilterListener = (grid, standardFilterButtons, customProfileButtons, controllers, stateUpdater) => {
    if (!grid) return;

    grid.addEventListener('click', (event) => {
        const button = event.target.closest(`.${CUSTOM_PROFILE_CLASS}`);
        if (!button || !button.profileData) return;

        standardFilterButtons.forEach(btn => btn.classList.remove('active'));

        const isActive = button.classList.contains('active');
        customProfileButtons.forEach(btn => btn.classList.remove('active'));

        if (!isActive) {
            button.classList.add('active');
            applyProfileToUI(button.profileData, controllers);
        } else {
                document.getElementById('contrast').value = 100;
                document.getElementById('contrast-input').value = 100;
                document.getElementById('saturation').value = 100;
                document.getElementById('saturation-input').value = 100;
                document.getElementById('night-vision').checked = false;
                document.getElementById('customBg').value = document.getElementById('customBg').defaultValue;
                document.getElementById('customText').value = '#00ff00';
                document.getElementById('customHighlight').value = '#0000ff';
                if (controllers.contrastController) controllers.contrastController.updateUI();
                if (controllers.saturationController) controllers.saturationController.updateUI();
            
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
    const TRACK_COLOR = '#44475a'; 
    const ACTIVE_COLOR = '#7B4EAC';
    const updateSliderLook = (value) => {
        const percentage = ((value - min) / (max - min)) * 100;
        rangeSlider.style.background = `linear-gradient(to right, ${ACTIVE_COLOR} ${percentage}%, ${TRACK_COLOR} ${percentage}%)`;
    };

    rangeSlider.addEventListener('input', () => {
        const value = rangeSlider.value;
        numberInput.value = value;
        updateSliderLook(value);
        updateCallback(); 
    });

    numberInput.addEventListener('input', () => {
        let value = parseInt(numberInput.value) || min;
        
        value = Math.min(Math.max(value, min), max); 

        numberInput.value = value;
        rangeSlider.value = value;
        updateSliderLook(value);
        updateCallback();
    });

    updateSliderLook(rangeSlider.value);
    
    return { 
        updateUI: () => updateSliderLook(rangeSlider.value)
    };
};

function mapContrastToFunctional(visualValue) {
    const val = Number(visualValue);
    
    if (val <= 100) {
        return 50 + (val / 100) * 50;
    }
    
    return val;
}

function mapFunctionalToVisual(functionalValue) {
    const val = Number(functionalValue);

    if (val < 100) {
        return ((val - 50) / 50) * 100;
    }

    return val;
}

document.addEventListener('DOMContentLoaded', async () => {
    
    const optionsButton = document.getElementById('options');
    const tabs = document.querySelectorAll('.tab-btn'); 
    const sections = document.querySelectorAll('.tab-section'); 
    const contrastSlider = document.getElementById('contrast');
    const contrastInput = document.getElementById('contrast-input');
    const saturationSlider = document.getElementById('saturation');
    const saturationInput = document.getElementById('saturation-input');
    const standardFilterButtons = document.querySelectorAll('#tab-filters .filter-btn');
    const resetButton = document.querySelector('.reset-btn');
    const adjustmentsResetBtn = document.getElementById('adjustmentsResetBtn');
    const nightVisionToggle = document.getElementById('night-vision');
    const customBg = document.getElementById('customBg');
    const customText = document.getElementById('customText');
    const customHighlight = document.getElementById('customHighlight');
    const customResetBtn = document.getElementById('customResetBtn');
    const contrastController = initializeSliderController('contrast', 'contrast-input', gatherAndSendState);
    const saturationController = initializeSliderController('saturation', 'saturation-input', gatherAndSendState);

    const controllers = { contrastController, saturationController };

    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            tab.classList.add('active');

            const target = tab.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.remove('hidden');
        });
    });

    let customProfiles = [];
    try {
        customProfiles = await loadCustomProfiles();
    } catch (e) {
        console.error("Failed to load custom profiles:", e);
    }
    renderCustomFilters(customProfiles);
    const customProfileButtons = document.querySelectorAll(`.${CUSTOM_PROFILE_CLASS}`); 
    attachCustomFilterListener(document.getElementById('custom-filters-grid'), standardFilterButtons, customProfileButtons, controllers, gatherAndSendState);

    standardFilterButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            customProfileButtons.forEach(btn => btn.classList.remove('active'));

            standardFilterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            gatherAndSendState();
        });
    });

    resetButton.addEventListener('click', () => {
        standardFilterButtons.forEach(btn => btn.classList.remove('active'));
        customProfileButtons.forEach(btn => btn.classList.remove('active')); 

        gatherAndSendState();
    });

    adjustmentsResetBtn.addEventListener('click', () => {
        
        contrastSlider.value = 100;
        contrastSlider.dispatchEvent(new Event('input'));
        saturationSlider.value = 100;
        saturationSlider.dispatchEvent(new Event('input'));
        contrastInput.value = 100;
        saturationInput.value = 100;
        nightVisionToggle.checked = false;

        if (controllers.contrastController) controllers.contrastController.updateUI();
        if (controllers.saturationController) controllers.saturationController.updateUI();

        gatherAndSendState();
    });

    nightVisionToggle.addEventListener('change', gatherAndSendState);

    const colorPickers = [
        { input: customBg, default: '#ff0000' }, 
        { input: customText, default: '#00ff00' }, 
        { input: customHighlight, default: '#0000ff' } 
    ];

    colorPickers.forEach(picker => {
        picker.input.addEventListener('input', () => {
            customProfileButtons.forEach(btn => btn.classList.remove('active'));
            gatherAndSendState();
        });
    });

    customResetBtn.addEventListener('click', () => {
        customProfileButtons.forEach(btn => btn.classList.remove('active'));
        colorPickers.forEach(picker => {
            picker.input.value = picker.default;
        });
        gatherAndSendState();
    });

    loadSettings().then(settings => {
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.add('hidden'));
        
        let initialTab = 'filters';
        
        if (settings.filter && settings.filter !== 'none') {
            initialTab = 'filters';
        } else if (settings.activeProfileName) { 
            initialTab = 'custom';
        } else if (settings.contrast !== 100 || settings.saturation !== 100 || settings.nightVision) {
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
            
            const functionalContrast = settings.contrast || 100;
            const visualContrast = mapFunctionalToVisual(functionalContrast);
            contrastSlider.value = visualContrast;
            contrastInput.value = visualContrast;
            saturationSlider.value = settings.saturation || 100;
            saturationInput.value = settings.saturation || 100;
            
            nightVisionToggle.checked = settings.nightVision || false;

            if (settings.customColors) {
                customBg.value = settings.customColors.background || '#ff0000';
                customText.value = settings.customColors.text || '#00ff00';
                customHighlight.value = settings.customColors.highlight || '#0000ff';
            }

            contrastController.updateUI();
            saturationController.updateUI();
            
        } else {
             gatherAndSendState(); 
        }
    });

    async function gatherAndSendState() {
        const activeStandardFilter = document.querySelector('#tab-filters .filter-btn.active');
        const activeCustomProfile = document.querySelector(`.${CUSTOM_PROFILE_CLASS}.active`);
        
        let filterToSend = 'none';

        if (activeCustomProfile && activeCustomProfile.profileData) {
            const baseFilterId = activeCustomProfile.profileData.baseFilter;

            if (baseFilterId && baseFilterId !== 'none') {
                const matchingStandardBtn = document.querySelector(`#tab-filters .filter-btn[data-filter="${baseFilterId}"]`);
                if (matchingStandardBtn) {
                    filterToSend = matchingStandardBtn.textContent;
                }
            }
        } else if (activeStandardFilter) {
            filterToSend = activeStandardFilter.textContent;
        }
        
        const settings = {
            filter: filterToSend,
            activeProfileName: activeCustomProfile ? activeCustomProfile.textContent : null,
            
            contrast: mapContrastToFunctional(contrastSlider.value),
            saturation: saturationSlider.value,
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
            const response = await chrome.tabs.sendMessage(tab.id, messagePayload);
            console.log('Resposta do script de conteúdo:', response);
            
        } catch (error) {
            const isConnectionError = error.message.includes('Could not establish connection') || error.message.includes('Receiving end does not exist');
            
            if (error.message && !isConnectionError) {
                 console.error(`[Unexpected Error] Failed to send direct message. Error: ${error.message}`);
            }
            
            if (!tab || !tab.id) {
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