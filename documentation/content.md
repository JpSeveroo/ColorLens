# 📘 Documentação Técnica: src/content/content.js

Este arquivo é o **Content Script**. Ele roda isolado dentro de cada página web que o usuário visita. Sua função é manipular o DOM (Document Object Model) e o CSS da página para injetar filtros SVG e alterar propriedades visuais em tempo real.

## 1. Persistência de Dados (Storage)

Estas funções são "wrappers" (envoltórios) para transformar a API antiga de callbacks do Chrome em Promises modernas (`async/await`), facilitando a leitura do código.

### `saveSettings(settings)`
* **Função:** Salva as preferências do usuário na nuvem do Google (`chrome.storage.sync`).
* **Parâmetro `settings`:** Objeto contendo configurações como `{ filter: 'Protanopia', contrast: 120, ... }`.
* **Detalhe:** Usa a chave `colorLensSettings` para agrupar tudo.

### `loadSettings()`
* **Função:** Recupera as configurações salvas.
* **Retorno:** Uma `Promise` que resolve com o objeto de configurações ou um objeto vazio `{}` se for o primeiro acesso.

---

## 2. Definições de Filtros (Constants)

### `COLOR_FILTERS_DATA`
Este é o "coração" matemático da simulação de daltonismo. É um objeto dicionário onde cada chave é o nome de um filtro.

* **Estrutura:**
    * `id`: O identificador que será usado no HTML (ex: `id="protanopia"`).
    * `svg` (**A Mágica acontece aqui**): Contém o código XML do filtro SVG.
        * `<feColorMatrix>`: É uma primitiva SVG que multiplica as cores de cada pixel da tela por uma matriz 4x5.
        * `values`: Os números dentro da matriz definem como o Vermelho, Verde e Azul são misturados. Por exemplo, na Protanopia (cegueira ao vermelho), a matriz mistura os canais Verde e Azul para simular o que o daltônico vê no lugar do vermelho.
    * `value`: Usado para filtros CSS simples que não precisam de matriz, como `grayscale(100%)`.

> **⚠️ Nota do Treinador:** Nesta versão do código, as chaves estão Capitalizadas (ex: `'Protanopia'`). Isso é importante porque o código que consome isso (`applyFilters`) precisa buscar exatamente essa string.

---

## 3. Injeção no DOM (DOM Manipulation)

### `injectSvgFilters()`
Esta função cria os "óculos" invisíveis que a página vai usar.

1.  **Verificação:** Checa se o elemento `#colorlens-svg-filters` já existe para não criar duplicatas.
2.  **Criação do Container:** Cria um elemento `<svg>` oculto (`display: none`).
3.  **População:** Percorre o objeto `COLOR_FILTERS_DATA` e insere todo o código XML (as tags `<filter>`) dentro de um `<defs>` (definições).
4.  **Inserção:** Adiciona esse SVG gigante ao final do elemento `<html>` (root) da página.

---

## 4. Aplicação Visual (Core Logic)

### `applyFilters(settings)`
Esta é a função que efetivamente "liga" os efeitos visuais no CSS da página inteira.

1.  **Desestruturação:** Extrai `filter`, `contrast`, `saturation` e `nightVision` do objeto de configurações.
2.  **Seleção do Filtro:**
    * Busca o filtro no dicionário usando a chave fornecida (ex: `'Protanopia'`).
    * Se o filtro tiver `svg`, constrói a string CSS `url(#id_do_filtro)`.
    * Se for valor simples, usa direto (ex: `grayscale(100%)`).
3.  **Montagem da String CSS:** Concatena (junta) todas as propriedades:
    * `contrast(...)`: Aumenta ou diminui a diferença entre cores.
    * `saturate(...)`: Deixa as cores mais vivas ou mais cinzas.
    * `brightness(...)` e `sepia(...)`: Usados se o modo `nightVision` estiver ativo (escurece e amarela a tela).
4.  **Aplicação:** Define `document.documentElement.style.filter` com a string final. Isso aplica o efeito em tudo que está na página.
5.  **Classe de Auxílio:** Adiciona ou remove a classe `.colorlens-night-vision` no HTML para tratamentos específicos de fundo.

---

## 5. Comunicação (Messaging)

### `chrome.runtime.onMessage.addListener`
O "ouvido" do script. Ele fica esperando ordens do Popup ou da página de Opções.

* **Gatilho:** Quando recebe uma mensagem com `action === 'applySettings'`.
* **Fluxo de Execução:**
    1.  Imprime o log no console.
    2.  Chama `injectSvgFilters()` (garante que os filtros existam).
    3.  Chama `injectUtilityStyles()` (garante que o CSS extra exista).
    4.  Chama `applyFilters()` (aplica o daltonismo/contraste).
    5.  Chama `applyCustomColors()` (aplica a tintura de cor personalizada).
* **Callback:** Responde "settings applied" para quem chamou.

---

## 6. Lógica de Cores Personalizadas (Custom Colors)
Aqui está a matemática por trás daquela funcionalidade de "tingir" a página.

### `hexToRgbNormalized(hex)`
Converte uma cor Hexadecimal (ex: `#ff0000`) para RGB normalizado entre 0 e 1 (ex: `1, 0, 0`). O SVG precisa de valores entre 0 e 1, não 0 e 255.

### `buildColorMatrix(backgroundHex, ...)`
Cria uma matriz de cor agressiva.
* **O que ela faz:** Ela zera canais específicos e força a cor da tela a se basear inteiramente nas cores escolhidas pelo usuário para Fundo, Texto e Destaque.
* **Simbologia da Matriz:**
    ```
    R_bg  R_text  R_high  0  0  (Canal Vermelho Resultante)
    G_bg  G_text  G_high  0  0  (Canal Verde Resultante)
    ...
    ```
    Isso substitui a lógica natural de cores da imagem pela mistura ponderada das cores escolhidas.

### `injectCustomColorFilter(...)` e `applyCustomColors(...)`
Funcionam de forma idêntica ao `injectSvgFilters` e `applyFilters`, mas especificamente para criar e aplicar um filtro dinâmico chamado `#colorlens-custom-color-mapping`.

---

## 7. Estilos Utilitários (CSS Injection)

### `injectUtilityStyles()`
Cria uma tag `<style>` no cabeçalho da página para regras que o `style.filter` sozinho não resolve.

* `transition`: Faz com que as mudanças de cor sejam suaves (0.3s) em vez de bruscas.
* `html.colorlens-night-vision`:
    * `background-color: #121212 !important;`: **Atenção aqui.** Isso força o fundo da página a ser quase preto.