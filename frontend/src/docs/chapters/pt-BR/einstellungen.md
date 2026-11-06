# Configurações e operação

Este capítulo descreve todas as configurações, a instalação e a inicialização do Nodestro e os atalhos de teclado.

## Modelos locais {#lokale-modelle}
<!-- keywords: modelo local, ollama, offline, sem chave de api, qwen, download, recomendação, hardware, gpu, memória, servidor de modelos, mistral, europeu, esforço de raciocínio -->

→ [Abrir no Nodestro](/settings#settings-local-models)

O Nodestro pode rodar agentes, assistentes e a busca no conhecimento com **modelos locais** pelo Ollama, sem chave de API: prompts e documentos ficam neste computador. Uma instalação nova usa modelos locais por padrão (agentes `ollama:qwen3.5:4b`, assistente `ollama:qwen3.5:9b`); uma instalação atualizada mantém os modelos que tinha.

*Configurações → Modelos locais* mostra:

- **Estado:** se o servidor de modelos está rodando e quem o fornece. No desktop, o Nodestro inicia o próprio servidor (um processo separado neste computador, com a própria pasta de modelos); no Nodestro Local Docker é um contêiner separado; em um servidor, o operador o fornece. Um Ollama que você já usa só é utilizado se você salvar o endereço dele no provedor Ollama.
- **Ambiente:** se faltar, **Baixar e instalar** obtém uma vez a versão fixada e verifica o SHA-256. Sem internet, instale-o a partir do arquivo da versão (veja [Importação offline](/docs/einstellungen#offline-import)).
- **Recomendado para este computador:** um modelo por tarefa (classificar, escrever, agentes com ferramentas, análise, assistente, busca semântica) conforme o que a tarefa precisa, a memória deste computador e os modelos instalados. Um modelo instalado que seja suficiente vem primeiro; *Adequado* e *Limitado* significam que um modelo maior faria melhor; o motivo aparece sob o modelo. As sugestões nunca alteram um agente: você escolhe o modelo dele no editor.
- **Modelos:** os modelos sugeridos com tamanho do download, memória necessária e licença; **Verificado** significa que a compilação instalada é a que o Nodestro verificou.

**Preferir modelos europeus:** o Qwen continua sendo o padrão. Com a chave ligada, as recomendações sugerem, quando igualmente adequados, modelos da editora europeia Mistral AI (`ministral-3:3b`, `ministral-3:8b`, `ministral-3:14b` e, para programação, `devstral-small-2:24b`), mesmo que ainda precisem ser baixados; um modelo instalado continua sendo a primeira alternativa. Um modelo mais fraco nunca é sugerido, e a chave nunca usa um serviço na nuvem: todos esses modelos rodam neste computador. Um modelo que você mesmo define para um agente sempre tem prioridade, e o modo offline estrito continua recusando downloads. Para a busca semântica, a chave sugere o modelo europeu `mdenseon:307m` (LightOn) enquanto nenhum modelo de embedding estiver instalado. Ele não vem da biblioteca do Ollama: **Baixar** obtém os arquivos originais fixados (1,2 GB), verifica o SHA-256, monta o modelo a partir deles e só o mantém se ele reproduzir exatamente os vetores de referência. Um índice existente continua com seu modelo; trocar significa reconstruir o índice.

**Esforço de raciocínio:** modelos locais que conseguem “pensar” fazem isso sem limite a partir do esforço *Médio*, e o raciocínio conta para o tamanho máximo da saída. Em um computador sem placa de vídeo, um modelo pequeno pode levar muitos minutos nisso. Para etapas rápidas (classificar, extrair, respostas estruturadas curtas), escolha *Baixo*: o modelo então responde sem pensar. O servidor de modelos que o Nodestro inicia dá a cada modelo 32.768 tokens de contexto para prompt, raciocínio e resposta juntos. Inicie um Ollama próprio com `OLLAMA_CONTEXT_LENGTH=32768`; o padrão de 4.096 tokens é pequeno demais para agentes.

Custos: modelos locais **não têm cobrança de API externa**. O Nodestro não registra os custos de operação locais (hardware, energia); por isso as execuções mostram “local, sem cobrança de API” em vez de um total de 0, e execuções mistas somam ao custo o número de solicitações locais.

## Este computador, janela de contexto e velocidade {#lokale-hardware}
<!-- keywords: hardware, gpu, só cpu, memória, janela de contexto, ollama_context_length, velocidade, tokens por segundo, medir, modo de economia de cpu, raciocínio reduzido -->

*Configurações → Modelos locais → Este computador* mostra o que o Nodestro detectou: sistema, núcleos de CPU, memória, a placa de vídeo e a memória dela, se o servidor de modelos está rodando (e na GPU ou na CPU) e a **janela de contexto** dele: definida pelo Nodestro para o servidor que ele inicia, informada por um servidor em execução ou ainda desconhecida para o seu próprio Ollama. A coluna **Neste computador** da lista de modelos diz se um modelo roda na GPU, na CPU (mais lento), se é lento demais sem GPU ou grande demais para esta memória.

Avisos aparecem acima da lista quando se aplicam: uma janela de contexto pequena demais (para o seu próprio Ollama: defina `OLLAMA_CONTEXT_LENGTH=32768` no computador dele e reinicie-o), nenhuma placa de vídeo (espere respostas lentas; modelos pequenos e o esforço *Baixo* para etapas simples funcionam melhor), pouca memória, um modelo que não cabe ou um modelo medido como lento. A verificação do fluxo de trabalho também avisa quando a janela de contexto fica abaixo de 16.384 tokens ou o limite de resposta de um agente não cabe nela.

**Velocidade:** o Nodestro não estima velocidades. **Medir velocidade** em um modelo de linguagem instalado executa uma geração curta neste computador e mostra os tokens por segundo medidos, quando foi medido e se o modelo rodou na GPU ou na CPU.

**Modo de economia de CPU para modelos que raciocinam** (ligado por padrão): em um computador sem placa de vídeo, agentes com esforço *Médio* em modelos locais que raciocinam respondem sem a longa fase de raciocínio. O esforço *Alto* e uma opção de raciocínio definida explicitamente nunca são reduzidos. Cada etapa respondida assim leva o selo “Raciocínio reduzido: modo de economia de CPU” na execução e no teste do agente. Desligue o modo para que os agentes sempre raciocinem como configurado.

## Importação offline e pasta de modelos {#offline-import}
<!-- keywords: offline, air gap, usb, gguf, pacote offline, sha-256, ssd externo, pasta de modelos, copiar -->

Para computadores sem internet, *Configurações → Modelos locais → Importação offline* importa de um caminho no computador onde o Nodestro roda (no Local Docker: dentro da pasta de importação):

- **Pacote offline:** uma pasta criada em um computador com internet (`orkexa-local export`). Cada arquivo é verificado pelo SHA-256 antes de ser usado.
- **Arquivo GGUF:** um arquivo de modelo; dê a ele o nome que os agentes usam (por exemplo `meu-modelo:q4`) e, para modelos que leem imagens, o projetor de visão (`mmproj`).

**Pasta de modelos:** os modelos são grandes. Escolha outra pasta, por exemplo em um SSD externo: **Copiá-los para lá e verificá-los** copia cada modelo, verifica-o e só então troca (a pasta antiga é mantida); **Usar a pasta como está** troca para uma pasta que já contém modelos do Ollama.

## Criar um modelo a partir de arquivos locais {#modell-bauen}
<!-- keywords: criar, mdenseon, safetensors, template, gguf, air gap, soma de verificação, vetores de referência, embedding, reconstruir índice -->

Alguns modelos não estão na biblioteca do Ollama e são criados a partir dos arquivos originais: por enquanto o modelo de embeddings europeu `mdenseon:307m` (LightOn, Apache-2.0). Com internet, **Baixar** na lista de modelos busca os arquivos e cria o modelo. Sem internet (ou no modo offline estrito), use *Configurações → Modelos locais → Criar a partir de arquivos locais*: copie os dois arquivos de um computador com internet, informe os caminhos no computador onde o Nodestro roda (no Local Docker: dentro da pasta de importação) e escolha **Criar e verificar**. Nada é baixado.

- **Arquivo de pesos:** `model.safetensors` de `lightonai/mDenseOn`, revisão `a5fdb000f7a21da96c3bddde3a782ef777316df3`, 1,227,771,776 bytes, SHA-256 `a336c49fc679aeb23969114b12fb7317804da3cc7d8bc214818009dea39d545c`.
- **Arquivo de template:** `mmBERT-Base-307M-F16.gguf` de `mykor/mmBERT-base-GGUF`, revisão `66e31bd2787f6b5fe9b762a664f4899af38b0605`; SHA-256 dos primeiros 6,036,928 bytes `a224ccdee4310594e73c9907934a1520405bfc4467a3577d3dcf418e7c017901`. Basta o arquivo inteiro ou só esses primeiros bytes (o cabeçalho).

O Nodestro verifica os dois arquivos com essas somas, grava o arquivo do modelo, cria o modelo no servidor de modelos e calcula textos de referência: o modelo só é mantido se cada vetor coincidir com a referência. A lista mostra a etapa em andamento; **Cancelar** interrompe a criação. Se falhar, a mensagem diz o motivo: um arquivo que não corresponde à soma (arquivo errado, revisão errada ou cópia incompleta), um arquivo que falta, um arquivo que não serve para o modelo ou vetores de referência diferentes (o modelo é removido). **Tentar de novo** inicia outra vez com os mesmos caminhos.

Depois disso, o modelo aparece como modelo de embeddings. Um índice semântico existente continua com o modelo dele: escolha o novo modelo em [Busca no conhecimento](/docs/wissen#suchverfahren) e reconstrua o índice; a busca usa o índice antigo até o novo ficar completo.

## Modo offline estrito {#offline}
<!-- keywords: offline estrito, air gap, sem nuvem, verificação prévia, downloads recusados -->

Com o **Modo offline estrito** ligado, a verificação antes de cada execução recusa modelos na nuvem (também como modelo reserva, avaliador ou orquestrador), um servidor de modelos que não esteja neste computador, ferramentas de servidor como a busca na web e serviços MCP remotos; downloads também são recusados. Modelos locais, ferramentas locais e servidores MCP locais continuam funcionando. O modo não altera nenhum fluxo de trabalho: só recusa o que sairia do computador.

## Provedores de IA {#anbieter}
<!-- keywords: chave de api, provedor, anthropic, openai, gemini, ollama, vllm, compatível com openai, url base, variável de ambiente, .env, capacidades -->

→ [Abrir no Nodestro](/settings#settings-providers)

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

Administradores também definem o **Orçamento máximo por execução** (vazio: sem teto): nenhuma execução pode começar com mais nem ser aumentada além dele. O **Prazo das decisões de orçamento** (de 1 a 720 horas, inicialmente 24) diz quanto tempo uma execução pausada aguarda uma [decisão de orçamento](/docs/workflows#budget-freigabe) antes de falhar. Quem pode decidir é explicado em [Quem pode decidir](/docs/workflows#budget-rechte).

## Sandbox {#sandbox}
<!-- keywords: escolher sandbox, automático, docker, processo python, docker disponível, sandbox integrado, sandbox linux, macos, windows, bloqueado, experimental -->

→ [Abrir no Nodestro](/settings#settings-sandbox)

Aqui você escolhe onde as ferramentas rodam. A mudança vale na hora.

| Modo | Suas próprias ferramentas | Ferramentas criadas por IA e de origem desconhecida |
|---|---|---|
| **Automático** (padrão, recomendado) | Processo Python | só o Docker, depois que ele passa nas verificações do Nodestro; caso contrário, **bloqueadas** |
| **Sandbox Linux** (opcional, só Linux) | Processo Python | só o sandbox Linux integrado; caso contrário, **bloqueadas**; sem pacotes Python de terceiros, então ferramentas que precisam deles ficam **bloqueadas**; o Docker não é usado |
| **Processo Python** (só para uso confiável) | Processo Python | sempre **bloqueadas**; nem o Docker nem o sandbox Linux integrado são usados |
| **Docker** | Docker | Docker; se o Docker não estiver rodando, nenhuma ferramenta roda |

O Nodestro nunca recorre a um processo sem proteção para código criado por IA, e o modo *Automático* também nunca recorre ao sandbox Linux integrado: ele só é usado se você escolher **Sandbox Linux**. Se você nunca escolheu um modo, o Nodestro usa *Automático*; um modo que você escolheu em uma versão anterior é mantido. Se você escolheu **Processo Python** em uma versão anterior, as ferramentas criadas por IA agora estão bloqueadas: esse modo não as executa mais em um sandbox integrado. Escolha **Automático** e inicie o Docker ou, no Linux, **Sandbox Linux**.

Abaixo da escolha, o Nodestro mostra:

- o **computador que executa o Nodestro** com o sistema operacional dele. É o computador do ambiente de execução do Nodestro, não o dispositivo do seu navegador: se você abre o Nodestro em um servidor a partir de um Mac, vale o sistema do servidor;
- onde as ferramentas criadas por IA e as suas próprias rodam **agora**, ou que estão **bloqueadas** e por quê;
- cada **sandbox neste computador** com seu estado: *Aprovado* (pode rodar código criado por IA), *Experimental, não usado*, *Indisponível*, *Sem isolamento* (o processo Python) ou *Não usado aqui*.

O sandbox Linux integrado é aprovado no Ubuntu 24.04 e no Debian 13 (Intel ou AMD de 64 bits) assim que o autoteste dele passa; no ARM64 ele não está disponível. O Nodestro não tem sandbox nativo no macOS e no Windows: o antigo sandbox experimental do macOS foi removido, e a linha dele informa isso. Por isso, nos dois sistemas, ferramentas criadas por IA precisam do Docker ou de um mecanismo compatível. Os detalhes estão em [O sandbox](/docs/tools#sandbox) e [Confiança e isolamento](/docs/tools#vertrauen).

Em um servidor e no Nodestro Local Docker, todas as ferramentas rodam em um contêiner; lá a configuração não pode ser alterada.

## Instalar o Docker {#sandbox-docker}
<!-- keywords: instalar docker, docker desktop, docker engine, macos, windows, linux, wsl, iniciar docker, docker não está rodando, colima, orbstack, podman, rootless, grupo docker, verificar mecanismo -->

Com *Automático*, ferramentas criadas por IA exigem o Docker ou um mecanismo de contêineres compatível em qualquer sistema; no Linux, o modo **Sandbox Linux** é a única alternativa, sem pacotes de terceiros. O Nodestro inicia sem o Docker; só as ferramentas criadas por IA ficam bloqueadas até um mecanismo adequado estar rodando. O Nodestro encontra sozinho um mecanismo em execução e cria a imagem do contêiner no primeiro uso.

- **macOS:** instale o [Docker Desktop para Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple silicon ou Intel), abra-o uma vez e espere até ele informar que está rodando. [Colima](https://github.com/abiosoft/colima), [OrbStack](https://orbstack.dev/) e [Podman](https://podman.io/) também são aceitos, se passarem nas verificações do Nodestro.
- **Windows:** instale o [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/) com o backend WSL 2, reinicie se for solicitado e inicie o Docker Desktop. Ele precisa executar contêineres Linux. O Podman também é aceito, se passar nas verificações do Nodestro.
- **Linux:** instale o [Docker Engine](https://docs.docker.com/engine/install/) para a sua distribuição. Recomendamos o [Docker sem privilégios de root (rootless)](https://docs.docker.com/engine/security/rootless/) com delegação do cgroup v2, para que os limites valham. Incluir o seu usuário no grupo `docker` também funciona, mas membros do grupo docker têm, na prática, privilégios de root neste computador. O Podman também é aceito.

**O Nodestro verifica o mecanismo por conta própria.** Antes de um mecanismo executar código criado por IA, o Nodestro verifica os limites e o filtro de chamadas de sistema (seccomp) dele e inicia um pequeno contêiner de teste. Dentro dele, o código precisa rodar como usuário sem privilégios nem permissões especiais, sem rede, em um sistema de arquivos somente leitura, com limites aplicados de memória, processos, CPU e arquivos abertos, e sem segredos no ambiente. O Nodestro recusa um mecanismo que falha em uma verificação, qualquer que seja o nome dele, e *Configurações → Sandbox* mostra qual verificação falhou. As verificações nunca são afrouxadas. O Nodestro verifica em segundo plano, então a página nunca espera pelo Docker; enquanto a verificação está em andamento, a linha do Docker mostra *Verificando* e se atualiza sozinha. Depois de iniciar ou mudar o mecanismo, clique em **Verificar de novo**. Administradores também podem clicar em **Executar autoteste** para iniciar o contêiner de teste na hora (**Preparar o sandbox** enquanto a imagem do sandbox estiver faltando). Só administradores iniciam uma nova verificação, e no máximo a cada 10 segundos: caso contrário, a página diz que nada novo foi verificado (e quando tentar de novo) e continua mostrando o último resultado. Os demais usuários veem o estado e cada verificação sem detalhes técnicos.

**Qual mecanismo?** No Linux, o Docker Engine é o caminho mais direto, de preferência sem root com delegação do cgroup v2; o Podman com root também funciona. O Podman sem root pode falhar nas verificações, porque talvez não aplique todos os limites de arquivos do sandbox. No macOS e no Windows, use o Docker Desktop ou uma das alternativas acima. Seja qual for o mecanismo, o nome dele não decide: o Nodestro confia nas próprias verificações no seu computador.

Depois abra *Configurações → Sandbox*: com **Automático**, o Nodestro usa o Docker assim que ele estiver rodando; aparece *Docker disponível* e as ferramentas criadas por IA deixam de ficar bloqueadas. Se o Docker parar, elas voltam a ficar bloqueadas até ele rodar de novo; o Nodestro não muda para o processo Python.

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

## Exibição do raciocínio {#denken-anzeige}
<!-- keywords: raciocínio, thinking, reasoning, resumo, pensamento, ao vivo, status, não transmitido -->

Enquanto um modelo trabalha, o Nodestro mostra o que o provedor transmite do raciocínio: no assistente, no chat com o líder da equipe de uma execução, nas execuções de fluxos, no Arquiteto de fluxos e no teste de agente. **O Nodestro nunca escreve, completa ou parafraseia raciocínio por conta própria.** Se um provedor guarda o raciocínio para si, você vê apenas que o modelo está pensando, e por que não há texto.

A exibição sempre separa o raciocínio da resposta (moldura tracejada, rótulo próprio) e indica um destes estados:

| Estado | Significado |
|---|---|
| *Pensando…* | Uma fase de raciocínio está em andamento; ainda não chegou texto, ou o texto está oculto. |
| *Texto do raciocínio* | O raciocínio do modelo como foi gerado (modelos abertos, por exemplo via Ollama ou vLLM). |
| *Resumo do raciocínio* | Um resumo escrito pelo provedor de um raciocínio que ele não expõe (OpenAI, Gemini, Claude). |
| *Raciocínio não transmitido* | O modelo raciocinou, mas o provedor não enviou texto (criptografado, omitido ou não solicitado). |
| *Raciocínio não exposto* | O modelo não raciocina, ou o provedor dele nunca envia o raciocínio. |

**Exibição neste navegador** (seção *Exibição do raciocínio*): *Mostrar ao vivo* abre o texto enquanto ele chega, *Recolhido* (padrão) mostra a atividade e deixa o texto a um clique, *Só status* nunca mostra o texto. O assistente e o chat com o líder da equipe têm uma escolha própria por conversa (**Raciocínio** abaixo da entrada ou da introdução); *Padrão* segue a escolha global. A escolha fica neste navegador e não altera nenhum fluxo nem nenhuma conversa.

**Mostrar não é ativar.** Se e quanto um modelo raciocina é definido no agente ([Raciocínio e esforço](/docs/agenten#denken)). Alguns provedores só enviam texto quando solicitado:

| Provedor | O que chega ao vivo | Como obter texto |
|---|---|---|
| Anthropic (Claude 4 e posteriores) | resumo | a opção do agente para mostrar o raciocínio (*Mostrar resumido*) |
| OpenAI (modelos que raciocinam) | resumo; o raciocínio em si, nunca | **Solicitar resumos do raciocínio** (administradores; a OpenAI pode exigir uma organização verificada) |
| OpenAI GPT-4o, GPT-4.1 | nada: eles não raciocinam | – |
| Gemini 2.5 e posteriores | resumo (resumos de pensamentos) | **Solicitar resumos do raciocínio** |
| Amazon Bedrock | Claude: resumo; outros modelos que raciocinam: texto do raciocínio quando o modelo o envia | as opções de requisição do agente |
| Ollama, vLLM, servidores compatíveis com a OpenAI | texto do raciocínio quando o servidor o separa | a configuração do servidor (por exemplo, um analisador de raciocínio) |

Solicitar resumos não muda nenhuma resposta nem custo: o provedor cobra os tokens de raciocínio, seja o texto transmitido ou não. As opções de raciocínio do agente mostram o que o modelo dele transmite (*Raciocínio ao vivo: …*).

## Backup e restauração {#backup}
<!-- keywords: backup, cópia de segurança, restaurar, exportar, zip, mudança, salvaguarda -->

→ [Abrir no Nodestro](/settings#settings-backup)

**Baixar backup** salva todos os dados em um arquivo ZIP: fluxos de trabalho com versões, modelos de agentes, ferramentas próprias, arquivos de conhecimento, memória, execuções, dados de uso, favoritos, tags e configurações. O banco de dados é salvo como um instantâneo consistente, mesmo enquanto uma execução está trabalhando.

As **chaves de API** dos provedores de IA nunca vão para o backup, nem URLs base que contenham credenciais. A restauração mantém as chaves deste computador.

**Restaurar de um arquivo** primeiro verifica o arquivo por completo: formato, a soma de verificação de cada arquivo, o banco de dados e cada fluxo de trabalho e execução salvos. Só então o Nodestro mostra o que o backup contém, em comparação com o estado atual. Os dados só são substituídos após confirmação explícita e somente se nenhuma execução estiver ativa. Antes disso, o Nodestro salva automaticamente um backup do estado atual (`before-restore-….zip` na pasta `backups` do diretório de dados); ele aparece entre os backups deste computador e pode ser restaurado da mesma forma. Se algo falhar, os dados anteriores permanecem inalterados.

## Diagnóstico do sistema {#diagnose}
<!-- keywords: diagnóstico, verificar, encontrar erros, conexão, docker, sandbox, versão, problema -->

→ [Abrir no Nodestro](/settings#settings-diagnostics)

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

Requisitos: Python 3.11 ou mais recente e Node.js 20 ou mais recente (só para compilar a interface); Docker é opcional.

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
| `--profile` | `NODESTRO_PROFILE` | Perfil de operação (padrão `desktop`). Um servidor Nodestro não é iniciado com este comando: ele roda como a distribuição de servidor separada do Nodestro, que o operador da sua organização instala |
| – | `NODESTRO_ALLOWED_HOSTS` | Outros nomes deste computador aos quais o Nodestro responde (separados por vírgula, por ex. `studio.localhost`). Outros nomes de host, alterações vindas de páginas web alheias e solicitações encaminhadas por um proxy são recusados, para que nenhuma página no navegador possa operar o Nodestro |
| `--no-browser` | – | Não abrir o navegador automaticamente |
| `--reload` | – | Reiniciar quando o código mudar (desenvolvimento) |

Para encerrar, use **Ctrl+C**. Execuções em andamento são canceladas.

> **Segurança:** o Nodestro ainda não tem gerenciamento de usuários, por isso responde só a este computador. `--host 0.0.0.0`, outros endereços de rede ou nomes de rede em `NODESTRO_ALLOWED_HOSTS` interrompem a inicialização, e o Nodestro não pode ficar atrás de um proxy reverso. Para que outros dispositivos usem um fluxo de trabalho, publique-o como API: as APIs publicadas usam chaves de API e têm seu próprio acesso à rede (veja *API e exportação*).

## Nodestro em um servidor {#server}
<!-- keywords: servidor, entrar, login, sair, função, funções, papel, permissão, permissões, espaço de trabalho, tenant, somente leitura, membros, nodestro-server, set-role, remove-member, revoke-sessions, sessão expirada -->

O Nodestro Studio também pode rodar em um **servidor Nodestro** da sua organização. Nesse caso você entra pelo serviço de login da sua organização, e seus dados ficam salvos nesse servidor em vez de no seu computador. O Nodestro iniciado com o comando `nodestro` não tem login nem funções; nada desta seção vale para eles.

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
