# Configurações e operação

Este capítulo descreve todas as configurações, a instalação e a inicialização do Nodestro e os atalhos de teclado.

## Provedores de IA {#anbieter}
<!-- keywords: chave de api, provedor, anthropic, openai, gemini, ollama, vllm, compatível com openai, url base, variável de ambiente, .env, capacidades -->

O Nodestro executa os agentes com a biblioteca Orkexa e trabalha com vários **provedores de IA** ao mesmo tempo: **Anthropic**, **OpenAI**, **Google Gemini** e seus próprios servidores por meio de um **endpoint compatível com OpenAI**, **Ollama** ou **vLLM**. Cada agente usa o provedor do seu modelo. Se esse provedor não estiver configurado, a execução não começa; o Nodestro nunca troca em silêncio para outro provedor. Se faltar o provedor do modelo padrão, aparece “Configurar provedor de IA” no canto superior direito, ou “O modelo padrão precisa de …” se outro provedor já estiver configurado.

Em *Configurações → Provedores de IA* cada provedor tem sua própria seção:

- **Anthropic, OpenAI, Google Gemini:** informe a chave de API e clique em **Salvar**. A chave fica no banco de dados local, nunca mais é exibida e só é enviada a este provedor. **Remover** a apaga.
- **Endpoint compatível com OpenAI, Ollama, vLLM:** informe a **URL base** do servidor (por exemplo `http://localhost:11434/v1` para o Ollama) e clique em **Salvar endpoint**; a chave de API é opcional. O provedor só conta como configurado quando há uma URL base salva.
- **Amazon Bedrock (AWS):** sem chave de API; você escolhe uma região da AWS e como o Nodestro entra na AWS; veja [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).
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

## Amazon Bedrock (AWS) {#bedrock}
<!-- keywords: amazon bedrock, bedrock, aws, região, iam, função, perfil, sso, perfil de inferência, arn, ue, residência de dados, somente ue, converse, aws_region, sts -->

O **Amazon Bedrock** executa Claude, Amazon Nova e outros modelos pela sua própria **conta da AWS**, na **região da AWS** que você escolher; os custos aparecem na sua fatura da AWS. O Bedrock **não tem campo de chave de API**: o Nodestro entra com credenciais da AWS e nunca armazena chaves de acesso da AWS. Uma função do IAM ou um perfil da AWS não é uma chave; só diz à AWS quem está perguntando.

**Acesso no desktop.** Em *Configurações → Provedores de IA → Amazon Bedrock (AWS)* escolha:

- **Credenciais padrão da AWS (ambiente, SSO, função de instância):** o que as ferramentas da AWS encontram neste computador, por exemplo depois de `aws sso login`, em variáveis de ambiente `AWS_*` ou de uma função de instância.
- **Perfil da AWS:** um perfil nomeado de `~/.aws/config`; você digita só o **nome**, as credenciais ficam na sua configuração da AWS.

No Nodestro Local (um contêiner) só há as credenciais padrão.

**Acesso em um servidor.** As credenciais da AWS do próprio servidor nunca são usadas para um espaço de trabalho. O Bedrock fica desativado até o operador atribuir ao espaço de trabalho uma **função da AWS** própria; o cartão mostra então *Função atribuída pelo operador*, e você não pode ver nem alterar a função. Sem função, aparece *não disponível neste servidor*: fale com seu operador. O operador também pode limitar as regiões e exigir a residência de dados somente na UE para todos os espaços de trabalho (veja [Nodestro em um servidor](/docs/einstellungen#server)).

**Região.** Digite a região para a qual as solicitações vão e que a AWS fatura, por exemplo `eu-central-1` (Frankfurt). O campo sugere regiões comuns e recusa nomes que não são regiões da AWS. O modelo precisa estar habilitado para sua conta nessa região.

**Modelo.** No agente, escolha o provedor *Amazon Bedrock (AWS)*. A lista mostra modelos **sugeridos** (perfis de inferência da UE do Claude e do Amazon Nova); uma sugestão não quer dizer que o modelo esteja habilitado para sua conta. Você pode digitar qualquer **ID de modelo** (`anthropic.claude-sonnet-4-5-20250929-v1:0`), **ID de perfil de inferência** (`eu.anthropic.claude-sonnet-5-5`) ou **ARN** (por exemplo, de um perfil de inferência de aplicação); ele é salvo como `bedrock:<id>` e repassado exatamente como você digitou, com os dois-pontos (veja [Modelo](/docs/agenten#modell)).

**Residência de dados somente na UE.** Com a chave ligada, o Nodestro verifica antes da primeira solicitação se a região e todas as regiões para as quais o modelo ou o perfil de inferência pode encaminhar são regiões da UE (Frankfurt, Estocolmo, Milão, Espanha, Irlanda, Paris); caso contrário, nada é enviado. Perfis de inferência globais (`global.…`) são sempre recusados; Londres e Zurique ficam na Europa, mas não na UE. A verificação cobre a configuração com que o Nodestro envia as solicitações. Ela **não garante** que a AWS processe tudo na UE: o registro de invocações de modelos, a detecção de abuso com sua retenção e as demais configurações da sua conta da AWS estão fora do Nodestro. Para impor isso na conta inteira, use o IAM e políticas de controle de serviço. Se seu operador exige “somente na UE”, a chave fica ligada.

**Verificar conexão.** O botão entra na AWS (`sts:GetCallerIdentity`) e faz uma leitura gratuita no Bedrock (uma lista de modelos). **Nenhum modelo é chamado, então não custa nada.** Depois o selo mostra *Conexão verificada* ou *Verificação falhou* com o motivo; antes, *Não configurado* ou *Configurado*.

**Permissões mínimas do IAM** da função ou do usuário:

- `bedrock:InvokeModel` e `bedrock:InvokeModelWithResponseStream` no modelo ou perfil de inferência (a API Converse usa essas); com um perfil de inferência, também no modelo base em cada região de destino;
- `bedrock:GetInferenceProfile` no perfil (verificação “somente na UE”) e `bedrock:GetGuardrail` se você usa um guardrail;
- `sts:GetCallerIdentity` e `bedrock:ListFoundationModels` para *Verificar conexão*.

**Preços.** O Bedrock é cobrado **por região**, nunca com os preços da Anthropic, nem para o Claude. Um preço só vale para as regiões que informa; uma região não informada tem custo **desconhecido**, nunca 0, e o modo de preço estrito então recusa a solicitação. Cadastre seus próprios preços com as regiões em [Preços dos modelos](/docs/nutzung#preise). Sua fatura da AWS pode ter mais itens do que o Nodestro conta (por exemplo, registro de invocações, guardrails ou outros serviços da AWS).

**O que o Bedrock oferece.** Ferramentas, streaming, imagens e documentos PDF, saída estruturada e esforço de raciocínio dependem do modelo; opções que um modelo não suporta, ou cujo suporte é desconhecido (um ARN digitado, um perfil de inferência de aplicação), o Nodestro mostra desativadas com o motivo. **Não disponível no Bedrock**, nem para o Claude: ferramentas de servidor como a pesquisa na web, modos de pensamento, as configurações de cache de prompts da Anthropic, modelos de reserva, lotes e citações.

**Ferramentas e credenciais da AWS.** No desktop, o Nodestro mantém as credenciais da AWS longe das ferramentas (variáveis de ambiente e consultas do SDK da AWS). O código de ferramentas no sandbox simples de subprocesso, porém, roda com o seu usuário e poderia ler diretamente os arquivos em `~/.aws`. Se houver credenciais reais da AWS na máquina, rode suas ferramentas e as geradas por IA no sandbox integrado ou em contêineres (veja [Sandbox](/docs/einstellungen#sandbox)).

**Solução de problemas por mensagem:**

| Mensagem | O que fazer |
|---|---|
| Nenhuma credencial da AWS foi encontrada | Entre (`aws sso login`), confira o perfil ou o ambiente e depois *Verificar conexão*. |
| A AWS não aceitou as credenciais | Estão erradas ou expiraram: entre de novo. |
| A AWS negou o acesso | Conceda as permissões acima e habilite o modelo no console da AWS. |
| O perfil da AWS … não existe | Compare o nome do perfil com `~/.aws/config`. |
| Não é um nome de região da AWS / não é válida | Use um nome como `eu-central-1`. |
| Não é conhecido nesta região | Use um ID de modelo ou perfil de inferência oferecido nesta região. |
| Não foi possível acessar | Confira rede, proxy e região. |
| Poderia violar a residência de dados somente na UE | Use uma região da UE e um perfil `eu.` ou um modelo dessa região. |
| Não disponível neste servidor | Peça ao seu operador que atribua uma função da AWS ao espaço de trabalho. |

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

No canto superior direito você alterna entre **Escuro** e **Claro**. A escolha fica salva no navegador. As duas variantes seguem o sistema de design *Midnight Citron*. Em telas estreitas, a barra lateral fica oculta: o botão de menu no canto superior esquerdo (**Mostrar todas as páginas**) a abre como painel, e **Esc** a fecha de novo.

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
