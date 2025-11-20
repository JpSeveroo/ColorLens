# Documentação: `src/popup/`

Este diretório contém o código da interface principal da extensão (a janela que abre ao clicar no ícone da barra de ferramentas).

## 1. `popup.html`

### Estrutura de Interface
Define a estrutura HTML5 do menu flutuante, organizado em um sistema de abas para otimizar o espaço limitado (340px de largura):
* **Header**: Contém o logo, título e o atalho para a página de opções (`options.html`).
* **Navegação (`#tabs-nav`)**: Botões para alternar entre três visões:
    1.  **Filtros Padrões**: Grade de botões para seleção rápida de simulações (Protanopia, Tritanopia, etc.).
    2.  **Ajustes Rápidos**: Sliders de controle fino (Contraste, Saturação) e Toggles (Modo Leitura, Visão Noturna).
    3.  **Personalização**: Lista de perfis salvos e seletores de cor (Color Pickers) para ajustes RGB manuais.

## 2. `popup.js`

### Visão Geral
Controla a lógica de interação da interface, o gerenciamento de estado dos controles e a comunicação com a aba ativa.

### Funcionalidades Chave

#### Gerenciamento de Estado (`gatherAndSendState`)
* Coleta os valores de **todos** os inputs da interface (filtros ativos, sliders, toggles, cores).
* Salva o estado persistentemente via `chrome.storage.sync`.
* Envia o payload de configurações para o Content Script aplicar na página.
* **Sistema de Fallback**: Tenta envio direto (`chrome.tabs.sendMessage`). Se falhar (ex: script não carregado), delega para o `background.js` injetar o script e re-enviar a mensagem.

#### Controladores de UI
* **Lógica de Abas**: Gerencia as classes `.hidden` e `.active` para alternar painéis.
* **Sliders Sincronizados (`initializeSliderController`)**: Mantém o input numérico e o slider de arraste (`<input type="range">`) em perfeita sincronia visual e de valor.
* **Mapeamento de Valores**: Converte valores visuais do slider (0-200) para valores funcionais CSS usando `mapContrastToFunctional`, garantindo uma experiência de uso linear.

#### Integração de Perfis
* Carrega perfis criados na página de Opções (`loadCustomProfiles`) e os renderiza dinamicamente na aba de Personalização.
* Permite ativação rápida de predefinições complexas com um clique.

## 3. `popup.css`

### Estilização
* **Variáveis CSS**: Centraliza o tema visual (Roxo `#7B4EAC`, Fundo `#2C2B3E`).
* **Componentes**:
    * **Sliders Customizados**: Estilização completa do `webkit-slider-thumb` e track para combinar com o tema Dark.
    * **Grid Layout**: Organiza os botões de filtro em colunas simétricas.