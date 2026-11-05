# Ramificações e aprovações

Um fluxo de trabalho pode ser mais do que uma cadeia fixa de agentes: uma **decisão** escolhe um caminho por regras fixas, uma **aprovação** segura a execução até que uma pessoa aprove ou rejeite, e um **subfluxo** executa outro fluxo como uma única etapa. Além disso, há **formulários de entrada** para entradas estruturadas e a opção de **continuar** execuções que falharam. Tudo roda no mesmo motor que qualquer outro fluxo de trabalho.

## Decisões {#entscheidung}
<!-- keywords: decisão, ramificação, condição, if, roteador, desvio, regra, roteamento -->

Uma **decisão** (paleta, grupo *Controlar o fluxo*) verifica um resultado com regras fixas e abre as ramificações correspondentes. Ela **não faz nenhuma requisição à IA** e não custa nada; o resultado sempre pode ser rastreado.

- Cada regra é uma **ramificação** com sua própria saída à direita do nó. Sempre existe também a ramificação **Senão**, usada quando nenhuma regra é atendida.
- Arraste as conexões a partir do ponto de cada ramificação até o próximo agente. Não é possível conectar a partir do próprio nó; nesse caso o editor pede que você escolha uma ramificação.
- **Resultado verificado:** vazio significa o resultado que chega pela conexão de entrada. Se chegarem vários, escolha um. Os valores de um [formulário de entrada](/docs/verzweigungen#eingabeformular) também podem ser verificados.
- Agentes em ramificações não escolhidas são **ignorados**. Isso não é um erro; a execução ainda pode terminar como *Concluído*.

Na execução, a decisão mostra quais regras foram atendidas, qual valor foi verificado e, se for o caso, por que *Senão* foi escolhido.

## Regras {#regeln}
<!-- keywords: regra, operador, comparação, igual, contém, maior, menor, vazio, campo, json, modo -->

Uma regra compara um **campo** do resultado com um **valor**. O campo é um caminho em uma saída estruturada, por exemplo `category` ou `customer.tier`; vazio significa o resultado inteiro. Um texto que contém JSON (também em um bloco de código) é lido como dados.

| Comparação | Significado |
|---|---|
| é igual a, é diferente de | texto, número ou sim/não; maiúsculas e minúsculas só se você pedir |
| contém, não contém, começa com, termina com | texto |
| maior que, maior ou igual a, menor que, menor ou igual a | números ou datas (AAAA-MM-DD) |
| é verdadeiro, é falso | sim/não (também "sim", "yes", "true", "1") |
| é um de, não é nenhum de | uma lista, valores separados por vírgulas |
| está vazio, não está vazio | valores ausentes ou vazios, ou listas vazias |

- **Modo:** *Primeira regra atendida* abre exatamente uma ramificação (a ordem importa). *Todas as regras atendidas* abre cada ramificação atendida; elas então rodam em paralelo.
- **Dados inválidos:** se o campo estiver ausente ou o tipo não servir (por exemplo "maior que" sobre um texto), a decisão escolhe a ramificação *Senão* ou falha, conforme a configuração.

Para que as regras funcionem de forma confiável, dê ao agente anterior uma [saída estruturada](/docs/agenten#ausgabeformat) com campos fixos.

## Unir ramificações {#zusammenfuehren}
<!-- keywords: unir, merge, juntar ramificações, ignorado, bloqueado -->

Um nó espera até que todos os seus antecessores tenham terminado. Ele **roda** assim que pelo menos uma conexão de entrada entrega dados, é **ignorado** quando nenhuma entrega, e fica **bloqueado** quando um antecessor falhou.

Por isso, unir ramificações não exige nenhuma configuração: um agente atrás das duas ramificações de uma decisão roda com o que chegar. O marcador de uma ramificação que não rodou vale "-". A [verificação antes de iniciar](/docs/workflows#pruefung) aponta esses pontos.

Decisões e aprovações repassam os dados: um agente atrás delas recebe os resultados que chegaram ali, com os nomes dos agentes que os produziram.

## Laços {#schleifen}
<!-- keywords: laço, loop, repetir, rodada, iteração, laço de qualidade, revisar, feedback, limite -->

Um **laço** roda etapas de novo até um resultado servir, por exemplo *Rascunho → Revisão → Decisão*: se a revisão não passar, a execução volta ao rascunho.

- **Criar:** arraste uma conexão de uma **ramificação** de uma decisão ou aprovação de volta para uma etapa anterior. O Nodestro a cria como laço (tracejada, com “↻ máx. 3×”) e a abre no inspetor. Não é possível voltar a partir de um agente: cada rodada termina com uma decisão ou aprovação.
- **Limite:** *Máximo de rodadas* (de 2 a 20) inclui a primeira execução. Cada rodada consome tokens de novo; o [orçamento](/docs/workflows#budget) vale para a execução inteira.
- **Quando o limite for atingido:** a execução termina como falha (“O laço … rodou … vezes sem atingir seu objetivo”) ou segue as outras ramificações da decisão. Se nenhum for seguido, as etapas seguintes são ignoradas.
- **Marcadores:** na tarefa de uma etapa do laço, `{{iteration}}` é a rodada (a partir de 1), `{{previous}}` o próprio resultado da rodada anterior e `{{feedback}}` o que voltou pelo laço (por exemplo, a justificativa da revisão ou o comentário de uma aprovação rejeitada). Na primeira rodada, ambos valem “-”.
- **Aprovações em laços:** uma aprovação rejeitada pode voltar para uma revisão pela ramificação *Rejeitado*; a rodada seguinte espera de novo uma decisão.

Durante uma execução, cada etapa mostra sua **rodada**; nos detalhes, você escolhe entre os resultados de todas as rodadas. Laços podem ficar um dentro do outro, mas não se sobrepor. Ao [continuar](#fortsetzen) uma execução com falha, um laço sempre roda de novo por inteiro.

## Aprovações {#freigabe}
<!-- keywords: aprovação, liberação, human in the loop, revisar, rejeitar, comentário, pausa -->

Uma **aprovação** segura a execução até que uma pessoa **aprove** ou **rejeite** os resultados. Nada é aprovado automaticamente, nem em agendamentos, execuções em lote ou séries de testes.

- **Orientação para quem revisa:** no que prestar atenção.
- **Resultados exibidos:** quais resultados a pessoa vê; sem seleção, tudo o que chega.
- **Comentário:** opcional ou obrigatório ao rejeitar. Agentes posteriores o leem com o nome da aprovação; nós de resultado, arquivos de resultado e decisões não o recebem. Ele fica salvo com a aprovação na execução.
- **Ao rejeitar:** seguir a ramificação **Rejeitado** ou encerrar a execução. Se nada estiver conectado a *Rejeitado*, esse caminho simplesmente termina.

Enquanto espera, a execução fica com o status **Pausado** e a aprovação **Aguardando aprovação**. Você pode decidir na visão geral da execução no editor, na visão detalhada da execução ou na página **Aprovações**. Depois, a execução continua de onde parou. Aprovações abertas sobrevivem a um reinício do Nodestro.

## A página Aprovações {#freigaben-seite}
<!-- keywords: aprovações, aprovações abertas, fila, decidir, navegação, contador -->

A página **Aprovações** (navegação, grupo *Executar e revisar*) lista todas as aprovações abertas, da mais antiga para a mais nova, com fluxo de trabalho, origem (manual, agendamento, lote, série de testes) e tempo de espera. O número ao lado do item de menu mostra quantas estão esperando.

Cada cartão mostra a orientação, os resultados a revisar (resultados estruturados como campos com rótulo, o JSON a um clique), um campo de comentário e os botões *Aprovar* e *Rejeitar*; os botões continuam visíveis mesmo com resultados longos. Aprovações dentro de subfluxos também aparecem aqui, com o caminho até a execução principal. Cartões de [chamadas de ferramentas](/docs/verzweigungen#tool-freigabe) indicam o fluxo de trabalho e a etapa ("*fluxo* · etapa *nome*").

Execuções que aguardam uma [decisão de orçamento](/docs/workflows#budget-freigabe) aparecem no topo em uma seção própria **Decisões de orçamento**, com um link para a execução.

## Aprovar chamadas de ferramentas {#tool-freigabe}
<!-- keywords: aprovação de ferramenta, chamada de ferramenta, por chamada, aprovar chamadas de ferramentas, não ativado, regras para chamadas de ferramentas -->

Aprovações de **chamadas individuais de ferramentas** não estão ativadas nesta versão. As ferramentas que um agente pode usar rodam sem perguntar antes de cada chamada. Na página **Aprovações**, *Regras para chamadas de ferramentas* mostra esse estado.

Para que uma pessoa confira os resultados antes de a execução continuar, use uma [aprovação](/docs/verzweigungen#freigabe). Para limitar o que um agente pode fazer, atribua a ele só as ferramentas de que precisa (veja [Atribuir ferramentas](/docs/agenten#tools)).

## Subfluxos {#unterworkflow}
<!-- keywords: subworkflow, sub-workflow, aninhar, reutilizar, bloco, versão, execução filha -->

Um **subfluxo** executa outro fluxo de trabalho salvo como uma única etapa. O resultado chega como o de um agente.

- **Versão:** *Versão mais recente* usa o estado atual; uma versão fixa não muda quando o outro fluxo é editado depois. A verificação avisa quando existe uma versão mais nova.
- **Entrada:** o que o subfluxo recebe como entrada; `{{input}}` é o que chega aqui.
- **Valores para o formulário de entrada dele:** texto ou marcadores como `{{form.cliente}}` ou `{{Análise}}`. A verificação avisa sobre campos obrigatórios sem valor.
- O subfluxo roda como uma **execução própria e vinculada**; um link nos detalhes leva até ela. Custos e tokens contam uma única vez, no orçamento da execução principal. Se o subfluxo tiver orçamento próprio, esse limite mais estreito também vale.
- Um fluxo não pode chamar a si mesmo, nem indiretamente; mais de cinco níveis não são permitidos.
- Se o subfluxo espera uma aprovação, a execução principal espera junto.

## Equipes {#teams}
<!-- keywords: equipe, contrato de saída, contrato, capacidades, resultado estruturado, run.output_contract -->

Uma **equipe** é um fluxo que, executado como subfluxo, promete um resultado fixo. Duas configurações tornam um fluxo uma equipe:

- **Contrato de saída** no nó de resultado: os campos (nome, tipo, obrigatório) que o fluxo entrega, como no resultado estruturado de um agente. No fim de uma execução, o resultado é verificado. Ele deve ser um objeto (ou texto JSON de um objeto) com cada campo obrigatório no tipo certo. Os outros campos são omitidos. Se o resultado não se encaixar, o nó de resultado falha e a execução com ele; um fluxo superior nunca recebe um resultado não verificado.
- **Capacidades como equipe** nas configurações do fluxo: palavras-chave curtas sobre o que o fluxo faz (no máximo 20). Elas acompanham o fluxo (versões, exportação) e depois ajudam a encontrar uma equipe adequada. Não concedem permissões.

Em um fluxo superior, um fluxo com contrato de saída entrega um objeto com exatamente esses campos. Por isso, uma decisão depois dele pode verificar um campo diretamente, por exemplo `score` maior ou igual a 5.

A verificação antes de iniciar avisa quando um agente antes do resultado responde em texto (então só uma resposta JSON ajuda) ou quando nenhum agente entrega um campo obrigatório. Nomes de campo inválidos ou repetidos impedem o início.

Fluxos com contrato de saída ou capacidades aparecem na paleta em **Equipes** e podem ser adicionados diretamente como subfluxo. O inspetor de um subfluxo mostra o que a equipe entrega. Um **clique duplo** no nó abre a equipe no editor; a trilha de navegação no topo leva de volta ao fluxo superior.

Uma equipe pode ser testada sozinha: crie uma [série de testes](/docs/automatisierung#testreihen) para o fluxo. Suas verificações podem usar os campos do contrato de saída, por exemplo `score` maior ou igual a 5.

## Orquestrador {#orchestrator}
<!-- keywords: orquestrador, orquestração, delegar, grupo, equipes, decisões, run.orchestration_limit -->

Um **orquestrador** deixa um modelo de IA decidir qual equipe recebe qual parte da tarefa. Ele toma uma decisão após a outra: **delegar** uma tarefa a uma equipe ou **concluir** com uma resposta. A resposta é o resultado do nó.

O inspetor de um orquestrador começa com uma frase que resume como ele trabalha ("Como este orquestrador trabalha: …") e agrupa as configurações em quatro áreas expansíveis; cada uma mostra no cabeçalho um resumo e eventuais problemas:

- **Pool de equipes:** os **Fluxos de trabalho escolhidos** são os fluxos de trabalho salvos entre os quais o modelo pode escolher (no máximo 20). De cada equipe, o modelo vê apenas nome, descrição, capacidades e contrato de saída.
- **Equipes por capacidade** (também no pool de equipes): em vez de escolher cada equipe, você cita capacidades (no máximo 10). Quando uma execução começa, equipes salvas com uma capacidade correspondente entram no grupo (até *No máximo tantas equipes*): primeiro as com mais tags correspondentes, depois pelo nome. Equipes com erros ficam de fora; equipes com etapas de aprovação são incluídas. A seleção fica fixa para essa execução (e para uma versão publicada); os detalhes mostram quais tags cada equipe atendeu. Nada é pontuado nem estimado.
- **Missão:** **Tarefa** e **Instruções** (o que deve ser feito e, opcionalmente, como planejar) e o **Modelo** do orquestrador.
- **Limites:** **Máximo de decisões** (de 1 a 50, padrão 8), **Usos máximos por equipe** e **Equipes ao mesmo tempo**. Sem resposta após a última decisão, a etapa falha.
- **Escalação ativa:** as opções descritas em [Equipes dinâmicas](/docs/verzweigungen#dynamische-teams).

O orquestrador apenas escolhe. Ele não tem ferramentas, não cria agentes, ferramentas nem equipes e não tem permissões próprias. Cada equipe escolhida roda como uma **execução vinculada própria**, com sua parte do orçamento, seus limites e suas aprovações de ferramentas. Decisões não permitidas (uma equipe desconhecida, a mesma tarefa de novo, uma equipe esgotada) não são executadas e são mostradas ao modelo; os detalhes da execução as indicam como *Inválida, não executada*. Mesmo assim contam como decisão.

Os detalhes da execução listam cada decisão com motivo, tarefa, resultado e um link para a execução da equipe. Quando uma equipe para para uma **aprovação** (também em um subfluxo ou abaixo de outro orquestrador), o orquestrador aguarda junto: a execução fica *pausada* e aparece em **Aprovações**. Após a decisão, a mesma execução da equipe continua, também depois de uma reinicialização, e o modelo não é consultado de novo sobre essa delegação. Se uma rejeição encerra a execução da equipe (*Ao rejeitar: encerrar a execução*), esta execução também termina; nenhuma outra equipe pode contornar a rejeição. Cancelar uma execução em espera também cancela suas equipes em espera. Uma equipe não pode chamar de novo o fluxo de trabalho do orquestrador.

**Durante a execução** você pode fazer perguntas ao líder da equipe e dar instruções para a próxima decisão, na aba **Líder da equipe** da visão de detalhes; veja [Conversar com o líder da equipe](/docs/ausfuehrungen#teamleitung). **Direção ao vivo**, na área *Limites*, define quem pode dar instruções.

## Equipes dinâmicas {#dynamische-teams}
<!-- keywords: equipe dinâmica, montar equipe, paralelo, ao mesmo tempo, parâmetros, formulário inicial, modelo, composição da equipe, staffing -->

Na área **Escalação ativa** de um orquestrador (campo *Equipes dinâmicas*) o modelo ganha mais espaço, sempre dentro do pool e dos limites. Tudo começa desligado.

- **Equipes ao mesmo tempo** (1 a 5, na área *Limites*): uma decisão pode passar trabalho a várias equipes diferentes de uma vez, para partes que não dependem umas das outras. Cada equipe recebe seu próprio resultado.
- **Montar a escalação ativa por conta própria:** o orquestrador traz equipes do pool para a sua escalação ativa e as dispensa novamente quando os resultados intermediários indicam. Só equipes da escalação ativa recebem trabalho; *No máximo na escalação ativa* limita o tamanho. A mesma equipe pode trabalhar várias vezes (até *Usos máximos por equipe*). Sem essa opção, o orquestrador escolhe no pool inteiro.
- **Preencher o formulário inicial das equipes:** o orquestrador pode definir os campos do formulário de entrada de uma equipe (nunca arquivos). Os valores são verificados como em um início manual; um campo desconhecido ou um valor inválido é recusado e mostrado ao modelo.

O pool fica fixo no início da execução, nas versões daquele momento. Nunca surgem novas equipes, agentes ou ferramentas, e as aprovações, o orçamento e os limites de cada equipe valem sem mudança.

**O que os detalhes da execução mostram:** qual orquestrador trabalha com qual modelo, quantas decisões foram usadas, o custo das decisões e o total (custos desconhecidos aparecem como *não totalmente conhecido*, nunca como 0), o pool com versões, a **Escalação ativa ao longo do tempo**, as equipes em espera e cada decisão com motivo, tarefa, valores e o resultado de cada equipe: *Concluído*, *Aguardando aprovação*, *Falhou*, *Rejeitado*, *Cancelado* ou *Expirado*. Só as decisões registradas são mostradas, nenhum raciocínio do modelo.

**Salvar a composição da equipe como modelo:** uma escalação ativa existe só durante a execução. Depois do fim, este botão salva um **novo fluxo de trabalho** com o mesmo orquestrador, seu formulário inicial, seus limites e exatamente as equipes que trabalharam, nas versões da execução. Nada é salvo sem este clique.

## Formulários de entrada {#eingabeformular}
<!-- keywords: formulário, formulário de entrada, campos, tipo, obrigatório, valor padrão, opção, data, número -->

Em vez de uma caixa de texto livre, o nó **Início** pode ter um **formulário de entrada**. A caixa de diálogo de início pede então exatamente esses campos e os verifica antes de a execução começar.

| Tipo | Entrada |
|---|---|
| Texto, Texto longo | texto livre |
| Número | um número, também com vírgula decimal |
| Data | AAAA-MM-DD |
| Sim/Não | escolha entre sim e não |
| Opção | um dos valores definidos |
| Arquivo | um ou mais arquivos do [Conhecimento](/docs/wissen#start-dateien) |

Cada campo tem um **rótulo**, um **nome técnico** (só letras, dígitos e _) e, opcionalmente, um valor padrão, uma explicação e *Obrigatório*. Os agentes leem valores individuais com `{{form.nome}}`; `{{run.input}}` contém todos os valores como linhas "Rótulo: valor", seguidas da entrada adicional opcional. As decisões comparam os valores com o tipo correto.

[Agendamentos](/docs/automatisierung#zeitplaene), [execuções em lote](/docs/automatisierung#stapel) e [séries de testes](/docs/automatisierung#testreihen) também usam formulários. Fluxos sem formulário se comportam como antes.

## Continuar execuções que falharam {#fortsetzen}
<!-- keywords: continuar, retomar, resume, tentar de novo, reiniciar, falhou, cancelada -->

Uma execução que falhou ou foi cancelada pode ser **continuada** (botão *Continuar* na visão detalhada). Isso cria uma **nova execução vinculada**; a antiga permanece inalterada.

- Antes, o Nodestro mostra para cada etapa se o resultado será **reaproveitado** ou **executado de novo**, e por quê.
- Um resultado só é reaproveitado se a etapa teve sucesso, nem ela nem suas ferramentas, conexões, entrada ou arquivos mudaram, e todos os antecessores também são reaproveitados. Etapas alteradas e tudo o que vem depois rodam de novo.
- Resultados reaproveitados não custam nada na nova execução; o custo fica na execução antiga e não é contado duas vezes em [Uso](/docs/nutzung).
- Decisões de aprovação de etapas reaproveitadas continuam valendo e são marcadas como reaproveitadas; ninguém é consultado duas vezes.
- Se etapas que rodam de novo já tinham chamado **ferramentas próprias** que podem agir fora do Nodestro (como enviar uma mensagem), você precisa confirmar isso explicitamente.

Se uma execução foi interrompida porque o Nodestro parou enquanto ela rodava, a visualização detalhada dela nomeia as etapas não concluídas e oferece **Continuar** direto no aviso; essas etapas são executadas de novo com o motivo *Foi interrompida*.

Se nada puder ser reaproveitado com segurança, o Nodestro oferece um reinício completo. Traces importados e execuções isoladas de subfluxos não podem ser continuados; continue a execução principal.
