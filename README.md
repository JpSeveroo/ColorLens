# 🎨 ColorLens

O **ColorLens** é uma extensão de navegador focada em **acessibilidade para pessoas com daltonismo**.  
Seu objetivo é facilitar a navegação na web através de filtros de cor, contraste aprimorado e customizações visuais que tornam os sites mais inclusivos.

---

## 📂 Estrutura do Projeto

```bash
ColorLens/
│
├── manifest.json        # Arquivo de configuração da extensão (permissões, nome, ícones etc.)
├── README.md            # Documentação do projeto
│
├── assets/              # Arquivos estáticos (ícones, imagens, logos)
│   ├── icons/           # Ícones em diferentes tamanhos para a extensão
│   └── images/          # Imagens utilizadas no popup ou documentação
│
├── src/                 # Código-fonte principal da extensão
│   ├── popup/           # Interface do popup (menu rápido da extensão)
│   │   ├── popup.html   # Estrutura da interface do popup
│   │   ├── popup.css    # Estilos visuais do popup
│   │   └── popup.js     # Lógica de interação do popup
│   │
│   ├── content/         # Scripts que interagem diretamente com as páginas visitadas
│   │   └── content.js   # Aplica filtros de cor e contrastes sobre o conteúdo da página
│   │
│   ├── background/      # Scripts em segundo plano
│   │   └── background.js # Gerencia eventos persistentes da extensão
│   │
│   ├── options/         # Página de opções/configurações do usuário
│   │   ├── options.html # Estrutura visual das opções
│   │   ├── options.css  # Estilo da página de configurações
│   │   └── options.js   # Lógica para salvar/aplicar preferências do usuário
│   │
│   └── utils/           # Funções auxiliares
│       └── filters.js   # Filtros de cor (protanopia, deuteranopia, tritanopia etc.)
│
└── tests/               # Testes unitários e de integração
    └── filters.test.js  # Testes para verificar se os filtros estão funcionando corretamente
```

**✨ Funcionalidades:**

1. Aplicação de filtros para diferentes tipos de daltonismo:
- Protanopia
- Deuteranopia
- Tritanopia

2. Ajuste de contraste e brilho para melhorar a legibilidade.
3. Configurações salvas localmente para cada usuário.
4. Interface simples e intuitiva no popup.
5. Testes para garantir a eficácia dos filtros.

**🛠️ Tecnologias Utilizadas:**

- HTML5 e CSS3: Estrutura e estilo da interface.
- JavaScript (ES6+): Lógica principal da extensão.
- Chrome Extensions API: Integração com o navegador.
- Jest (ou outra lib de testes JS): Testes unitários.

**🚀 Como Executar o Projeto:**

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/ColorLens.git
```
2. Abra o Google Chrome (ou navegador compatível).
3. Vá em chrome: //extensions/.
4. Ative o Modo do desenvolvedor.
5. Clique em Carregar sem compactação e selecione a pasta do projeto.
6. A extensão estará disponível na barra de ferramenta.

---

📌 Futuras Melhorias

- Suporte a mais navegadores (Firefox, Edge, Opera).
- Mais opções de personalização de filtros.
- Modo de alto contraste automático com base no site.
- Exportar/importar configurações.

---

**🤝 Contribuição:**

Contribuições são bem-vindas!
Para contribuir:

1. Faça um fork do repositório.
2. Crie uma branch (git checkout -b feature/minha-feature).
3. Commit suas mudanças (git commit -m 'Adiciona nova feature').
4. Faça o push (git push origin feature/minha-feature).

Abra um Pull Request.

---

**📜 Licença**

Este projeto é distribuído sob a licença MIT.
Você pode usá-lo, modificá-lo e distribuí-lo livremente.
