# 📈 Notifinancia

> **Gestão Inteligente de Dividendos e Automação de Carteira**

O **Notifinancia** é uma plataforma web completa desenvolvida para o acompanhamento estratégico de ações e Fundos Imobiliários (FIIs) da B3. Inspirado na metodologia Barsi de investimento focado em dividendos, o sistema oferece cotações em tempo real, cálculos automáticos de preço médio, alertas de variação e relatórios diários automatizados direto no e-mail do usuário.

---

## 💡 Destaques Técnicos (Visão para Recrutadores)

Este projeto foi construído com foco em **performance, resiliência e UX**, resolvendo desafios reais de engenharia de software:

*   **Arquitetura Serverless Híbrida:** Integração fluida entre um Front-end MVC e um Back-end robusto em Python utilizando as *Serverless Functions* da Vercel. Isso eliminou problemas de CORS e reduziu o tempo de resposta das APIs para milissegundos.
*   **Views Modulares:** A tela da carteira utiliza `PortfolioView` como compositor, delegando header, resumo consolidado, cards de ativos, prompt, modal de edição e rodapé para Views especializadas.
*   **Resiliência no Web Scraping:** Implementação de mecanismos de *fallback* e cálculos matemáticos "na raça" no Back-end (Python/yfinance) para contornar bloqueios de IP ao buscar o *Dividend Yield* em ambientes de nuvem.
*   **Integração com IA (Prompt Engineering):** O sistema não apenas exibe dados, mas conta com um motor gerador de *Smart Prompts*. Ele compila os dados da carteira do usuário (ativos, preço médio, variação diária, quantidade) e gera um prompt otimizado para o Google Gemini retornar análises táticas de aporte e leitura de cenário.
*   **CRON Jobs e Mensageria:** Utilização de *Edge Functions* (Deno/Supabase) para varrer o banco de dados de usuários, compilar o fechamento de mercado e disparar relatórios transacionais via Resend API.

---

## 🛠️ Tecnologias Utilizadas

**Front-end:**
*   HTML5, CSS3 (Bootstrap 5) & JavaScript (ES6+)
*   Arquitetura MVC (Model-View-Controller) local
*   Vite (Build Tool)

**Back-end & API:**
*   Python 3 & FastAPI
*   Vercel Serverless Functions (`/api`)
*   `yfinance` & `requests` (Integração B3)

**Banco de Dados, Autenticação & Automação:**
*   Supabase (PostgreSQL)
*   Supabase Auth (Magic Links / OAuth)
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

## 🗺️ Roadmap de Evolução e Monetização do Notifinancia

### 🚀 Fase 1: Fundação, Legislação e Monetização Inicial
* [x] **Aviso de Venda de FIIs:** Alerta de DARF e tutorial inseridos diretamente na exclusão de ativos com lucro.
* [x] **Rodapé Profissional & Proteção Jurídica:** Views de Termos, Privacidade, Contato e Disclaimer configuradas de forma responsiva via *Hash Routing*.
* [ ] **Monetização:** Injeção do bloco de Ads/parceiros para faturamento institucional.

### ⚡ Fase 2: UX Fluida, Inteligência de Dados e Resumo
* [x] **UX de Edição Dinâmica:** Skeleton Loading finalizado e Simulador da Bola de Neve calculando dados em tempo real no foco do input.
* [x] **Dashboard Consolidado:** Criação do painel superior com patrimônio total, variação global e projeção agregada de renda passiva.
* [x] **Organização Arquitetural das Views:** Modularização da carteira em `PortfolioView`, `PortfolioHeaderView`, `PortfolioSummaryView`, `AssetCardView`, `PromptView`, `UpdateAssetModalView` e `FooterView`.
* [ ] **Otimização Mobile:** Implementação de acordeões para ocultar/mostrar detalhes de DY e Renda em telas menores.

### 🔍 Fase 3: Radar de Ativos e Descoberta
* [ ] **Radar de Oportunidades para Visitantes:** Tela inicial para usuários sem login exibindo uma seleção curada de 5 ações e 5 FIIs no mesmo layout dos cards da carteira. Inclui botão de "Adicionar à Carteira" e foco interativo em quanto o usuário precisa gastar para atingir o gatilho da *Bola de Neve*.
* [ ] **Busca Direta por Ativo:** Barra de pesquisa instantânea no Radar permitindo consultar qualquer ticker da B3 com o mesmo modelo visual de preview de custos e dividendos.
* [ ] **Filtros Estratégicos (Motor de Base):** Implementação de regras automatizadas de filtro e busca nos bastidores baseadas na metodologia Barsi (P/VP, DY, histórico), servindo como base para varredura e seleção dos ativos diários monitorados.

### 📱 Fase 4: Comunicação Avançada e Mobile
* [ ] **Notificações Customizáveis:** Painel para o usuário gerenciar a frequência de e-mails e configurar alertas de variações bruscas.
* [ ] **Progressive Web App (PWA):** Transformação em aplicativo instalável na tela inicial com suporte a *Web Push Notifications*.

