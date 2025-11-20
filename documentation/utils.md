# Documentação: `src/utils/`

Diretório para funções auxiliares e constantes reutilizáveis, visando manter o código DRY (Don't Repeat Yourself).

## 1. `filters.js`

### Dicionário de Filtros (`COLOR_FILTERS_DATA`)
Exporta um objeto constante contendo as definições técnicas de cada filtro de daltonismo.
* **Estrutura**:
    * `id`: Identificador único.
    * `svg`: String contendo o código XML do filtro SVG (`<feColorMatrix>`) com a matriz de convolução de cor específica para cada condição (Protanopia, Deuteranopia, etc.).
    * `value`: (Opcional) Valor CSS direto para filtros simples como `grayscale(100%)`.

## 2. `storage.js`

### Abstração de Armazenamento
Encapsula a API `chrome.storage` em Promises modernas (async/await) para facilitar o uso em outros módulos.
* **`saveSettings(settings)`**: Salva o objeto de configurações no armazenamento sincronizado do navegador (`sync`), permitindo que as preferências do usuário o acompanhem entre dispositivos.
* **`loadSettings()`**: Recupera as configurações salvas, retornando um objeto vazio `{}` caso seja o primeiro acesso.