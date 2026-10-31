# Automação

Em *Automação*, na navegação, os fluxos de trabalho rodam sem clicar em *Iniciar*: **execuções em lote** processam muitas entradas de uma vez, **séries de testes** medem a qualidade de um fluxo e **agendamentos** iniciam fluxos regularmente. Cada execução individual é uma execução comum, com trace, orçamento e uso; as aprovações esperam uma pessoa como sempre.

## Execuções em lote {#stapel}
<!-- keywords: lote, batch, muitas entradas, csv, excel, xlsx, json, tabela, colunas, mapeamento, exportar -->

Uma **execução em lote** roda um fluxo de trabalho para cada linha de uma tabela, por exemplo para 200 solicitações de clientes.

1. Na página **Execuções em lote**, escolha *Nova execução em lote* e selecione o fluxo de trabalho.
2. Envie uma tabela: CSV (vírgula ou ponto e vírgula), Excel (XLSX) ou JSON (uma lista de objetos), no máximo 1.000 linhas e 10 MB.
3. Associe cada coluna a um campo do [formulário de entrada](/docs/verzweigungen#eingabeformular) ou à entrada livre, ou ignore-a. O Nodestro sugere associações adequadas.
4. A pré-visualização conta linhas válidas e inválidas e mostra o custo estimado. Linhas inválidas não rodam.
5. Inicie. A página de detalhes mostra o progresso, os custos e cada linha com seu status e um link para a execução.

Um lote pode ser **pausado** (execuções em andamento terminam, novas não começam), **continuado** e **cancelado**. Um erro em uma linha não interrompe as outras. Se o Nodestro foi encerrado durante um lote, ele fica *interrompido* e pode ser continuado. Você baixa os resultados como CSV ou JSON.

## Limites, custos e ferramentas próprias {#grenzen}
<!-- keywords: limites, limite de custo, limite de falhas, simultâneas, paralelo, estimativa, custo, rate limit, ferramentas próprias -->

- **Simultâneas:** quantas execuções rodam em paralelo (de 1 a 8). Mais é mais rápido, mas pode atingir os limites de taxa da API.
- **Limite de custo (USD):** o lote para assim que o total é atingido. O [orçamento por execução](/docs/workflows#budget) também vale para cada execução individual.
- **Falhas no máximo:** o lote para depois de tantas execuções com falha.
- **Custo estimado:** a partir das últimas execuções bem-sucedidas do fluxo, vezes o número de execuções. Se ainda não houver execução bem-sucedida, o Nodestro informa só o máximo: orçamento vezes quantidade.
- **Ferramentas próprias** que podem agir fora do Nodestro (como enviar mensagens) seriam chamadas em cada execução. Você precisa confirmar isso explicitamente antes de iniciar.
- Execuções que esperam uma **aprovação** não ocupam vaga; continuam assim que alguém decide.

Os custos de todas as execuções aparecem como sempre em [Uso](/docs/nutzung), cada um contado uma única vez.

## Séries de testes {#testreihen}
<!-- keywords: série de testes, benchmark, caso de teste, regra de verificação, qualidade, regressão, resultado esperado, aprovado -->

Uma **série de testes** pertence a um fluxo de trabalho e contém **casos de teste** fixos: uma entrada (valores de formulário, texto livre, arquivos), **regras de verificação** para o resultado e, opcionalmente, critérios para uma [avaliação por IA](/docs/automatisierung#ki-bewertung).

- As regras de verificação usam as mesmas comparações das [decisões](/docs/verzweigungen#regeln), por exemplo `category é igual a complaint` ou `total maior que 100`. São exatas e não custam nada.
- *Executar série de testes* escolhe a versão do fluxo (estado atual ou uma anterior), limites como nos lotes e se a IA deve avaliar.
- Um caso é **aprovado** quando sua execução teve sucesso, todas as regras de verificação são atendidas e, se avaliado, a IA o aprovou.
- A avaliação mostra taxa de aprovação, avaliação por IA, tokens, custos e duração, além dos detalhes de cada caso.

Uma série de testes tem no máximo 200 casos. Casos inválidos (como um campo obrigatório sem valor) são informados antes do início e ignorados.

## Avaliação por IA {#ki-bewertung}
<!-- keywords: avaliação por ia, juiz, llm as judge, critérios, avaliação, nota, pontuação -->

Para casos com critérios (um por linha), um modelo de IA separado avalia o resultado, opcionalmente em comparação com um **resultado esperado**. O padrão é o modelo dos assistentes de IA; na série de testes você pode escolher um modelo próprio de qualquer provedor configurado.

O veredito é sempre marcado como **avaliação por IA** e não substitui uma regra de verificação. Ele tem custo adicional, que aparece na avaliação e em [Uso](/docs/nutzung) como *Avaliação por IA de séries de testes*.

## Comparar execuções de teste {#testreihen-vergleichen}
<!-- keywords: comparar, comparar versões, melhor, pior, regressão, antes depois -->

Escolha duas execuções na lista de execuções de teste e clique em *Comparar*. A tabela mostra a taxa de aprovação das duas e, para cada caso, se foi aprovado, marcado como **melhor**, **pior**, **igual** ou **alterado**.

Assim você verifica, depois de cada mudança em agentes, prompts ou ferramentas, se o fluxo melhorou, e pode testar uma [versão](/docs/workflows#versionen) anterior contra o estado atual.

## Comparar modelos {#modelle-vergleichen}
<!-- keywords: comparar modelos, outro modelo, mais barato, mais rápido, escolha de modelo, variante -->

Se um modelo mais barato ou mais forte basta para um agente, você verifica com a mesma série de testes. Na caixa de início, ative **Testar outros modelos** e escolha outro modelo para alguns agentes. Os casos de teste e a avaliação por IA continuam iguais, e o workflow salvo não muda.

Uma execução assim precisa de um **limite de custo** em [Limites](/docs/automatisierung#grenzen), porque as execuções anteriores usaram outros modelos e não dizem nada sobre o custo. Na lista ela leva o rótulo **Comparação de modelos** e cita os modelos substituídos. Depois compare-a com uma execução da versão salva. Ela não conta como resultado de teste dessa versão, porque testou uma variante. Se um modelo servir, defina-o no próprio agente.

## Agendamentos {#zeitplaene}
<!-- keywords: agendamento, schedule, cron, regular, diário, semanal, mensal, a cada hora, fuso horário, perdido -->

Um **agendamento** inicia um fluxo de trabalho uma vez ou regularmente, com entradas fixas (valores de formulário, texto, arquivos).

- **Ritmo:** uma vez, a cada poucas horas, diariamente, em dias da semana escolhidos ou mensalmente em um dia (nos meses mais curtos, no último dia).
- **Fuso horário:** os horários valem no fuso escolhido, também nas mudanças de horário de verão. Um horário que não existe quando o relógio adianta roda uma hora depois; um que acontece duas vezes quando o relógio atrasa roda uma vez.
- **Próximos inícios:** a caixa de diálogo mostra as próximas datas antes de salvar.
- **Desativado até você ativar:** um agendamento novo fica desativado. Ao ativá-lo, o Nodestro verifica tudo de que uma execução precisa: o fluxo, as entradas, um [orçamento por execução](/docs/einstellungen#budget) e a confirmação de ferramentas próprias. Se não passar na verificação, ele continua desativado e o motivo é mostrado.

Agendamentos só rodam enquanto o Nodestro está em execução. Horários que passaram enquanto o Nodestro estava desligado contam como **perdidos**: *Pular* os ignora, *Recuperar uma vez* inicia uma única execução na próxima inicialização, não importa quantos foram perdidos. Execuções de agendamentos levam a origem *Agendamento* em [Execuções](/docs/ausfuehrungen#liste).
