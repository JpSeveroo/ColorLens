try {
    importScripts('../../assets/lib/browser-polyfill.js');
} catch (e) {
    console.error('Erro ao importar browser-polyfill.js:', e);
}

// Recebe mensagens enviadas por outros scripts da extensão (ex: popup.js)
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Verifica se a ação recebida é para atualizar as configurações
    if (request.action === 'updateSettings') {
        
        // Busca a aba ativa na janela atual
        browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            if (tabs.length > 0) {
                browser.tabs.sendMessage(tabs[0].id, {
                    action: 'applySettings',
                    settings: request.settings
                });
            }
        })
        .catch(error => console.error('Erro ao enviar a mensagem para o content script:', error));
    }
});