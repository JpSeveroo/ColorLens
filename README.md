# 🎨 ColorLens

> **Sua Web, Acessível e Personalizada.**

O **ColorLens** é uma extensão de navegador robusta focada em acessibilidade digital. Ela vai além de simples filtros, oferecendo um motor de renderização em tempo real que manipula o DOM e aplica matrizes de convolução SVG para simular e corrigir diferentes tipos de daltonismo. Além disso, permite a criação de perfis de usuário persistentes e remapeamento manual de canais RGB.

---

## ✨ Funcionalidades Principais

### 1. Simulação e Correção de Daltonismo
Utiliza filtros SVG (`feColorMatrix`) para manipular os canais de cor da página, oferecendo suporte para:
* **Protanopia / Protanomalia** (Deficiência no vermelho)
* **Deuteranopia / Deuteranomalia** (Deficiência no verde)
* **Tritanopia / Tritanomalia** (Deficiência no azul)
* **Achromatopsia / Monocromia** (Visão em escala de cinza)

### 2. Personalização Visual Avançada
* **Contraste & Saturação:** Sliders de ajuste fino (0% a 200%) para melhorar a legibilidade.
* **Modo Noturno:** Filtro de baixa luminosidade com tonalidade sépia para redução de fadiga visual (`brightness(80%) sepia(20%)`).

### 3. Mapeamento de Cores (Color Mapping)
Uma *feature* técnica avançada que permite interceptar e substituir canais de cores específicos. Ideal para usuários que precisam diferenciar elementos de UI (como gráficos ou botões) trocando, por exemplo, todo o "Vermelho" da página por uma cor hexadecimal personalizada.

### 4. Gerenciamento de Perfis
* **Criação de Perfis:** Salve combinações complexas de filtros, ajustes e mapeamentos.
* **Persistência:** Utiliza a `chrome.storage.sync` e `local` para manter suas preferências salvas entre sessões.

---

## 🚀 Instalação (Modo Desenvolvedor)

Como este projeto ainda não está na Chrome Web Store, você deve instalá-lo manualmente:

1.  Clone este repositório:
    ```bash
    git clone [https://github.com/seu-usuario/ColorLens.git](https://github.com/seu-usuario/ColorLens.git)
    ```
2.  Abra o navegador (Chrome, Edge, Brave) e acesse `chrome://extensions`.
3.  Ative o **Modo do desenvolvedor** (canto superior direito).
4.  Clique em **Carregar sem compactação** (Load unpacked).
5.  Selecione a pasta raiz do projeto `ColorLens`.
6. [EXTRA] : Link para dowload simplificado na chrome web store https://chromewebstore.google.com/detail/colorlens/edjapphbjiacdcgponphdfmaeedofegk?hl=pt-br
---

## 🛠️ Arquitetura do Projeto

O projeto segue a arquitetura padrão de extensões Manifest V3:

* **`src/content/`**: Scripts injetados nas páginas web. Responsáveis por aplicar os filtros CSS e SVG no DOM.
* **`src/background/`**: Service Worker que gerencia eventos globais e atua como fallback para comunicação (messaging) quando a injeção direta falha.
* **`src/popup/`**: Interface de acesso rápido (React-like, mas feito com Vanilla JS) para alternar filtros padrões.
* **`src/options/`**: Painel de controle completo para criação de perfis ("CRUD" de perfis) e configurações avançadas.
* **`src/utils/`**: Módulos reutilizáveis, incluindo as definições matemáticas das matrizes de cores (`filters.js`).

---

## 🧪 Tecnologias

* **Core:** JavaScript (ES6+), HTML5, CSS3 (Grid/Flexbox).
* **APIs:** Chrome Extensions API (`scripting`, `storage`, `tabs`, `runtime`).
* **Processamento Visual:** SVG Filters (`<feColorMatrix>`) e CSS Filters.

---

## 👥 Autores

Desenvolvido por estudantes de Engenharia de Software da UPE:

* **João Pedro Bento Severo**
* **Murilo de Andrade Souza**
* **Mateus Montalvão Torres**
* **José Severo de Abreu Junior**

---

## 📜 Licença


Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.
