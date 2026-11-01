# Configurações e operação

Este capítulo descreve todas as configurações, a instalação e a inicialização do Nodestro e os atalhos de teclado.

## Provedores de IA {#anbieter}
<!-- keywords: chave de api, provedor, anthropic, openai, gemini, ollama, vllm, compatível com openai, url base, variável de ambiente, .env, capacidades -->

O Nodestro executa os agentes com a biblioteca Orkexa e trabalha com vários **provedores de IA** ao mesmo tempo: **Anthropic**, **OpenAI**, **Google Gemini** e seus próprios servidores por meio de um **endpoint compatível com OpenAI**, **Ollama** ou **vLLM**. Cada agente usa o provedor do seu modelo. Se esse provedor não estiver configurado, a execução não começa; o Nodestro nunca troca em silêncio para outro provedor. Se faltar o provedor do modelo padrão, aparece “Configurar provedor de IA” no canto superior direito, ou “O modelo padrão precisa de …” se outro provedor já estiver configurado.

Em *Configurações → Provedores de IA* cada provedor tem sua própria seção:

- **Anthropic, OpenAI, Google Gemini:** informe a chave de API e clique em **Salvar**. A chave fica no banco de dados local, nunca mais é exibida e só é enviada a este provedor. **Remover** a apaga.
- **Endpoint compatível com OpenAI, Ollama, vLLM:** informe a **URL base** do servidor (por exemplo `http://localhost:11434/v1` para o Ollama) e clique em **Salvar endpoint**; a chave de API é opcional. O provedor só conta como configurado quando há uma URL base salva.
- **O que os modelos sabem fazer:** para seus próprios servidores você informa se os modelos suportam ferramentas, saída estruturada, imagens, documentos PDF, esforço de raciocínio e outras capacidades. O Nodestro não supõe nada: uma opção que um modelo não suporta, ou cujo suporte é desconhecido, é relatada como erro pela verificação em vez de ser omitida.
- **Testar conexão** só pede ao provedor a lista de modelos; não custa nada.
- **Primeiro provedor:** se você salvar uma chave enquanto o provedor do modelo padrão ainda não estiver configurado, novos agentes passam a usar um modelo desse provedor; uma mensagem diz qual. Só as configurações mudam: fluxos de trabalho existentes mantêm seus modelos.

Você também pode definir as chaves como **variáveis de ambiente**, antes de iniciar ou em um arquivo **`.env`** na pasta em que você inicia o `nodestro`. Variáveis de ambiente têm **prioridade** sobre chaves salvas:

| Provedor | Variável de ambiente |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |
| Compatível com OpenAI, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (opcional) |

Uma chave de versões anteriores (na época só para a Anthropic) vira automaticamente a chave da Anthropic nestas configurações na primeira inicialização.

## Modelo dos assistentes e modelo padrão {#modelle}
<!-- keywords: modelo padrão, modelo dos assistentes, default model, novos agentes -->

- **Modelo padrão para novos agentes:** novos agentes vazios começam com este provedor e modelo (pela paleta, em novos fluxos de trabalho e como modelo vazio). Nos rascunhos por IA, ele serve de substituto caso o arquiteto sugira um modelo não permitido. Agentes existentes não mudam.
- **Modelo dos assistentes:** este modelo cria agentes a partir da sua descrição, escreve ferramentas como agente de código, sugere estruturas de memória e responde suas perguntas como [Nodestro Assistant](/docs/assistent). Um modelo forte (padrão: Claude Opus 5.5 da Anthropic) gera sugestões melhores. Os rascunhos por IA só sugerem modelos de provedores configurados.

Os dois campos são compostos por **provedor** e **modelo**. Escolha o modelo da lista ou digite qualquer id de modelo do provedor, por exemplo `gpt-5.5` na OpenAI ou `llama3.1:8b` no Ollama. Ele é salvo como `provedor:modelo` (por exemplo `openai:gpt-5.5`); valores antigos sem provedor, como `claude-sonnet-5-5`, contam como modelos da Anthropic.

Se o modelo padrão pertence a um provedor não configurado enquanto outro está configurado, um aviso acima da escolha do modelo explica que novos agentes e cópias de exemplos não podem rodar com ele e sugere o modelo correspondente do provedor configurado (*Usar …*). Fluxos de trabalho existentes mantêm seus modelos de qualquer forma.

Salve as alterações com **Salvar** na seção *Modelos e orçamento*.

## Orçamento padrão {#budget}
<!-- keywords: orçamento padrão, orçamento, budget, limite -->

O **orçamento padrão por execução** (inicialmente 2 USD) vale para todos os fluxos sem orçamento próprio. Vazio significa sem limite. Como o orçamento funciona está em [Orçamento por execução](/docs/workflows#budget).

## Sandbox {#sandbox}
<!-- keywords: escolher sandbox, docker, processo python, docker disponível -->

Aqui você escolhe onde rodam as ferramentas que você mesmo escreve: **Processo Python** ou **Docker**. A mudança vale na hora. Avisos mostram se o Docker foi encontrado e se o **sandbox Linux integrado** está ativo; se não estiver, o motivo aparece (por exemplo, uma distribuição Linux não testada ou uma função do kernel ausente). Se o Docker estiver selecionado, mas inacessível, testes e chamadas de ferramentas falham. Os detalhes estão em [O sandbox](/docs/tools#sandbox).

Ferramentas criadas por IA e de origem desconhecida só rodam isoladas: automaticamente no sandbox Linux integrado; caso contrário, só com Docker; veja [Confiança e isolamento](/docs/tools#vertrauen).

## Idioma {#sprache}
<!-- keywords: idioma, language, português, inglês, alemão, espanhol, francês, italiano, idioma do navegador, tradução, localização -->

O Nodestro está disponível em **alemão, inglês, espanhol, francês, português (Brasil) e italiano**. Em **Idioma da interface** você escolhe um deles ou **Automático (idioma do navegador)**.

- **Primeira inicialização:** o Nodestro usa o idioma do seu navegador. Se ele não for suportado, aparece o inglês.
- **Sua escolha:** um idioma escolhido sempre tem prioridade e fica salvo, mesmo depois de reiniciar. O Nodestro o guarda no navegador e nas configurações; outro navegador o adota enquanto não tiver uma escolha própria.
- **Efeito imediato:** a troca não exige reinicialização e não inicia nenhum fluxo de trabalho nem chamada à IA.

O idioma afeta apenas a **interface**: menus, avisos, mensagens de erro, esta documentação e formatos de números e datas. Os custos são sempre mostrados em dólares americanos, no formato do idioma escolhido. Nas mensagens de erro do servidor, você vê o texto original em **Detalhes técnicos**.

**Seu conteúdo não muda.** Agentes, prompts, fluxos de trabalho, ferramentas, conhecimento, memória e resultados nunca são traduzidos automaticamente. Um agente existente continua respondendo no idioma do prompt dele, qualquer que seja o idioma da interface.

**Assistentes de IA:** novas sugestões (agentes, estruturas de memória) são escritas no idioma da interface, a menos que sua descrição peça outro idioma. Código, identificadores e chaves JSON sempre continuam em inglês.

## Aparência {#darstellung}
<!-- keywords: tema, escuro, claro, modo escuro, modo claro, esquema de cores, design, midnight citron -->

No canto superior direito você alterna entre **Escuro** e **Claro**. A escolha fica salva no navegador. As duas variantes seguem o sistema de design *Midnight Citron*. Em telas estreitas, a barra lateral vira uma barra de ícones.

## Backup e restauração {#backup}
<!-- keywords: backup, cópia de segurança, restaurar, exportar, zip, mudança, salvaguarda -->

**Baixar backup** salva todos os dados em um arquivo ZIP: fluxos de trabalho com versões, modelos de agentes, ferramentas próprias, arquivos de conhecimento, memória, execuções, dados de uso, favoritos, tags e configurações. O banco de dados é salvo como um instantâneo consistente, mesmo enquanto uma execução está trabalhando.

As **chaves de API** dos provedores de IA nunca vão para o backup, nem URLs base que contenham credenciais. A restauração mantém as chaves deste computador.

**Restaurar de um arquivo** primeiro verifica o arquivo por completo: formato, a soma de verificação de cada arquivo, o banco de dados e cada fluxo de trabalho e execução salvos. Só então o Nodestro mostra o que o backup contém, em comparação com o estado atual. Os dados só são substituídos após confirmação explícita e somente se nenhuma execução estiver ativa. Antes disso, o Nodestro salva automaticamente um backup do estado atual (`before-restore-….zip` na pasta `backups` do diretório de dados); ele aparece entre os backups deste computador e pode ser restaurado da mesma forma. Se algo falhar, os dados anteriores permanecem inalterados.

## Diagnóstico do sistema {#diagnose}
<!-- keywords: diagnóstico, verificar, encontrar erros, conexão, docker, sandbox, versão, problema -->

**Iniciar diagnóstico** verifica se o Nodestro funciona por completo neste computador e mostra para cada item **OK**, **Aviso** ou **Erro**, com uma explicação e uma sugestão de solução:

- versões do Nodestro, Orkexa, Python, SQLite e do sistema operacional
- banco de dados (legível, gravável, íntegro, busca de texto completo)
- diretórios de dados, ferramentas e backups graváveis, espaço livre em disco
- provedores de IA: quais estão configurados e se os provedores do modelo padrão e do modelo do assistente estão entre eles (sem exibir chaves)
- Docker e a sandbox de ferramentas com uma pequena ferramenta de teste
- suporte a PDF e a interface compilada

O diagnóstico é gratuito e não envia nada para a internet. **Testar conexão** pede também a lista de modelos ao provedor do modelo padrão; na seção de cada provedor em [Provedores de IA](/docs/einstellungen#anbieter) você o testa individualmente. Isso não usa tokens e não custa nada. Chaves de API e outras credenciais nunca são exibidas.

## Instalação e inicialização {#installation}
<!-- keywords: instalação, inicialização, linha de comando, cli, porta, host, data-dir, no-browser, reload, python, node -->

Requisitos: Python 3.10 ou mais recente e Node.js 20 ou mais recente (só para compilar a interface); Docker é opcional.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -e .
nodestro
```

O Nodestro inicia em `http://localhost:8000` e abre o navegador. Opções do comando `nodestro`:

| Opção | Variável de ambiente | Significado |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Endereço (padrão `127.0.0.1`). Só são aceitos endereços deste computador (`127.0.0.1`, `::1`, `localhost`), porque o Nodestro ainda não tem login |
| `--port` | `NODESTRO_PORT` | Porta (padrão `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Diretório de dados (padrão `~/.nodestro`) |
| `--profile` | `NODESTRO_PROFILE` | Perfil de operação (padrão `desktop`). `server` ainda não pode ser iniciado |
| – | `NODESTRO_ALLOWED_HOSTS` | Outros nomes deste computador aos quais o Nodestro responde (separados por vírgula, por ex. `studio.localhost`). Outros nomes de host, alterações vindas de páginas web alheias e solicitações encaminhadas por um proxy são recusados, para que nenhuma página no navegador possa operar o Nodestro |
| `--no-browser` | – | Não abrir o navegador automaticamente |
| `--reload` | – | Reiniciar quando o código mudar (desenvolvimento) |

Para encerrar, use **Ctrl+C**. Execuções em andamento são canceladas.

> **Segurança:** o Nodestro ainda não tem gerenciamento de usuários, por isso responde só a este computador. `--host 0.0.0.0`, outros endereços de rede ou nomes de rede em `NODESTRO_ALLOWED_HOSTS` interrompem a inicialização, e o Nodestro não pode ficar atrás de um proxy reverso. Para que outros dispositivos usem um fluxo de trabalho, publique-o como API: as APIs publicadas usam chaves de API e têm seu próprio acesso à rede (veja *API e exportação*).

## Nodestro em um servidor {#server}
<!-- keywords: servidor, entrar, login, sair, função, funções, papel, permissão, permissões, espaço de trabalho, tenant, somente leitura, membros, nodestro-server, set-role, remove-member, revoke-sessions, sessão expirada -->

O Nodestro Studio também pode rodar em um **servidor Nodestro** da sua organização. Nesse caso você entra pelo serviço de login da sua organização, e seus dados ficam salvos nesse servidor em vez de no seu computador. O aplicativo de desktop e o comando `nodestro` não têm login nem funções; nada desta seção vale para eles.

**Entrar e sair.** Quando você abre o Nodestro, o servidor leva você ao login e depois de volta. No canto superior direito aparecem seu nome e sua função. Um clique abre sua conta: nome, função, **espaço de trabalho**, suas permissões e **Sair**. Quando sua sessão expira, a próxima ação leva você de novo ao login e depois à mesma página. Se um login falhar (por exemplo porque demorou demais), um aviso no topo da página explica o que aconteceu, com **Entrar novamente**.

**Espaços de trabalho.** Fluxos de trabalho, execuções, conhecimento e configurações pertencem a um espaço de trabalho. Se você for membro de vários, troque na sua conta com **Trocar de espaço de trabalho**; o Nodestro então carrega a página inicial do outro espaço. As configurações valem para o seu espaço de trabalho atual nesse servidor.

**Funções e permissões.** Cada função tem permissões fixas:

| Função | Permissões |
|---|---|
| **Proprietário** | Ler, Editar, Executar, Administrar |
| **Administrador** | Ler, Editar, Executar, Administrar |
| **Editor** | Ler, Editar, Executar |
| **Operador** | Ler, Executar |
| **Observador** | Ler |

- **Ler:** ver tudo, inclusive execuções e a documentação.
- **Editar:** criar e alterar fluxos de trabalho, modelos de agentes, conhecimento e memória.
- **Executar:** iniciar fluxos de trabalho, cancelar e continuar execuções, decidir aprovações.
- **Administrar:** configurações, provedores de IA, serviços conectados, regras para chamadas de ferramentas, publicação de APIs e chaves de API.
- **Gerenciar a instalação** não pertence a nenhuma função: backup, diagnóstico do sistema e acesso de rede das APIs publicadas não aparecem em um servidor; quem cuida disso é o operador do servidor.

**O Nodestro mostra antes o que sua função não permite.** Esses controles ficam ocultos ou bloqueados, com o motivo ao lado, por exemplo *Sua função (Observador) não permite isso: é preciso a permissão “Editar”. Peça a um administrador do seu servidor Nodestro.* Como **Observador** ou **Operador**, um aviso no topo de cada página diz que você pode ver tudo, mas não alterar nada (e, como observador, também não executar). O servidor verifica cada requisição por conta própria mesmo assim.

**Membros e funções** são gerenciados pelo operador do servidor com comandos da linha de comando `nodestro-server`; o Nodestro Studio não tem uma página para isso:

- `nodestro-server members TENANT` lista os membros de um espaço de trabalho com suas funções.
- `nodestro-server set-role TENANT USER ROLE` adiciona uma pessoa ou altera a função dela (`owner`, `admin`, `editor`, `operator`, `viewer`).
- `nodestro-server remove-member TENANT USER` remove uma pessoa do espaço de trabalho e encerra as sessões dela ali.
- `nodestro-server revoke-sessions USER` encerra todas as sessões de uma pessoa (as associações continuam).

`USER` é um ID de usuário (`u_…`), um endereço de e-mail verificado ou o identificador no serviço de login. O servidor só conhece uma pessoa depois que ela entrou uma vez; um espaço de trabalho sempre mantém pelo menos um proprietário. Os detalhes estão no runbook do repositório nodestro-server (`docs/RUNBOOK.md`, seção *Members*). Se o login informar que sua conta ainda não tem acesso, peça a um administrador para adicionar você.

**Dados.** No fim da barra lateral aparece **O servidor da sua organização** em vez de *Local e privado*: seus dados ficam nesse servidor e só vão para os provedores de IA que o operador permite. Backups e instalação ficam a cargo do operador. Frases como “roda só no seu computador” valem apenas para o aplicativo de desktop e para o comando `nodestro`.

## Atalhos de teclado {#tastenkuerzel}
<!-- keywords: atalhos de teclado, shortcuts, teclado, keyboard, acessibilidade -->

<!-- widget: shortcuts -->

Além disso, em qualquer lugar: **Tab** vai para o próximo controle e mostra a explicação dele, **Esc** fecha caixas de diálogo e explicações, **Enter** ou **Espaço** acionam botões.
