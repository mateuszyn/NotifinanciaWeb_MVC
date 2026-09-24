# 📈 Notifinancia

> **Gestão Inteligente de Dividendos e Automação de Carteira**

O **Notifinancia** é uma plataforma web completa desenvolvida para o acompanhamento estratégico de ações e Fundos Imobiliários (FIIs) da B3. Inspirado na metodologia Barsi de investimento focado em dividendos, o sistema oferece cotações em tempo real, cálculos automáticos de preço médio, alertas de variação e relatórios diários automatizados direto no e-mail do usuário.

> 🚧 **Em migração arquitetural:** A branch `feature/react-migration` contém a reescrita completa do front-end em **React + Vite**. Veja o progresso detalhado em [`docs/REACT_MIGRATION_PLAN.md`](docs/REACT_MIGRATION_PLAN.md).

---

## 💡 Destaques Técnicos (Visão para Recrutadores)

Este projeto foi construído com foco em **performance, resiliência e UX**, resolvendo desafios reais de engenharia de software:

*   **Migração Arquitetural Planejada (React):** O projeto está sendo portado de uma arquitetura MVC Vanilla JS para React, adotando Custom Hooks, Context API e componentização orientada a mercado. A estratégia de migração incremental (*Strangler Fig*) garante que a versão de produção nunca ficou fora do ar durante o processo.
*   **Arquitetura Serverless Híbrida:** Integração fluida entre um Front-end e um Back-end robusto em Python utilizando as *Serverless Functions* da Vercel. Isso eliminou problemas de CORS e reduziu o tempo de resposta das APIs para milissegundos.
*   **Resiliência no Web Scraping:** Implementação de mecanismos de *fallback* e cálculos matemáticos "na raça" no Back-end (Python/yfinance) para contornar bloqueios de IP ao buscar o *Dividend Yield* em ambientes de nuvem.
*   **Integração com IA (Prompt Engineering):** O sistema não apenas exibe dados, mas conta com um motor gerador de *Smart Prompts*. Ele compila os dados da carteira do usuário (ativos, preço médio, variação diária, quantidade) e gera um prompt otimizado para o Google Gemini retornar análises táticas de aporte e leitura de cenário.
*   **CRON Jobs e Mensageria:** Utilização de *Edge Functions* (Deno/Supabase) para varrer o banco de dados de usuários, compilar o fechamento de mercado e disparar relatórios transacionais via Resend API.

---

## 🛠️ Tecnologias Utilizadas

**Front-end (branch `main` — estável):**
*   HTML5, CSS3 (Bootstrap 5) & JavaScript (ES6+)
*   Arquitetura MVC (Model-View-Controller)
*   Vite (Build Tool)

**Front-end (branch `feature/react-migration` — em andamento):**
*   **React 19** + Vite
*   **React Router DOM** (rotas com History API)
*   **Context API** (gerenciamento de sessão global)
*   **Custom Hooks** (`useAssets`) para lógica de negócio

**Back-end & API:**
*   Python 3 & FastAPI
*   Vercel Serverless Functions (`/api`)
*   `yfinance` & `requests` (Integração B3)

**Banco de Dados, Autenticação & Automação:**
*   Supabase (PostgreSQL)
*   Supabase Auth (OAuth Google)
*   Supabase Edge Functions (Deno)
*   Resend API (Disparo de E-mails)

---

## ⚙️ Instalação e Configuração

Para configurar o ambiente de desenvolvimento local do Notifinancia e rodar o Front-end e o Back-end simultaneamente, siga os passos abaixo:

### 1. Pré-requisitos
*   **Node.js:** Versão 24.x ou superior recomendada.
*   **Python:** Versão 3.9 ou superior.
*   **Git:** Para clonagem e versionamento.
*   **Vercel CLI:** Para emular o ambiente de produção localmente (instale via npm: `npm i -g vercel`).

### 2. Configuração Inicial
Clone o repositório para sua máquina local e navegue até a pasta do projeto:
```bash
git clone [https://github.com/SEU-USUARIO/NotifinanciaWeb_MVC.git](https://github.com/SEU-USUARIO/NotifinanciaWeb_MVC.git)
cd NotifinanciaWeb_MVC
```

### 3. Instalação de Dependências (Front-end)
Instale os pacotes necessários (Vite, Supabase SDK, etc) executando na pasta raiz:

```bash
npm install
``` 
Nota sobre permissões (Windows/PowerShell): Caso receba um erro de "execução de scripts desabilitada" ao tentar rodar comandos no VS Code, isso ocorre devido à política de segurança do Windows. Para liberar a execução no terminal, abra o PowerShell como Administrador e execute: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser.


### 4. Variáveis de Ambiente
Na raiz do projeto, crie um arquivo chamado .env. Adicione as seguintes variáveis para a conexão com o banco de dados:

```bash
VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase_aqui
```
(Certifique-se de nunca commitar este arquivo. Ele já deve estar ignorado no .gitignore).

### 5. Execução do Projeto (Front + API Serverless)
Como o projeto utiliza a infraestrutura da Vercel para rodar o Python na pasta /api, não utilizamos o comando padrão do Vite. Para iniciar o orquestrador completo, execute:

```bash
vercel dev
```
O Vercel CLI irá subir o servidor de desenvolvimento, conectar a API Python e disponibilizar a aplicação, geralmente no endereço: http://localhost:3000.

### 📱 Funcionalidades
[x] Autenticação segura sem senha (Magic Link/Google).

[x] CRUD completo de ativos da B3 (Ações e FIIs).

[x] Cálculo de Rentabilidade com base no Preço Médio.

[x] Trava de segurança para meta da "Bola de Neve" (cotas que pagam novas cotas).

[x] Geração diária de e-mails de fechamento de mercado.

[x] Injeção de Prompts para análises via IA.

# 🗺️ Roadmap de Evolução e Monetização do Notifinancia

Este documento apresenta o planejamento estratégico e o acompanhamento das fases de evolução, melhorias de UX, expansão de funcionalidades e refatoração arquitetural do **Notifinancia**.

---

## 🚀 Fase 1: Fundação, Legislação e Monetização Inicial

* [x] **Aviso de Venda de FIIs:** Alerta de DARF e tutorial inseridos diretamente na exclusão de ativos com lucro.
* [x] **Rodapé Profissional & Proteção Jurídica:** Views de Termos, Privacidade, Contato e Disclaimer configuradas de forma responsiva via Hash Routing.
* [ ] **Monetização:** Injeção do bloco de Ads/parceiros para faturamento institucional.

---

## ⚡ Fase 2: UX Fluida, Inteligência de Dados e Resumo

* [x] **UX de Edição Dinâmica:** Skeleton Loading finalizado e Simulador da Bola de Neve calculando dados em tempo real no foco do input.
* [x] **Dashboard Consolidado & Raio-X Rápido:** Painel superior dinâmico com patrimônio total, variação global, projeção de renda passiva e grade interativa de mini-cards de tickers integrados por popover (`<details>`).
* [x] **Transparência de Indicadores (DY):** Inserção de ícones informativos ("i") customizados e responsivos nas boxes de DY (tanto no painel consolidado quanto nos cards individuais), detalhando a base de cálculo de 12 meses via Yahoo Finance e lembrando seu caráter estimado/não garantido.
* [x] **Estética Inspirada no Ecossistema de E-mail:** Customização visual do header com o ícone de envelope estilizado em tons de destaque e sino de notificações em amarelo vivo.
* [x] **Estabilização do Layout Mobile:** Resolução do vazamento horizontal de tela (`overflow-x`) e aprimoramento da gaveta inferior (`bottom-drawer`), garantindo margem de segurança (`safe-area-inset-bottom`) e respiro visual para o botão flutuante de adição de ativos.
* [ ] **Alternância de Zoom no Portfólio:** Implementação de um controle de zoom para visualização compacta ou expandida dos cards da carteira na versão mobile.
* [ ] **Impressão e Exportação Avançada da Carteira:** Adicionar ícone de atalho no header para disparo de impressão layout-desktop (grid completo exibindo todos os ativos organizados lado a lado, ignorando o formato mobile simplificado). *(Pendente)*
* [ ] **Otimização Mobile:** Implementação de acordeões para ocultar/mostrar detalhes de DY e Renda em telas menores.

---

## 🔍 Fase 3: Radar de Ativos e Descoberta

* [ ] **Radar de Oportunidades para Visitantes:** Tela inicial para usuários sem login exibindo uma seleção curada de 5 ações e 5 FIIs no mesmo layout dos cards da carteira. Inclui botão de "Adicionar à Carteira" e foco interativo em quanto o usuário precisa gastar para atingir o gatilho da Bola de Neve.
* [ ] **Busca Direta por Ativo:** Barra de pesquisa instantânea no Radar permitindo consultar qualquer ticker da B3 com o mesmo modelo visual de preview de custos e dividendos.
* [x] **Dashboard Consolidado & Raio-X Rápido:** Painel superior dinâmico com patrimônio total, variação global, projeção de renda passiva e grade interativa de mini-cards de tickers integrados por popover

---

## 📱 Fase 4: Comunicação Avançada e Mobile

* [ ] **Notificações Customizáveis:** Painel para o usuário gerenciar a frequência de e-mails e configurar alertas de variações bruscas.
* [ ] **Progressive Web App (PWA):** Transformação em aplicativo instalável na tela inicial com suporte a Web Push Notifications.

---

## 🏛️ Fase 5: Evolução Arquitetural e Refatoração de Domínio (Clean MVC)

* [ ] **Desacoplamento do AssetController (God Controller):** Divisão das responsabilidades atuais em controllers focados por domínio e domínio de negócio isolado.
* [ ] **Criação do PortfolioController:** Centralização do orquestrador global responsável por gerenciar o estado da carteira, SWR de preços, ordenações e a composição das views fracionadas.
* [ ] **Criação do ProfileController:** Isolação de todas as regras relativas ao usuário, gerenciamento de preferências (corretoras, ordenação padrão), notificações e fluxos de autenticação/logout.
* [x] **Modularização da Camada de Visualização (Views):** Decomposição bem-sucedida da antiga God View (`asset-view.js`) em componentes atômicos e reutilizáveis (`portfolio-header-view.js`, `portfolio-summary-view.js`, `asset-card-view.js`, entre outros), com gerenciamento global de eventos de fechamento de popovers e menus.
* [ ] **Blindagem e Tratamento de Erros:** Substituição de retornos silenciosos em falhas de banco por contratos estruturados (`{ data, error }`), garantindo rastreabilidade de exceções no front-end.