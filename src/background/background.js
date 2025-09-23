console.log("Essa mizera passou por aqui!")

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
        chrome.tabs.query({ active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'applySettings',
                    settings: request.settings
                });
            }
        });
    }
});