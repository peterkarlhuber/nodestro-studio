# Ramificações e aprovações

Um fluxo de trabalho pode ser mais do que uma cadeia fixa de agentes: uma **decisão** escolhe um caminho por regras fixas, uma **aprovação** segura a execução até que uma pessoa aprove ou rejeite, e um **subworkflow** executa outro fluxo como uma única etapa. Além disso, há **formulários de entrada** para entradas estruturadas e a opção de **continuar** execuções que falharam. Tudo roda no mesmo motor que qualquer outro fluxo de trabalho.

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

A página **Aprovações** (navegação, grupo *Automação*) lista todas as aprovações abertas, da mais antiga para a mais nova, com fluxo de trabalho, origem (manual, agendamento, lote, série de testes) e tempo de espera. O número ao lado do item de menu mostra quantas estão esperando.

Cada cartão mostra a orientação, os resultados a revisar, um campo de comentário e os botões *Aprovar* e *Rejeitar*. Aprovações dentro de subworkflows também aparecem aqui, com o caminho até a execução principal.

## Subworkflows {#unterworkflow}
<!-- keywords: subworkflow, sub-workflow, aninhar, reutilizar, bloco, versão, execução filha -->

Um **subworkflow** executa outro fluxo de trabalho salvo como uma única etapa. O resultado chega como o de um agente.

- **Versão:** *Versão mais recente* usa o estado atual; uma versão fixa não muda quando o outro fluxo é editado depois. A verificação avisa quando existe uma versão mais nova.
- **Entrada:** o que o subworkflow recebe como entrada; `{{input}}` é o que chega aqui.
- **Valores para o formulário de entrada dele:** texto ou marcadores como `{{form.cliente}}` ou `{{Análise}}`. A verificação avisa sobre campos obrigatórios sem valor.
- O subworkflow roda como uma **execução própria e vinculada**; um link nos detalhes leva até ela. Custos e tokens contam uma única vez, no orçamento da execução principal.
- Um fluxo não pode chamar a si mesmo, nem indiretamente; mais de cinco níveis não são permitidos.
- Se o subworkflow espera uma aprovação, a execução principal espera junto.

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

Se nada puder ser reaproveitado com segurança, o Nodestro oferece um reinício completo. Traces importados e execuções isoladas de subworkflows não podem ser continuados; continue a execução principal.
