# Termos

Os termos mais importantes do Nodestro, cada um explicado brevemente com o capítulo que traz mais detalhes. Termos parecidos são diferenciados aqui de forma explícita.

## Fluxo de trabalho {#workflow}
<!-- keywords: fluxo de trabalho, workflow, nó, conexão, início, resultado -->

Um **fluxo de trabalho** é uma sequência de nós: um início, agentes, decisões, aprovações e um resultado. As conexões definem qual etapa recebe os resultados de qual outra. Mais em [Nós](/docs/workflows#knoten).

## Agente {#agent}
<!-- keywords: agente, ia, modelo, prompt de sistema, tarefa, biblioteca -->

Um **agente** é uma etapa em que um modelo de IA realiza uma tarefa: com prompt de sistema, tarefa e, opcionalmente, ferramentas, conhecimento e memória. Os agentes da **biblioteca de agentes** são modelos; cada fluxo de trabalho usa sua própria cópia. Mais em [Agentes](/docs/agenten#grundlagen).

## Ferramenta {#tool}
<!-- keywords: ferramenta, tool, função, sandbox -->

Uma **ferramenta** é uma função que um agente pode chamar enquanto trabalha, como uma calculadora ou seu próprio código Python. O modelo decide quando usá-la; suas próprias ferramentas rodam em um sandbox. Mais em [Ferramentas](/docs/tools#ueberblick).

## Conhecimento {#wissen}
<!-- keywords: conhecimento, knowledge, documentos, permanente, busca -->

**Conhecimento** são documentos que ficam armazenados e são atribuídos a agentes, por exemplo um manual ou uma tabela de preços. Eles ficam disponíveis em cada execução desses agentes até você excluí-los. Mais em [Conhecimento](/docs/wissen#ueberblick).

## Arquivo de entrada {#eingabedatei}
<!-- keywords: arquivo de entrada, arquivo, upload, execução, único, diferença conhecimento -->

Um **arquivo de entrada** é enviado ao iniciar uma execução, por exemplo o contrato a ser revisado. Ele pertence só a essa execução e não vai para o conhecimento. O que várias execuções precisam vai para o conhecimento. Mais em [Entrada ou conhecimento?](/docs/datei-eingaben#eingabe-oder-wissen).

## Memória {#memory}
<!-- keywords: memória, memory, notas, espaço de memória -->

**Memória** são notas que um agente escreve e lê por conta própria. *Por execução*, dura uma execução; *permanente*, fica em um espaço de memória e se mantém entre execuções. Diferente do conhecimento, a memória é escrita pelo próprio agente. Mais em [Tipos de memória](/docs/memory#arten).

## Execução {#ausfuehrung}
<!-- keywords: execução, run, status, resultado -->

Uma **execução** é uma passagem de um fluxo de trabalho com uma entrada específica. Ela tem um status, custos, um resultado e uma visão detalhada de cada etapa. Mais em [Status](/docs/ausfuehrungen#status).

## Versão {#version}
<!-- keywords: versão, salvar, histórico, restaurar -->

Cada salvamento que altera algo cria uma **versão** numerada do fluxo de trabalho. Você pode ver, comparar e restaurar versões anteriores. Mais em [Versões](/docs/workflows#versionen).

## Publicação (versão da API) {#veroeffentlichung}
<!-- keywords: publicação, release, versão da api, publicar, api -->

**Publicar** congela uma versão salva como API. Cada publicação recebe seu próprio número; alterações posteriores no editor não a mudam. As ferramentas são congeladas junto; a API lê o conhecimento e a memória permanente ao vivo. Mais em [Publicar](/docs/api-und-export#veroeffentlichen).

## Série de testes {#testreihe}
<!-- keywords: série de testes, teste, caso de teste, regra de verificação, qualidade -->

Uma **série de testes** contém casos de teste fixos com entradas e regras de verificação para um fluxo de trabalho. Uma execução de teste os roda contra uma versão específica e mostra quantos casos foram aprovados. Mais em [Séries de testes](/docs/automatisierung#testreihen).

## Aprovação {#freigabe}
<!-- keywords: aprovação, pessoa, aprovar, rejeitar -->

Uma **aprovação** é uma etapa em que a execução para até que uma pessoa aprove ou rejeite o resultado obtido até ali. Mais em [Aprovação](/docs/verzweigungen#freigabe).
