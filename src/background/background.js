// Recebe mensagens enviadas por outros scripts da extensão (ex: popup.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Verifica se a ação recebida é para atualizar as configurações
    if (request.action === 'updateSettings') {
        
        // Busca a aba ativa na janela atual
        chrome.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'applySettings',
                    settings: request.settings
                });
            }
        })
        .catch(error => console.error('Erro ao enviar a mensagem para o content script:', error));
    }
});