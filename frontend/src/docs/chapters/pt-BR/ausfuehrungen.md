# Execuções

Cada execução de um fluxo de trabalho é registrada por completo: entrada, resultados, tarefas, chamadas de ferramentas, raciocínio, memória, erros, tempos, tokens e custos. Este capítulo explica as visualizações, os status, a exportação e a importação de traces e como interpretar erros.

## Visão geral {#ueberblick}
<!-- keywords: execuções, runs, histórico, registro, trace -->

Você vê as execuções em dois lugares:

- **No editor**, na *Visão geral da execução* abaixo da tela: a última execução deste fluxo, ao vivo enquanto ela roda.
- Na página **Execuções**: todas as execuções de todos os fluxos, com visualização detalhada.

As execuções são mantidas mesmo que você altere ou exclua o fluxo de trabalho; cada execução guarda o fluxo como ele era no início.

## Acompanhar ao vivo {#live}
<!-- keywords: ao vivo, streaming, acompanhar, visão geral da execução, progresso, tempo real, aguarda você, cancelar execução -->

Durante uma execução, a **Visão geral da execução** mostra:

- no cabeçalho, o status da execução e **Cancelar execução** (veja [Cancelar execuções](/docs/ausfuehrungen#abbrechen)); ao terminar, um link para os **Detalhes**,
- no topo, o número de agentes, requisições à API, tokens e os custos estimados, atualizados continuamente,
- à esquerda, todos os agentes com o status; um clique mostra os detalhes à direita, e *Resultado geral* mostra o resultado do fluxo,
- à direita, o texto que o agente selecionado está escrevendo, suas chamadas de ferramentas e (se ativado) seu raciocínio.

Se uma [chamada de ferramenta](/docs/verzweigungen#tool-freigabe) aguarda a sua decisão, a execução, a etapa e o nó dela mostram **Aguarda você**: a execução só continua depois que você decidir. Se a execução parar em uma aprovação, a visão geral mostra a aprovação para você decidir; uma decisão tomada em outro lugar (página *Aprovações*, outra aba, a API) também aparece aqui sem recarregar.

Depois da execução, a visão geral mostra o mesmo que a visualização detalhada: o motivo de uma falha, chamadas de ferramentas sem resultado e etapas não concluídas (veja [A visualização detalhada](/docs/ausfuehrungen#details)).

Na tela, cada agente mostra seu status e, depois da execução, também tokens e custos. As conexões por onde passaram dados ficam destacadas.

## A lista de execuções {#liste}
<!-- keywords: lista, filtro, filtro de status, filtro de fluxo, excluir, origem, carregar execuções mais antigas, atualização, concluída com problemas -->

A página **Execuções** lista as execuções, das mais recentes para as mais antigas, com fluxo de trabalho, status, horário de início, duração, requisições, tokens e custos. Abaixo do nome do fluxo aparece a entrada ou a mensagem de erro. Se uma execução concluída teve chamadas de ferramentas sem resultado, aparece **Concluída com problemas** ao lado de *Concluído*, desde que o servidor forneça essa informação.

- **Filtros:** por fluxo de trabalho, por status e por origem (*Execuções próprias* ou *Traces importados*).
- **Excluir:** símbolo da lixeira; execuções em andamento não podem ser excluídas.
- **Importar trace:** veja [Importar traces](/docs/ausfuehrungen#trace-import).
- **Carregar execuções mais antigas:** a lista mostra primeiro as 100 execuções mais recentes e indica isso embaixo. Os filtros de status e de origem só procuram entre as execuções carregadas. Se o servidor não suportar carregamento por páginas, a lista para em 500 execuções; as mais antigas continuam salvas e podem ser encontradas com o filtro de fluxo de trabalho.

A lista é atualizada a cada cinco segundos enquanto houver uma execução na fila ou em andamento; caso contrário, a cada 30 segundos. Em uma aba em segundo plano ela não consulta o servidor; quando você volta, ela se atualiza na hora.

## A visualização detalhada {#details}
<!-- keywords: detalhes, visualização detalhada, linha do tempo, cascata, timeline, abas, resultado, tarefa, raciocínio, falhou em, concluída com problemas, chamadas sem resultado, não concluído, interrompida, mostrar como json, resultado estruturado -->

Um clique em uma execução abre a visualização detalhada:

1. **Números principais:** status com duração total, requisições à API, tokens (divididos em entrada, saída, cache e raciocínio) e custos estimados.
2. **Resumo da execução:** quantas etapas deram certo e quantas foram ignoradas, que caminho as decisões tomaram, como as aprovações foram decididas, quais ferramentas foram chamadas e quantas vezes (com erros) e em qual etapa a execução falhou, com *Ir para a etapa*. Ele é montado só com os dados salvos da execução, sem chamar nenhum modelo; o que a execução não registrou aparece como *não registrado*.
3. **Avisos sobre o resultado** (só quando necessário, veja abaixo).
4. **Entrada e resultado** do fluxo lado a lado.
5. **Linha do tempo:** uma barra de tempo por agente, na ordem em que começaram; etapas que nunca começaram vêm por último. Cada barra mostra quando o agente rodou; barras sobrepostas rodaram em paralelo. Ao lado aparecem a duração, os tokens e o número de chamadas de ferramentas. A etapa que falhou abre primeiro; caso contrário, uma etapa que aguarda uma pessoa.
6. **Detalhes do agente selecionado:** duração, horário de início e fim, tokens, requisições e custos, um eventual erro, o resultado do controle de qualidade e as abas:

| Aba | Conteúdo |
|---|---|
| **Resultado** | A saída do agente: o texto como Markdown, um resultado estruturado como campos com rótulo (as descrições curtas dos campos servem de rótulo). O JSON fica a um clique, em **Mostrar como JSON**. |
| **Tarefa** | A tarefa como chegou ao agente depois de substituir os marcadores. Ideal para encontrar problemas no fluxo de dados. |
| **Ferramentas** | Cada chamada de ferramenta com entrada, resultado, momento, duração e sucesso. |
| **Raciocínio** | As reflexões do modelo (só se *Mostrar raciocínio* estava ativo). |
| **Memória** | As anotações de um agente com memória *Por execução*. |

**Abrir no editor** leva ao fluxo de trabalho; **Cancelar execução** interrompe uma execução em andamento.

A aba **Contexto** mostra o que o agente recebeu nesta execução: prompt do sistema, tarefa com as entradas destacadas, mensagens de exemplo, ferramentas, conhecimento, memória, formato de saída e verificação de qualidade, sempre com a configuração do momento do início. Credenciais nunca são exibidas.

**Avisos sobre o resultado.** O que não deu certo aparece abaixo dos números principais:

- **Falhou em *etapa*:** se uma etapa falhou, o aviso a nomeia com o próprio problema em linguagem clara e diz o que fazer, por exemplo uma resposta cortada no limite de tokens ou uma chave de API recusada. Em erros do provedor, o modelo também é indicado. Quando a solução é uma configuração, um link leva até ela: **Abrir Configurações** ou **Abrir "Avançado" de *agente***. Se outras etapas falharam, o número delas aparece abaixo. O texto original fica em *Detalhes técnicos*.
- **Concluída com problemas:** uma execução pode ficar *Concluído* mesmo que chamadas de ferramentas não tenham tido resultado: recusadas por uma pessoa, expiradas sem decisão, não permitidas pelas regras de aprovação, canceladas, com falha ou com erro da ferramenta. Aparece então o selo laranja **Concluída com problemas** ao lado de *Concluído*, e um aviso lista cada uma dessas chamadas com etapa, ferramenta e motivo, cada uma com *Ir para a etapa*. Verifique se o resultado depende delas.
- **Não concluído:** se uma execução terminou enquanto etapas ainda estavam em andamento ou aguardando (por exemplo porque o Nodestro foi encerrado), essas etapas mostram **Não concluído** em vez de *Aguardando* ou *Em execução*. O aviso nomeia as etapas que nunca tiveram resultado, ou diz que o Nodestro parou durante a execução. **Continuar**, direto no aviso, as conclui; etapas concluídas são aproveitadas (veja [Continuar execuções que falharam](/docs/verzweigungen#fortsetzen)).

## Status {#status}
<!-- keywords: status, concluído, erro, ignorado, cancelado, aguardando, em execução, fila -->

| Status | Significado |
|---|---|
| **Aguardando** | O nó espera até que todos os antecessores terminem. |
| **Na fila** | A execução foi criada e vai começar em seguida. |
| **Em execução** | Sendo executado agora. |
| **Concluído** | Concluído com sucesso. |
| **Erro** | Falhou; a mensagem está nos detalhes. Uma execução fica com *Erro* assim que um nó falha. |
| **Ignorado** | O nó não rodou porque sua ramificação não foi escolhida. Isso não é um erro. |
| **Bloqueado** | O nó não rodou porque um antecessor falhou ou foi cancelado. |
| **Aguardando aprovação** | Uma [aprovação](/docs/verzweigungen#freigabe) espera a decisão de uma pessoa. |
| **Pausado** | A execução espera uma aprovação e continua depois da decisão. |
| **Cancelado** | Interrompido com *Cancelar execução*, rejeitado, ou um trace exportado antes de estar completo. |
| **Aguarda você** | Uma chamada de ferramenta aguarda a sua aprovação; a execução continua assim que você decidir. |
| **Não concluído** | Uma etapa de uma execução encerrada que nunca terminou (por exemplo porque o Nodestro foi encerrado). |
| **Concluída com problemas** | Não é um status próprio, mas um selo ao lado de *Concluído*: chamadas de ferramentas da execução ficaram sem resultado. |

Uma execução com falha ou cancelada pode ser [continuada](/docs/verzweigungen#fortsetzen). Execuções de agendamentos, lotes, séries de testes e subfluxos mostram sua origem na lista e nos detalhes.

## O resultado de uma execução {#ergebnis}
<!-- keywords: resultado, output, resultado geral, saída do fluxo, destino -->

- Se houver **nós de resultado**, o conteúdo deles é o resultado. Um nó de resultado com um antecessor assume a saída dele; com vários antecessores, um objeto com uma entrada por antecessor.
- Se **não** houver nó de resultado, os agentes sem sucessor valem como resultado.
- Com vários nós de resultado (ou últimos agentes), o resultado é um objeto com uma entrada por nó, com o nome do nó.

## Cancelar execuções {#abbrechen}
<!-- keywords: cancelar, parar, cancel, encerrar, cancelar mesmo, confirmação -->

**Cancelar execução** (na visão geral da execução ou na visualização detalhada) pede confirmação por segurança: um segundo clique em **Cancelar mesmo?** em até cinco segundos interrompe a execução; **Esc** ou um clique em outro lugar a deixa continuar. Isso vale também para uma execução pausada. Agentes em andamento param no próximo passo (próximo trecho de texto, próxima solicitação ou próxima chamada de ferramenta); agentes que ainda não começaram não são mais executados. Os tokens usados até ali são cobrados e mostrados.

## Conversar com o líder da equipe {#teamleitung}
<!-- keywords: líder da equipe, orquestrador, chat ao vivo, fazer uma pergunta, dar uma instrução, direcionar, direção ao vivo, live_steering, orçamento do chat, run_chat -->

Quando uma execução tem um **orquestrador** (também em uma execução de equipe aninhada), a visão de detalhes mostra a aba **Líder da equipe** ao lado de **Visão geral**. As aprovações e o status da execução continuam visíveis acima. Com vários líderes, você escolhe um; cada um mostra seu fluxo de trabalho, o nível e o status. Abaixo você vê o que ele está fazendo: decisões (usadas do máximo), suas equipes com status e os especialistas trabalhando agora.

Você escolhe explicitamente o que escreve:

- **Fazer uma pergunta:** um modelo de IA responde a partir do estado atual da execução. Uma pergunta nunca muda a execução. A resposta é marcada como *Resposta do chat, não uma decisão* e informa o estado em que se baseia.
- **Dar uma instrução:** o líder da equipe a considera na **próxima decisão**. Uma decisão que já está sendo tomada e equipes que já estão trabalhando não são interrompidas nem alteradas; os especialistas em andamento não percebem nada até a próxima decisão.

Cada instrução mostra seu estado: *Aguardando a próxima decisão* (com quantas equipes estão trabalhando agora), *Sendo considerada na decisão N*, *Considerada na decisão N* com o que foi decidido, ou *Não será mais considerada* com o motivo. “Considerada” significa que o líder da equipe leu a instrução e a incluiu na decisão; se e como segui-la, ele decide sozinho dentro dos seus limites. Enter envia, Shift+Enter começa uma nova linha.

**Custos:** as respostas às perguntas têm um **orçamento do chat** próprio por execução, separado do orçamento da execução. Os custos aparecem na página [Uso](/docs/nutzung#statistik) em **Chat ao vivo das execuções**, não nos custos da execução. No [modo de preços](/docs/nutzung#preismodus) estrito, perguntas a modelos sem preço conhecido são recusadas. Instruções não custam nada a mais; elas passam a fazer parte da próxima decisão.

**Permissões e limites:** para ler basta a permissão *Ler*; para enviar você precisa de *Executar*. Uma mensagem tem no máximo 2000 caracteres; por execução e líder da equipe há um número máximo de mensagens, instruções e perguntas, além de um limite de perguntas por minuto. A linha abaixo do campo de texto mostra o orçamento do chat e as perguntas restantes.

**Pausa, reinício, continuação:** enquanto uma equipe aguarda uma aprovação, as instruções continuam abertas e valem para a próxima decisão quando a execução prossegue. Se um reinício do servidor fizer perder uma decisão, a instrução é entregue de novo à decisão seguinte. Quando a execução ou o líder da equipe termina, as instruções abertas são marcadas como *Não será mais considerada* e não são levadas adiante quando você continua a execução. Depois do fim, a conversa só pode ser lida.

**Execuções sem supervisão:** no inspetor do orquestrador, **Direção ao vivo** define quem pode dar instruções: *Execuções iniciadas por uma pessoa* (padrão), *Sempre* (também agendamento, API, execução em lote e série de testes) ou *Desativada*. Perguntas não são afetadas. Mais sobre o orquestrador em [Orquestrador](/docs/verzweigungen#orchestrator).

## Exportar trace {#trace-export}
<!-- keywords: exportar trace, exportar, json, run json, compartilhar, arquivar, higienizar, anonimizar, privacidade, dados pessoais -->

**Exportar trace** na visão de detalhes salva uma execução como arquivo JSON: o fluxo de trabalho no momento do início, entrada, status, resultado e, por agente, tarefa, resultado, texto, raciocínio, chamadas de ferramentas com entradas e saídas, erros, verificação de qualidade, memória, carimbos de tempo, tokens e custo. A caixa de diálogo oferece dois tipos:

- **Completo:** tudo como foi salvo. Compartilhe o arquivo apenas se não contiver nada confidencial.
- **Higienizado para compartilhar:** chaves de API, tokens, senhas e chaves privadas são sempre substituídos. Opcionalmente, o Nodestro também substitui **dados pessoais** (endereços de e-mail, telefones, IBANs, números de cartão, endereços IP) e remove **conteúdos** inteiros (entradas, prompts, saídas, dados de ferramentas, memória); restam o fluxo, os status, os modelos, os tempos e os tokens.

Os trechos substituídos recebem marcadores como `[EMAIL_1]`; valores iguais recebem o mesmo marcador. Apenas a cópia baixada é higienizada; a execução salva permanece inalterada. A detecção funciona com padrões e **não garante encontrar tudo**, por exemplo nomes ou endereços. Revise o arquivo antes de compartilhá-lo.

Os resultados de ferramentas são encurtados para 20.000 caracteres por chamada.

## Importar traces {#trace-import}
<!-- keywords: importar trace, importar, json, abrir, ver, duplicata, restaurar -->

**Importar trace** na página *Execuções* reabre arquivos de trace exportados, inclusive vários de uma vez e em outro computador.

Como a importação funciona:

- O trace aparece como uma execução própria marcada como **Importado** e abre na visualização detalhada de sempre: resultados, agentes, chamadas de ferramentas, entradas e saídas, erros, carimbos de data e hora, controles de qualidade, tokens e custos, na medida em que o trace os contém.
- **Nada é executado.** Não há solicitação a um provedor de IA nem custos.
- Traces importados são **salvos permanentemente** e, como qualquer execução, podem ser reabertos, filtrados, exportados e excluídos.
- **Execuções existentes nunca são sobrescritas:** cada importação recebe um novo ID; o ID original aparece na visualização detalhada.
- **Duplicatas:** se a mesma execução já existir (a original ou uma importação anterior do mesmo arquivo), o Nodestro não cria cópia, mas abre a execução existente e avisa.
- **Traces incompletos:** se uma execução foi exportada enquanto ainda rodava, ela aparece como *Cancelado* com um aviso.
- **Uso:** execuções importadas não entram nas estatísticas de uso, porque seus custos não ocorreram nesta instalação.
- **Abrir no editor** não aparece em traces importados, porque o fluxo correspondente geralmente não existe aqui. O fluxo em si é transferido com a [exportação de fluxo de trabalho](/docs/workflows#import-export).

**Arquivos inválidos** são recusados com uma mensagem clara, sem salvar nada: não é JSON, é uma exportação de fluxo em vez de um trace, faltam campos obrigatórios ou há valores danificados. Um trace pode ter no máximo 50 MB.

## Comparar execuções {#vergleich}
<!-- keywords: comparar, comparação, diferença, diff, lado a lado, duas execuções -->

Marque duas execuções na lista de execuções com a caixa no início da linha e clique em **Comparar**. A visão de comparação as coloca lado a lado:

- **Indicadores:** status, duração, requisições, tokens de entrada e de saída, custo, chamadas de ferramentas e agentes com falha. Linhas diferentes ficam destacadas, com a diferença de A para B.
- **Resultado final:** como comparação por linhas (só em A, só em B) ou lado a lado.
- **Agentes:** por agente, modelo, status, duração, tokens, custo, ferramentas, erros e avaliação. Selos indicam o que difere; saídas e comentários da avaliação podem ser comparados diretamente.

Apenas dados salvos são comparados; nada é executado novamente. Se as execuções pertencem ao mesmo fluxo de trabalho, os agentes são associados pelo nó; caso contrário, pelo nome. Se o fluxo de trabalho mudou entre as execuções, a visão avisa. Traces importados também podem ser comparados.

## Interpretar erros {#fehler}
<!-- keywords: erros, mensagem de erro, erro, interpretar, causa, solução, refusalerror, budgetexceedederror -->

Os erros aparecem nos detalhes junto à execução ("Falhou em *etapa*", com o problema dessa etapa) e junto ao agente afetado (mensagem vermelha). A mensagem aparece no idioma da interface, diz em linguagem clara o que aconteceu e o que você pode fazer, por exemplo aumentar *Máx. de tokens* em "Avançado" ou verificar a chave em *Configurações → Provedores de IA*. Erros do provedor distinguem uma chave recusada, requisições demais (limite de taxa), um provedor sobrecarregado e um provedor inacessível. Em **Detalhes técnicos** fica o texto original do servidor ou da API com o tipo de erro, por exemplo para repassá-lo em um relatório de erro.

| Mensagem | Significado | Solução |
|---|---|---|
| `BudgetExceededError` | O orçamento da execução acabou. | Aumente o orçamento no fluxo ou nas configurações, ou escolha modelos mais baratos. |
| `RefusalError` | O modelo recusou a solicitação. | Reformule a tarefa, defina modelos alternativos ou escolha *Aceitar o texto da resposta mesmo assim*. |
| `MaxToolRoundsError` | Mais rodadas de ferramentas do que o permitido. | Aumente *Máx. de rodadas de ferramentas* ou deixe a tarefa mais precisa. |
| `IncompleteResponseError` | A resposta atingiu *Máx. de tokens* ou a janela de contexto. | Aumente *Máx. de tokens*, reduza o conhecimento. |
| `ToolExecutionError` | Uma ferramenta falhou de forma inesperada e *Devolver erros de ferramentas ao modelo* estava desligado. | Teste a ferramenta em *Experimentar* e ligue a opção. |
| *O provedor de IA relatou um erro …* | O provedor relatou um erro (por exemplo chave inválida, sobrecarga, id de modelo desconhecido, opções de requisição inválidas). | Verifique a chave e o id do modelo, tente de novo mais tarde, verifique as opções de requisição. |
| *Ignorado porque um nó anterior não teve sucesso.* | Consequência de um erro anterior. | Corrija o primeiro agente que falhou. |
| *A execução foi cancelada.* | Alguém escolheu *Cancelar*. | – |

Mais mensagens e soluções em [Erros comuns](/docs/faq#haeufige-fehler).
