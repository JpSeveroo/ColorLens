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


// O Background Worker é o manipulador de mensagens central.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Sempre retorne true para indicar que você usará sendResponse de forma assíncrona.
    let isAsync = false;

    // --- Lógica de Fallback de Injeção (Correção do Erro) ---
    if (request.action === 'injectAndApplySettings') {
        isAsync = true;
        const { tabId, settings } = request;

        console.log('[Background] Recebido pedido de FALLBACK. Iniciando injeção e reenvio.');

        // 1. Tenta injetar/re-injetar o content script
        injectContentScript(tabId)
            .then(success => {
                if (success) {
                    // 2. Se a injeção foi bem-sucedida, reenvia a mensagem de settings
                    return chrome.tabs.sendMessage(tabId, {
                        action: 'applySettings',
                        settings: settings
                    });
                }
                return { status: 'injection_failed' };
            })
            .then(response => {
                // 3. Envia a resposta final de volta para o popup (se ele ainda estiver aberto)
                sendResponse({ status: 'settings_applied_via_background', response: response });
            })
            .catch(error => {
                // Captura qualquer erro de comunicação durante o fallback
                console.error(`[Background] Erro ao re-enviar mensagem após injeção:`, error);
                sendResponse({ status: 'error', message: error.message });
            });
    }

    // --- Lógica Antiga (Manter apenas se for essencial) ---
    // Nota: O seu popup.js já tem a lógica de enviar diretamente (Caminho Rápido)
    // e usa o 'injectAndApplySettings' como fallback. 
    // Mantenha apenas a lógica de 'injectAndApplySettings' para o cenário de debug.
    
    return isAsync;
});