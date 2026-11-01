# Fluxos de trabalho

Um fluxo de trabalho conecta agentes em uma sequência. Este capítulo explica como criar fluxos de trabalho, conectar nós, como os dados passam entre os agentes e como iniciar uma execução.

## Criar e gerenciar fluxos de trabalho {#anlegen}
<!-- keywords: novo fluxo de trabalho, criar, excluir, duplicar, cópia, visão geral, workflow, continuar, execuções recentes, equipes, selo equipe, sem modelo de ia, galeria, comece aqui, nível -->

A página **Fluxos de trabalho** mostra todos os fluxos como cartões com o número de agentes, a última alteração e o status da última execução.

A página oferece três formas equivalentes de começar: **Criar com IA** abre a caixa de diálogo de um novo fluxo de trabalho com o [Arquiteto IA](/docs/ki-architekt#neu-erstellen), **Começar com um exemplo** abre a [galeria de exemplos](/docs/beispiele) e **Montar você mesmo** abre a mesma caixa de diálogo para um fluxo vazio. Enquanto não houver nenhum fluxo, elas aparecem como blocos grandes; depois, como uma linha estreita **Começar um novo** acima da lista.

**Sem modelo de IA:** se ainda não houver um provedor de IA configurado para o modelo padrão, um aviso acima dos blocos grandes explica que os fluxos só rodam com um modelo de IA conectado (uma chave de API ou um servidor de modelos local como o Ollama), com o link **Configurar nas configurações**. O exemplo passa então para o primeiro lugar, porque uma cópia não precisa de modelo, e *Criar com IA* mostra *Precisa de uma conexão com um modelo de IA*. A caixa de diálogo também avisa se você escolher *Criar com IA* nela: o Arquiteto IA trabalha com o seu modelo padrão.

- **Novo fluxo de trabalho:** digite um nome e uma descrição opcional. O novo fluxo já contém *Início → Agente → Resultado*.
- **Criar com IA:** no mesmo diálogo você descreve o que quer e o [arquiteto de fluxos](/docs/ki-architekt#neu-erstellen) projeta o fluxo para você revisar.
- **Abrir:** clique no cartão.
- **Duplicar:** símbolo de cópia no cartão. A cópia se chama "… (cópia)"; as execuções não são copiadas.
- **Excluir:** símbolo da lixeira. As execuções anteriores continuam disponíveis em *Execuções*.

**Continuar:** assim que existem fluxos e execuções, a área **Continuar** aparece acima da lista: quantas aprovações aguardam você (um clique abre a página *Aprovações*), as **Execuções recentes** com o status e, com mais de seis fluxos, os **Editados recentemente**. Partes sem conteúdo são omitidas; se não houver nada, a área inteira some.

**Equipes:** fluxos com capacidades ou com um contrato de saída levam o selo **Equipe**: um [orquestrador](/docs/verzweigungen#orchestrator) pode delegar trabalho a eles. Eles ficam abaixo dos seus próprios fluxos, na área expansível **Equipes**. Cópias de exemplos orquestrados trazem suas equipes junto.

**Galeria de exemplos:** abaixo da lista ficam os exemplos recomendados, o mais simples primeiro e marcado com **Comece aqui** enquanto você não tiver nenhum fluxo. Depois, a galeria é uma área recolhida que lembra se você a abriu. Na galeria completa você busca por nome, área, bloco ou nível e filtra por categoria e por **Nível**; busca, filtros e uma prévia aberta fazem parte do endereço, então *Voltar* leva à mesma seleção. Em **Do que você precisa**, a prévia mostra qual provedor de IA e quais modelos a cópia usa (e se ele está configurado), se uma execução para em uma aprovação, quais arquivos de conhecimento e de exemplo vêm junto e se é preciso uma conexão com outro serviço. Mais detalhes em [Fluxos de trabalho de exemplo](/docs/beispiele).

## Favoritos e tags {#favoriten-tags}
<!-- keywords: favorito, favoritos, estrela, tag, tags, etiqueta, filtrar, organizar -->

Fluxos de trabalho, modelos de agentes e ferramentas podem ser marcados como favoritos com a **estrela**. Os favoritos ficam sempre no topo das listas. O **ícone de etiqueta** adiciona tags como “Cliente A” ou “Rascunho”; tags existentes são sugeridas.

Acima das listas você filtra por **Só favoritos** e por uma tag. Favoritos e tags são salvos separadamente dos objetos: não alteram fluxos de trabalho, agentes nem ferramentas, e também aparecem na [busca](/docs/start#suche). Pastas não existem, de propósito.

## O editor {#editor}
<!-- keywords: tela, canvas, paleta, blocos, inspetor, visão geral da execução, zoom, minimapa, barra de título, mais ações, equipes na paleta -->

O editor tem quatro áreas:

1. **Barra de título:** nome, *Arquiteto IA*, *API e exportação*, o menu **Mais ações** (*Versões* e *Exportar como arquivo*), *Salvar* e *Iniciar fluxo de trabalho*. Com alterações não salvas, aparece também *Descartar*. Em janelas estreitas, as ações secundárias aparecem só como ícones.
2. **Tela:** os nós e as conexões. No canto superior esquerdo aparece se há alterações não salvas e quantos agentes e conexões o fluxo tem. No canto inferior esquerdo ficam o zoom, *Mostrar tudo*, *Organizar automaticamente* e também *Desfazer* e *Refazer* (bloqueados quando não há nada a desfazer ou refazer). No canto superior direito, um mapa geral mostra o fluxo inteiro. Um fluxo grande abre em tamanho legível no seu nó de início, em vez de ser reduzido para caber na tela.
3. **Blocos (paleta):** *Agente* (vazio), *Descrever um agente* (a IA cria a configuração), *Início*, *Resultado*, até oito modelos da biblioteca de agentes e, abaixo, as **Equipes**, que você pode buscar e recolher; cada equipe mostra suas capacidades. Arraste um bloco para a tela ou clique nele. Um novo nó aparece na parte visível da tela e já fica selecionado.
4. **Inspetor (à direita):** sem seleção, mostra a verificação e as configurações do fluxo de trabalho; caso contrário, a configuração do nó selecionado e, com vários nós selecionados, as ações em comum (veja [Controles e atalhos de teclado](/docs/workflows#bedienung)).

Abaixo da tela fica a **Visão geral da execução** com a última execução deste fluxo.

Os blocos, o inspetor (com o título *Propriedades*) e a visão geral da execução são painéis. O botão no cabeçalho de um painel o oculta ou mostra; um painel oculto deixa uma barra estreita, e os blocos continuam disponíveis como ícones. O divisor entre um painel e a tela muda seu tamanho: arraste-o, ou selecione-o com *Tab* e use as teclas de seta (com *Shift* em passos maiores). Um clique duplo no divisor restaura o tamanho padrão. Enquanto o inspetor está oculto, sua barra mostra o nó selecionado; um clique duplo em um nó mostra suas propriedades. O Nodestro lembra o layout neste navegador para todos os fluxos de trabalho. Ele não faz parte do fluxo: alterá-lo nunca cria alterações não salvas nem uma etapa de desfazer, e um fluxo em execução continua rodando.

## Tipos de nós {#knoten}
<!-- keywords: início, resultado, saída, agente, nó, entrada -->

| Nó | Função | Entradas | Saídas |
|---|---|---|---|
| **Início** | Fornece a entrada que você digita ao iniciar. Opcionalmente com uma *Sugestão de entrada* ou um [formulário de entrada](/docs/verzweigungen#eingabeformular). | nenhuma | quantas quiser |
| **Agente** | Chama seu modelo de IA com sua configuração e retorna um resultado (texto ou JSON). | quantas quiser | quantas quiser |
| **Decisão** | Escolhe uma ou mais ramificações por regras fixas, sem requisição à IA. | uma ou mais | uma saída por ramificação |
| **Aprovação** | Segura a execução até que uma pessoa aprove ou rejeite. | quantas quiser | *Aprovado*, *Rejeitado* |
| **Subworkflow** | Executa outro fluxo de trabalho salvo como uma única etapa. | quantas quiser | quantas quiser |
| **Resultado** | Reúne os resultados dos agentes conectados como saída do fluxo de trabalho, se quiser também como arquivos. | quantas quiser | nenhuma |

Os nós de início e de resultado são opcionais: agentes sem antecessor recebem automaticamente a entrada da execução e, sem nó de resultado, a saída dos últimos agentes vale como resultado (veja [O resultado de uma execução](/docs/ausfuehrungen#ergebnis)). Decisão, aprovação e subfluxo ficam na paleta, em *Controlar o fluxo*; veja [Ramificações e aprovações](/docs/verzweigungen).

Cada nó tem um nome único. Se você criar um segundo agente com o mesmo nome, o Nodestro acrescenta um número ("Agente 2"). O nome de um agente também é o seu marcador nas tarefas.

## Conectar agentes {#verbinden}
<!-- keywords: conexão, aresta, edge, porta, arrastar, círculo, ciclo, excluir -->

Arraste do **ponto direito** (saída) de um nó até o **ponto esquerdo** (entrada) de outro. Uma conexão significa: o nó de destino espera o nó de origem terminar e recebe o resultado dele.

O Nodestro impede conexões inválidas e explica o motivo:

- Um nó não pode ser conectado a si mesmo.
- O nó de início não tem entrada e o nó de resultado não tem saída.
- A mesma conexão só pode existir uma vez.
- **Ciclos só como laço:** os dados seguem em uma direção. Uma conexão de volta para um antecessor só é possível a partir de uma ramificação de uma decisão ou aprovação e vira um [laço](/docs/verzweigungen#schleifen) com limite; qualquer outra é recusada.

Para excluir uma conexão, selecione-a e pressione **Delete** ou **Backspace**. Durante uma execução, as conexões por onde os dados estão passando se acendem.

## Fluxo de dados entre agentes {#datenfluss}
<!-- keywords: fluxo de dados, entrada, input, repasse, antecessor, sucessor, json, várias entradas -->

É assim que um agente recebe sua tarefa:

1. O Nodestro pega a **tarefa** do agente (campo *Tarefa* no inspetor, padrão: `{{input}}`).
2. Os marcadores são substituídos pelos resultados dos **antecessores diretos** e pela entrada da execução.
3. Resultados de antecessores que não aparecem na tarefa são acrescentados sob o título **`# Eingaben`** ("entradas"), cada um com o nome do antecessor como subtítulo. Assim nada se perde em silêncio.
4. Se depois disso a tarefa estiver vazia, o agente recebe a entrada da execução.

**O que é repassado:**

- Um resultado de texto é repassado como texto.
- Um resultado estruturado é repassado como JSON formatado.
- O nó de início repassa a entrada da execução.
- Agentes sem antecessor recebem a entrada da execução.

Um agente só vê os resultados de seus antecessores **diretos**, não os de nós mais atrás. Se ele precisar da entrada original, use `{{run.input}}`.

## Marcadores nas tarefas {#platzhalter}
<!-- keywords: marcadores, placeholders, modelo, {{input}}, {{run.input}}, variável, tarefa -->

| Marcador | É substituído por |
|---|---|
| `{{input}}` | o resultado do único antecessor; com vários antecessores, todos os resultados, cada um como seção `## Nome`; sem antecessor, a entrada da execução. Logo após um nó inicial com formulário preenchido, são apenas os valores do formulário; use `{{run.input}}` para os valores do formulário e o texto adicional |
| `{{run.input}}` (ou `{{workflow.input}}`) | a entrada ao iniciar o fluxo de trabalho, em qualquer ponto do fluxo |
| `{{Nome do antecessor}}` | o resultado exatamente desse antecessor direto |

Maiúsculas e minúsculas não importam nos marcadores. No inspetor, abaixo do campo de tarefa, aparecem botões para todos os antecessores diretos; um clique insere o marcador correspondente.

**Exemplo:** um agente redator tem os antecessores *Público* e *Estrutura*:

```
Escreva o artigo sobre "{{run.input}}".

Público:
{{Público}}

Estrutura:
{{Estrutura}}
```

> **Erro comum:** se você renomear um antecessor, os marcadores antigos deixam de corresponder. Um marcador desconhecido fica no texto como está, e o resultado do antecessor é acrescentado sob `# Eingaben`. Depois de renomear, confira as tarefas dos sucessores.

## Prévia da entrada {#eingabe-vorschau}
<!-- keywords: prévia, entrada, contexto, ver prompt, verificar marcadores, o que o agente recebe -->

A seção **Prévia da entrada** no inspetor de um agente mostra o que o agente receberia na próxima execução, sem chamar a API:

- o **prompt do sistema** e a **tarefa** com os marcadores preenchidos. Cada trecho inserido fica destacado; passando o mouse, você vê de onde ele vem.
- quais **entradas** estão disponíveis. Os resultados dos predecessores vêm da última execução deste fluxo de trabalho. Se um predecessor ainda não tem resultado, aparece no lugar dele um aviso em amarelo em vez de um valor inventado.
- marcadores que não correspondem a nenhum predecessor conectado.
- as demais partes do contexto: mensagens de exemplo, ferramentas, conhecimento, memória, formato de saída e verificação de qualidade.

Credenciais nas opções da requisição nunca são exibidas. Para uma execução concluída, a aba **Contexto** nos [detalhes](/docs/ausfuehrungen#details) mostra o que o agente recebeu naquele momento.

## Execução paralela {#parallel}
<!-- keywords: paralelo, simultâneo, ramificação, juntar, ordem -->

Cada nó começa assim que **todos** os seus antecessores terminam. Nós que não dependem uns dos outros rodam ao mesmo tempo. No exemplo *Artigo de blog*, *Público* e *Estrutura* trabalham em paralelo; o *Redator* só começa quando os dois terminam.

Ramos paralelos encurtam o tempo de execução, mas custam a mesma quantidade de tokens que agentes executados um após o outro.

**Erros em um ramo:** se um agente falhar, todos os nós que dependem dele são **ignorados**. Ramos independentes continuam. A execução então termina com o status *Erro*.

## Configurações do fluxo de trabalho {#einstellungen}
<!-- keywords: nome, descrição, inspetor, configurações do fluxo de trabalho -->

Clique em um ponto vazio da tela para ver no inspetor as configurações do fluxo de trabalho: **Nome**, **Descrição**, **Orçamento por execução** e os **limites** de etapas simultâneas e de duração. Abaixo aparecem os problemas que impedem o início e um resumo rápido dos controles.

## Orçamento por execução {#budget}
<!-- keywords: orçamento, budget, limite de custo, limite, usd, dólar, interrupção, budgetexceedederror, reserva, sem máximo rígido -->

O orçamento limita os **custos estimados** de uma execução em dólares americanos, somando todos os agentes e controles de qualidade.

- Se o fluxo não tiver orçamento próprio, vale o **orçamento padrão** das configurações (inicialmente 2 USD).
- Se também não houver nada lá, a execução não tem limite.
- **Antes** de cada solicitação, seu custo máximo possível é reservado (tamanho da entrada e a saída máxima que ela pode gerar, na tarifa mais cara). Depois da resposta, a reserva é substituída pelo custo real. Assim, agentes executando ao mesmo tempo não conseguem ultrapassar o orçamento juntos: se o restante não bastar, uma solicitação espera até que outra termine.
- Se o orçamento não bastar nem sem outras solicitações, a solicitação não é enviada e o agente para (erro `BudgetExceededError`).
- Se uma única solicitação for maior que o orçamento inteiro, ela é executada sozinha no modo de preço padrão; no modo estrito, é recusada.

Custos desconhecidos **não** contam como 0. Se o custo máximo de uma solicitação não puder ser determinado com antecedência (sem preço conhecido, imagens, arquivos ou ferramentas do provedor, como a pesquisa na web), no modo padrão ela é executada sem limite superior. A execução mostra então, ao lado dos custos, o aviso **Sem máximo rígido** com o número dessas solicitações. No modo de preço estrito, solicitações sem preço conhecido não são enviadas.

## Limites por execução {#limits}
<!-- keywords: limites, ao mesmo tempo, paralelo, limite de tempo, duração, timeout, run.time_limit, etapas, run.step_limit -->

Três limites opcionais valem para cada execução do fluxo. Vazio significa sem limite.

- **Máximo de etapas executando ao mesmo tempo** (de 1 a 32): se houver mais etapas prontas, as demais esperam por uma vaga livre. Com 1, todas as etapas são executadas uma após a outra.
- **Limite de tempo por execução** (em minutos, no máximo 7 dias): só conta o tempo de execução ativo. A espera por uma aprovação não conta. Quando o tempo acaba, nenhuma outra etapa é iniciada, os agentes em andamento são solicitados a parar e a execução falha com um erro que indica o limite de tempo.
- **Máximo de etapas por execução** (de 1 a 10.000): cada nó executado conta uma vez, inclusive início e resultado, e cada rodada de um loop conta de novo. Se a próxima etapa fosse uma a mais, ela não é iniciada e a execução falha com um erro que indica o limite. Isso protege contra loops que dão mais rodadas do que o previsto. Uma execução continuada também conta as etapas que reaproveita.

Uma solicitação ao modelo ou uma chamada de ferramenta que já está em andamento ainda é concluída. Por isso, a execução pode ultrapassar o limite de tempo pela duração dessa chamada.

## Verificação antes de iniciar {#pruefung}
<!-- keywords: verificação, validação, problemas, início bloqueado, erro, aviso -->

O Nodestro verifica o fluxo de trabalho a cada alteração (após meio segundo de pausa), sem chamar a API e sem custo:

- **Estrutura:** Há pelo menos um agente? O nó inicial não tem entradas e o nó de resultado não tem saídas? Não há ciclos, conexões duplicadas nem conexões que não levam a lugar nenhum? O nó de resultado tem uma entrada?
- **Agentes:** Cada configuração é verificada com as regras da biblioteca. Nós com erros mostram “1 problema” na área de trabalho, inclusive Início e Resultado; avisos aparecem como “1 aviso”, com cor e ícone próprios.
- **Conexões e marcadores:** marcadores que não correspondem a nenhum predecessor conectado, agentes sem entrada, resultados que não chegam a lugar nenhum e nomes de agentes duplicados.
- **Configurações:** provedores não configurados, arquivos de conhecimento ou de início apagados, modelos sem preço conhecido e orçamento 0.

Os resultados aparecem no topo do inspetor do fluxo de trabalho (clique em um ponto vazio da área de trabalho), separados em **erros** e **avisos**. Um clique em uma mensagem seleciona o agente afetado ou destaca a conexão afetada; conexões com erro aparecem em vermelho tracejado. Quando você seleciona um nó, as mensagens dele aparecem acima das configurações dele. Enquanto um provedor não estiver configurado, os nós não mostram “Pronto”.

Enquanto houver **erros**, **Iniciar fluxo de trabalho** fica bloqueado. O motivo aparece logo ao lado do botão; havendo vários problemas, o primeiro (“3 problemas impedem o início. Primeiro: …”). **Mostrar** seleciona o nó ou a conexão afetada e abre o inspetor; se faltar um provedor de IA, **Abrir configurações** leva direto até lá. O botão bloqueado continua acessível pelo teclado, e leitores de tela leem o motivo. **Avisos** não bloqueiam o início; a caixa de diálogo de início os mostra novamente.

## Iniciar uma execução {#starten}
<!-- keywords: iniciar, executar, run, caixa de diálogo de início, entrada, anexar arquivos, tarefa pré-preenchida, mais arquivos -->

**Iniciar fluxo de trabalho** abre a caixa de diálogo de início:

- **Entrada:** o texto que todos os agentes recebem no início. Ele já vem preenchido com a *Sugestão de entrada* do nó de início. Se o fluxo tiver um [formulário de entrada](/docs/verzweigungen#eingabeformular), o campo fica abaixo dos campos do formulário; se estiver pré-preenchido, ele se chama **Tarefa (exemplo pré-preenchido)**: troque o exemplo pelo seu próprio pedido.
- **Anexar arquivos (opcional):** arquivos de conhecimento colocados diretamente no contexto dos primeiros agentes, só nesta execução (veja [Anexar arquivos ao iniciar](/docs/wissen#start-dateien)). Se o formulário tiver campos de arquivo próprios, esta área fica recolhida em **Anexar mais arquivos (opcional)**.
- **Orçamento:** a caixa de diálogo mostra qual orçamento vale.

Com **Iniciar**, o Nodestro salva o fluxo de trabalho e começa a execução. A execução usa o estado do fluxo de trabalho no momento do início; mudanças posteriores só valem na próxima execução. Se o provedor de um modelo não estiver configurado, o diálogo avisa. Se a execução ainda não puder começar, o motivo aparece abaixo de **Iniciar**: envios de arquivos ainda em andamento, ou erros que precisam ser corrigidos antes (*Primeiro corrija os problemas acima.*).

## Controles e atalhos de teclado {#bedienung}
<!-- keywords: atalhos de teclado, shortcuts, ctrl+s, ctrl+z, desfazer, refazer, delete, duplicar, organizar automaticamente -->

<!-- widget: shortcuts -->

Mais dicas:

- **Organizar automaticamente** dispõe os nós em colunas conforme sua posição no fluxo de dados.
- **Mostrar tudo** ajusta o zoom para que o fluxo inteiro fique visível.
- **Selecionar vários nós:** Shift-clique ou Ctrl-clique adiciona nós à seleção; Shift e arrastar na tela seleciona com um retângulo. Arrastar move todos os nós selecionados, **Delete** exclui todos, **Ctrl+D** duplica todos. O inspetor oferece então *Duplicar todos*, *Excluir nós* e *Limpar seleção*.
- **Desfazer uma exclusão:** depois de excluir nós, aparece uma mensagem com **Desfazer**.
- **Criar conexões:** enquanto você arrasta, a tela já mostra onde uma conexão não é permitida; se você soltar ali, uma mensagem explica o motivo.
- Se você sair do editor com alterações não salvas, o Nodestro pergunta se deve salvá-las, descartá-las ou **Continuar editando**.
- Desfazer guarda até 80 etapas. Mover um nó é uma etapa, assim como digitar em um campo até você mudar para outro campo ou nó. O nome, a descrição e o orçamento do fluxo também contam. Se você desfizer tudo até o estado salvo, não restam alterações não salvas.

- **Excluir conexões:** clique em uma conexão. Ela fica destacada, e **Delete** ou **Backspace** a remove. Enquanto você digita em um campo de entrada, essas teclas só apagam texto. Excluir uma conexão também pode ser desfeito.
- Em janelas estreitas (menos de 1100 pixels de largura), a barra **Blocos** começa recolhida; depois vale o layout que você escolheu por último.

## Salvar e descartar {#speichern}
<!-- keywords: salvar, descartar, não salvo, descartar alterações, redefinir -->

**Salvar** (ou **Ctrl+S**) guarda o estado atual e cria uma nova [versão](/docs/workflows#versionen). Enquanto houver alterações não salvas, a barra de título mostra **Descartar**.

**Descartar** joga fora todas as alterações não salvas, inclusive o histórico de desfazer/refazer, e recarrega o último estado salvo. O mesmo vale quando você sai do editor e escolhe **Descartar** na caixa de diálogo: na próxima abertura aparece exatamente o fluxo de trabalho salvo.

**Alterado em outro lugar:** antes de salvar, o Nodestro verifica se o fluxo foi salvo em outro lugar nesse meio-tempo, em outra aba ou por outra pessoa. Nesse caso, a caixa de diálogo **Alterado em outro lugar** pergunta o que fazer, em vez de substituir a outra alteração sem avisar:

- **Carregar versão salva:** o editor mostra o estado salvo; suas alterações não salvas aqui se perdem.
- **Manter a minha como cópia:** seu estado vira um novo fluxo "… (minha cópia)", e o estado salvo fica como está.
- **Salvar a minha mesmo assim:** seu estado substitui a outra alteração.
- **Continuar editando:** nada é salvo.

Nada se perde de vez: cada salvamento fica guardado em [Versões](/docs/workflows#versionen).

## Versões {#versionen}
<!-- keywords: versão, versões, histórico, restaurar, voltar, estado anterior -->

Cada salvamento que altera algo é guardado como **versão** numerada com data e hora. **Versões**, no menu **Mais ações** da barra de título, abre o histórico:

- **Salvar como versão** salva as alterações atuais com uma descrição opcional (“antes de refazer a pesquisa”).
- O ícone de lápis adiciona ou altera a descrição de uma versão.
- **Diferenças** mostra o que mudaria em relação ao estado no editor: agentes, conexões, nome e configurações.
- **Restaurar** volta o fluxo de trabalho para essa versão e salva o resultado como **nova versão**. Nenhuma versão é sobrescrita ou excluída. Se houver alterações não salvas, escolha **Salvar primeiro e restaurar** (as alterações viram antes uma versão própria) ou **Restaurar sem salvar**.

As versões são independentes de desfazer/refazer, que vale apenas dentro de uma sessão no editor. As execuções usam sempre o estado do momento do início. Quando um fluxo de trabalho é excluído, suas versões também são. No topo do histórico aparece o **resultado dos testes** da versão salva em cada série de testes do fluxo (como ao [publicar](/docs/api-und-export#veroeffentlichen)).

## Importar e exportar {#import-export}
<!-- keywords: exportar, importar, json, arquivo, compartilhar, backup, .nodestro.json, não é um fluxo de trabalho, arquivo inválido -->

- **Exportar como arquivo** (no editor, em **Mais ações**) salva o fluxo como `<Nome>.nodestro.json`: todos os nós, conexões, posições e configurações dos agentes, além do orçamento.
- **Importar** (na página *Fluxos de trabalho*) carrega esse arquivo como **nova cópia** com um novo ID. Fluxos existentes nunca são sobrescritos. Se o arquivo não tiver nome, o fluxo recebe o nome do arquivo.

O Nodestro verifica o arquivo antes de criar qualquer coisa. Se não for a exportação de um fluxo de trabalho (por exemplo outro arquivo JSON, um arquivo sem etapas ou com conexões quebradas), nada é importado e a mensagem explica o motivo, por exemplo *Este arquivo não é um workflow do Nodestro: ele não tem etapas ("nodes").*

**Não estão incluídos** arquivos de conhecimento, espaços de memória e ferramentas próprias; o arquivo só faz referência aos IDs e nomes deles. Em outro computador eles precisam existir lá; caso contrário, a verificação informa, por exemplo, "Ferramentas desconhecidas".

Exportar um fluxo e exportar um trace são coisas diferentes: um fluxo descreve o processo, um trace descreve uma execução específica com resultados (veja [Importar traces](/docs/ausfuehrungen#trace-import)).

## Exemplos {#beispiele}
<!-- keywords: exemplo, modelo, padrão, pipeline, receita, caso de uso -->

**Linear: pesquisa → análise → revisão (exemplo "Análise financeira")**

1. *Research Agent* (Sonnet, esforço baixo) extrai todos os números com período e unidade.
2. *Analysis Agent* recebe a ferramenta `calculator` e calcula com exatidão crescimento e margens. Tarefa: `Calcule os principais indicadores a partir destes resultados da pesquisa: {{Research Agent}}`.
3. *Review Agent* verifica a análise e retorna um **resultado estruturado** com `summary`, `key_figures`, `issues` e `approved`.

**Ramificar e juntar (exemplo "Artigo de blog")**

1. Início com o tema.
2. *Público* e *Estrutura* rodam em paralelo.
3. *Redator* junta os dois (`{{Público}}`, `{{Estrutura}}`) e tem um **controle de qualidade** com os critérios "segue a estrutura" e "responde às perguntas do público".

**Classificar e responder**

1. *Classificação* (Haiku, saída estruturada com `category`, `urgency` como número inteiro e `reason`).
2. *Resposta* (Sonnet) recebe a classificação como JSON e a solicitação original por `{{run.input}}`.

## Limitações {#grenzen}
<!-- keywords: limites, limitações, laços, condições, if, loop, ramificação -->

- **Laços só com limite:** um fluxo de trabalho é um grafo direcionado; etapas só se repetem por meio de [laços](/docs/verzweigungen#schleifen) de no máximo 20 rodadas. Fora de laços, cada nó roda no máximo uma vez por execução. Condições são montadas com [decisões](/docs/verzweigungen#entscheidung); nós em ramificações não escolhidas são ignorados.
- **Continuar em vez de repetir:** uma execução com falha ou cancelada pode ser [continuada](/docs/verzweigungen#fortsetzen); isso cria uma nova execução vinculada.
- **Uma execução por vez por fluxo no editor:** enquanto houver uma execução ativa, *Iniciar fluxo de trabalho* fica bloqueado. Para iniciar muitas execuções de uma vez, use uma [execução em lote](/docs/automatisierung#stapel).
- **Estado no momento do início:** alterações durante uma execução só valem na próxima.
