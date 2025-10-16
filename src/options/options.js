document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    try {
        loadAllSavedSettings();
    } catch (error) {
        console.warn('Erro ao carregar configurações:', error);
    }
});

function initializeTabs() {
    const buttons = document.querySelectorAll('.options-btn');
    const sections = document.querySelectorAll('.content-section');

    function switchTab(targetTabId) {
        buttons.forEach(btn => btn.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));

        const selectedButton = document.querySelector(`[data-tab="${targetTabId}"]`);
        const selectedSection = document.getElementById(targetTabId);

        if (selectedButton && selectedSection) {
            selectedButton.classList.add('active');
            selectedSection.classList.add('active');
        }
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    if (!document.querySelector('.content-section.active')) {
        const firstTabId = buttons[0]?.getAttribute('data-tab');
        if (firstTabId) {
            switchTab(firstTabId);
        }
    }
}

function loadAllSavedSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['userProfiles', 'customColors'])
        .then((data) => {
            updateUI(data.userProfiles, data.customColors);
        })
        .catch(error => {
            console.warn('Erro ao carregar configurações:', error);
        });
    }
}

function updateUI(userProfiles, customColors) {
    if (userProfiles) {
        console.log('Loading user profiles:', userProfiles);
        // TODO: Implementar interface de carregamento de perfil
    }
    
    if (customColors) {
        console.log('Loading custom colors:', customColors);
        // TODO: Implementar interface de carregamento de cores personalizadas
    }
}

function saveProfile(profileName, settings) {
    chrome.storage.local.get('userProfiles')
    .then((data) => {
        const profiles = data.userProfiles || {};

        profiles[profileName] = settings;

        chrome.storage.local.set({ userProfiles: profiles })
        .then(() => {
            console.log(`Perfil '${profileName}' salvo com sucesso.`);
        });
    });
}

function loadAndApplyProfile(profileName) {
    chrome.storage.local.get('userProfiles')
    .then((data) => {
        const profiles = data.userProfiles || {};
        const profileSettings = profiles[profileName];

        if (profileSettings) {
            chrome.runtime.sendMessage({ 
                action: 'applySettings', 
                settings: profileSettings 
            })
            .then(() => {
                console.log(`Configurações do perfil '${profileName}' aplicadas com sucesso.`);
            });
        }
    });
}

function deleteProfile(profileName) {
    chrome.storage.local.get('userProfiles')
    .then((data) => {
        const profiles = data.userProfiles || {};
        const profileExists = profiles.hasOwnProperty(profileName);

        if (profileExists) {
            delete profiles[profileName];
            chrome.storage.local.set({ userProfiles: profiles })
            .then(() => {
                console.log(`Perfil '${profileName}' excluído com sucesso.`);
            });
        }
    });
}

function saveCustomColors() {
    const colorSettings = {
        backgroundColor: document.getElementById('backgroundColor').value,
        textColor: document.getElementById('textColor').value,
        highlightColor: document.getElementById('highlightColor').value
    };

    chrome.storage.local.set({ customColors: colorSettings })
    .then(() => {
        console.log('Cores customizadas salvas.');
        applyCustomColorsToPage(colorSettings);
    });
}

function applyCustomColorsToPage(colors) {
    chrome.runtime.sendMessage({ 
        action: 'applyColors', 
        colors: colors
    });
}
