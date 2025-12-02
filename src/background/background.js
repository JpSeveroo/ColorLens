async function injectContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/content/content.js']
        });
        console.log(`[Background] Content script injetado na tab ${tabId}.`);
        return true;
    } catch (error) {
        console.error(`[Background] Falha ao injetar content script na tab ${tabId}:`, error);
        return false;
    }
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    let isAsync = false;

    if (request.action === 'injectAndApplySettings') {
        isAsync = true;
        const { tabId, settings } = request;

        console.log('[Background] Recebido pedido de FALLBACK. Iniciando injeção e reenvio.');

        injectContentScript(tabId)
            .then(success => {
                if (success) {
                    return chrome.tabs.sendMessage(tabId, {
                        action: 'applySettings',
                        settings: settings
                    });
                }
                return { status: 'injection_failed' };
            })
            .then(response => {
                sendResponse({ status: 'settings_applied_via_background', response: response });
            })
            .catch(error => {
                console.error(`[Background] Erro ao re-enviar mensagem após injeção:`, error);
                sendResponse({ status: 'error', message: error.message });
            });
    }

    if (request.action === 'applyColors') {
        isAsync = true;
        const { colors } = request;
        
        console.log('[Background] Recebido pedido de aplicação de cores customizadas.');
        
        chrome.tabs.query({ active: true, currentWindow: true })
            .then((tabs) => {
                if (tabs.length > 0) {
                    return chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'applyColors',
                        colors: colors
                    });
                }
                return { status: 'no_active_tab' };
            })
            .then(response => {
                sendResponse({ status: 'colors_applied', response: response });
            })
            .catch(error => {
                console.error('[Background] Erro ao aplicar cores customizadas:', error);
                sendResponse({ status: 'error', message: error.message });
            });
    }
    
    return isAsync;
});