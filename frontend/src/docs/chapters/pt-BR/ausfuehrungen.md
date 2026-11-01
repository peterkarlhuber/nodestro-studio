# Execuções

Cada execução de um fluxo de trabalho é registrada por completo: entrada, resultados, tarefas, chamadas de ferramentas, raciocínio, memória, erros, tempos, tokens e custos. Este capítulo explica as visualizações, os status, a exportação e a importação de traces e como interpretar erros.

## Visão geral {#ueberblick}
<!-- keywords: execuções, runs, histórico, registro, trace -->

Você vê as execuções em dois lugares:

- **No editor**, na *Visão geral da execução* abaixo da tela: a última execução deste fluxo, ao vivo enquanto ela roda.
- Na página **Execuções**: todas as execuções de todos os fluxos, com visualização detalhada.

As execuções são mantidas mesmo que você altere ou exclua o fluxo de trabalho; cada execução guarda o fluxo como ele era no início.

## Acompanhar ao vivo {#live}
<!-- keywords: ao vivo, streaming, acompanhar, visão geral da execução, progresso, tempo real -->

Durante uma execução, a **Visão geral da execução** mostra:

- no topo, o número de agentes, requisições à API, tokens e os custos estimados, atualizados continuamente,
- à esquerda, todos os agentes com o status; um clique mostra os detalhes à direita, e *Resultado geral* mostra o resultado do fluxo,
- à direita, o texto que o agente selecionado está escrevendo, suas chamadas de ferramentas e (se ativado) seu raciocínio.

Na tela, cada agente mostra seu status e, depois da execução, também tokens e custos. As conexões por onde passaram dados ficam destacadas.

## A lista de execuções {#liste}
<!-- keywords: lista, filtro, filtro de status, filtro de fluxo, excluir, origem -->

A página **Execuções** lista as execuções, das mais recentes para as mais antigas, com fluxo de trabalho, status, horário de início, duração, requisições, tokens e custos. Abaixo do nome do fluxo aparece a entrada ou a mensagem de erro.

- **Filtros:** por fluxo de trabalho, por status e por origem (*Execuções próprias* ou *Traces importados*).
- **Excluir:** símbolo da lixeira; execuções em andamento não podem ser excluídas.
- **Importar trace:** veja [Importar traces](/docs/ausfuehrungen#trace-import).

A lista é atualizada a cada cinco segundos.

## A visualização detalhada {#details}
<!-- keywords: detalhes, visualização detalhada, linha do tempo, cascata, timeline, abas, resultado, tarefa, raciocínio -->

Um clique em uma execução abre a visualização detalhada:

1. **Números principais:** status com duração total, requisições à API, tokens (divididos em entrada, saída, cache e raciocínio) e custos estimados.
2. **Resumo da execução:** quantas etapas deram certo e quantas foram ignoradas, que caminho as decisões tomaram, como as aprovações foram decididas, quais ferramentas foram chamadas e quantas vezes (com erros) e em qual etapa a execução falhou, com *Ir para a etapa*. Ele é montado só com os dados salvos da execução, sem chamar nenhum modelo; o que a execução não registrou aparece como *não registrado*.
3. **Entrada e resultado** do fluxo lado a lado.
4. **Linha do tempo:** uma barra de tempo por agente, na ordem em que começaram. Cada barra mostra quando o agente rodou; barras sobrepostas rodaram em paralelo. Ao lado aparecem a duração, os tokens e o número de chamadas de ferramentas.
5. **Detalhes do agente selecionado:** duração, horário de início e fim, tokens, requisições e custos, um eventual erro, o resultado do controle de qualidade e as abas:

| Aba | Conteúdo |
|---|---|
| **Resultado** | A saída do agente, como Markdown ou JSON formatado. |
| **Tarefa** | A tarefa como chegou ao agente depois de substituir os marcadores. Ideal para encontrar problemas no fluxo de dados. |
| **Ferramentas** | Cada chamada de ferramenta com entrada, resultado, momento, duração e sucesso. |
| **Raciocínio** | As reflexões do modelo (só se *Mostrar raciocínio* estava ativo). |
| **Memória** | As anotações de um agente com memória *Por execução*. |

**Abrir no editor** leva ao fluxo de trabalho; **Cancelar** interrompe uma execução em andamento.

A aba **Contexto** mostra o que o agente recebeu nesta execução: prompt do sistema, tarefa com as entradas destacadas, mensagens de exemplo, ferramentas, conhecimento, memória, formato de saída e verificação de qualidade, sempre com a configuração do momento do início. Credenciais nunca são exibidas.

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
| **Cancelado** | Interrompido com *Cancelar*, rejeitado, ou um trace exportado antes de estar completo. |

Uma execução com falha ou cancelada pode ser [continuada](/docs/verzweigungen#fortsetzen). Execuções de agendamentos, lotes, séries de testes e subfluxos mostram sua origem na lista e nos detalhes.

## O resultado de uma execução {#ergebnis}
<!-- keywords: resultado, output, resultado geral, saída do fluxo, destino -->

- Se houver **nós de resultado**, o conteúdo deles é o resultado. Um nó de resultado com um antecessor assume a saída dele; com vários antecessores, um objeto com uma entrada por antecessor.
- Se **não** houver nó de resultado, os agentes sem sucessor valem como resultado.
- Com vários nós de resultado (ou últimos agentes), o resultado é um objeto com uma entrada por nó, com o nome do nó.

## Cancelar execuções {#abbrechen}
<!-- keywords: cancelar, parar, cancel, encerrar -->

**Cancelar** (na visão geral da execução ou na visualização detalhada) interrompe a execução. Agentes em andamento param no próximo passo (próximo trecho de texto, próxima solicitação ou próxima chamada de ferramenta); agentes que ainda não começaram não são mais executados. Os tokens usados até ali são cobrados e mostrados.

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

Os erros aparecem na execução junto à execução (resumo "Falharam: …") e junto ao agente afetado (mensagem vermelha). A mensagem aparece no idioma da interface e geralmente indica o tipo de erro. Em **Detalhes técnicos** fica o texto original do servidor ou da API, por exemplo para repassá-lo em um relatório de erro.

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
