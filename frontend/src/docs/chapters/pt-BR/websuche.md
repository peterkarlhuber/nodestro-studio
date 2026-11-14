# Busca na web e leitura de páginas web

Duas ferramentas integradas dão a um agente acesso à web: `search_web` busca por meio de um serviço de busca que você escolhe, e `fetch_web_page` lê uma única página. Este capítulo explica o que elas fazem, como escolher um serviço de busca, quanto custa, onde as ferramentas estão disponíveis e como verificar quais fontes uma execução usou.

## As duas ferramentas {#werkzeuge}
<!-- keywords: search_web, fetch_web_page, busca na web, ler página, internet, ferramenta integrada -->

- **`search_web`** busca na web ou em notícias e devolve resultados com título, endereço, um trecho curto e, quando conhecida, a data. Ela precisa de um **serviço de busca**, uma conexão do tipo *Busca na web* (veja [Conexões de serviço](/docs/verbindungen)).
- **`fetch_web_page`** lê uma página (HTML, texto ou PDF) e devolve o texto dela. Não precisa de conexão. Endereços de rede interna, endereços com usuário ou senha e portas diferentes das portas web usuais são recusados.

Você atribui as duas como qualquer outra ferramenta na seção **Ferramentas** do agente (veja [Atribuir ferramentas](/docs/agenten#tools)). O inspetor as marca com o selo **Internet**. Uma boa dupla: o agente busca com `search_web` e lê os resultados mais promissores com `fetch_web_page` antes de confiar em mais do que um trecho.

## Escolher um serviço de busca {#suchdienst}
<!-- keywords: serviço de busca, provedor, ddgs, brave, tavily, mojeek, searxng, provedor de teste, chave de api -->

Em *Ferramentas → Conexões → Configurar serviço de busca* você configura um serviço de busca. O Nodestro não escolhe nenhum por você: cada cartão diz com honestidade o que o serviço precisa e o que esperar.

| Serviço | Chave | Observações |
|---|---|---|
| DDGS | não | Gratuito e sem nenhuma garantia. Usa outros mecanismos de busca, que podem bloqueá-lo ou mudar a qualquer momento. Indisponível em um servidor Nodestro. |
| Brave Search | sim | Os resultados não podem ser armazenados. Cerca de 5 USD a cada 1000 solicitações. |
| Tavily | sim | Cobrado conforme o plano: informe seu preço por solicitação. |
| Mojeek | sim | Operado na Europa. Cobrado conforme o plano: informe seu preço por solicitação. |
| SearXNG | opcional | Seu próprio servidor: informe o endereço dele. |
| Provedor de teste | qualquer | Provedor de teste offline para experimentar: resultados inventados, sem internet. |

Verifique você mesmo as condições e os preços de um serviço antes de usá-lo; o Nodestro não recomenda nenhum deles. Depois atribua a conexão a `search_web` no inspetor do agente.

## Custos e limites {#kosten}
<!-- keywords: custos, preço por solicitação, orçamento, chamadas, resultados, domínios permitidos, domínios bloqueados, avançado -->

Uma busca paga custa dinheiro por solicitação. O Nodestro lança cada solicitação com o preço do serviço nos custos da execução e verifica o orçamento da execução antes de uma solicitação paga. Para o Brave vale o preço publicado, a menos que a conexão informe um próprio; Tavily e Mojeek precisam do preço por solicitação na conexão, senão `search_web` não é chamada. DDGS, SearXNG e o provedor de teste não custam nada no Nodestro.

Em **Avançado**, abaixo de cada ferramenta web no inspetor do agente, você limita o que o agente pode fazer: o máximo de resultados por busca, região, idioma e período das buscas, **domínios permitidos** e **bloqueados**, o máximo de caracteres por página e o máximo de chamadas por execução. Campos vazios mantêm os valores padrão; `search_web` permite no máximo 10 chamadas por execução, `fetch_web_page` no máximo 20.

## Modo offline e servidores {#offline-server}
<!-- keywords: offline, modo offline estrito, servidor, perfil de servidor, operador, indisponível -->

As duas ferramentas precisam da internet. No modo offline estrito, a verificação antes de uma execução as recusa. Em um servidor Nodestro elas não são oferecidas: a verificação as aponta e cada chamada é recusada. O operador do servidor pode ativá-las com `NODESTRO_WEB_TOOLS_SERVER=1`. O DDGS nunca é oferecido em um servidor.

## Fontes de uma execução {#quellen}
<!-- keywords: fontes, fontes da web, registro de fontes, S1, fontes citadas, lida, só resultado, resultado estruturado -->

Cada resultado de busca e cada página que as ferramentas web veem ficam registrados na execução com um identificador (`S1`, `S2` …). A visão de detalhes da execução os mostra em **Fontes da web** com título, domínio, horário e status: **Lida** quando a página foi lida, **Só resultado** quando ela só apareceu em uma busca. Os links abrem em uma nova aba. Só os endereços e os títulos são guardados, nunca o texto da página, e só naquela execução.

Você pode exigir que um agente cite suas fontes: em um resultado estruturado, ative **Cita fontes da web** em um campo de texto ou de lista (veja [Formato de saída](/docs/agenten#ausgabeformat)). Cada valor precisa então indicar uma fonte registrada pelo identificador ou pelo endereço. Se o agente citar uma fonte que não encontrou, ele recebe uma correção; se fizer isso de novo, a etapa falha, para que nenhuma fonte inventada seja entregue.

## O exemplo Pesquisa na web {#beispiel}
<!-- keywords: pesquisa na web, exemplo, agente de pesquisa, resposta com fontes, lista de fontes, consulta, aprofundada -->

O exemplo **Pesquisa na web com fontes** entre os [fluxos de trabalho de exemplo](/docs/beispiele) responde a uma pergunta com fontes. Ao copiá-lo, escolha um dos seus serviços de busca em **Serviços para as ferramentas** ou configure um com **Configurar serviço de busca**; nada vem pré-selecionado. Sem escolha, a cópia é criada mesmo assim, e a verificação antes da execução lembra você de escolher uma conexão no agente.

O resultado contém a resposta, as constatações e as contradições com identificadores de fonte como `[S1]`, as lacunas, a **lista de fontes** e o **período de consulta**. A lista de fontes e o período de consulta são escritos pelo Nodestro depois da etapa a partir das fontes registradas, não pelo modelo. No agente você define isso para cada campo de texto em **Fontes da web**: **Cita fontes da web**, **Uma fonte por afirmação [S1]**, **Lista de fontes (automática)** ou **Período de consulta (automático)**. Com **Pesquisa detalhada** no formulário de início, o agente busca e lê mais (8 buscas e 12 páginas em vez de 3 e 4).

## O texto das páginas é dado {#sicherheit}
<!-- keywords: segurança, injeção de prompt, manipulação, conteúdo externo, não confiável -->

Resultados de busca e textos de páginas vêm de terceiros. O Nodestro os marca para o modelo como conteúdo externo: dados, não instruções. Ainda assim, as páginas podem conter tentativas de manipular o agente, por exemplo texto oculto que pede para ele ignorar a tarefa ou enviar dados para algum lugar. Dê aos agentes com ferramentas web só as outras ferramentas de que eles precisam, use [aprovações](/docs/tools#freigabe) para ferramentas que alteram algo e confira os resultados baseados em fontes da web antes de agir com base neles.
