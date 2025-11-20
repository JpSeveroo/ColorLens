# Documentação: `src/options/`

Este diretório contém a interface de configuração avançada da extensão, permitindo ao usuário criar perfis persistentes, visualizar ajustes em tempo real e gerenciar preferências detalhadas.

## 1. `options.html`

### Estrutura
Define o layout da página de configurações, dividido em duas áreas principais via CSS Grid/Flexbox:
* **Sidebar (`.sidebar`)**: Navegação lateral contendo o logo e botões para alternar entre abas ("Criação de Perfil" e "Sobre / Ajuda").
* **Main Content (`.main-content`)**: Área dinâmica que exibe a seção ativa.
    * **Seção `profile-creation`**: O formulário principal. Inclui uma imagem de pré-visualização (`.preview-img`), controles deslizantes (sliders) para contraste/saturação, seletores de daltonismo e o formulário de mapeamento de cores (Color Mapping).
    * **Seção `help`**: Texto estático informativo sobre o funcionamento da extensão.

## 2. `options.js`

### Visão Geral
Este script gerencia toda a lógica de interatividade da página de opções, incluindo o sistema CRUD (Create, Read, Update, Delete) de perfis de usuário e a simulação visual dos filtros.

### Funcionalidades Chave

#### Gerenciamento de Estado e Perfis (CRUD)
* **Persistência:** Utiliza `chrome.storage.local` para salvar e recuperar o array `userProfiles`.
* **`populateProfileSelector()`**: Carrega perfis salvos no `<select>`, permitindo troca rápida de configurações.
* **`saveVisualSettings()`**: Salva o estado atual dos controles visuais (sem criar um perfil nomeado) para persistência entre sessões.

#### Motor de Pré-visualização (`applyVisualEffects`)
* Simula, **dentro da página de opções**, como o filtro ficará na web.
* Aplica uma *stack* de filtros CSS dinâmicos na imagem de preview (`preview.avif`):
    ```javascript
    previewImg.style.filter = `
        ${filterCSS} 
        contrast(${contrast}%) 
        saturate(${saturation}%) 
        brightness(${brightness}%) 
        hue-rotate(${hueRotate}deg)
    `;
    ```
* Isso permite que o usuário veja o resultado do "Modo Noturno" ou "Protanopia" antes de aplicá-lo globalmente.

#### Mapeamento de Cores Customizado
* Gerencia os inputs de cor (`<input type="color">`) para remapeamento RGB.
* **`applyColorMapping()`**: Cria um gradiente linear (`linear-gradient`) sobre a imagem de preview para representar a mudança de matiz (hue) selecionada pelo usuário.

## 3. `options.css`

### Estilização
* **Variáveis CSS (`:root`)**: Define a paleta de cores global (Roxo `#7c4dff` como primária, tons escuros para background), garantindo consistência com o Popup.
* **Design Responsivo**: Utiliza Flexbox para adaptar o layout de duas colunas (Sidebar + Content) para uma coluna única em telas menores (`@media (max-width: 768px)`).
* **Componentes Customizados**:
    * Sliders estilizados com `linear-gradient` para indicar progresso visual.
    * Switches (botões de alternância) animados com transições CSS.