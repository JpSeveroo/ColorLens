document.addEventListener('DOMContentLoaded', () => {
    loadAllSavedSettings();

    document.getElementById('save-profile-btn').addEventListener('click', () => {
        saveProfile('Novo Perfil', gatherCurrentSettings());
    });
});

function loadAllSavedSettings() {
    browser.storage.local.get(['userProfiles', 'customColors'])
    .then((data) => {
        updateUI(data.userProfiles, data.customColors);
    });
}

function saveProfile(profileName, settings) {
    browser.storage.local.get('userProfiles')
    .then((data) => {
        const profiles = data.userProfiles || {};

        profiles[profileName] = settings;

        browser.storage.local.set({ userProfiles: profiles })
        .then(() => {
            console.log(`Perfil '${profileName}' salvo com sucesso.`);
        });
    });
}

function loadAndApplyProfile(profileName) {
    browser.storage.local.get('userProfiles')
    .then((data) => {
        const profiles = data.userProfiles || {};
        const profileSettings = profiles[profileName];

        if (profileSettings) {
            browser.runtime.sendMessage({ 
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
    browser.storage.local.get('userProfiles')
    .then((data) => {
        const profiles = data.userProfiles || {};
        const profileExists = profiles.hasOwnProperty(profileName);

        if (profileExists) {
            delete profiles[profileName];
            browser.storage.local.set({ userProfiles: profiles })
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

    browser.storage.local.set({ customColors: colorSettings })
    .then(() => {
        console.log('Cores customizadas salvas.');
        applyCustomColorsToPage(colorSettings);
    });
}

function applyCustomColorsToPage(colors) {
    browser.runtime.sendMessage({ 
        action: 'applyColors', 
        colors: colors
    });
}
