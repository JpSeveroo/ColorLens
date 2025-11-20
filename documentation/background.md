# Documentação: `src/background/`

## `background.js`

### Visão Geral
Este arquivo atua como o **Service Worker** da extensão. Ele opera em segundo plano, independente da página web ativa ou do popup, servindo como um hub central de comunicação assíncrona e recuperação de falhas de injeção.

### Responsabilidades Principais

1.  **Gerenciamento de Injeção de Scripts (`Scripting API`)**
    * Responsável pela injeção programática ("lazy injection") do `content.js` em abas onde o script ainda não foi carregado ou foi desconectado.
    * Utiliza `chrome.scripting.executeScript` para garantir a integridade do ambiente de execução antes do envio de comandos.

2.  **Hub de Mensageria e Fallback**
    * Atua como um mecanismo de segurança (fallback) para a comunicação entre a UI (Popup/Options) e o Content Script.
    * Centraliza a retransmissão de mensagens quando a conexão direta porta-a-porta falha (ex: erro "Receiving end does not exist").

### Manipuladores de Eventos (Listeners)

O arquivo mantém um listener principal em `chrome.runtime.onMessage` que gerencia as seguintes ações:

* **`injectAndApplySettings`**:
    * **Gatilho:** Acionado quando o Popup falha ao tentar enviar configurações diretamente para a aba.
    * **Fluxo:** O background intercepta o erro, injeta o `content.js` na aba alvo (`tabId`) e, após a confirmação de sucesso, reenvia o payload de configurações (`applySettings`).

* **`applyColors`**:
    * **Gatilho:** Acionado pela página de Opções (`options.js`) ao atualizar o mapeamento de cores.
    * **Fluxo:** Identifica a aba ativa na janela atual via `chrome.tabs.query` e despacha as novas definições de cores para renderização imediata.