# Agentes

Um agente é um modelo de IA com um papel, uma tarefa e ferramentas opcionais. O modelo pode ser da Anthropic, da OpenAI, do Google Gemini ou de um servidor próprio. Este capítulo explica cada configuração do inspetor, seu efeito e valores típicos.

## Noções básicas {#grundlagen}
<!-- keywords: nome, descrição, símbolo, ícone, inspetor, estrutura -->

Selecione um agente na tela; o inspetor mostra a configuração dele. As configurações mais usadas ficam no topo, e as menos usadas em seções recolhíveis (*Ferramentas*, *Conhecimento*, *Memória*, *Formato de saída*, *Raciocínio e esforço*, *Controle de qualidade*, *Avançado*). Ao lado de cada título de seção há um resumo, por exemplo "2 atribuídas". O resumo cita cada configuração diferente da de um agente novo, por exemplo "1 modelo reserva · sem cache" em *Avançado*. Os problemas continuam visíveis com a seção recolhida: o título mostra "1 erro" ou "2 avisos", e os links em *Problemas em*, no topo, abrem a seção e levam até ela. Uma seção fica aberta ou fechada como você a deixou, também no próximo agente e depois de recarregar. Só este navegador guarda isso; o fluxo de trabalho e suas exportações não mudam.

- **Ícone:** clique no ícone no canto superior esquerdo para escolher outro. Ele serve só para orientação.
- **Nome:** aparece na tela e também é o marcador `{{Nome}}` para os sucessores.
- **Descrição:** uma frase sobre o papel do agente. Ela aparece no nó e é o ponto de partida para a criação com IA.

Com os símbolos no canto superior direito você salva o agente como **modelo** na biblioteca, **duplica** o agente (Ctrl+D) ou o **exclui**.

## Modelo {#modell}
<!-- keywords: modelo, model, opus, sonnet, haiku, fable, preço, escolha, qual modelo -->

O modelo determina capacidades, velocidade e preço. Escolha primeiro o **provedor** e depois o **modelo**: da lista de modelos conhecidos ou como qualquer id de modelo do provedor que você digitar (por exemplo um modelo novo da OpenAI ou `llama3.1:8b` no Ollama). Provedores ainda não configurados trazem a indicação “não configurado”. A tabela mostra os modelos conhecidos com seus preços por milhão de tokens; “–” significa que o preço é desconhecido. Para esses modelos os custos ficam **desconhecidos** e nunca contam como 0.

<!-- widget: models -->

**Regras práticas:**

- **Haiku 5.5** para classificar, extrair e tarefas curtas e bem definidas.
- **Sonnet 5.5** para a maioria das tarefas de agente; o padrão para novos agentes.
- **Opus 5.5** para raciocínio exigente, planejamento, código e tarefas longas com muitas ferramentas.
- **Fable 5.1** para as tarefas mais difíceis, quando a qualidade importa mais que o custo.

O modelo padrão para novos agentes é definido nas [configurações](/docs/einstellungen#modelle), e o acesso aos provedores em [Provedores de IA](/docs/einstellungen#anbieter). Algumas opções só existem para modelos da Anthropic: thinking e exibição do raciocínio, cache de prompts, modelos alternativos e ferramentas de servidor. Com outros provedores o inspetor as oculta; se alguma ainda estiver definida, a verificação relata um erro em vez de omiti-la em silêncio.

**Amazon Bedrock:** os IDs de modelo são repassados exatamente como você digita, com dois-pontos e barras: `bedrock:anthropic.claude-sonnet-4-5-20250929-v1:0`, `bedrock:eu.anthropic.claude-sonnet-5-5` ou um ARN como `bedrock:arn:aws:bedrock:eu-central-1:111122223333:application-inference-profile/abc`. Só os primeiros dois-pontos separam o provedor. Os modelos da lista são sugestões, não modelos habilitados para sua conta. O Claude no Bedrock é um provedor à parte: as opções exclusivas da Anthropic acima também ficam desativadas para ele, e opções como saída estruturada ou esforço de raciocínio seguem o que o modelo suporta no Bedrock (desconhecido para um ARN digitado). Veja [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).

## Prompt de sistema {#system-prompt}
<!-- keywords: prompt de sistema, system prompt, papel, instrução, persona, engenharia de prompt -->

O prompt de sistema descreve de forma permanente **quem** o agente é e **como** ele trabalha. Ele vale para todas as tarefas do agente e, com o cache ativado, é reutilizado a baixo custo.

Um bom prompt de sistema contém:

1. **Papel:** "Você é um analista financeiro especializado em empresas industriais."
2. **Método:** "Confira o período e a unidade de cada número. Calcule com a ferramenta de calculadora."
3. **Padrão de qualidade:** "Indique as incertezas de forma explícita."
4. **Saída:** idioma, tamanho e formato ("Responda em português com no máximo 200 palavras, em forma de lista.").

Evite instruções que dependam da entrada específica; elas vão na **tarefa**.

## Tarefa {#aufgabe}
<!-- keywords: tarefa, task, modelo, marcador -->

A tarefa é a mensagem que o agente recebe em cada execução. Ela pode conter marcadores: `{{input}}`, `{{run.input}}` e `{{Nome de um antecessor}}`. As regras estão em [Marcadores nas tarefas](/docs/workflows#platzhalter).

Se a tarefa não contiver nenhum marcador, o inspetor avisa: os resultados dos antecessores são então acrescentados sob `# Eingaben`.

## Atribuir ferramentas {#tools}
<!-- keywords: atribuir ferramentas, tools, ferramentas de servidor, pesquisa na web, busca na web, execução de código -->

Na seção **Ferramentas** você escolhe na biblioteca de ferramentas quais funções o agente pode chamar. A lista é agrupada em *Integradas*, *Próprias* e *Geradas por IA*; ao passar o mouse, aparece a descrição.

Abaixo você ativa as **ferramentas de servidor da Anthropic**: *Pesquisa na web*, *Busca na web* e *Execução de código*. Elas rodam nos servidores da Anthropic (veja [Ferramentas de servidor](/docs/tools#server-tools)). As ferramentas de servidor só estão disponíveis para modelos da Anthropic.

O agente decide sozinho se e quando chama uma ferramenta, com base no nome e na descrição dela. Quantas vezes ele pode fazer isso é controlado por [Máx. de rodadas de ferramentas e Ferramentas em paralelo](/docs/agenten#limits); se ele é obrigado, por [Tool choice](/docs/agenten#tool-choice).

## Atribuir conhecimento {#wissen}
<!-- keywords: atribuir conhecimento, arquivos, pdf, contexto, sob demanda, pesquisa, citações -->

Na seção **Conhecimento** você atribui arquivos enviados e escolhe **como** o agente os recebe:

- **No contexto:** os arquivos ficam completos no prompt desde o início.
- **Sob demanda:** o agente vê um catálogo e carrega os arquivos sozinho (ferramenta `files`).
- **Pesquisa:** o agente procura os trechos adequados (ferramenta `search`).

**Ativar citações** faz as respostas remeterem aos trechos exatos. Detalhes e recomendações estão no capítulo [Conhecimento](/docs/wissen#modi).

**Enviar arquivo**, na mesma seção, envia um ou mais arquivos direto para [Conhecimento](/docs/wissen#hochladen) e os atribui a este agente. O arquivo fica salvo permanentemente em Conhecimento na hora e também pode ser usado por outros agentes; a atribuição é uma alteração normal do agente e é salva com o fluxo de trabalho. *Desfazer* ou *Descartar* removem só a atribuição, não o arquivo. Arquivos que você passa ao iniciar uma execução não são arquivos de conhecimento: pertencem só àquela execução.

## Memória {#memory}
<!-- keywords: memória, memory, anotações, por execução, permanente, espaço -->

Na seção **Memória** você escolhe *Desligada*, *Por execução* ou *Permanente* e, para a memória permanente, um **espaço de memória**. Você pode criar espaços novos aqui mesmo. **Configurar com IA** sugere uma estrutura de arquivos adequada. O resto está no capítulo [Memória](/docs/memory).

## Formato de saída {#ausgabeformat}
<!-- keywords: formato de saída, estruturado, json, esquema, campos, pydantic, nome do campo, tipo, obrigatório, output format -->

**Texto (Markdown)** é o padrão: o agente responde livremente.

**Estruturado (JSON)** obriga o agente a retornar um objeto com campos fixos. O Nodestro monta um esquema JSON a partir deles, a API retorna um objeto compatível e o resultado é verificado contra o esquema. Os sucessores o recebem como JSON; a execução o mostra formatado.

Cada campo tem:

| Configuração | Significado |
|---|---|
| **Nome do campo** | Chave no JSON, por exemplo `summary` ou `key_metrics`. São permitidos letras, dígitos e `_`; o nome não pode começar com dígito e precisa ser único. Outros caracteres são substituídos por `_` durante a digitação. |
| **Tipo** | *Texto*, *Número* (decimal), *Número inteiro*, *Sim/Não*, *Lista (texto)* ou *Lista (números)*. |
| **Descrição** | Explica ao modelo o que vai no campo. Quanto mais precisa, melhor. |
| **Obrigatório** | Campos obrigatórios sempre são preenchidos; campos opcionais podem ser `null`. |

**Exemplo** de uma avaliação:

| Nome do campo | Tipo | Descrição |
|---|---|---|
| `summary` | Texto | Resumo em 2–3 frases |
| `key_metrics` | Lista (texto) | Os principais indicadores com unidade |
| `risk_score` | Número inteiro | Risco de 1 (baixo) a 5 (alto) |
| `approved` | Sim/Não | A análise está correta? |

O resultado fica assim:

```json
{
  "summary": "A receita e a margem cresceram bastante …",
  "key_metrics": ["Crescimento da receita 27,6%", "Margem EBIT 16,8%"],
  "risk_score": 2,
  "approved": true
}
```

**Limitações:**

- Um formato estruturado precisa de pelo menos um campo.
- Citações não podem ser combinadas com um formato estruturado.
- Se o modelo recusar uma solicitação, não há objeto; o agente então sempre falha, independentemente da configuração *Em caso de recusa*.

## Raciocínio e esforço {#denken}
<!-- keywords: esforço, effort, raciocínio, thinking, adaptativo, between_tools, mostrar raciocínio, reasoning -->

O **esforço (effort)** determina o quanto o modelo trabalha a fundo: *Baixo*, *Médio* (padrão), *Alto*, *Muito alto* ou *Máximo*. Mais esforço significa mais raciocínio, mais tokens de saída e custos maiores, mas traz resultados melhores em tarefas difíceis. *Padrão do modelo* deixa a escolha para o modelo.

O **raciocínio (thinking)** define se o modelo pensa antes de responder:

| Configuração | Efeito | Restrição |
|---|---|---|
| *Padrão do modelo* / *Adaptativo* | O modelo raciocina quando é útil. | – |
| *Só entre chamadas de ferramentas* | Raciocina apenas entre chamadas de ferramentas, não antes da primeira resposta. | Só Sonnet 5.5 e só até o esforço *Alto*. |
| *Desligado* | Sem raciocínio. | Não é possível com Opus 5.5, Sonnet 5.5, Fable 5.1 e Fable 5; com Opus 5 e Haiku 5.5, só até o esforço *Alto*. |

**Mostrar raciocínio** controla se as reflexões aparecem na execução: *Mostrar resumido* (um resumo do raciocínio), *Mensagens de progresso* (breves atualizações) ou *Omitir*. O raciocínio exibido aparece na aba *Raciocínio*. Essa configuração não pode ser combinada com raciocínio *Desligado* ou *Só entre chamadas de ferramentas*.

O raciocínio conta como **tokens de saída** e é cobrado como tal.

Se não se sabe se um modelo suporta esforço de raciocínio (servidores próprios, ids de modelo desconhecidos), um esforço definido gera um erro. Escolha então *Padrão do modelo* ou declare a capacidade em [Provedores de IA](/docs/einstellungen#anbieter). Endpoints compatíveis com OpenAI (como Ollama ou vLLM) não aceitam nenhuma configuração de esforço; a verificação explica isso, e **Definir esforço como padrão do modelo** ajusta o agente com um clique.

## Controle de qualidade {#qualitaet}
<!-- keywords: controle de qualidade, juiz, judge, avaliador, critérios, revisão, refine, llm as a judge, avaliação -->

Com o controle de qualidade, um segundo modelo, o **juiz**, verifica o resultado do agente:

1. O agente realiza a tarefa.
2. O juiz avalia o resultado **por critério** como *aprovado* ou *reprovado*, com uma justificativa. Ele também vê as chamadas de ferramentas e seus resultados.
3. Se um critério obrigatório for reprovado, o agente recebe a justificativa e revisa a resposta.
4. Isso se repete até o número de **revisões** configurado (0–5).

O resultado do controle aparece na execução junto ao agente: aprovado ou não, número de tentativas e a justificativa do juiz. Um resultado reprovado também é repassado; a execução não falha por causa disso.

**Bons critérios** podem ser verificados um a um: "Cada número vem de um resultado de ferramenta", "Cita pelo menos um risco concreto", "No máximo 150 palavras". Critérios vagos como "bem escrito" levam a avaliações pouco confiáveis.

**Custos:** cada verificação e cada revisão é uma solicitação extra. Os custos do juiz contam para o agente e para o orçamento da execução. Uma verificação recém-ativada começa com o modelo padrão das configurações como **modelo juiz**; você pode mudá-lo quando quiser, e as verificações existentes mantêm o modelo delas. Agentes projetados pela IA (*Criar com IA* e o arquiteto de fluxos) também recebem o modelo padrão como juiz; a verificação continua desativada. Se esse modelo não puder devolver um veredito estruturado, o rascunho avisa, e nenhum outro modelo é escolhido. O resumo da seção cita o juiz. Se o juiz for o mesmo modelo do agente, um aviso indica isso: um modelo tende a avaliar bem as próprias respostas.

## Limites {#limits}
<!-- keywords: máx. de tokens, max_tokens, rodadas de ferramentas, max_tool_rounds, ferramentas em paralelo, max_parallel_tools, limite -->

| Configuração | Padrão | Efeito |
|---|---|---|
| **Máx. de tokens** | 8.000 | Número máximo de tokens de saída por resposta, incluindo o raciocínio (até 128.000). Ao atingi-lo, o agente para com `IncompleteResponseError`. |
| **Máx. de rodadas de ferramentas** | 8 | Quantas rodadas de chamadas de ferramentas o agente pode fazer por tarefa (0–50). Depois disso, ele termina com `MaxToolRoundsError`. Com 0, ele não pode chamar nenhuma ferramenta. |
| **Ferramentas em paralelo** | 1 | Quantas chamadas de ferramentas de uma resposta rodam ao mesmo tempo (1–16). Útil para ferramentas lentas e independentes, como pesquisas na web. |

Aumente *Máx. de tokens* para textos longos ou esforço alto, e *Máx. de rodadas de ferramentas* quando um agente precisar de muitas etapas de pesquisa.

## Tool choice {#tool-choice}
<!-- keywords: tool choice, tool_choice, forçar, any, none, auto, escolha de ferramenta -->

| Configuração | Efeito |
|---|---|
| *Automático* | O modelo decide se usa ferramentas (padrão). |
| *Nenhuma ferramenta* | O modelo responde sem chamadas de ferramentas. |
| *Forçar alguma ferramenta* | A primeira resposta precisa ser uma chamada de ferramenta. |
| *Ferramenta específica* | A primeira resposta precisa chamar a ferramenta escolhida. |

Opus 5.5, Sonnet 5.5 e Fable 5.1 recusam chamadas de ferramentas forçadas; a verificação avisa. Nesses casos, use *Automático* com uma instrução no prompt de sistema ou um formato de saída estruturado.

## Erros de ferramentas {#tool-fehler}
<!-- keywords: erros de ferramentas, raise_tool_errors, tratamento de erros, toolexecutionerror -->

Uma ferramenta pode falhar de duas formas:

- **Erros esperados** (a ferramenta informa, por exemplo, "fuso horário desconhecido"): o agente sempre recebe a mensagem como resultado e pode reagir.
- **Erros inesperados** (entrada inválida, falha, tempo esgotado no sandbox): com **Devolver erros de ferramentas ao modelo** (padrão: ligado), o agente também os vê como resultado de erro. Se a opção estiver desligada, o agente termina com `ToolExecutionError`.

Chamadas de ferramentas com falha são marcadas na execução com um símbolo de aviso.

## Cache de prompt {#caching}
<!-- keywords: cache, caching, prompt caching, ttl, 5 minutos, 1 hora -->

Com o **cache de prompt** ligado (padrão), a API guarda o início fixo de uma solicitação (prompt de sistema, ferramentas, conhecimento no contexto, conversa anterior). As solicitações seguintes o leem por uma fração do preço. Isso compensa com rodadas de ferramentas, controles de qualidade e execuções repetidas.

A **duração do cache** é de *5 minutos* ou *1 hora*. Gravar no cache de 1 hora custa mais. Detalhes e preços em [Cache e custos](/docs/nutzung#caching).

## Recusas e modelos alternativos {#ablehnung}
<!-- keywords: recusa, refusal, fallback, modelo alternativo, segurança, refusalerror -->

Os modelos podem recusar solicitações por motivos de segurança; às vezes é um alarme falso.

**Quando o modelo recusa:**

- *Tratar como erro* (padrão): o agente falha com `RefusalError`; os sucessores são ignorados.
- *Aceitar o texto da resposta mesmo assim:* o texto (geralmente vazio) é repassado como resultado.

**Modelos alternativos:** se o modelo recusar, a API responde à mesma solicitação com o próximo modelo da lista. Os custos são calculados por modelo que respondeu. O Sonnet 5.5 não aceita uma lista própria; não use modelos alternativos com ele.

## Mensagens de exemplo {#beispiele-nachrichten}
<!-- keywords: exemplos, few shot, mensagens de exemplo, messages, diálogo -->

As mensagens de exemplo vêm antes da tarefa em si e mostram ao modelo o formato desejado (few-shot prompting). Elas alternam entre **Usuário** e **Assistente**, começam com uma mensagem do usuário e terminam com uma resposta do assistente. Mensagens vazias são ignoradas.

**Exemplo:** Usuário: "A entrega chegou danificada." – Assistente: "Categoria: reclamação · Urgência: alta".

## Request options {#request-options}
<!-- keywords: request options, opções de solicitação, betas, mcp, inference_geo, json, avançado -->

Para usuários avançados: um objeto JSON cujos campos são incluídos sem alteração em cada solicitação à API do agente, como `betas` ou configurações que o Nodestro não oferece separadamente. JSON inválido é marcado na hora e não é aplicado. Valores errados só causam um erro da API durante a execução.

## Criar um agente com IA {#ki-entwurf}
<!-- keywords: criação com ia, descrever agente, arquiteto, agent architect, criar automaticamente, dinâmico -->

Em vez de configurar tudo sozinho, você descreve o agente com suas palavras: tarefa, entradas, resultado desejado, padrão de qualidade. O **arquiteto de agentes** (o modelo dos assistentes definido nas configurações) então sugere:

- nome, descrição e um prompt de sistema completo,
- o modelo adequado mais barato e o menor esforço adequado,
- ferramentas existentes e ferramentas de servidor adequadas,
- limites de tokens e de rodadas de ferramentas.

Você vê a sugestão com o custo da criação e só a adota com **Aplicar**; depois tudo continua editável. No editor, o agente mantém a tarefa anterior ao aplicar.

Se faltarem capacidades ao arquiteto, ele indica as **ferramentas que faltam** com uma descrição. Você pode gerá-las em [Ferramentas → Criar com IA](/docs/tools#ki-erstellen). O arquiteto usa apenas modelos atuais, esforço no máximo *Muito alto*, no máximo 32.000 tokens e 20 rodadas de ferramentas.

A sugestão é escrita no idioma da interface, a menos que sua descrição peça outro idioma. Nomes de campos e outros identificadores técnicos continuam em inglês.

Disponível em **Criar com IA** no inspetor, **Descrever um agente** na paleta ou na página *Biblioteca de agentes*.

## Biblioteca de agentes {#bibliothek}
<!-- keywords: biblioteca, modelo, template, reutilizar, página de agentes -->

Na página **Biblioteca de agentes** você gerencia modelos de agentes reutilizáveis:

- **Modelo vazio** ou **Descrever um agente** cria um novo modelo.
- No editor, o símbolo de salvar no inspetor salva um agente como modelo.
- Os modelos são editados à direita com o mesmo formulário do editor; **Salvar** aplica as alterações e **Descartar** restaura o último estado salvo.
- Os oito modelos mais recentes aparecem na paleta do editor em **Da biblioteca**.

Um agente criado a partir de um modelo é uma **cópia**: alterações posteriores no modelo não afetam os agentes já inseridos.

## Testar um agente {#agent-testen}
<!-- keywords: testar, teste, experimentar, testar agente, execução de teste, executar sozinho -->

**Testar agente** no inspetor (no editor e na biblioteca de agentes) executa apenas este agente com a **configuração atual, inclusive alterações não salvas**:

1. Digite uma **entrada de teste**. Ela é inserida na tarefa como a entrada de uma execução; os marcadores dos predecessores ficam vazios. Com *Enviar a entrada diretamente como tarefa*, só o seu texto vai para o agente.
2. **Iniciar teste** mostra a resposta, todas as chamadas de ferramentas, erros, tokens, custo, duração e, se ativa, a verificação de qualidade.

Um teste **não é uma execução do fluxo de trabalho**: ele não aparece em *Execuções* e não altera resultados. A memória persistente só é lida; o teste trabalha sobre uma cópia. Um teste chama o provedor do modelo e **pode custar dinheiro**; o diálogo informa os preços do modelo quando conhecidos, e o custo aparece na página [Uso](/docs/nutzung#statistik).

## Validação e mensagens {#validierung}
<!-- keywords: validação, mensagem de erro, problema, aviso, vermelho, mensagem do inspetor -->

O inspetor verifica cada alteração com as regras da biblioteca, sem chamar a API:

- **Mensagens vermelhas** (erros) impedem o início, por exemplo uma ferramenta desconhecida, um nome de campo inválido, configurações de raciocínio que o modelo não suporta ou um controle de qualidade sem critério.
- **Mensagens amarelas** (avisos) permitem o início, por exemplo execução de código junto com pesquisa na web.
- **Notas cinzas** informam, por exemplo, que entradas são acrescentadas porque a tarefa não contém nenhum marcador.

Mensagens comuns e suas soluções estão em [Erros comuns](/docs/faq#haeufige-fehler).
