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


// O Worker de Background é o manipulador de mensagens central.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Sempre retorna true para indicar que você usará sendResponse de forma assíncrona.
    let isAsync = false;

    // --- Lógica de Fallback de Injeção (Correção do Erro) ---
    if (request.action === 'injectAndApplySettings') {
        isAsync = true;
        const { tabId, settings } = request;

        console.log('[Background] Recebido pedido de FALLBACK. Iniciando injeção e reenvio.');

        // 1. Tenta injetar/re-injetar o script de conteúdo
        injectContentScript(tabId)
            .then(success => {
                if (success) {
                    // 2. Se a injeção foi bem-sucedida, reenvia a mensagem de configurações
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

    // --- Manipulador para Personalização de Cores (da Página de Opções) ---
    if (request.action === 'applyColors') {
        isAsync = true;
        const { colors } = request;
        
        console.log('[Background] Recebido pedido de aplicação de cores customizadas.');
        
        // Obtém a aba ativa atual e envia cores para o script de conteúdo
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