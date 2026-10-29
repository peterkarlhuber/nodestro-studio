# Uso e custos

O Nodestro conta os tokens de cada solicitação a um provedor de IA e estima os custos. Este capítulo explica os tipos de tokens, como os custos são calculados, como o cache economiza e o que a página *Uso* mostra.

## Visão geral {#ueberblick}
<!-- keywords: uso, custos, tokens, estatísticas, consumo, cobrança -->

Você vê tokens e custos em quatro lugares:

- em cada nó de agente depois de uma execução,
- na *Visão geral da execução* do editor (ao vivo),
- na visualização detalhada de cada execução, no total e por agente,
- na página **Uso**, resumidos por dia, fluxo de trabalho e modelo.

Todos os custos são **estimativas pelo preço de tabela**; o que vale é a cobrança de cada provedor. O Nodestro só conhece preços dos modelos da Anthropic. Com outros modelos os custos ficam **desconhecidos** (exibidos como “–”): nunca contam como 0, e um orçamento só limita custos com preço conhecido. Os valores são sempre em dólares americanos, com até seis casas decimais e no formato numérico do idioma escolhido (por exemplo "US$ 0,0042" em português, "$0.0042" em inglês).

## Tipos de tokens {#tokens}
<!-- keywords: token, entrada, saída, input, output, cache read, cache write, tokens de raciocínio, requisições, requests -->

| Tipo | Significado |
|---|---|
| **Entrada** | Tudo o que vai para o modelo e não vem do cache: prompt de sistema, tarefa, conversa, resultados de ferramentas, conhecimento. |
| **Saída** | Tudo o que o modelo escreve, **incluindo o raciocínio**, e as chamadas de ferramentas. |
| **Do cache** | Entrada lida do cache de prompt; bem mais barata. |
| **Para o cache** | Entrada gravada no cache; um pouco mais cara que a entrada normal. |
| **Raciocínio** | A parte da saída usada no raciocínio (se a API informar). |

**Requisições à API** conta cada chamada à API. Um agente precisa de pelo menos uma requisição, mais uma por rodada de ferramentas, e o controle de qualidade precisa de outras para cada verificação e revisão. Passe o mouse sobre o número de tokens de um agente para ver o detalhamento.

## Como os custos são calculados {#kosten}
<!-- keywords: calcular custos, preço, tabela de preços, estimativa, mtok, custo de pesquisa na web, preço desconhecido -->

Para cada solicitação, o Nodestro multiplica os tipos de tokens pelos preços do modelo (em dólares americanos por milhão de tokens) e soma as taxas de buscas na web (US$ 10 por 1.000 buscas). A soma de todas as solicitações dá os custos do agente e da execução; se uma parte é desconhecida, a soma também é. A tabela de preços vem da biblioteca Orkexa (modelos da Anthropic):

<!-- widget: models -->

Se uma execução mostrar **"–"** em vez de um valor, pelo menos uma solicitação não pôde ser precificada (por exemplo, um modelo desconhecido). O Nodestro prefere então não mostrar valor a mostrar um valor baixo demais. Para o orçamento, essas solicitações contam como 0.

## Cache {#caching}
<!-- keywords: cache, caching, prompt caching, economizar, ttl, 5 minutos, 1 hora, cache write -->

Com o **cache de prompt** (por agente em *Avançado*, ligado por padrão), a API guarda o início fixo de uma solicitação. As solicitações seguintes com o mesmo início o leem do cache:

- **Ler** do cache custa, dependendo do modelo, apenas cerca de 2,5 a 10% do preço normal de entrada.
- **Gravar** no cache de 5 minutos custa 1,25 vez o preço de entrada; no cache de 1 hora, 2 vezes.

O cache compensa especialmente quando um agente faz **várias solicitações** (rodadas de ferramentas, controle de qualidade, memória) ou quando o mesmo fluxo roda **várias vezes em sequência**. O conhecimento no modo *No contexto* fica no início do prompt e por isso se beneficia mais.

**Duração do cache:** o cache de 5 minutos é prorrogado a cada uso. Escolha *1 hora* só se costuma haver mais de cinco minutos entre as solicitações.

Quanto veio do cache aparece no detalhamento dos tokens ("do cache", "para o cache").

## A página Uso {#statistik}
<!-- keywords: página de uso, estatísticas, gráfico, por dia, por fluxo de trabalho, por modelo, período, teste de agente, assistente, origem -->

Escolha o período no topo (7, 30 ou 90 dias). A página mostra:

- **Indicadores:** execuções, outras operações de IA, requisições à API, tokens (entrada e saída) e custo estimado.
- **Custo por dia** como gráfico de barras; passe o mouse sobre uma barra para ver custo e número de execuções.
- **Por fluxo de trabalho** e **Por modelo** como tabelas com quantidade, tokens, custo e participação no custo total.
- **Por origem:** execuções de fluxos de trabalho, testes de agentes, criação de agentes com IA, assistente de memória e criação de ferramentas com IA.
- **Últimas operações de IA fora dos fluxos de trabalho** com momento, modelo, tokens e custo.

As execuções são atribuídas pelo **momento de início**. Em *Por modelo*, cada agente conta para o modelo da sua configuração; o custo da sua verificação de qualidade está incluído. As demais operações de IA contam para o modelo que usaram. Cada requisição é contada exatamente uma vez: execuções de fluxos de trabalho a partir das execuções salvas, todo o resto a partir de um registro próprio. **Traces importados** não são incluídos.

## Economizar {#sparen}
<!-- keywords: economizar, mais barato, reduzir custos, otimizar, dicas -->

- **O menor modelo adequado:** Haiku para etapas simples, Sonnet para a maioria, Opus só onde for necessário.
- **Reduzir o esforço:** *Baixo* ou *Médio* basta para muitas tarefas e economiza tokens de raciocínio.
- **Deixar o cache ligado.**
- **Usar o conhecimento de forma seletiva:** *Pesquisa* ou *Sob demanda* em vez de arquivos grandes *No contexto*.
- **Limitar tokens e rodadas de ferramentas**, para que um agente não se perca.
- **Definir um orçamento**, para que uma execução nunca custe mais do que o planejado.
- **Usar o controle de qualidade de forma seletiva:** cada verificação e revisão custa a mais.
