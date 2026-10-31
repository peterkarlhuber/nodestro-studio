# Fluxos de trabalho

Um fluxo de trabalho conecta agentes em uma sequência. Este capítulo explica como criar fluxos de trabalho, conectar nós, como os dados passam entre os agentes e como iniciar uma execução.

## Criar e gerenciar fluxos de trabalho {#anlegen}
<!-- keywords: novo fluxo de trabalho, criar, excluir, duplicar, cópia, visão geral, workflow -->

A página **Fluxos de trabalho** mostra todos os fluxos como cartões com o número de agentes, a última alteração e o status da última execução.

A página oferece três formas equivalentes de começar: **Criar com IA** abre a caixa de diálogo de um novo fluxo de trabalho com o [Arquiteto IA](/docs/ki-architekt#neu-erstellen), **Começar com um exemplo** abre a [galeria de exemplos](/docs/beispiele) e **Montar você mesmo** abre a mesma caixa de diálogo para um fluxo vazio. Enquanto não houver nenhum fluxo, elas aparecem como blocos grandes; depois, como uma linha estreita acima da lista.

- **Novo fluxo de trabalho:** digite um nome e uma descrição opcional. O novo fluxo já contém *Início → Agente → Resultado*.
- **Criar com IA:** no mesmo diálogo você descreve o que quer e o [arquiteto de fluxos](/docs/ki-architekt#neu-erstellen) projeta o fluxo para você revisar.
- **Abrir:** clique no cartão.
- **Duplicar:** símbolo de cópia no cartão. A cópia se chama "… (cópia)"; as execuções não são copiadas.
- **Excluir:** símbolo da lixeira. As execuções anteriores continuam disponíveis em *Execuções*.

## Favoritos e tags {#favoriten-tags}
<!-- keywords: favorito, favoritos, estrela, tag, tags, etiqueta, filtrar, organizar -->

Fluxos de trabalho, modelos de agentes e ferramentas podem ser marcados como favoritos com a **estrela**. Os favoritos ficam sempre no topo das listas. O **ícone de etiqueta** adiciona tags como “Cliente A” ou “Rascunho”; tags existentes são sugeridas.

Acima das listas você filtra por **Só favoritos** e por uma tag. Favoritos e tags são salvos separadamente dos objetos: não alteram fluxos de trabalho, agentes nem ferramentas, e também aparecem na [busca](/docs/start#suche). Pastas não existem, de propósito.

## O editor {#editor}
<!-- keywords: tela, canvas, paleta, blocos, inspetor, visão geral da execução, zoom, minimapa -->

O editor tem quatro áreas:

1. **Barra de título:** nome, *Exportar*, *Salvar*, *Adicionar agente* e *Iniciar fluxo de trabalho*.
2. **Tela:** os nós e as conexões. No canto superior esquerdo aparece se há alterações não salvas e quantos agentes e conexões o fluxo tem. No canto inferior esquerdo ficam o zoom, *Mostrar tudo*, *Organizar automaticamente* e também *Desfazer* e *Refazer*. No canto superior direito, um mapa geral mostra o fluxo inteiro.
3. **Blocos (paleta):** *Agente* (vazio), *Descrever um agente* (a IA cria a configuração), *Início*, *Resultado* e até oito modelos da biblioteca de agentes. Arraste um bloco para a tela ou clique nele.
4. **Inspetor (à direita):** sem seleção, mostra as configurações do fluxo de trabalho; caso contrário, a configuração do nó selecionado.

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

Os nós de início e de resultado são opcionais: agentes sem antecessor recebem automaticamente a entrada da execução e, sem nó de resultado, a saída dos últimos agentes vale como resultado (veja [O resultado de uma execução](/docs/ausfuehrungen#ergebnis)). Decisão, aprovação e subworkflow ficam na paleta, em *Controlar o fluxo*; veja [Ramificações e aprovações](/docs/verzweigungen).

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
<!-- keywords: limites, ao mesmo tempo, paralelo, limite de tempo, duração, timeout, run.time_limit -->

Dois limites opcionais valem para cada execução do fluxo. Vazio significa sem limite.

- **Máximo de etapas executando ao mesmo tempo** (de 1 a 32): se houver mais etapas prontas, as demais esperam por uma vaga livre. Com 1, todas as etapas são executadas uma após a outra.
- **Limite de tempo por execução** (em minutos, no máximo 7 dias): só conta o tempo de execução ativo. A espera por uma aprovação não conta. Quando o tempo acaba, nenhuma outra etapa é iniciada, os agentes em andamento são solicitados a parar e a execução falha com um erro que indica o limite de tempo.

Uma solicitação ao modelo ou uma chamada de ferramenta que já está em andamento ainda é concluída. Por isso, a execução pode ultrapassar o limite de tempo pela duração dessa chamada.

## Verificação antes de iniciar {#pruefung}
<!-- keywords: verificação, validação, problemas, início bloqueado, erro, aviso -->

O Nodestro verifica o fluxo de trabalho a cada alteração (após meio segundo de pausa), sem chamar a API e sem custo:

- **Estrutura:** Há pelo menos um agente? O nó inicial não tem entradas e o nó de resultado não tem saídas? Não há ciclos, conexões duplicadas nem conexões que não levam a lugar nenhum? O nó de resultado tem uma entrada?
- **Agentes:** Cada configuração é verificada com as regras da biblioteca. Agentes com erros mostram “1 problema” na área de trabalho.
- **Conexões e marcadores:** marcadores que não correspondem a nenhum predecessor conectado, agentes sem entrada, resultados que não chegam a lugar nenhum e nomes de agentes duplicados.
- **Configurações:** provedores não configurados, arquivos de conhecimento ou de início apagados, modelos sem preço conhecido e orçamento 0.

Os resultados aparecem no inspetor do fluxo de trabalho (clique em um ponto vazio da área de trabalho), separados em **erros** e **avisos**. Um clique em uma mensagem seleciona o agente afetado ou destaca a conexão afetada; conexões com erro aparecem em vermelho tracejado.

Enquanto houver **erros**, **Iniciar fluxo de trabalho** fica bloqueado; passe o mouse sobre o botão para ver os motivos. **Avisos** não bloqueiam o início; a caixa de diálogo de início os mostra novamente.

## Iniciar uma execução {#starten}
<!-- keywords: iniciar, executar, run, caixa de diálogo de início, entrada, anexar arquivos -->

**Iniciar fluxo de trabalho** abre a caixa de diálogo de início:

- **Entrada:** o texto que todos os agentes recebem no início. Ele já vem preenchido com a *Sugestão de entrada* do nó de início.
- **Anexar arquivos (opcional):** arquivos de conhecimento colocados diretamente no contexto dos primeiros agentes, só nesta execução (veja [Anexar arquivos ao iniciar](/docs/wissen#start-dateien)).
- **Orçamento:** a caixa de diálogo mostra qual orçamento vale.

Com **Iniciar**, o Nodestro salva o workflow e começa a execução. A execução usa o estado do workflow no momento do início; mudanças posteriores só valem na próxima execução. Se o provedor de um modelo não estiver configurado, o diálogo avisa.

## Controles e atalhos de teclado {#bedienung}
<!-- keywords: atalhos de teclado, shortcuts, ctrl+s, ctrl+z, desfazer, refazer, delete, duplicar, organizar automaticamente -->

<!-- widget: shortcuts -->

Mais dicas:

- **Organizar automaticamente** dispõe os nós em colunas conforme sua posição no fluxo de dados.
- **Mostrar tudo** ajusta o zoom para que o fluxo inteiro fique visível.
- Se você sair do editor com alterações não salvas, o Nodestro pergunta se deve salvá-las ou descartá-las.
- Desfazer guarda até 80 etapas. Mover um nó é uma etapa, assim como digitar em um campo até você mudar para outro campo ou nó. O nome, a descrição e o orçamento do fluxo também contam.

- **Excluir conexões:** clique em uma conexão. Ela fica destacada, e **Delete** ou **Backspace** a remove. Enquanto você digita em um campo de entrada, essas teclas só apagam texto. Excluir uma conexão também pode ser desfeito.
- A barra **Blocos** fica sempre recolhida ao abrir o editor; depois de expandida, continua aberta até você sair do editor.

## Salvar e descartar {#speichern}
<!-- keywords: salvar, descartar, não salvo, descartar alterações, redefinir -->

**Salvar** (ou **Ctrl+S**) guarda o estado atual e cria uma nova [versão](/docs/workflows#versionen). Enquanto houver alterações não salvas, a barra de título mostra **Descartar**.

**Descartar** joga fora todas as alterações não salvas, inclusive o histórico de desfazer/refazer, e recarrega o último estado salvo. O mesmo vale quando você sai do editor e escolhe **Descartar** na caixa de diálogo: na próxima abertura aparece exatamente o fluxo de trabalho salvo.

## Versões {#versionen}
<!-- keywords: versão, versões, histórico, restaurar, voltar, estado anterior -->

Cada salvamento que altera algo é guardado como **versão** numerada com data e hora. **Versões** na barra de título do editor abre o histórico:

- **Salvar como versão** salva as alterações atuais com uma descrição opcional (“antes de refazer a pesquisa”).
- O ícone de lápis adiciona ou altera a descrição de uma versão.
- **Diferenças** mostra o que mudaria em relação ao estado no editor: agentes, conexões, nome e configurações.
- **Restaurar** volta o fluxo de trabalho para essa versão e salva o resultado como **nova versão**. Nenhuma versão é sobrescrita ou excluída.

As versões são independentes de desfazer/refazer, que vale apenas dentro de uma sessão no editor. As execuções usam sempre o estado do momento do início. Quando um fluxo de trabalho é excluído, suas versões também são. No topo do histórico aparece o **resultado dos testes** da versão salva em cada série de testes do fluxo (como ao [publicar](/docs/api-und-export#veroeffentlichen)).

## Importar e exportar {#import-export}
<!-- keywords: exportar, importar, json, arquivo, compartilhar, backup, .nodestro.json -->

- **Exportar** (no editor) salva o fluxo como `<Nome>.nodestro.json`: todos os nós, conexões, posições e configurações dos agentes, além do orçamento.
- **Importar** (na página *Fluxos de trabalho*) carrega esse arquivo como **nova cópia** com um novo ID. Fluxos existentes nunca são sobrescritos.

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
