# Workflows de exemplo

O Nodestro traz 24 workflows multiagente prontos, um para cada área de aplicação típica. Cada exemplo contém agentes com prompts de sistema, as conexões, uma tarefa de teste preparada com dados inventados e um resultado claramente descrito. Este capítulo explica a galeria, como copiar e adaptar, e descreve cada exemplo separadamente.

## A galeria {#galerie}
<!-- keywords: exemplos, modelos, galeria, biblioteca, destaques, categorias, página inicial -->

A galeria fica na página **Workflows**, abaixo dos seus próprios workflows e claramente separada deles. Ela mostra alguns exemplos em destaque e as seis categorias. **Ver todos os 24 exemplos** abre a galeria completa, também dentro da área de workflows.

Na galeria completa você busca por nome, área e descrição e filtra por categoria. Cada cartão mostra a área, o nome, a descrição, o número de agentes, o nível e o padrão. Exemplos de áreas sensíveis têm o selo **Exige revisão especializada**. A [busca](/docs/start#suche) também encontra exemplos.

## Prévia e cópia {#uebernehmen}
<!-- keywords: prévia, copiar, cópia, modelo, inalterado, gratuito -->

Um clique em um cartão abre a **prévia**: o fluxo como diagrama, cada agente com sua função, modelo, ferramentas e os resultados que recebe, o guia e a tarefa de teste. A prévia não salva nada e não chama nenhum modelo.

**Copiar para meus workflows** cria um workflow seu e o abre no editor. A cópia é independente: você pode mudar tudo, e o modelo continua sempre inalterado. Se você copiar um exemplo duas vezes, terá dois workflows separados. A cópia começa com a versão 1 no [histórico de versões](/docs/workflows#versionen).

Se **Adicionar os casos de teste como série de testes** estiver marcado (padrão), a cópia recebe também uma [série de testes](/docs/automatisierung#testreihen) com os casos de teste preparados; os arquivos de exemplo necessários são salvos como arquivos de entrada da cópia. Copiar nunca inicia uma execução, nunca cria um [agendamento](/docs/automatisierung#zeitplaene) e nunca publica uma [API](/docs/api-und-export#veroeffentlichen); isso você decide depois.

Os exemplos nunca são criados automaticamente; só o que você copia aparece entre seus workflows. Só há custos quando você executa uma cópia. Os exemplos usam modelos da Anthropic; basta esse [provedor configurado](/docs/einstellungen#anbieter), e você pode trocar os modelos de uma cópia para outro provedor a qualquer momento. Nenhum exemplo precisa de outros serviços, contas ou fontes de dados pagas.

## Idiomas {#sprachen}
<!-- keywords: idioma, tradução, alemão, inglês, cópia, prompts -->

A galeria e a prévia aparecem no idioma da interface. Nomes, descrições, prompts de sistema, tarefas e a tarefa de teste da cópia são criados no idioma que você escolhe na prévia em **Idioma da cópia**; o padrão é o idioma da interface.

Uma cópia salva permanece no seu idioma, mesmo que você mude a interface depois. Identificadores técnicos, como os nomes dos campos da saída estruturada e os nomes das ferramentas, ficam em inglês em todos os idiomas.

## Padrões e funções {#muster}
<!-- keywords: sequencial, paralelo, revisão, juiz, verificação de qualidade, funções, estrutura -->

Os exemplos usam apenas os agentes de que a tarefa precisa, geralmente três ou quatro.

- **Sequencial:** os agentes trabalham um após o outro; cada um se baseia no resultado do anterior.
- **Paralelo:** vários agentes trabalham ao mesmo tempo na mesma entrada, e outro reúne os resultados.
- **Ramificado:** uma decisão ou uma aprovação escolhe o caminho; nem todo agente roda em toda execução (veja [Ramificações e aprovações](/docs/verzweigungen)).
- **Revisão:** um agente revisor confere o trabalho dos outros e muitas vezes entrega uma saída estruturada com campos fixos.
- **Verificação de qualidade:** em alguns agentes, uma [verificação de qualidade](/docs/agenten#qualitaet) integrada avalia o resultado segundo critérios fixos e o faz revisar, se necessário.

Os cartões da galeria também mostram quais blocos um exemplo usa: decisão, aprovação, formulário de entrada, subworkflow, arquivos de resultado, arquivos como entrada, propostas de conhecimento ou memória.

As funções na prévia descrevem o que um agente faz: pesquisa, análise, planejamento, revisão ou redação. Os cálculos usam as ferramentas integradas, como a calculadora e o cálculo de datas; elas não custam nada a mais.

## Dados de teste {#testdaten}
<!-- keywords: tarefa de teste, dados de teste, sintéticos, inventados, dados de exemplo -->

Cada tarefa de teste começa com o aviso **DADOS DE EXEMPLO SINTÉTICOS**. Empresas, pessoas, números e regras são inventados e servem apenas para testar. Depois de copiar, a tarefa de teste é a entrada sugerida do nó inicial; substitua-a lá pelos seus próprios dados.

## Arquivos de exemplo e casos de teste {#beispieldateien}
<!-- keywords: arquivos de exemplo, casos de teste, série de testes, arquivo, upload, pdf, excel, word, zip -->

Muitos exemplos têm um [campo de arquivo](/docs/datei-eingaben#datei-felder) opcional, por exemplo para um registro de paradas em Excel, propostas em PDF e Word ou um contrato como arquivo Word. A prévia oferece pequenos **arquivos de exemplo** fictícios para baixar, que combinam com a tarefa de teste. Você pode colocá-los no campo de arquivo ao iniciar a cópia e experimentar como o exemplo trabalha com arquivos. Sem arquivo, os agentes trabalham com o texto como antes.

Cada exemplo também tem **casos de teste**, por exemplo um caso com texto, outro com arquivo de exemplo e, nos exemplos com decisão, um caso para cada caminho. Cada caso de teste contém verificações em campos do resultado. Os casos de teste copiados aparecem como série de testes da cópia; eles só rodam quando você inicia a série e então custam o mesmo que execuções normais.

A execução salva arquivos de resultado como PDF, Word ou Excel em [Arquivos](/docs/dateien). Se um agente propuser aprendizados para o conhecimento, só é salvo o que você adotar explicitamente.

## Áreas sensíveis {#sensible-bereiche}
<!-- keywords: finanças, direito, rh, administração, revisão, responsabilidade, aconselhamento, cautela -->

Seis exemplos tratam de finanças, direito, RH ou administração: análise financeira, recrutamento, revisão de contrato, orçamento doméstico, comparação de imóveis e solicitação de cidadão. Seus agentes recebem no prompt de sistema a instrução adicional de apontar incertezas e listar os pontos que uma pessoa qualificada precisa verificar.

Os resultados são ferramentas de apoio, não aconselhamento nem uma decisão. Verifique-os com olhar profissional antes de usá-los, enviá-los ou publicá-los.

## Adaptar os exemplos {#anpassen}
<!-- keywords: adaptar, mudar, dados próprios, conhecimento, modelo, prompt -->

- **Seus dados:** substitua a tarefa de teste no nó inicial ou informe sua própria entrada ao iniciar.
- **Seus arquivos:** coloque documentos para uma única execução diretamente no campo de arquivo ao iniciar; para isso você não precisa de uma coleção de conhecimento.
- **Conhecimento:** carregue documentos de que você precisa sempre como [conhecimento](/docs/wissen#modi) e atribua-os ao agente adequado.
- **Prompts e tarefas:** as tarefas se referem aos antecessores com [marcadores](/docs/workflows#platzhalter). Se você renomear um agente, ajuste os marcadores.
- **Dados atuais:** para informações ao vivo você pode adicionar a [ferramenta de servidor](/docs/tools#server-tools) de busca na web; ela tem custo extra por busca.

As seções abaixo indicam adaptações concretas para cada exemplo.

<!-- examples:start -->

## Os 24 exemplos em resumo {#uebersicht}

Cada exemplo está na galeria e tem sua própria seção abaixo.

| Nº | Exemplo | Área | Agentes | Padrão |
|---|---|---|---|---|
| 1 | Analisar paradas de máquina | Produção e indústria | 3 | com ramificações |
| 2 | Tratar uma reclamação com 8D | Gestão da qualidade | 5 | com ramificações |
| 3 | Comparar propostas de fornecedores | Logística e compras | 3 | paralelo |
| 4 | Estratégia SWOT para uma pequena empresa | Empresas e PMEs | 4 | paralelo |
| 5 | Análise financeira | Finanças e investimentos | 3 | sequencial |
| 6 | Artigo de blog | Marketing e conteúdo | 4 | paralelo |
| 7 | Preparar uma proposta sob medida | Vendas | 3 | sequencial |
| 8 | Responder solicitações de clientes | Atendimento ao cliente | 4 | com ramificações |
| 9 | Divulgar uma vaga e preparar entrevistas | Recursos humanos | 5 | com ramificações |
| 10 | Transformar uma pergunta de pesquisa em hipóteses | Pesquisa e desenvolvimento | 4 | sequencial |
| 11 | Revisão de código com testes | Desenvolvimento de software | 3 | paralelo |
| 12 | Estruturar um contrato e encontrar pontos de verificação | Direito e administração | 5 | com ramificações |
| 13 | Criar um plano de estudos pessoal | Educação e formação | 4 | paralelo |
| 14 | Verificar o orçamento doméstico e economizar | Pessoas físicas – finanças | 3 | sequencial |
| 15 | Planejar uma viagem pessoal | Pessoas físicas – viagens | 4 | com ramificações |
| 16 | Avaliar uma ideia de negócio | Autônomos e empreendedores | 4 | paralelo |
| 17 | Desenvolver uma estratégia para redes sociais | Influenciadores e criadores de conteúdo | 3 | sequencial |
| 18 | Comparar ofertas de imóveis | Imóveis | 3 | paralelo |
| 19 | Analisar atrasos de obra | Construção civil | 4 | paralelo |
| 20 | Desenvolver e precificar um cardápio | Gastronomia | 3 | sequencial |
| 21 | Planejamento de culturas de uma propriedade | Agricultura | 3 | sequencial |
| 22 | Planejar a festa de uma associação | Associações e clubes | 4 | paralelo |
| 23 | Desenvolver uma campanha de doações | Organizações sem fins lucrativos | 3 | paralelo |
| 24 | Responder a uma solicitação de cidadão | Instituições públicas | 3 | sequencial |

## 1 · Analisar paradas de máquina {#production-downtime}
<!-- keywords: produção e indústria, analista de paradas, analista de causas, planejador de ações -->

**Área:** Produção e indústria · **Agentes:** 3 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, formulário de entrada, subfluxo, arquivos de resultado, arquivos como entrada

Paradas custam tempo de produção, mas em registros longos os padrões passam despercebidos facilmente. O workflow transforma um registro de paradas em uma lista de medidas justificada e priorizada.

**Como os agentes trabalham juntos:** Dois agentes trabalham em paralelo: o analista de paradas calcula totais, participações e um ranking de Pareto com a calculadora, enquanto o analista de causas desenvolve hipóteses pelos 6M. O planejador de ações reúne os dois, e uma verificação de qualidade integrada garante que cada medida esteja justificada. Se a participação das paradas ficar acima da meta de 3 %, um nó de decisão inicia um subfluxo de qualidade que avalia os riscos das medidas e planeja como garanti-las.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de paradas** | Avalia o registro de forma quantitativa e calcula com a calculadora. (saída estruturada; Ferramentas: `calculator`) | Registro de paradas |
| **Analista de causas** | Desenvolve hipóteses de causa pelos 6M e propõe verificações. | Registro de paradas |
| **Planejador de ações** | Reúne análise e hipóteses em medidas priorizadas. (com verificação de qualidade) | Analista de paradas, Analista de causas |

**Entrada:** Um registro de paradas (data, turno, máquina, duração, código de falha, observação) e o tempo de produção planejado. Você pode colar o registro no texto como tabela ou colocá-lo no campo de arquivo opcional como CSV ou Excel; o arquivo de exemplo "Registro_paradas_L2_semanas14-15.xlsx" contém as mesmas doze entradas fictícias da tarefa de teste.

**Arquivos de exemplo:** `Registro_paradas_L2_semanas14-15.xlsx`

**Casos de teste:** Registro no texto, meta não atingida (4,6 %); Quinzena tranquila, meta atingida; Registro como arquivo Excel

**Resultado:** Uma tabela priorizada com ações imediatas, verificações e ações permanentes, cada uma com efeito esperado, esforço, função responsável e indicador, além da análise dos dados com a participação das paradas e os três próximos passos mais importantes. A execução também salva tudo em Markdown e em um arquivo Excel com as tabelas.

**Como adaptar:** Coloque uma exportação do seu MES ou da sua planilha no campo de arquivo; registros longos também funcionam, porque os agentes leem arquivos grandes de forma direcionada. Para uma análise semanal, você pode agendar a cópia. No prompt de sistema do planejador de ações, você pode acrescentar a sua metodologia, por exemplo os pilares do TPM ou um esquema de avaliação fixo.

## 2 · Tratar uma reclamação com 8D {#quality-8d}
<!-- keywords: gestão da qualidade, descrição do problema d1–d3, análise de causas d4, planejamento de ações d5–d7, relatório 8d, contenção de emergência -->

**Área:** Gestão da qualidade · **Agentes:** 5 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, aprovação, formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento

Reclamações exigem contenção rápida e uma análise de causa sólida. O método 8D define os passos; o workflow os percorre de forma estruturada e os documenta de maneira consistente.

**Como os agentes trabalham juntos:** Uma cadeia sequencial: o primeiro agente descreve o problema e as ações de contenção (D1 a D3), o segundo busca as causas de ocorrência e de não detecção (D4), o terceiro planeja ações corretivas e preventivas (D5 a D7). O agente de relatório reúne tudo em um relatório 8D estruturado. Um nó de decisão verifica a gravidade: em casos críticos, um agente adicional planeja a contenção de emergência das próximas 24 horas. Antes de o relatório ir para o cliente, uma pessoa o libera.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Descrição do problema D1–D3** | Descreve a equipe, o problema (é/não é) e as ações de contenção. (saída estruturada) | Reclamação |
| **Análise de causas D4** | Busca as causas de ocorrência e de não detecção com os 5 porquês. | Descrição do problema D1–D3, Reclamação |
| **Planejamento de ações D5–D7** | Planeja ações corretivas, sua verificação e a prevenção. | Análise de causas D4 |
| **Relatório 8D** | Reúne todas as etapas em um relatório 8D estruturado. (saída estruturada) | Descrição do problema D1–D3, Análise de causas D4, Planejamento de ações D5–D7, Contenção de emergência |
| **Contenção de emergência** | Planeja a contenção das próximas 24 horas em casos críticos. | Gravidade |

**Entrada:** A reclamação do cliente com peça, lote, defeito e taxa de defeitos, além das informações internas conhecidas sobre produção, material e inspeção. Você também pode anexar a carta de reclamação, dados de medição e fotos do defeito como arquivos; os arquivos de exemplo contêm uma carta de reclamação fictícia (PDF) e medições (Excel).

**Arquivos de exemplo:** `Reclamacao_G-220_lote_24-117.pdf`, `Medicoes_ganchos.xlsx`

**Casos de teste:** Reclamação no texto; Carta de reclamação e medições como arquivos

**Resultado:** Um relatório 8D estruturado com um campo para cada disciplina D1 a D8 e uma lista de pontos em aberto que a equipe ainda precisa esclarecer. Após a liberação, a execução salva o relatório em PDF e como arquivo Word editável. O agente de relatório também propõe aprendizados para o conhecimento; só é salvo o que você adotar explicitamente.

**Como adaptar:** Substitua os dados de teste pela sua reclamação e anexe diretamente registros de inspeção, desenhos ou fotos. Se você usa um formulário próprio, ajuste os campos do agente de relatório em "Formato de saída". Aprendizados adotados de reclamações anteriores podem ser atribuídos como conhecimento à análise de causas.

## 3 · Comparar propostas de fornecedores {#supplier-comparison}
<!-- keywords: logística e compras, analista de custos, analista de riscos, recomendação de compra -->

**Área:** Logística e compras · **Agentes:** 3 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

O menor preço unitário raramente é a proposta mais barata. O workflow compara propostas por custo total e risco de fornecimento e justifica uma recomendação para compras.

**Como os agentes trabalham juntos:** O analista de custos e o analista de riscos trabalham em paralelo. Um calcula o custo total de propriedade por proposta com a calculadora, o outro avalia prazo de entrega, dependências e qualidade. A recomendação de compra pondera os dois e entrega um resultado estruturado.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de custos** | Calcula o custo total por proposta com a calculadora. (Ferramentas: `calculator`) | Propostas |
| **Analista de riscos** | Avalia riscos de prazo, dependência, capacidade e qualidade. | Propostas |
| **Recomendação de compra** | Pondera custos e riscos e recomenda um fornecedor. (saída estruturada) | Analista de custos, Analista de riscos |

**Entrada:** Várias propostas com preço, frete, prazo de entrega, quantidade mínima, condições de pagamento e dados de qualidade, além dos seus custos internos. Você pode escrever as propostas no texto ou anexá-las como arquivos, inclusive misturando PDF, Word e Excel; os três arquivos de exemplo mostram exatamente isso.

**Arquivos de exemplo:** `Proposta_A_Exemplo_Precisao.pdf`, `Proposta_B_Exemplo_Componentes.docx`, `Proposta_C_Amostra_Pecas_Metalicas.xlsx`

**Casos de teste:** Três propostas no texto; Três propostas em PDF, Word e Excel

**Resultado:** Uma recomendação estruturada com classificação, justificativas, riscos, pontos de negociação e premissas usadas. A execução também a salva como relatório em PDF e como arquivo Excel com uma planilha por lista.

**Como adaptar:** Anexe as suas propostas como arquivos e informe a demanda e os custos no texto. Se você tem pesos fixos (por exemplo 50 % custo, 30 % risco, 20 % qualidade), acrescente-os no prompt de sistema da recomendação de compra. Contratos-quadro ou avaliações de fornecedores podem ser salvos como conhecimento e atribuídos ao analista de riscos.

## 4 · Estratégia SWOT para uma pequena empresa {#sme-swot}
<!-- keywords: empresas e pmes, análise interna, análise do ambiente, desenvolvedor de estratégia, revisor crítico -->

**Área:** Empresas e PMEs · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** arquivos de resultado

Muitas pequenas empresas conhecem seus problemas, mas não a melhor ordem para enfrentá-los. O workflow cria uma análise SWOT, deriva estratégias dela e as submete a um revisor crítico.

**Como os agentes trabalham juntos:** A análise interna (forças, fraquezas) e a análise do ambiente (oportunidades, ameaças) rodam em paralelo. O desenvolvedor de estratégia combina as duas em estratégias segundo a matriz TOWS e um plano de 90 dias. O revisor crítico busca pontos fracos e informações ausentes; o resultado contém estratégia e revisão. No final, o resultado é salvo com a execução como arquivo Markdown e PDF.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Análise interna** | Identifica forças e fraquezas a partir dos dados da empresa. | Perfil da empresa |
| **Análise do ambiente** | Deriva oportunidades e ameaças do mercado e do ambiente. | Perfil da empresa |
| **Desenvolvedor de estratégia** | Desenvolve estratégias segundo a matriz TOWS e um plano de 90 dias. | Análise interna, Análise do ambiente |
| **Revisor crítico** | Questiona a estratégia e revela pontos fracos. (saída estruturada) | Desenvolvedor de estratégia, Perfil da empresa |

**Entrada:** Um perfil curto da empresa com números-chave, oferta, pontos fortes, problemas, ambiente de mercado e metas.

**Casos de teste:** Marcenaria com sucessão não definida

**Resultado:** Uma matriz SWOT com estratégias derivadas e um plano de 90 dias, além de uma revisão crítica estruturada com parecer, pontos fracos, informações ausentes e próximos passos.

**Como adaptar:** Descreva sua empresa no mesmo estilo. Quanto mais precisos os números e as metas, mais concreta a estratégia. Você pode carregar estudos setoriais ou pesquisas com clientes como conhecimento e atribuí-los à análise do ambiente.

## 5 · Análise financeira {#financial-analysis}
<!-- keywords: finanças e investimentos, agente de pesquisa, agente de análise, agente de revisão -->

**Área:** Finanças e investimentos · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento

Números de relatórios anuais são citados rapidamente, mas raramente recalculados e colocados em contexto. O workflow extrai os números, calcula margens e crescimento com exatidão e faz revisar o resultado criticamente.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** Uma cadeia sequencial de três agentes: o agente de pesquisa organiza os números com período e unidade, o agente de análise calcula indicadores com a calculadora e o agente de revisão verifica os cálculos e a lógica e resume o resultado de forma estruturada.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Agente de pesquisa** | Reúne números e contexto dos dados financeiros. | Tarefa |
| **Agente de análise** | Calcula margens, crescimento e índices de estabilidade com a calculadora. (Ferramentas: `calculator`) | Agente de pesquisa |
| **Agente de revisão** | Revisa a análise e a resume de forma estruturada. (saída estruturada) | Agente de análise, Agente de pesquisa |

**Entrada:** Números financeiros de uma empresa de pelo menos dois anos, por exemplo do relatório anual ou trimestral, e os efeitos extraordinários conhecidos. Você pode colar os números ou anexá-los como arquivo Excel, CSV ou PDF; o arquivo de exemplo contém os indicadores da tarefa de teste.

**Arquivos de exemplo:** `Indicadores_Exemplo_Industrias.xlsx`

**Casos de teste:** Indicadores no texto; Indicadores como arquivo Excel

**Resultado:** Uma revisão estruturada com resumo, principais indicadores, erros ou riscos encontrados, limites da análise e a indicação se a análise é considerada correta, também em PDF e como arquivo Excel. O agente de pesquisa propõe os números extraídos para o conhecimento; só é adotado o que você confirmar. O resultado não é recomendação de investimento.

**Como adaptar:** Anexe diretamente o relatório anual ou a sua tabela de indicadores. Outros indicadores, como alavancagem ou fluxo de caixa livre, são acrescentados no prompt de sistema do agente de análise. Para muitas empresas em sequência, use o processamento em lote com uma linha por empresa.

## 6 · Artigo de blog {#blog-article}
<!-- keywords: marketing e conteúdo, público, estrutura, redator, revisão -->

**Área:** Marketing e conteúdo · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Iniciante · **Elementos:** arquivos de resultado

Bons artigos nascem de um público claro e de uma estrutura bem pensada. O workflow divide o trabalho como uma redação e verifica o resultado antes da publicação.

**Como os agentes trabalham juntos:** Público e estrutura são criados em paralelo com um modelo rápido. O redator transforma os dois no artigo; uma verificação de qualidade integrada garante que ele siga a estrutura e responda às perguntas dos leitores. A revisão verifica extensão e legibilidade com a ferramenta de estatísticas de texto e marca afirmações não verificadas.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Público** | Descreve os leitores, suas perguntas e o que já sabem. | Tema |
| **Estrutura** | Cria o título e a estrutura. | Tema |
| **Redator** | Escreve o artigo a partir da estrutura e do público. (com verificação de qualidade) | Público, Estrutura |
| **Revisão** | Verifica extensão e legibilidade e entrega a versão final. (Ferramentas: `text_statistics`) | Redator |

**Entrada:** Um tema em uma frase. Opcionalmente, acrescente o público, o tom ou a extensão desejada diretamente na entrada.

**Casos de teste:** Tema em uma frase

**Resultado:** Um artigo pronto em Markdown com títulos, uma meta descrição e breves notas de revisão com a contagem de palavras e indicações de afirmações que devem ser comprovadas antes da publicação. A execução também salva o resultado como arquivo Markdown e HTML, que você pode levar para o seu CMS.

**Como adaptar:** Mude o tema na entrada. Você pode carregar seu guia de estilo como conhecimento e atribuí-lo ao redator e à revisão. Defina a extensão desejada no prompt de sistema do redator.

## 7 · Preparar uma proposta sob medida {#sales-offer}
<!-- keywords: vendas, analista de necessidades, consultor de soluções, redator da proposta -->

**Área:** Vendas · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Avançado · **Elementos:** aprovação, formulário de entrada, arquivos de resultado, arquivos como entrada

Uma boa proposta responde à necessidade real do cliente, não só às palavras-chave dele. O workflow esclarece a necessidade, calcula uma solução adequada e redige uma proposta completa.

**Como os agentes trabalham juntos:** O analista de necessidades separa requisitos explícitos e implícitos e reúne perguntas em aberto. O consultor de soluções monta itens da tabela de preços e calcula com a calculadora, incluindo uma variante dentro do orçamento. O redator da proposta redige a proposta; uma verificação de qualidade integrada confere completude e preços. Um formulário de entrada recebe os dados principais (cliente, prazo, orçamento, montagem no fim de semana); antes do envio, uma pessoa aprova a proposta.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de necessidades** | Identifica requisitos explícitos e implícitos. | Solicitação do cliente |
| **Consultor de soluções** | Monta itens adequados e calcula com a calculadora. (Ferramentas: `calculator`) | Analista de necessidades, Solicitação do cliente |
| **Redator da proposta** | Redige o rascunho da proposta para o cliente. (com verificação de qualidade) | Analista de necessidades, Consultor de soluções |

**Entrada:** A solicitação do cliente e a sua tabela de preços com descontos e condições. O formulário recebe os dados principais; a tabela de preços você pode escrever no texto ou anexar como arquivo Excel, CSV ou PDF, como mostra o arquivo de exemplo.

**Arquivos de exemplo:** `Tabela_precos_moveis_escritorio.xlsx`

**Casos de teste:** Solicitação e tabela de preços no texto; Tabela de preços como arquivo Excel

**Resultado:** Um rascunho de proposta com carta de apresentação, tabela de itens, totais, variantes, premissas e perguntas em aberto. Só depois da sua aprovação a execução salva a proposta em PDF e como arquivo Word editável.

**Como adaptar:** Anexe a sua tabela de preços atual como arquivo; assim basta a solicitação do cliente como texto. Condições de pagamento e textos padrão são acrescentados no prompt de sistema do redator da proposta.

## 8 · Responder solicitações de clientes {#customer-service}
<!-- keywords: atendimento ao cliente, classificador, verificador de políticas, redator de respostas, desescalada -->

**Área:** Atendimento ao cliente · **Agentes:** 4 · **Padrão:** com ramificações · **Nível:** Iniciante · **Elementos:** decisão, aprovação, formulário de entrada, arquivos como entrada

No atendimento ao cliente muitas solicitações chegam ao mesmo tempo, e cada uma precisa da regra certa e do tom certo. O workflow classifica as solicitações, verifica políticas e prazos e prepara respostas para aprovação.

**Como os agentes trabalham juntos:** Um classificador rápido organiza cada solicitação por assunto, urgência e humor. O verificador de políticas aplica a política de atendimento e recalcula prazos com a ferramenta de datas. O redator de respostas redige as respostas; uma verificação de qualidade garante que nada seja prometido além da política. Um nó de decisão envia os escalonamentos primeiro a um agente de desescalada. Cada rascunho aguarda aprovação; uma rejeição com retorno devolve os rascunhos, por um laço, ao redator de respostas, que os revisa e os envia de novo para aprovação (no máximo três rodadas).

| Agente | Tarefa | Recebe |
|---|---|---|
| **Classificador** | Organiza cada solicitação por assunto, urgência e humor. (saída estruturada) | Solicitações |
| **Verificador de políticas** | Aplica a política de atendimento e verifica prazos com a ferramenta de datas. (Ferramentas: `days_between`) | Classificador, Solicitações |
| **Redator de respostas** | Redige rascunhos de resposta cordiais para aprovação. (com verificação de qualidade) | Classificador, Verificador de políticas, Desescalada, Aprovar respostas |
| **Desescalada** | Prepara como lidar com clientes irritados e o que precisa de aprovação. | Escalonar? |

**Entrada:** Várias solicitações de clientes com dados de pedido e entrega, a data de hoje e a sua política de atendimento, como trecho no texto ou como arquivo (PDF, Word, Markdown); o arquivo de exemplo contém uma política mais detalhada.

**Arquivos de exemplo:** `Politica_atendimento_Cozinha_Amostra.pdf`

**Casos de teste:** Quatro solicitações, uma delas irritada; Uma pergunta gentil sobre um produto; Política como arquivo PDF

**Resultado:** Para cada solicitação, uma classificação, a regra aplicável com verificação de prazo e um rascunho de resposta que uma pessoa aprova antes do envio.

**Como adaptar:** Anexe a sua política completa e as perguntas frequentes como arquivo, ou carregue-as como conhecimento e atribua-as ao verificador de políticas se valerem de forma permanente. O tom da sua marca (você ou senhor/senhora, despedida) é definido no prompt de sistema do redator de respostas. Para muitas solicitações de uma vez, use o processamento em lote.

## 9 · Divulgar uma vaga e preparar entrevistas {#hr-recruiting}
<!-- keywords: recursos humanos, perfil da vaga, anúncio da vaga, roteiro de entrevista, revisor de imparcialidade, revisão -->

**Área:** Recursos humanos · **Agentes:** 5 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, arquivos de resultado

Uma boa contratação começa com um perfil claro e entrevistas justas e comparáveis. O workflow transforma anotações soltas em perfil da vaga, anúncio e roteiro de entrevista e verifica a imparcialidade de tudo.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** O agente de perfil organiza atividades e requisitos. A partir disso, o anúncio da vaga e o roteiro de entrevista são criados em paralelo. O revisor de imparcialidade verifica os dois em busca de formulações discriminatórias ou não permitidas, por exemplo sobre idade ou língua materna, e indica o que uma pessoa precisa verificar. Se ele tiver objeções, um nó de decisão encaminha os documentos para uma revisão que aplica as sugestões; caso contrário, ficam as primeiras versões.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Perfil da vaga** | Organiza atividades, requisitos obrigatórios e desejáveis e competências. | Necessidade de contratação |
| **Anúncio da vaga** | Redige um anúncio de vaga atraente e inclusivo. | Perfil da vaga |
| **Roteiro de entrevista** | Prepara perguntas de entrevista estruturadas com critérios de avaliação. | Perfil da vaga |
| **Revisor de imparcialidade** | Verifica anúncio e roteiro quanto a discriminação e perguntas inadmissíveis. (saída estruturada) | Anúncio da vaga, Roteiro de entrevista |
| **Revisão** | Aplica ao anúncio e ao roteiro as alterações sugeridas pela revisão de imparcialidade. | Precisa de revisão? |

**Entrada:** Anotações sobre a vaga: atividades, qualificações desejadas, equipe, condições e remuneração.

**Casos de teste:** Anotações com desejos problemáticos

**Resultado:** Perfil da vaga, anúncio da vaga e roteiro de entrevista com âncoras de avaliação, uma revisão de imparcialidade estruturada e, se houver objeções, uma versão revisada com a lista de alterações, também como arquivo Word. Os documentos precisam ser aprovados pelo RH ou por uma pessoa qualificada antes da publicação.

**Como adaptar:** Substitua as anotações pela sua necessidade de contratação. Você pode guardar seu perfil de empregador e seus benefícios como conhecimento e atribuí-los ao agente do anúncio. Acrescente as exigências legais do seu país ao prompt de sistema do revisor de imparcialidade. Não amplie o fluxo para triar, avaliar ou classificar candidatos sem uma análise jurídica: pelo Regulamento de IA da UE, esses sistemas são IA de alto risco.

## 10 · Transformar uma pergunta de pesquisa em hipóteses {#research-hypotheses}
<!-- keywords: pesquisa e desenvolvimento, analista da pergunta, desenvolvedor de hipóteses, crítico metodológico, planejador de experimentos -->

**Área:** Pesquisa e desenvolvimento · **Agentes:** 4 · **Padrão:** sequencial · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento

Uma boa pesquisa começa com uma pergunta precisa e testável. O workflow decompõe uma pergunta de pesquisa, formula hipóteses, submete-as a uma crítica metodológica e deriva um plano de experimentos realista.

**Como os agentes trabalham juntos:** Uma cadeia sequencial com retorno: o analista esclarece variáveis e premissas, o agente de hipóteses formula hipóteses testáveis com hipóteses nulas, o crítico metodológico as confronta com os dados preliminares usando a calculadora e aponta fatores de confusão. O planejador de experimentos usa hipóteses e crítica em conjunto.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista da pergunta** | Esclarece objetivo, variáveis, restrições e lacunas de conhecimento. | Pergunta de pesquisa |
| **Desenvolvedor de hipóteses** | Formula hipóteses testáveis com previsões e hipóteses nulas. | Analista da pergunta |
| **Crítico metodológico** | Verifica testabilidade das hipóteses, fatores de confusão e dados disponíveis. (Ferramentas: `calculator`) | Desenvolvedor de hipóteses, Pergunta de pesquisa |
| **Planejador de experimentos** | Deriva um plano de experimentos das hipóteses e da crítica. | Desenvolvedor de hipóteses, Crítico metodológico |

**Entrada:** Uma pergunta de pesquisa com objetivo, dados de ensaios preliminares e restrições como material, tempo e equipamentos. Você pode anexar dados de medição e documentos como arquivos; o arquivo de exemplo contém os valores do ensaio preliminar por chapa.

**Arquivos de exemplo:** `Ensaio_preliminar_PL-7.csv`

**Casos de teste:** Pergunta e ensaio preliminar no texto; Dados do ensaio preliminar em CSV

**Resultado:** Um plano de experimentos com hipóteses, fatores e níveis, tamanho da amostra, método de medição, análise e critérios de interrupção, além dos riscos em aberto, também como arquivo Word. O planejador de experimentos propõe o plano para o conhecimento; você decide se ele é salvo.

**Como adaptar:** Substitua a pergunta e o ensaio preliminar pelos seus e anexe os dados de medição diretamente. A literatura de que você precisa com frequência pode ser carregada como conhecimento no modo "Pesquisa" e atribuída ao analista da pergunta, para que ele trabalhe com citações. Acrescente as suas diretrizes estatísticas no crítico metodológico.

## 11 · Revisão de código com testes {#code-review}
<!-- keywords: desenvolvimento de software, analista de bugs, revisor de segurança, correção e testes -->

**Área:** Desenvolvimento de software · **Agentes:** 3 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

Um segundo olhar encontra bugs antes que cheguem à produção. O workflow verifica o código ao mesmo tempo quanto a erros de lógica e problemas de segurança e entrega uma versão melhorada com testes.

**Como os agentes trabalham juntos:** O analista de bugs e o revisor de segurança trabalham em paralelo no mesmo código. O agente de melhoria reúne as constatações e escreve código corrigido e testes pytest; uma verificação de qualidade integrada garante que cada constatação seja tratada e coberta por testes.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de bugs** | Procura erros de lógica, casos-limite e desvios da descrição. | Código-fonte |
| **Revisor de segurança** | Verifica o código quanto a vulnerabilidades e padrões inseguros. | Código-fonte |
| **Correção e testes** | Escreve código corrigido e testes pytest para todas as constatações. (com verificação de qualidade) | Analista de bugs, Revisor de segurança, Código-fonte |

**Entrada:** Um trecho de código com um breve contexto: linguagem, finalidade e ambiente, ou um projeto inteiro como arquivo ZIP ou arquivos avulsos no campo de arquivo. Arquivos compactados são apenas lidos, nunca executados. O código permanece inalterado na sua linguagem; as explicações aparecem no idioma da interface. O arquivo de exemplo é um pequeno projeto Python com erros embutidos.

**Arquivos de exemplo:** `calculadora-descontos.zip`

**Casos de teste:** Trecho de código no texto; Projeto como arquivo ZIP

**Resultado:** Uma lista de achados ordenada por gravidade, o código corrigido e testes pytest que cobrem cada achado, também como arquivo Markdown. Os testes não são executados automaticamente; rode-os localmente.

**Como adaptar:** Anexe o seu projeto como ZIP ou cole o código e informe a linguagem e o framework. Para outras linguagens, ajuste o framework de testes no agente de correção, por exemplo Jest ou JUnit. As suas diretrizes de código podem ser salvas como conhecimento. Pela API do workflow, a revisão também pode ser disparada a partir de um pipeline de CI.

## 12 · Estruturar um contrato e encontrar pontos de verificação {#contract-review}
<!-- keywords: direito e administração, estruturador do contrato, explicador de cláusulas, analista de pontos de verificação, visão geral do contrato, cláusulas críticas -->

**Área:** Direito e administração · **Agentes:** 5 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento

Contratos são longos, e cláusulas importantes se escondem nos detalhes. O workflow estrutura um contrato, explica-o em linguagem simples e reúne pontos que uma pessoa qualificada deveria verificar. Ele não substitui aconselhamento jurídico.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** O estruturador levanta partes, vigência, serviços e prazos. Com base nisso, o explicador de cláusulas (linguagem simples) e o analista de pontos de verificação (regras incomuns ou unilaterais) trabalham em paralelo; os dois leem o contrato por conta própria, como texto ou como arquivo enviado. Se o analista encontrar cláusulas críticas, um nó de decisão acrescenta uma análise aprofundada dessas cláusulas. O agente de relatório reúne tudo em uma visão geral estruturada com perguntas para a assessoria jurídica.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Estruturador do contrato** | Registra partes, objeto, vigência, preços e prazos. | Texto do contrato |
| **Explicador de cláusulas** | Explica cada cláusula em linguagem simples. | Estruturador do contrato, Texto do contrato |
| **Analista de pontos de verificação** | Encontra disposições incomuns, desequilibradas ou ausentes. (saída estruturada) | Estruturador do contrato, Texto do contrato |
| **Visão geral do contrato** | Reúne explicações e pontos de verificação em uma visão geral estruturada. (saída estruturada) | Explicador de cláusulas, Analista de pontos de verificação, Cláusulas críticas |
| **Cláusulas críticas** | Examina a fundo as cláusulas críticas e prepara perguntas para a negociação. | Cláusulas críticas? |

**Entrada:** O contrato como arquivo (PDF, Word, Markdown ou texto) no campo "Contrato como arquivo" ou como texto, de preferência com a numeração das cláusulas. Você envia o arquivo diretamente ao iniciar; não precisa de uma coleção de conhecimento para isso. O arquivo de exemplo contém o contrato fictício da tarefa de teste.

**Arquivos de exemplo:** `Contrato_servico_software_exemplo.docx`

**Casos de teste:** Contrato no texto, com cláusulas críticas; Contrato como arquivo Word, sem texto; Contrato de manutenção equilibrado

**Resultado:** Uma visão geral estruturada com resumo, dados principais, cláusulas explicadas, pontos de verificação e perguntas para um advogado ou uma advogada, também em PDF e como arquivo Word editável. O estruturador propõe os dados principais do contrato para o conhecimento, por exemplo para um cadastro de contratos; só é salvo o que você confirmar.

**Como adaptar:** Envie o seu contrato como arquivo ao iniciar ou cole-o. Os seus próprios critérios, como requisitos mínimos de responsabilidade ou proteção de dados, são acrescentados no prompt de sistema do analista de pontos de verificação. Contratos-modelo para comparação podem ser salvos como conhecimento e atribuídos a esse analista.

## 13 · Criar um plano de estudos pessoal {#learning-plan}
<!-- keywords: educação e formação, diagnóstico de aprendizagem, planejador de estudos, tutor, autor do quiz -->

**Área:** Educação e formação · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

Aprender funciona melhor com um plano que começa de onde você está. O workflow cria um plano de estudos pessoal, explica os primeiros temas e verifica a compreensão com um quiz.

**Como os agentes trabalham juntos:** O diagnóstico de aprendizagem determina o ponto de partida e as lacunas, e o planejador de estudos cria com isso um plano semanal. Com base nele, o tutor (conteúdos da semana escolhida, apoiados no seu material do curso se você quiser) e o autor do quiz (verificação de conhecimentos com gabarito) trabalham em paralelo. O resultado contém as três partes.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Diagnóstico de aprendizagem** | Determina o ponto de partida, o objetivo de aprendizagem e as lacunas. | Objetivo de aprendizagem |
| **Planejador de estudos** | Cria um plano semanal com objetivos de aprendizagem e exercícios. | Diagnóstico de aprendizagem |
| **Tutor** | Explica o conteúdo da primeira semana com exemplos e exercícios. | Planejador de estudos, Objetivo de aprendizagem |
| **Autor do quiz** | Cria uma verificação de conhecimentos com respostas para a primeira semana. | Planejador de estudos |

**Entrada:** Quem está aprendendo, o objetivo, o tempo disponível, os conhecimentos prévios e o estilo de aprendizagem preferido. No formulário você escolhe a semana a ser elaborada e pode anexar material próprio; o arquivo de exemplo é um guia curto sobre tabelas dinâmicas.

**Arquivos de exemplo:** `Guia_rapido_tabelas_dinamicas.docx`

**Casos de teste:** Semana 1 sem material; Semana 2 com material do curso

**Resultado:** Um plano de estudos de quatro semanas com objetivos por semana, explicações claras com exercícios para a semana escolhida e um quiz com gabarito e explicações, também em PDF para imprimir.

**Como adaptar:** Descreva o seu próprio objetivo; funciona para quase qualquer tema. Para as semanas seguintes, inicie o workflow de novo e mude a semana no formulário. Material que você usa sempre pode ser carregado como conhecimento e atribuído ao tutor.

## 14 · Verificar o orçamento doméstico e economizar {#household-budget}
<!-- keywords: pessoas físicas – finanças, analista de orçamento, consultor de economia, verificação de realidade -->

**Área:** Pessoas físicas – finanças · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

No fim do mês muitas vezes sobra menos do que o esperado. O workflow recalcula um orçamento doméstico, encontra potenciais de economia e verifica se as sugestões são realistas no dia a dia.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** O analista de orçamento calcula totais, saldo e participações por categoria com a calculadora. O consultor de economia estima economias concretas, também recalculadas. A verificação de realidade recebe os dois resultados, verifica a viabilidade e entrega um resultado estruturado.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de orçamento** | Calcula receitas, despesas, saldo e participações com a calculadora. (Ferramentas: `calculator`) | Orçamento doméstico |
| **Consultor de economia** | Encontra formas concretas de economizar e estima seu efeito. (Ferramentas: `calculator`) | Analista de orçamento, Orçamento doméstico |
| **Verificação de realidade** | Verifica a viabilidade das sugestões e as resume. (saída estruturada) | Analista de orçamento, Consultor de economia |

**Entrada:** Receitas, despesas fixas e variáveis de uma família e uma meta de poupança. Em vez de digitar tudo, você pode anexar o extrato bancário ou um controle de gastos como arquivo CSV ou Excel; o arquivo de exemplo contém um mês fictício.

**Arquivos de exemplo:** `Extrato_bancario_marco_2026.csv`

**Casos de teste:** Orçamento no texto; Extrato bancário em CSV

**Resultado:** Uma verificação estruturada do orçamento com o saldo mensal atual, potencial de economia, medidas, primeiros passos rápidos e observações, também como arquivo Excel. Não substitui aconselhamento financeiro ou de endividamento.

**Como adaptar:** Anexe o seu próprio extrato ou informe os seus números; prioridades pessoais, como "o carro fica", vão no texto. Extratos bancários contêm dados pessoais: eles ficam com você e só são passados ao modelo para esta execução.

## 15 · Planejar uma viagem pessoal {#travel-plan}
<!-- keywords: pessoas físicas – viagens, planejador de roteiro, planejador de orçamento, planejador de organização, documentos de viagem -->

**Área:** Pessoas físicas – viagens · **Agentes:** 4 · **Padrão:** com ramificações · **Nível:** Iniciante · **Elementos:** decisão, formulário de entrada, arquivos de resultado

Uma boa viagem combina com os interesses, o orçamento e as limitações de todos os viajantes. O workflow planeja um roteiro, recalcula o orçamento e cria uma checklist para a organização.

**Como os agentes trabalham juntos:** O planejador de roteiro monta um plano dia a dia conforme interesses e restrições. O planejador de orçamento calcula noites e custos com a calculadora e a ferramenta de datas. O planejador de organização reúne tudo em um plano de viagem com checklist; uma verificação de qualidade confere orçamento e restrições. Um formulário de entrada recebe destino, datas, viajantes e orçamento. Para viagens ao exterior, um nó de decisão acrescenta uma lista de documentos e regras de entrada.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Planejador de roteiro** | Monta um plano diário conforme interesses e limitações. | Desejos de viagem |
| **Planejador de orçamento** | Calcula noites e custos com a calculadora e a ferramenta de datas. (Ferramentas: `calculator`, `days_between`) | Planejador de roteiro |
| **Planejador de organização** | Reúne roteiro e orçamento em um plano de viagem com checklist. (com verificação de qualidade) | Planejador de roteiro, Planejador de orçamento, Documentos de viagem |
| **Documentos de viagem** | Lista documentos, seguro e regras de entrada para viagens ao exterior. | Exterior? |

**Entrada:** Quem viaja, destino e datas, orçamento, interesses e limitações.

**Casos de teste:** Viagem em família para Lisboa (exterior); Fim de semana no próprio país

**Resultado:** Um plano de viagem com roteiro diário, tabela de orçamento e checklist, também em PDF para levar. Preços e horários são estimativas com base em conhecimento geral e precisam ser verificados antes da reserva, porque o workflow não usa dados em tempo real.

**Como adaptar:** Insira seus desejos de viagem. Se quiser preços e horários atuais, você pode adicionar a ferramenta de servidor "busca na web" ao planejador de roteiro; ela tem custo extra por busca.

## 16 · Avaliar uma ideia de negócio {#business-idea}
<!-- keywords: autônomos e empreendedores, analista de mercado, calculista de rentabilidade, analista de riscos, júri de investidores -->

**Área:** Autônomos e empreendedores · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** arquivos de resultado

Antes de abrir um negócio vale a pena olhar com sobriedade para o mercado, os números e os riscos. O workflow faz três especialistas examinarem a ideia ao mesmo tempo e um júri chegar a um parecer fundamentado.

**Como os agentes trabalham juntos:** Três agentes trabalham em paralelo: o analista de mercado estima públicos-alvo e concorrência, o calculista de rentabilidade determina o ponto de equilíbrio e cenários com a calculadora, o analista de riscos busca pontos fracos. O júri de investidores pondera tudo e entrega um parecer estruturado com nota.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de mercado** | Estima públicos-alvo, demanda e concorrência. | Ideia de negócio |
| **Calculista de rentabilidade** | Calcula margem de contribuição, ponto de equilíbrio e cenários com a calculadora. (Ferramentas: `calculator`) | Ideia de negócio |
| **Analista de riscos** | Busca pontos fracos e riscos da ideia. | Ideia de negócio |
| **Júri de investidores** | Pondera mercado, números e riscos e chega a um parecer. (saída estruturada) | Analista de mercado, Calculista de rentabilidade, Analista de riscos |

**Entrada:** Uma descrição da ideia com oferta, públicos-alvo, preços, custos, capacidade e concorrentes conhecidos.

**Casos de teste:** Serviço móvel de conserto de bicicletas

**Resultado:** Um veredito estruturado (seguir, ajustar ou descartar) com pontuação, pontos fortes, riscos, premissas a testar e próximos passos concretos para validar a ideia, também como relatório em PDF.

**Como adaptar:** Descreva sua ideia com seus números. Quanto mais honestas as premissas, mais útil o parecer. Carregue seus próprios dados de mercado ou resultados de pesquisas como conhecimento e atribua-os ao analista de mercado.

## 17 · Desenvolver uma estratégia para redes sociais {#creator-strategy}
<!-- keywords: influenciadores e criadores de conteúdo, agente de estratégia, desenvolvedor de ideias, planejador de conteúdo -->

**Área:** Influenciadores e criadores de conteúdo · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada, memória

Publicar com regularidade exige uma direção clara e um plano que caiba no seu tempo disponível. O workflow deriva uma estratégia das métricas, reúne ideias adequadas e planeja a publicação.

**Como os agentes trabalham juntos:** Uma cadeia de três agentes: o agente de estratégia define posicionamento, pilares de conteúdo e metas e analisa para isso as estatísticas anexadas, o desenvolvedor de ideias formula ideias concretas de posts com gancho e o planejador de conteúdo as distribui em quatro semanas. O desenvolvedor de ideias guarda as suas sugestões em uma memória para que execuções posteriores não repitam ideias. Um controle de qualidade verifica se a frequência e o mix são realistas.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Agente de estratégia** | Define posicionamento, pilares de conteúdo e metas mensuráveis. | Perfil do criador |
| **Desenvolvedor de ideias** | Desenvolve ideias concretas de posts com gancho e formato. | Agente de estratégia |
| **Planejador de conteúdo** | Distribui as ideias em um plano realista de quatro semanas. (com verificação de qualidade) | Agente de estratégia, Desenvolvedor de ideias |

**Entrada:** Perfil com plataformas, números, posts de sucesso, público, metas, tempo disponível e data de início. Você também pode anexar estatísticas como capturas de tela ou como exportação CSV/Excel; o arquivo de exemplo é uma exportação assim.

**Arquivos de exemplo:** `Estatisticas_posts_marco.csv`

**Casos de teste:** Perfil no texto; Perfil com exportação de estatísticas

**Resultado:** Um calendário editorial de quatro semanas com data, plataforma, formato, ideia, gancho e chamada para ação, precedido de um breve resumo da estratégia, também como arquivo Excel para continuar planejando.

**Como adaptar:** Informe o seu perfil e os seus números ou anexe capturas de tela das suas estatísticas. O estilo da sua marca e os temas proibidos são acrescentados no prompt de sistema do desenvolvedor de ideias. A memória "creator-ideas" fica em Memória; limpe-a se quiser recomeçar. Para um plano mensal, você pode agendar a cópia.

## 18 · Comparar ofertas de imóveis {#real-estate}
<!-- keywords: imóveis, calculista de rentabilidade, analista de imóvel e localização, avaliação de oportunidades e riscos -->

**Área:** Imóveis · **Agentes:** 3 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

Em imóveis, números e localização decidem juntos. O workflow recalcula rentabilidade e fluxo de caixa, analisa o imóvel e sua localização e confronta oportunidades e riscos.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** O calculista de rentabilidade determina o rendimento bruto e líquido do aluguel e o fluxo de caixa mensal com a calculadora, enquanto o analista de imóvel e localização avalia em paralelo estado, reservas e entorno. A avaliação reúne os dois em uma comparação estruturada.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Calculista de rentabilidade** | Calcula rentabilidade, financiamento e fluxo de caixa com a calculadora. (Ferramentas: `calculator`) | Ofertas |
| **Analista de imóvel e localização** | Avalia estado, reservas, facilidade de locação e localização. | Ofertas |
| **Avaliação de oportunidades e riscos** | Confronta os números com a avaliação do imóvel e compara de forma estruturada. (saída estruturada) | Calculista de rentabilidade, Analista de imóvel e localização |

**Entrada:** Pelo menos duas ofertas com preço de compra, área, aluguel, condomínio, fundo de reserva e localização, além das suas premissas de financiamento. Anúncios, atas e plantas você anexa como PDF, Word ou imagem; os arquivos de exemplo contêm um anúncio com trecho de ata e uma planta da oferta 2.

**Arquivos de exemplo:** `Anuncio_oferta_2_predio_antigo.pdf`, `Planta_oferta_2.png`

**Casos de teste:** Duas ofertas no texto; Com anúncio e planta

**Resultado:** Uma comparação estruturada com indicadores, oferta preferida, oportunidades, riscos e pontos a verificar antes de uma decisão, também em PDF. Não substitui aconselhamento financeiro, tributário ou jurídico nem uma visita.

**Como adaptar:** Informe as suas ofertas e dados de financiamento e anexe diretamente anúncios, atas de assembleia ou plantas. Um índice de aluguéis de que você precisa com frequência pode ser salvo como conhecimento e atribuído ao analista de imóvel e localização.

## 19 · Analisar atrasos de obra {#construction-delay}
<!-- keywords: construção civil, analista de cronograma, analista de causas, planejador de contramedidas, relatório ao contratante -->

**Área:** Construção civil · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** aprovação, formulário de entrada, arquivos de resultado, arquivos como entrada

Atrasos na obra se acumulam, e os contratantes precisam rapidamente de uma visão clara. O workflow calcula desvios, classifica causas, desenvolve contramedidas e redige um relatório de situação.

**Como os agentes trabalham juntos:** O analista de cronograma e o analista de causas trabalham em paralelo. Um calcula atrasos e folgas com as ferramentas de datas e calculadora, o outro organiza as causas por área de responsabilidade e necessidade de documentação; os dois também analisam cronogramas, diários de obra e fotos anexados. O planejador de contramedidas desenvolve opções de aceleração e o agente de relatório resume tudo para o contratante. Antes que o relatório saia da equipe do projeto, uma pessoa o libera.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de cronograma** | Calcula atrasos, folgas e consequências com a ferramenta de datas e a calculadora. (Ferramentas: `days_between`, `calculator`) | Situação do projeto |
| **Analista de causas** | Classifica as causas por área de responsabilidade e necessidade de documentação. | Situação do projeto |
| **Planejador de contramedidas** | Desenvolve medidas de aceleração com custo e efeito. | Analista de cronograma, Analista de causas |
| **Relatório ao contratante** | Resume de forma objetiva a posição do cronograma, as causas e as medidas. | Analista de cronograma, Planejador de contramedidas, Analista de causas |

**Entrada:** Um cronograma com marcos planejados e reais, observações sobre as causas, data do relatório e condições contratuais, como texto ou como arquivos: cronograma em Excel, diário de obra em PDF, fotos como imagem. Os arquivos de exemplo contêm um cronograma e um trecho do diário de obra.

**Arquivos de exemplo:** `Cronograma_creche_Sol_Nascente.xlsx`, `Diario_de_obra_trecho_abril_maio.pdf`

**Casos de teste:** Cronograma no texto; Cronograma e diário de obra como arquivos

**Resultado:** Um relatório de status objetivo com situação do cronograma, causas, contramedidas, decisões necessárias e riscos. Após a liberação, a execução o salva em PDF e como arquivo Word editável. Questões sobre multas e prorrogação de prazo ficam sujeitas a análise técnica e jurídica.

**Como adaptar:** Exporte o seu cronograma do software de projetos em Excel e anexe o diário de obra e as fotos. Para um relatório periódico, você pode agendar a cópia; a liberação fica então esperando por você.

## 20 · Desenvolver e precificar um cardápio {#restaurant-menu}
<!-- keywords: gastronomia, desenvolvedor de conceito, precificação, redator do cardápio -->

**Área:** Gastronomia · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

Um cardápio precisa agradar aos clientes e dar lucro. O workflow desenvolve pratos para um público, calcula o custo de insumos e os preços e escreve textos de cardápio apetitosos.

**Como os agentes trabalham juntos:** Uma cadeia de três agentes: o desenvolvedor de conceito monta pratos com receitas, a precificação calcula o custo de insumos e os preços de venda com a calculadora, e o redator do cardápio escreve o cardápio. Um controle de qualidade verifica público, preços e o aviso sobre alergênicos. O resultado contém a precificação e o cardápio.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Desenvolvedor de conceito** | Monta pratos adequados com receitas e quantidades. | Conceito |
| **Precificação** | Calcula custo de insumos e preços de venda com a calculadora. (Ferramentas: `calculator`) | Desenvolvedor de conceito, Conceito |
| **Redator do cardápio** | Escreve o cardápio de almoço com descrições apetitosas. (com verificação de qualidade) | Precificação, Desenvolvedor de conceito |

**Entrada:** Tipo de estabelecimento, público, número e tipo de pratos, custo de insumos alvo, faixa de preço e preços de compra. Os preços de compra você pode colar ou anexar como arquivo CSV ou Excel, como mostra o arquivo de exemplo.

**Arquivos de exemplo:** `Precos_compra_Moinho_Exemplo.csv`

**Casos de teste:** Cardápio de almoço com preços no texto; Preços de compra em CSV

**Resultado:** Uma tabela de precificação com custo de insumos e preço por prato e um cardápio de almoço pronto com descrições curtas, também como arquivo Word para diagramar e como arquivo Excel com as tabelas de precificação. Alergênicos e aditivos precisam ser verificados e sinalizados com base nas receitas reais.

**Como adaptar:** Anexe a sua lista atual de preços de compra e descreva o seu público. As suas fichas técnicas podem ser carregadas como conhecimento e atribuídas à precificação; regras da casa, como tamanho das porções, vão no desenvolvedor de conceito. Para a troca a cada duas semanas, você pode agendar a cópia.

## 21 · Planejamento de culturas de uma propriedade {#farm-planning}
<!-- keywords: agricultura, planejador de rotação, cálculo de margem bruta, verificação de plausibilidade -->

**Área:** Agricultura · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

O planejamento de culturas precisa considerar ao mesmo tempo rotação, solos, contratos e rentabilidade. O workflow propõe uma rotação, calcula margens brutas e verifica o plano segundo suas próprias regras.

**Como os agentes trabalham juntos:** Uma cadeia de três agentes: o planejador de rotação atribui uma cultura a cada talhão, o cálculo de margem bruta calcula cada talhão e o total com a calculadora e a verificação de plausibilidade confere regras e riscos e entrega um resultado estruturado.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Planejador de rotação** | Atribui uma cultura a cada talhão conforme regras e solo. | Dados da propriedade |
| **Cálculo de margem bruta** | Calcula as margens brutas por talhão e no total com a calculadora. (Ferramentas: `calculator`) | Planejador de rotação, Dados da propriedade |
| **Verificação de plausibilidade** | Verifica o plano quanto a regras e riscos e o resume. (saída estruturada) | Planejador de rotação, Cálculo de margem bruta |

**Entrada:** Talhões com área, solo e cultura anterior, as suas regras de planejamento e premissas de receita e custos por hectare. Talhões e premissas você pode anexar como arquivo Excel ou CSV; o arquivo de exemplo contém as duas tabelas da tarefa de teste.

**Arquivos de exemplo:** `Cadastro_talhoes_Fazenda_Exemplo.xlsx`

**Casos de teste:** Propriedade no texto; Cadastro de talhões como arquivo Excel

**Resultado:** Um plano de culturas por talhão com margem bruta, uma verificação das regras, riscos e perguntas em aberto, também como arquivo Excel. Exigências legais, por exemplo sobre adubação ou condições de incentivos, precisam ser verificadas com base nas regras locais vigentes.

**Como adaptar:** Anexe o seu cadastro de talhões e os seus dados de cálculo em Excel e informe as suas regras de planejamento. Análises de solo de que você precisa todo ano podem ser carregadas como conhecimento e atribuídas ao planejador de rotação.

## 22 · Planejar a festa de uma associação {#club-event}
<!-- keywords: associações e clubes, planejador de cronograma, planejador de orçamento, planejador de comunicação, documento para a diretoria -->

**Área:** Associações e clubes · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Iniciante · **Elementos:** arquivos de resultado

Festas de associações são organizadas por voluntários no tempo livre. O workflow cria cronograma, tarefas, orçamento e comunicação e resume tudo em um documento para a reunião da diretoria.

**Como os agentes trabalham juntos:** O planejador de cronograma e o planejador de orçamento trabalham em paralelo; um conta regressivamente a partir da festa com a ferramenta de datas, o outro calcula o orçamento com a calculadora. O planejador de comunicação prepara convites e posts alinhados ao cronograma. O documento para a diretoria reúne tudo; uma verificação de qualidade confere completude e responsabilidades.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Planejador de cronograma** | Planeja de trás para frente, a partir do dia da festa, cronograma, tarefas e turnos. (Ferramentas: `days_between`) | Informações-chave |
| **Planejador de orçamento** | Calcula receitas, despesas e reserva com a calculadora. (Ferramentas: `calculator`) | Informações-chave |
| **Planejador de comunicação** | Prepara convites, posts e um comunicado à imprensa. | Planejador de cronograma |
| **Documento para a diretoria** | Resume planejamento, orçamento e comunicação para a diretoria. (com verificação de qualidade) | Planejador de cronograma, Planejador de orçamento, Planejador de comunicação |

**Entrada:** Ocasião, data, local, número de convidados, desejos de programação, voluntários, orçamento e custos conhecidos.

**Casos de teste:** Festa de verão pelo aniversário da associação

**Resultado:** Um documento para a diretoria com cronograma até a festa, tarefas e responsáveis, escala de turnos, orçamento com superávit ou déficit, plano de comunicação e propostas de deliberação, também como arquivo Word para enviar à diretoria.

**Como adaptar:** Insira as informações-chave da sua festa. Licenças e exigências variam conforme o município; acrescente as exigências conhecidas na entrada. Logotipos e modelos de cartaz podem ser guardados como conhecimento.

## 23 · Desenvolver uma campanha de doações {#nonprofit-campaign}
<!-- keywords: organizações sem fins lucrativos, desenvolvedor da campanha, analista de impacto, revisor de credibilidade -->

**Área:** Organizações sem fins lucrativos · **Agentes:** 3 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** arquivos de resultado, propostas de conhecimento

Campanhas de doação precisam de uma história tocante, mas também de afirmações honestas sobre impacto. O workflow desenvolve uma campanha, avalia o possível impacto e verifica se as promessas são críveis e eticamente corretas.

**Como os agentes trabalham juntos:** O desenvolvedor da campanha e o analista de impacto trabalham em paralelo: um concebe mensagem, públicos e ações, o outro constrói um modelo de impacto com indicadores e calcula o custo por criança com a calculadora. O revisor de credibilidade verifica os dois; o resultado contém as três partes.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Desenvolvedor da campanha** | Concebe mensagem, públicos, canais e cronograma da campanha. | Descrição do projeto |
| **Analista de impacto** | Constrói um modelo de impacto com indicadores e o custo por criança. (Ferramentas: `calculator`) | Descrição do projeto |
| **Revisor de credibilidade** | Verifica afirmações quanto a exagero, ética e evidências. (saída estruturada) | Desenvolvedor da campanha, Analista de impacto |

**Entrada:** Organização, projeto, resultados até agora, meta, necessidade de recursos, período da campanha e canais existentes.

**Casos de teste:** Padrinhos de leitura nas escolas

**Resultado:** Um conceito de campanha com cronograma e rascunhos de textos, um modelo de impacto com indicadores e uma revisão estruturada de afirmações exageradas, observações éticas e um plano de medição de impacto, também como arquivo Word. O analista de impacto propõe o seu modelo de impacto para o conhecimento, por exemplo para futuros pedidos de financiamento; só é salvo o que você confirmar.

**Como adaptar:** Descreva seu projeto e seus resultados da forma mais honesta possível. Carregue relatórios anuais ou avaliações como conhecimento e atribua-os ao analista de impacto.

## 24 · Responder a uma solicitação de cidadão {#citizen-inquiry}
<!-- keywords: instituições públicas, análise de assuntos, preparação das informações, rascunho de resposta -->

**Área:** Instituições públicas · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento

Solicitações de cidadãos muitas vezes contêm vários assuntos e precisam ser respondidas de forma correta, clara e sem compromissos precipitados. O workflow decompõe a solicitação, encontra as regras relevantes nas informações fornecidas e prepara uma resposta.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** Uma cadeia de três agentes: a análise de assuntos separa os assuntos e atribui responsabilidades, a preparação das informações busca as regras relevantes apenas no trecho fornecido e o rascunho de resposta redige uma resposta acessível ao cidadão. Uma verificação de qualidade garante que apenas regras documentadas sejam citadas e que nenhum compromisso vinculante seja assumido.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Análise de assuntos** | Separa os assuntos e atribui responsabilidades e urgência. | Solicitação do cidadão |
| **Preparação das informações** | Busca as regras relevantes apenas nas informações fornecidas. | Análise de assuntos, Solicitação do cidadão |
| **Rascunho de resposta** | Redige uma resposta objetiva e acessível para aprovação. (com verificação de qualidade) | Análise de assuntos, Preparação das informações |

**Entrada:** A solicitação da cidadã ou do cidadão e as informações internas, regras e responsabilidades relevantes, como trecho no texto ou como arquivos. Você também pode anexar fotos da solicitação. O arquivo de exemplo é um folheto informativo fictício da prefeitura.

**Arquivos de exemplo:** `Folheto_anexos_e_iluminacao.pdf`

**Casos de teste:** Depósito de jardim e poste de luz; Regras como arquivo de folheto

**Resultado:** Um rascunho de resposta em linguagem simples com responsabilidades, próximos passos e observações para quem vai tratar o caso, também como arquivo Word para o seu papel timbrado. A preparação das informações propõe as regras encontradas, com a referência, para o conhecimento, para que solicitações futuras possam usá-las; só é salvo o que você confirmar. O rascunho precisa ser verificado e aprovado tecnicamente antes do envio.

**Como adaptar:** Anexe os seus regulamentos e folhetos ou carregue-os de forma permanente como conhecimento (modo "Pesquisa" com citações) e atribua-os à preparação das informações. Papel timbrado e despedida vão no prompt de sistema do rascunho de resposta. Para muitas solicitações de uma vez, use o processamento em lote.

<!-- examples:end -->
