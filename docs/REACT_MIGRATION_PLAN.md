# Plano de Migração: Vanilla JS (MVC) para React

Este documento detalha o plano para portar o sistema `NotifinanciaWeb_MVC` de Vanilla JavaScript para **React**. O objetivo é modernizar a stack técnica, adotando os padrões de mercado para aplicações front-end, o que facilitará a manutenção e enriquecerá seu portfólio para vagas Fullstack/Front-end.

## Decisões em Aberto
- **Manutenção do CSS Framework**: O projeto atual utiliza **Bootstrap**. Para minimizar o impacto visual e focar na migração lógica, o plano prevê manter o Bootstrap, a menos que seja decidido migrar para Tailwind CSS.
- **Roteamento**: Avaliar entre manter o hash-router (`#/termos`) ou passar para history router normal do `react-router-dom`. Como o deploy é na Vercel, o history router funciona nativamente sem problemas.

## Arquitetura Proposta (Padrão de Mercado)

A estrutura de diretórios passará do clássico MVC (Model-View-Controller) no front-end para uma arquitetura orientada a componentes.

- **`src/components/`**: Peças de UI reutilizáveis (Botões, Modais, Cards). *(Substitui partes de `src/views/`)*
- **`src/pages/`**: Componentes que representam telas inteiras (Home/Dashboard, Termos, Contato). *(Substitui o roteamento manual do `main.js`)*
- **`src/hooks/`**: Onde a lógica de negócio e controle de estado residirá. *(Substitui o `src/controllers/asset-controller.js`)*
- **`src/context/`**: Gerenciamento de estados globais, como a sessão do usuário logado e os dados da carteira.
- **`src/services/` & `src/infrastructure/`**: Serão mantidos **sem alterações** ou com mínimas alterações. A lógica do Supabase e as chamadas de API são puras e totalmente reaproveitáveis no React.

## Proposed Changes

Abaixo estão as etapas de execução propostas.

### 1. Inicialização e Dependências

Configurar o ambiente Vite para React e instalar dependências essenciais.

#### `package.json` (Atualização)
- Adição de `react`, `react-dom`, `react-router-dom` (Roteamento).
- Adição dos plugins do Vite para React.

### 2. Configuração Base (Context & Routing)

#### `src/context/AuthContext.jsx`
- Criaremos um Provider para injetar a sessão do Supabase (`session`, `user`) por toda a aplicação. Isso evita passar os dados do usuário componente por componente.

#### `src/App.jsx` e `src/main.jsx`
- O `App.jsx` conterá a definição das rotas (`/`, `/termos`, `/privacidade`, `/contato`) utilizando `react-router-dom`.
- O `main.js` atual será substituído pelo `main.jsx` do React.

### 3. Migração de Lógica (Controllers -> Hooks/Services)

#### `src/hooks/useAssets.js`
- Toda a lógica pesada que hoje está no `asset-controller.js` (como buscar, adicionar, editar e excluir ativos, e calcular o PM e variações) será transformada em um Custom Hook do React.
- Esse Hook utilizará o `useState` para guardar a lista de ativos e `useEffect` para buscá-los ao carregar.

### 4. Migração Visual (Views -> Componentes/Páginas)

Transformar os templates string do JS em componentes JSX (React).

#### `src/pages/Dashboard.jsx` (antigo `portfolio-view.js` + parte do `main.js`)
- A tela principal. Mostrará os componentes de Summary, Header e a Lista de Cards.

#### Componentes Reutilizáveis
- `src/components/AssetCard.jsx` (migrado de `asset-card-view.js`)
- `src/components/PortfolioSummary.jsx` (migrado de `portfolio-summary-view.js`)
- `src/components/AddAssetModal.jsx` (migrado de `add-asset-view.js`)
- `src/components/LoginModal.jsx` (migrado de `login-view.js`)
- `src/components/Footer.jsx` (migrado de `footer-view.js`)

#### Páginas Institucionais
- `src/pages/Termos.jsx`
- `src/pages/Privacidade.jsx`
- `src/pages/Contato.jsx`

## Estratégia de Migração (GitHub + Vercel)

Como o projeto já está integrado à Vercel (conforme visto pela pasta `.vercel` e arquivo `vercel.json`), a melhor forma de realizar essa migração no mundo real sem quebrar o sistema atual em produção é:

1. **Nova Branch**: Criar uma branch dedicada para a migração (ex: `feature/react-migration`).
2. **Desenvolvimento Isolado**: Executar todas as alterações do React (instalação de pacotes, reestruturação de pastas, reescrita de código) nesta nova branch localmente.
3. **Preview Deploy (Vercel)**: Ao fazer *push* dessa branch para o GitHub, a Vercel automaticamente detectará o push e criará um **Preview Environment**. Isso gerará uma URL temporária onde poderemos testar a aplicação rodando em React perfeitamente na nuvem, sem afetar o site principal que os usuários estão usando.
4. **Validação**: Testar extensivamente a URL de Preview (Auth, CRUD, Responsividade).
5. **Merge e Deploy em Produção**: Uma vez validado, faremos um Pull Request (ou merge direto) da branch `feature/react-migration` para a `main`. A Vercel então fará o build da versão React e a substituirá pela antiga em produção sem downtime (tempo de inatividade).

> A Vercel é extremamente otimizada para React e Vite. Ela detectará automaticamente o uso do Vite e ajustará os comandos de build (`npm run build`) e o diretório de saída (`dist`) sem precisarmos configurar muita coisa extra.
