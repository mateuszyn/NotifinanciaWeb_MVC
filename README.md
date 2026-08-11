# 📈 Notifinancia

> **Gestão Inteligente de Dividendos e Automação de Carteira**

O **Notifinancia** é uma plataforma web completa desenvolvida para o acompanhamento estratégico de ações e Fundos Imobiliários (FIIs) da B3. Inspirado na metodologia Barsi de investimento focado em dividendos, o sistema oferece cotações em tempo real, cálculos automáticos de preço médio, alertas de variação e relatórios diários automatizados direto no e-mail do usuário.

---

## 💡 Destaques Técnicos (Visão para Recrutadores)

Este projeto foi construído com foco em **performance, resiliência e UX**, resolvendo desafios reais de engenharia de software:

*   **Arquitetura Serverless Híbrida:** Integração fluida entre um Front-end MVC e um Back-end robusto em Python utilizando as *Serverless Functions* da Vercel. Isso eliminou problemas de CORS e reduziu o tempo de resposta das APIs para milissegundos.
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
