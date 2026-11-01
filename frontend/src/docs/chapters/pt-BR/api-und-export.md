# API e exportação

Um fluxo de trabalho pronto pode ser usado como API web: diretamente pelo Nodestro neste computador, ou como projeto FastAPI independente que você pode executar em qualquer lugar. Os dois usam a mesma lógica de fluxo que o Nodestro. Nada é gerado de novo, e nenhuma IA reescreve o fluxo.

## Visão geral {#ueberblick}
<!-- keywords: api, rest, http, endpoint, publicar, implantar, implantação, deploy, fastapi, exportar, interface, integração -->

Abra um fluxo de trabalho no editor e clique em **API & Export**. A caixa de diálogo tem seis áreas:

| Área | Para quê |
|---|---|
| **Visão geral** | Status, endereços, publicação, versões e as últimas execuções da API |
| **Chaves e acesso** | Chaves de API e o acesso opcional pela rede |
| **Testar** | Verificar uma requisição ou iniciar uma execução de teste real |
| **Documentação** | Endpoints, exemplos em curl e Python, descrição OpenAPI |
| **Limites** | Nome na URL, descrição e limites |
| **Exportação** | O projeto FastAPI independente como ZIP |

Há dois caminhos:

1. **Servir diretamente:** o Nodestro responde a requisições em `/api/published/<nome>/…`. Por padrão, apenas deste computador.
2. **Exportar:** o Nodestro gera um projeto com runtime, versão do fluxo, testes, exemplos e README. Você o executa sem o Nodestro, por exemplo em um servidor ou no Docker.

Os dois rodam passo a passo como no Nodestro: os mesmos agentes, ferramentas, ramificações, aprovações e formulários.

## Publicar {#veroeffentlichen}
<!-- keywords: publicar, publicação, versão, congelar, verificação, salvar, nota -->

**Publicar** congela a última versão salva do fluxo de trabalho, junto com:

- os agentes com modelo, instruções e configurações,
- o código das ferramentas na versão aprovada (veja [Aprovação de ferramentas](/docs/tools#freigabe)),
- os subfluxos na versão atual (veja [Subfluxos](/docs/verzweigungen#unterworkflow)),
- o formulário de entrada, a partir do qual o Nodestro gera o esquema da requisição.

Antes, o Nodestro verifica o fluxo. Erros impedem a publicação; a caixa de diálogo mostra os avisos (por exemplo, falta de limite de custo ou etapas de aprovação). Alterações não salvas não são publicadas: salve primeiro. Abaixo aparece o **resultado dos testes** da versão em cada [série de testes](/docs/automatisierung#testreihen) do fluxo: *não testada*, *n de m aprovados* ou *desatualizado* quando outra versão foi testada por último ou a série mudou desde então. Sem [controle de publicação](#freigabe-gate), o resultado é apenas informativo; não impede a publicação.

Cada publicação recebe um número sequencial e uma nota opcional. Alterações posteriores no editor nunca mudam uma versão publicada. Elas só chegam à API quando você publica de novo.

## Controle de publicação {#freigabe-gate}
<!-- keywords: controle de publicação, gate, qualidade, série de testes, obrigatório, motivo, override, publicar, avaliação da ia -->

Com o **controle de publicação** você publica uma nova versão só depois que suas [séries de testes](/docs/automatisierung#testreihen) a testaram. O controle é opcional e vale por API. Você o ativa depois da primeira publicação em **Limites → Controle de publicação**: escolha as séries de testes, a parcela mínima de casos aprovados e, opcionalmente, uma avaliação mínima da IA. Versões já publicadas não mudam.

Antes de publicar, a janela mostra o resultado em três partes separadas:

- **Verificações obrigatórias:** a última execução de cada série testou exatamente esta versão com os modelos salvos, e a série não mudou desde então. Caso contrário, o controle bloqueia. Verificações obrigatórias não podem ser ignoradas, nem na janela nem pela API: teste a versão.
- **Resultados das verificações:** a parcela de casos cuja execução teve sucesso e passou em todas as verificações.
- **Avaliações da IA:** a média da [avaliação da IA](/docs/automatisierung#testreihen). Ela é marcada como *julgamento da IA, não garantido* e nunca é misturada com as verificações fixas.

Se os resultados ou as avaliações da IA não atenderem ao controle, você ainda pode publicar informando um **motivo** (pelo menos 10 caracteres). O motivo, quem o deu e quais pontos falharam ficam salvos com a versão e no histórico da API. A lista **Versões** mostra *controle atendido* ou *publicada com motivo*. Em um servidor, só os papéis owner e admin podem publicar e, portanto, informar um motivo.

## Versões e reversão {#versionen}
<!-- keywords: versão, versões, rollback, reverter, voltar, ativa, versão ativa, imutável, release -->

A lista de **versões** mostra cada versão publicada com data, nota e resultado da verificação. Uma delas está **ativa**: as requisições para `/runs` a usam.

- **Ativar** troca a versão ativa na hora, sem publicar de novo. É assim que você volta a uma versão anterior.
- As execuções mantêm sua versão até o fim, inclusive ao serem retomadas depois de um erro.
- Os clientes podem chamar uma versão específica: `POST /api/published/<nome>/versions/<número>/runs`.

Versões publicadas não podem ser editadas. Assim os resultados ficam rastreáveis: cada execução da API mostra com qual versão rodou.

## Desligar e excluir {#abschalten}
<!-- keywords: desligar, desativar, pausar, 503, excluir, apagar, remover -->

**Desligar** recusa novas execuções com o status `503` e o código `publication.disabled`. As execuções em andamento continuam; ao desligar, você também pode cancelá-las. O status e os resultados das execuções existentes continuam disponíveis. **Ligar** deixa a API disponível de novo.

**Excluir API** remove todas as versões, e as chaves perdem o acesso a elas. Só é possível quando nenhuma execução desta API está em andamento. As execuções em si continuam em Execuções. Se o fluxo de trabalho for excluído, sua API também some.

## Endpoints {#endpunkte}
<!-- keywords: endpoints, url, endereço, runs, status, resultado, eventos, cancelar, approve, resume, versões, openapi -->

Você define o nome na URL (por ex. `conferir-faturas`) ao publicar e o altera em **Limites**. Todos os caminhos começam com `/api/published/<nome>`:

| Método e caminho | Efeito | Permissão |
|---|---|---|
| `GET /` | O que a API espera e retorna, e quais versões existem | `read` |
| `POST /runs` | Inicia uma execução com a versão ativa | `run` |
| `POST /versions/<número>/runs` | Inicia uma execução com uma versão específica | `run` |
| `GET /runs` | As últimas execuções desta API | `read` |
| `GET /runs/<id>` | Status, etapas, custo e aprovações de uma execução | `read` |
| `GET /runs/<id>/result` | O resultado de uma execução concluída | `read` |
| `GET /runs/<id>/events` | O progresso como Server-Sent Events | `read` |
| `POST /runs/<id>/cancel` | Cancela uma execução | `run` |
| `GET /runs/<id>/approvals` | Aprovações pendentes com o que revisar | `read` |
| `POST /runs/<id>/approve` | Decide uma aprovação | `approve` |
| `POST /runs/<id>/resume` | Retoma uma execução com falha | `run` |
| `GET /runs/<id>/files` | Arquivos de resultado de uma execução | `read` |
| `GET /usage` | Execuções, tokens e custo desta API | `read` |
| `GET /openapi.json` | Descrição OpenAPI só desta API | – |

Os esquemas completos estão em **Documentação**, onde **Baixar a descrição OpenAPI** também entrega o arquivo OpenAPI.

## Requisições e respostas {#aufrufen}
<!-- keywords: requisição, request, corpo, body, json, input, values, formulário, esquema, arquivos, base64, resposta, 202, run_id, idempotency -->

O corpo da requisição é JSON. Se o fluxo tem um formulário de entrada, os campos ficam em `values`, com tipos, campos obrigatórios e opções como no formulário. Caso contrário, há um campo de texto `input`. Arquivos vêm como uma lista `files` com `name`, `media_type` e `content_base64`. A API também aceita arquivos como `multipart/form-data`, veja [Arquivos pela API](/docs/datei-eingaben#api-uploads).

```bash
curl -X POST http://127.0.0.1:8000/api/published/conferir-faturas/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"values": {"valor": 120, "fornecedor": "ACME"}}'
```

O Nodestro responde na hora com `202` e um `run_id`, com links para status, resultado e eventos. A execução trabalha em segundo plano. Consulte o status até ele ser `succeeded`, `failed` ou `cancelled` e então busque o resultado. Outros estados: `queued`, `running` e `awaiting_approval`.

Se uma requisição não corresponde ao esquema, a API responde `422` e nomeia cada campo inválido. Com o cabeçalho `Idempotency-Key`, uma requisição repetida (por exemplo, após um erro de rede) não inicia uma segunda execução, mas retorna a primeira.

## Espera síncrona e eventos {#synchron}
<!-- keywords: síncrono, sync, aguardar, esperar, wait, bloqueante, sse, server-sent events, stream, ao vivo, reconexão, last-event-id -->

Por padrão, toda API é assíncrona. Em **Limites** você pode ligar **Permitir aguardar o resultado**. Então `POST /runs?wait=30` aguarda o resultado até o tempo configurado. Se a execução não terminar até lá, vem o `202` de sempre. Isso não é possível para fluxos com etapas de aprovação, porque uma pessoa precisa decidir.

`GET /runs/<id>/events` entrega o progresso como Server-Sent Events: etapas começam e terminam, texto é gerado, aprovações aguardam, a execução termina. Prompts e dados das ferramentas ficam no Nodestro. Se a conexão cair, o cliente se reconecta com o cabeçalho `Last-Event-ID` e recebe só os eventos que perdeu.

## Aprovações pela API {#freigaben}
<!-- keywords: aprovação, aprovar, rejeitar, approve, reject, aguardando, awaiting_approval, humano, human in the loop -->

Quando uma execução chega a uma etapa de aprovação, ela passa para `awaiting_approval`. Você pode decidir em dois lugares, e vale a primeira decisão:

- no Nodestro, na página Aprovações (veja [A página Aprovações](/docs/verzweigungen#freigaben-seite)), com a indicação “da API publicada”,
- por `POST /runs/<id>/approve` com `{"decision": "approved"}` ou `"rejected"` e um comentário opcional. É preciso uma chave com a permissão `approve`.

Aprovações pendentes sobrevivem a um reinício do Nodestro. Uma execução com falha pode ser retomada com `POST /runs/<id>/resume`. Etapas bem-sucedidas são reutilizadas. Etapas que chamaram ferramentas só rodam de novo com `confirm_side_effects: true`.

## Chaves de API {#schluessel}
<!-- keywords: chave, chave de api, api key, token, bearer, authorization, x-api-key, permissões, scopes, run, read, approve, revogar, rotacionar, hash -->

Toda requisição precisa de uma chave, seja como `Authorization: Bearer <chave>` ou no cabeçalho `X-API-Key`. Você cria chaves em **Chaves e acesso**:

- **Nome:** quem usa a chave, por ex. o nome da aplicação.
- **Permissões:** `run` inicia, cancela e retoma, `read` lê status, resultados e eventos, `approve` decide aprovações.
- **Válida para:** as APIs que a chave pode chamar. Ela nunca alcança outros fluxos nem a interface do Nodestro.

A chave é mostrada **uma única vez**. O Nodestro guarda só um hash e depois reconhece a chave pelo início (`ndk_…`). **Revogar agora** bloqueia uma chave. **Substituir por uma nova chave** cria uma chave nova com as mesmas configurações e revoga a antiga. Chaves nunca aparecem em logs, traces, backups ou exportações. Depois de muitas chaves erradas em pouco tempo, a API responde `429` por um tempo.

## Acesso pela rede {#netzwerk}
<!-- keywords: rede, lan, porta, 8100, 0.0.0.0, outros dispositivos, tls, https, certificado, firewall, compartilhar -->

Por padrão, as APIs publicadas só respondem a este computador. Outros dispositivos recebem `403` com o código `lan.not_enabled`. Para permitir dispositivos da sua rede:

1. Abra **Chaves e acesso → Configurações de rede** e ligue o acesso pela rede. O Nodestro abre uma **porta própria** (padrão `8100`).
2. Ligue **Acessível na rede** em cada API. Só essas APIs ficam acessíveis pela porta.

Essa porta só atende as APIs publicadas, nunca a interface do Nodestro, suas configurações ou outros fluxos. Se a porta estiver ocupada, a caixa de diálogo avisa e o Nodestro continua funcionando normalmente. Depois de restaurar um backup, o acesso pela rede fica desligado de novo.

## Como ferramenta MCP {#mcp-server}
<!-- keywords: servidor mcp, ferramenta mcp, assistente de ia, claude, cliente, ferramenta -->

Uma API publicada também pode ser oferecida como **ferramenta para clientes MCP** neste computador, por exemplo um assistente de IA. Isso vem desligado e precisa de duas chaves: o operador inicia o Nodestro com `NODESTRO_MCP_SERVER=1` e você liga **Oferecer como ferramenta MCP** em *Acesso*.

- O cliente se conecta a `/api/published/_mcp` neste computador e envia uma chave de API como token Bearer. Ele vê as APIs oferecidas dessa chave como ferramentas, com o nome da API; a chave precisa de permissão para iniciar execuções.
- Cada chamada da ferramenta é uma **execução normal** da API publicada: mesma versão, mesmos limites, orçamentos, aprovações e histórico. Se a espera síncrona estiver ligada, a resposta traz o resultado; caso contrário, ou se uma execução parar em uma aprovação, ela informa a execução para você acompanhá-la no Nodestro ou pela API.
- Clientes em outros computadores não podem usá-la, nem pelo acesso de rede.

## Segurança {#sicherheit}
<!-- keywords: segurança, tls, https, criptografia, internet, proxy reverso, reverse proxy, certificado, backup, segredos -->

- Sem TLS, requisições, chaves e resultados trafegam pela rede **sem criptografia**. Use o acesso pela rede só em redes confiáveis, ou informe um certificado e sua chave (caminhos de arquivo neste computador).
- Não coloque o Nodestro diretamente na internet. Para isso existe a exportação, atrás de um proxy reverso com TLS.
- Cada execução custa dinheiro no provedor do modelo. Só distribua chaves com a permissão `run` se você confia nos limites da API.
- Backups não contêm chaves de API (veja [Backup e restauração](/docs/einstellungen#backup)). Na restauração, as chaves deste computador são mantidas.

## Limites {#grenzen}
<!-- keywords: limites, limits, rate limit, 429, simultâneas, orçamento, orçamento diário, custo, upload, tamanho de arquivo -->

Em **Limites** você decide quanto uma API pode ser usada:

| Limite | Padrão |
|---|---|
| Execuções simultâneas | 2 |
| Execuções aguardando aprovação | 20 |
| Novas execuções por minuto e chave | 10 |
| Requisições por minuto e chave | 120 |
| Orçamento diário (custo das últimas 24 horas) | 5 USD |
| Limite de custo por execução | O orçamento do fluxo |
| Tamanho de um arquivo enviado | 10 MB |

Quando um limite é ultrapassado, a API responde `429` com um código como `limit.concurrent` ou `limit.daily_budget` e, nos limites de taxa, com o cabeçalho `Retry-After`. O limite de custo por execução complementa o [orçamento do fluxo](/docs/workflows#budget).

## Mensagens de erro {#fehler}
<!-- keywords: erro, erros, error, código, status, 401, 403, 404, 409, 422, 429, 503, legível por máquina -->

Todo erro tem a mesma forma, para que programas possam avaliá-lo:

```json
{"error": {"status": 422, "code": "request.invalid", "message": "…", "params": {"errors": […]}}}
```

| Status | Significado |
|---|---|
| `401` | Chave ausente ou inválida (`auth.missing`, `auth.invalid`) |
| `403` | Permissão ausente (`auth.scope`) ou acesso pela rede desligado |
| `404` | A API, a versão, a execução ou o arquivo não existe |
| `409` | Não combina com o estado, por ex. resultado de uma execução em andamento (`run.not_finished`) |
| `422` | A requisição não corresponde ao esquema (`request.invalid`) |
| `429` | Um limite foi atingido (`limit.*`) |
| `503` | API desligada (`publication.disabled`) ou o provedor de um modelo não está configurado (`model.unavailable`) |

## Testar no Nodestro {#testen}
<!-- keywords: testar, teste, verificar, validar, dry run, execução de teste, exemplo -->

Em **Testar** há uma requisição de exemplo que você pode ajustar:

- **Verificar requisição** valida o corpo exatamente como a API, mostra a entrada que o fluxo receberia e não inicia nada. Não custa nada.
- **Iniciar execução de teste** inicia uma execução real da versão publicada pelo mesmo caminho da API. Ela é cobrada como qualquer execução e aparece em Execuções como execução de teste a partir do Nodestro.

Para testes de regressão de uma nova versão, use as [séries de testes](/docs/automatisierung#testreihen): elas rodam com a versão salva antes de você publicar.

## Monitoramento {#ueberwachung}
<!-- keywords: monitoramento, monitoring, execuções, origem, uso, custo, estatísticas, execuções de api -->

As execuções da API aparecem em Execuções com o gatilho **API**. A visão de detalhes mostra a versão e a chave que iniciou a execução. Na página Uso, as execuções de APIs publicadas têm uma linha própria (veja [A página Uso](/docs/nutzung#statistik)). A visão geral da caixa de diálogo mostra as últimas execuções desta API, e `GET /usage` entrega os mesmos números aos programas.

## Exportação como projeto FastAPI {#export}
<!-- keywords: exportação, exportar, zip, fastapi, projeto, independente, docker, uvicorn, readme, testes, pyproject, lock, implantação, servidor -->

Em **Exportação**, **Gerar ZIP** cria um projeto independente a partir de uma versão publicada. Ele contém:

| Parte | Conteúdo |
|---|---|
| `app/` | Aplicação FastAPI com os mesmos endpoints, configuração e gestão de chaves |
| `nodestro_runtime/`, `nodestro_api/` | O runtime do Nodestro (nodestro-runtime e a camada HTTP do nodestro-api), copiado sem alterações; versões e somas de verificação em `RUNTIME.json` |
| `workflow/` | A versão congelada com agentes, ferramentas e subfluxos |
| `pyproject.toml`, `requirements.lock` | Dependências com versões exatas |
| `tests/`, `examples/` | Testes sem chamadas ao modelo, uma requisição de exemplo e um cliente Python |
| `README.md`, `Dockerfile`, `.env.example` | Instalação, configuração e operação |

Se as ferramentas precisam de bibliotecas Python, a exportação usa exatamente as versões aprovadas (veja [Aprovação de bibliotecas](/docs/python-bibliotheken#freigabe)). Antes de gerar, a caixa de diálogo mostra cada arquivo e cada aviso. A exportação nunca contém chaves de API, configurações nem outros fluxos. A mesma versão com as mesmas opções gera o mesmo arquivo ZIP, byte a byte.

No projeto exportado, `python -m app.keys new` cria chaves para seus clientes. O acesso aos provedores de IA é definido como variáveis de ambiente, como `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` ou `GEMINI_API_KEY`; o README e o `.env.example` citam exatamente as variáveis de que a versão do workflow precisa. URLs base de servidores próprios também são exportadas, a menos que contenham credenciais; nesse caso você mesmo as define (por exemplo `OLLAMA_BASE_URL`).

## A biblioteca Orkexa {#orkexa}
<!-- keywords: orkexa, biblioteca, repositório, licença, mit, vendor, incluir, git, acesso -->

O Nodestro executa os agentes com a biblioteca **Orkexa**, que conversa com todos os provedores suportados. Ela não está no PyPI e fica em um repositório atualmente privado. Por isso a exportação oferece dois caminhos:

- **Referência Git** (padrão): o `pyproject.toml` aponta para o commit exato. Quem instala o projeto precisa de acesso de leitura ao repositório.
- **Incluir o código-fonte:** o código vai para `vendor/orkexa/` e o projeto se instala sem acesso ao repositório. A biblioteca está sob a licença MIT. Confirme que você pode repassá-la antes de entregar este projeto a outras pessoas.

Sem um dos dois o projeto não pode ser instalado. O README informa o caminho escolhido.

## Conhecimento e memória na exportação {#daten}
<!-- keywords: conhecimento, knowledge, memória, memory, dados, privacidade, confidencial, incluir, excluir -->

Arquivos de conhecimento e a memória persistente podem ter conteúdo confidencial. Por isso eles entram **no projeto só se você os selecionar um a um**:

- **Conhecimento** (veja [Conhecimento](/docs/wissen#ueberblick)): os arquivos selecionados são copiados com seu conteúdo. Os não selecionados ficam de fora, e os agentes não encontram nada ali.
- **Memória** (veja [Memória persistente](/docs/memory#dauerhaft)): o conteúdo atual de um espaço de memória selecionado vira o conteúdo inicial do projeto. Depois disso, os dois evoluem separadamente.

A verificação antes da exportação lista quais agentes usam dados que ficaram de fora. Ao servir diretamente, as execuções da API usam o conhecimento e a memória do Nodestro como qualquer outra execução.

## Guia de integração com IA {#ki-anleitung}
<!-- keywords: ia, guia, documentação, descrição, custo, opcional, revisar, aceitar, descartar -->

Por padrão, a exportação é criada sem IA e sem custo: o README e os exemplos vêm de modelos prontos. Opcionalmente, o modelo assistente escreve, a partir da documentação gerada, um guia em prosa para os usuários da sua API (`docs/AI_GUIDE.md`). Só a documentação da API vai para o modelo, sem chaves e sem dados. É uma chamada paga ao modelo e aparece na página Uso como “Guia com IA para uma API”.

O guia só entra na exportação depois da sua revisão: leia-o e clique em **Aceitar** ou **Descartar**. Ele não muda nada no código nem nos endpoints.
