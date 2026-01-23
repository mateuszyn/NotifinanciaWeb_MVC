**🛠️ Instalação e Configuração**

Para configurar o ambiente de desenvolvimento local do Notifinancia, siga os passos abaixo:

**1. Pré-requisitos**

- Node.js: Certifique-se de ter o Node.js instalado (Versão 24.x ou superior recomendada).

- Git: Para clonagem e versionamento.

**2. Configuração Inicial**

- Clone o repositório para sua máquina local e navegue até a pasta do projeto

**3. Instalação de Dependências**

- Instale todos os pacotes necessários (Vite, Supabase SDK, etc) executando:

_npm install_

- Só o NPM basta pois já está tudo criado.
- Nota sobre permissões (Windows/PowerShell): Caso receba um erro de "execução de scripts desabilitada" ao tentar rodar comandos npm no VS Code, abra o PowerShell e execute o comando. Talvez seja nova config de segurança do windows. Caso queira liberar o Terminal do VS, execute: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser no prompt de comando.

**4. Variáveis de Ambiente**

- Na raiz do projeto, crie um arquivo chamado ._env_.

- Adicione as seguintes variáveis para conexão posteriormente:

_VITE_SUPABASE_URL=_

VITE_SUPABASE_ANON_KEY=

**5. Execução**
- Para iniciar o servidor de desenvolvimento com suporte a Hot Reload:

_npm run dev_

- O console indicará o endereço local (ex: http://localhost:5173) para acesso via navegador.
