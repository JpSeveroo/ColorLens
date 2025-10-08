document.addEventListener('DOMContentLoaded', () => {
    loadAllSavedSettings();

    const tabs = document.querySelectorAll(".tab-btn");
    const sections = document.querySelectorAll(".tab-section");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        sections.forEach((section) => section.classList.add("hidden"));
        tab.classList.add("active");

        const target = tab.getAttribute("data-tab");
        document.getElementById(`tab-${target}`).classList.remove("hidden");
      });
    });
});

function loadAllSavedSettings() {
    chrome.storage.local.get(['userProfiles', 'customColors'])
    .then((data) => {
        updateUI(data.userProfiles, data.customColors);
    });
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
