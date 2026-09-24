# Plano de Migração: Vanilla JS (MVC) → React

> Branch de trabalho: `feature/react-migration`  
> Produção atual: `main` (Vanilla JS — estável e intacto)  
> Estratégia adotada: **Strangler Fig** — construção incremental lado a lado, sem quebrar a produção.

---

## ✅ Sessão 1 — Concluído (24/09/2026)

### Infraestrutura & Configuração
- [x] Criação da branch `feature/react-migration`
- [x] Instalação de `react`, `react-dom`, `react-router-dom`
- [x] Instalação e configuração do `@vitejs/plugin-react`
- [x] Criação do `vite.config.js` com suporte a JSX
- [x] Atualização do `index.html` para carregar `main.jsx` (a "Chave Geral")

### Camada de Autenticação
- [x] `src/context/AuthContext.jsx` — Provider global com `session`, `user`, `isAuthenticated`, `signInWithGoogle` (com `prompt: 'select_account'`), `signOut`

### Camada de Lógica (Hooks)
- [x] `src/hooks/useAssets.js` — Custom Hook com:
  - Dados demo para modo visitante (Guest Mode)
  - Fetch real de ativos do Supabase
  - Carregamento do perfil do usuário (sort, broker, notificações)
  - SWR: revalidação de preços em background
  - `handleSortChange` — ordena e persiste no banco
  - `handleBrokerChange` — troca corretora e persiste no banco
  - `handleToggleNotif` — ativa/desativa e persiste no banco
  - Função `sortAssets` portada do `AssetController`

### Componentes de UI
- [x] `src/components/Header.jsx` — Logo, sort select, broker select colorido, sino com **balão popover mobile**, menu do usuário com avatar e fallback, botão "Entrar"
- [x] `src/components/Footer.jsx` — Texto SEO + links de navegação React (`<Link>`) para Termos, Privacidade e Contato
- [x] `src/components/LoginModal.jsx` — Modal Bootstrap controlado por React (`useRef`), abre automaticamente para visitantes via `useEffect`
- [x] `src/components/PortfolioSummary.jsx` — Painel consolidado com Patrimônio, Variação Global, DY Anual, DY Mensal, grid de tickers com popovers
- [x] `src/components/AssetCard.jsx` — Card de ativo com bordas coloridas por variação PM/Dia, P.M., Preço Atual, Total, link Play Store da corretora

### Páginas
- [x] `src/pages/Dashboard.jsx` — Orquestra Header + PortfolioSummary + AssetCard com skeleton loading
- [x] `src/pages/Termos.jsx` — Conteúdo real migrado + botão Voltar com `useNavigate`
- [x] `src/pages/Privacidade.jsx` — Conteúdo real migrado + botão Voltar com `useNavigate`
- [x] `src/pages/Contato.jsx` — Formulário Formspree com e-mail pré-preenchido e bloqueado para usuários logados

### Roteamento & App Shell
- [x] `src/App.jsx` — `BrowserRouter` + `Routes` + `AuthProvider` + efeito global de fechar `<details>` ao clicar fora
- [x] `src/main.jsx` — Ponto de entrada do React

### Documentação
- [x] `docs/REACT_MIGRATION_PLAN.md` — Este arquivo
- [x] `README.md` — Badge de migração + stack React na seção de tecnologias + destaque de Migração Arquitetural na seção para recrutadores

---

## 🔲 Sessão 2 — CRUD de Ativos (Próxima Semana)

### Componentes a Criar
- [ ] `src/components/AddAssetDrawer.jsx` — Gaveta inferior "+ NOVO ATIVO" com formulário controlado
  - Validação de ticker na B3 (via `AssetService.validateTicker`)
  - Busca de preço atual ao digitar o ticker
  - Simulador da Bola de Neve inline
  - Autocomplete de tickers
- [ ] `src/components/UpdateAssetModal.jsx` — Modal de edição de quantidade e preço médio
  - Botões quick +/- de quantidade e preço
  - Formulário controlado com `useState`
- [ ] Botões de ação no `AssetCard.jsx`:
  - ✏️ Botão Editar (abre `UpdateAssetModal`)
  - 🗑️ Botão Excluir com alerta de DARF para FIIs com lucro (SweetAlert2)
  - 🔄 Botão "Tentar novamente" para ativos com erro de cotação

### Lógica a Migrar do AssetController
- [ ] `onCreateSubmit` → criar ativo (com validação + feedback Swal)
- [ ] `onUpdateSubmit` → editar ativo
- [ ] `onDeleteAsset` → excluir com alerta condicional DARF
- [ ] `onRetrySingleAsset` → revalidar preço de um ativo individualmente
- [ ] `onFetchCurrentPrice` → buscar preço atual no form de novo ativo

---

## 🔲 Sessão 3 — Polimento & Funcionalidades Avançadas

### Componentes Pendentes
- [ ] `src/components/AssetCard.jsx` — Completar seção de Dividendos:
  - Box de Renda Mensal e Renda Anual
  - Cotas compradas por mês/ano
  - Grid de meses pagos (12 meses rolantes coloridos)
  - Popover de DY Info (tooltip informativo)
  - Mensagem da Bola de Neve
- [ ] `src/components/PromptView.jsx` — Gerador de Smart Prompt para IA

### UX & Detalhes
- [ ] Animação `bell-animating` no sino ao toglar notificações
- [ ] Feedback toast (Swal) ao ativar/desativar notificações
- [ ] Swal de loading/sucesso/erro nas operações de CRUD
- [ ] Ordenação e corretora atualizando o select sem recarregar

---

## 🔲 Sessão 4 — Limpeza Final & Merge

### Remoção de Arquivos Legados
- [ ] `src/main.js` — Substituído por `src/main.jsx`
- [ ] `src/controllers/asset-controller.js` — Substituído por `src/hooks/useAssets.js`
- [ ] `src/views/` (pasta inteira) — Substituída por `src/components/` e `src/pages/`
- [ ] Remover `src/models/` se não houver mais dependências diretas

### Deploy & Validação Final
- [ ] Testar Preview Deploy na Vercel (URL temporária da branch)
- [ ] Validar Auth Google em produção (OAuth redirect)
- [ ] Validar CRUD completo no ambiente de Preview
- [ ] Merge da `feature/react-migration` → `main`
- [ ] Deploy em produção sem downtime

---

## Decisões Técnicas Registradas

| Decisão | Escolha | Motivo |
|---|---|---|
| CSS Framework | Bootstrap (mantido) | Reaproveitar visual existente; foco na lógica React |
| Roteamento | History API (`BrowserRouter`) | URLs limpas; Vercel suporta nativamente |
| Estado Global | Context API | Supabase Auth é simples o suficiente; sem necessidade de Redux |
| Fetch/Cache | SWR manual no hook | Padrão já existia no Vanilla; portado de forma limpa |
| Formulário de Contato | Formspree (mantido) | Funciona sem back-end adicional |
