# Documentação: `src/content/`

## `content.js`

### Visão Geral
O `content.js` é o script de conteúdo que é injetado e executado diretamente no contexto das páginas web visitadas pelo usuário. Ele é responsável por manipular o DOM e o CSS da página para aplicar os filtros de acessibilidade visual em tempo real.

### Responsabilidades Principais

1.  **Manipulação de DOM e CSS**
    * Injeta definições de filtros SVG invisíveis (`<svg><defs>...</defs></svg>`) no documento via `injectSvgFilters`.
    * Aplica propriedades CSS globais (`filter: ...`) ao elemento raiz (`<html>`) para renderizar correções de daltonismo, contraste e saturação.
    * Gerencia classes utilitárias no `<body>` e `<html>` para ativar/desativar modos de Leitura e Visão Noturna.

2.  **Cálculo Matricial de Cores (`applyCustomColors`)**
    * Implementa a lógica matemática para remapear cores específicas (ex: mudar vermelho para azul).
    * Constrói dinamicamente matrizes `feColorMatrix` SVG baseadas nos inputs hexadecimais do usuário.
    * Substitui a abordagem simples de CSS por transformações vetoriais no espaço RGB, permitindo uma substituição de cores mais precisa e menos destrutiva.

3.  **Detecção Inteligente de Ambiente (`isPageAlreadyDark`)**
    * Analisa computacionalmente a luminosidade da página antes de aplicar o "