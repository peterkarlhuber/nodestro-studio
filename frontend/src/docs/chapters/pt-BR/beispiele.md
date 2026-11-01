# Fluxos de trabalho de exemplo

O Nodestro traz 24 fluxos de trabalho multiagente prontos, um para cada área de aplicação típica. Cada exemplo contém agentes com prompts de sistema, as conexões, uma tarefa de teste preparada com dados inventados e um resultado claramente descrito. Este capítulo explica a galeria, como copiar e adaptar, e descreve cada exemplo separadamente.

## A galeria {#galerie}
<!-- keywords: exemplos, modelos, galeria, biblioteca, destaques, categorias, página inicial -->

A galeria fica na página **Fluxos de trabalho**, abaixo dos seus próprios fluxos de trabalho e claramente separada deles. Ela mostra alguns exemplos em destaque e as seis categorias. **Ver todos os 24 exemplos** abre a galeria completa, também dentro da área de fluxos de trabalho.

Na galeria completa você busca por nome, área e descrição e filtra por categoria. Cada cartão mostra a área, o nome, a descrição, o número de agentes, o nível e o padrão. Exemplos de áreas sensíveis têm o selo **Exige revisão especializada**. A [busca](/docs/start#suche) também encontra exemplos.

## Prévia e cópia {#uebernehmen}
<!-- keywords: prévia, copiar, cópia, modelo, inalterado, gratuito -->

Um clique em um cartão abre a **prévia**: o fluxo como diagrama, cada agente com sua função, modelo, ferramentas e os resultados que recebe, o guia e a tarefa de teste. A prévia não salva nada e não chama nenhum modelo.

**Copiar para meus fluxos de trabalho** cria um fluxo de trabalho seu e o abre no editor. A cópia é independente: você pode mudar tudo, e o modelo continua sempre inalterado. Se você copiar um exemplo duas vezes, terá dois fluxos de trabalho separados. A cópia começa com a versão 1 no [histórico de versões](/docs/workflows#versionen).

Se **Adicionar os casos de teste como série de testes** estiver marcado (padrão), a cópia recebe também uma [série de testes](/docs/automatisierung#testreihen) com os casos de teste preparados; os arquivos de exemplo necessários são salvos como arquivos de entrada da cópia. Copiar nunca inicia uma execução, nunca cria um [agendamento](/docs/automatisierung#zeitplaene) e nunca publica uma [API](/docs/api-und-export#veroeffentlichen); isso você decide depois.

Os exemplos nunca são criados automaticamente; só o que você copia aparece entre seus fluxos de trabalho. Só há custos quando você executa uma cópia. Os exemplos usam modelos da Anthropic; basta esse [provedor configurado](/docs/einstellungen#anbieter), e você pode trocar os modelos de uma cópia para outro provedor a qualquer momento. Nenhum exemplo precisa de outros serviços, contas ou fontes de dados pagas.

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

Os cartões da galeria também mostram quais blocos um exemplo usa: decisão, aprovação, formulário de entrada, subfluxo, arquivos de resultado, arquivos como entrada, propostas de conhecimento ou memória.

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
| 6 | Artigo de blog | Marketing e conteúdo | 3 | sequencial |
| 7 | Preparar uma proposta sob medida | Vendas | 3 | sequencial |
| 8 | Responder solicitações de clientes | Atendimento ao cliente | 4 | com ramificações |
| 9 | Divulgar uma vaga e preparar entrevistas | Recursos humanos | 5 | com ramificações |
| 10 | Transformar uma pergunta de pesquisa em hipóteses | Pesquisa e desenvolvimento | 3 | adaptativo (orquestração) |
| 11 | Revisão de código com testes | Desenvolvimento de software | 3 | paralelo |
| 12 | Estruturar um contrato e encontrar pontos de verificação | Direito e administração | 5 | com ramificações |
| 13 | Criar um plano de estudos pessoal | Educação e formação | 4 | paralelo |
| 14 | Verificar o orçamento doméstico e economizar | Pessoas físicas – finanças | 3 | sequencial |
| 15 | Planejar uma viagem pessoal | Pessoas físicas – viagens | 4 | com ramificações |
| 16 | Avaliar uma ideia de negócio | Autônomos e empreendedores | 2 | adaptativo (orquestração) |
| 17 | Desenvolver uma estratégia para redes sociais | Influenciadores e criadores de conteúdo | 3 | sequencial |
| 18 | Comparar ofertas de imóveis | Imóveis | 3 | paralelo |
| 19 | Analisar atrasos de obra | Construção civil | 3 | adaptativo (orquestração) |
| 20 | Desenvolver e precificar um cardápio | Gastronomia | 3 | sequencial |
| 21 | Planejamento de culturas de uma propriedade | Agricultura | 3 | sequencial |
| 22 | Planejar a festa de uma associação | Associações e clubes | 4 | paralelo |
| 23 | Desenvolver uma campanha de doações | Organizações sem fins lucrativos | 3 | com ramificações |
| 24 | Responder a uma solicitação de cidadão | Instituições públicas | 3 | sequencial |

## 1 · Analisar paradas de máquina {#production-downtime}
<!-- keywords: produção e indústria, analista de paradas, analista de causas, planejador de ações -->

**Área:** Produção e indústria · **Agentes:** 3 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, formulário de entrada, subfluxo, arquivos de resultado, arquivos como entrada

Paradas custam tempo de produção, mas em registros longos os padrões passam despercebidos facilmente. O fluxo de trabalho transforma um registro de paradas em uma lista de medidas justificada e priorizada.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o analista de paradas confere cada número com a calculadora. Uma verificação de qualidade avalia o plano de ações por três critérios (ligação com as constatações, priorização, responsáveis e indicadores) e faz o planejador de ações revisá-lo uma vez se não os cumprir. Uma condição compara a participação das paradas com a meta de 3 %: acima dela, roda o subfluxo de garantia da qualidade (avaliação de riscos com um FMEA simplificado e plano de verificação); caso contrário, ele é pulado. A execução mostra qual ramo foi seguido. Nenhuma etapa espera por uma pessoa: as causas são hipóteses a verificar no chão de fábrica, e as ações são propostas para a gerência de produção responsável.

**Por que esta arquitetura:** A avaliação quantitativa e a busca de causas olham o mesmo registro por ângulos diferentes e não dependem uma da outra; por isso rodam em paralelo, e só o planejador de ações as reúne. A garantia da qualidade só roda quando a meta não é atingida, porque só então são esperadas ações mais amplas cujos riscos precisam ser controlados; dentro da meta, ela só custaria tempo e dinheiro. Ela é um subfluxo para que o mesmo módulo possa ser reutilizado e testado separadamente. Não é preciso um orquestrador, porque todo registro de paradas precisa das mesmas etapas.

**Como adaptar:** Coloque uma exportação do seu MES ou da sua planilha no campo de arquivo; registros longos também funcionam, porque os agentes leem arquivos grandes de forma direcionada. Para uma análise semanal, você pode agendar a cópia. No prompt de sistema do planejador de ações, você pode acrescentar a sua metodologia, por exemplo os pilares do TPM ou um esquema de avaliação fixo.

## 2 · Tratar uma reclamação com 8D {#quality-8d}
<!-- keywords: gestão da qualidade, descrição do problema d1–d3, análise de causas d4, planejamento de ações d5–d7, relatório 8d, contenção de emergência -->

**Área:** Gestão da qualidade · **Agentes:** 5 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, aprovação, formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento, arquivos de conhecimento

Reclamações exigem contenção rápida e uma análise de causa sólida. O método 8D define os passos; o fluxo de trabalho os percorre de forma estruturada e os documenta de maneira consistente. Ele também verifica se o defeito já ocorreu antes: uma causa que volta significa que uma ação corretiva anterior não funcionou, e isso precisa constar no relatório.

**Como os agentes trabalham juntos:** Uma cadeia sequencial: o primeiro agente descreve o problema e as ações de contenção (D1 a D3). O segundo pesquisa casos comparáveis nos relatórios 8D anteriores da empresa e busca as causas de ocorrência e de não detecção (D4), indicando se uma causa é recorrente ou nova. O terceiro planeja ações corretivas e preventivas (D5 a D7). O agente de relatório reúne tudo em um relatório 8D estruturado. Um nó de decisão verifica a gravidade: em casos críticos, um agente adicional planeja a contenção de emergência das próximas 24 horas. Antes de o relatório ir para o cliente, uma pessoa o libera.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Descrição do problema D1–D3** | Descreve a equipe, o problema (é/não é) e as ações de contenção. (saída estruturada) | Reclamação |
| **Análise de causas D4** | Pesquisa relatórios 8D anteriores e busca com 5 porquês as causas de ocorrência e de não detecção. | Descrição do problema D1–D3, Reclamação |
| **Planejamento de ações D5–D7** | Planeja ações corretivas, sua verificação e a prevenção. | Análise de causas D4 |
| **Relatório 8D** | Reúne todas as etapas em um relatório 8D estruturado. (saída estruturada) | Descrição do problema D1–D3, Análise de causas D4, Planejamento de ações D5–D7, Contenção de emergência |
| **Contenção de emergência** | Planeja a contenção das próximas 24 horas em casos críticos. | Gravidade |

**Entrada:** A reclamação do cliente com peça, lote, defeito e taxa de defeitos, além das informações internas conhecidas sobre produção, material e inspeção. Você também pode anexar a carta de reclamação, dados de medição e fotos do defeito como arquivos; os arquivos de exemplo contêm uma carta de reclamação fictícia (PDF) e medições (Excel). Os relatórios 8D anteriores vêm da coleção de conhecimento; um arquivo fictício com quatro relatórios encerrados está incluído.

**Arquivos de exemplo:** `Reclamacao_G-220_lote_24-117.pdf`, `Medicoes_ganchos.xlsx`

**Casos de teste:** Reclamação no texto; Carta de reclamação e medições como arquivos

**Resultado:** Um relatório 8D estruturado com um campo para cada disciplina D1 a D8 e uma lista de pontos em aberto que a equipe ainda precisa esclarecer; a análise de causas cita os relatórios anteriores em que se apoia. Após a liberação, a execução salva o relatório em PDF e como arquivo Word editável. Assim se fecha o ciclo de aprendizado: o agente de relatório propõe o relatório 8D concluído para o conhecimento, uma pessoa decide se ele é salvo, e os relatórios salvos vão para a mesma coleção dos relatórios anteriores, de modo que a análise de causas os encontra em casos futuros.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o nó de decisão só acrescenta a contenção de emergência quando a descrição do problema classifica o caso como crítico; a análise de causas decide quais relatórios anteriores são relevantes e os cita, de modo que cada referência pode ser conferida. Não há loops; cada etapa roda uma vez. Uma pessoa decide duas vezes: antes de os arquivos serem criados, alguém libera o relatório 8D (rejeitá-lo encerra a execução sem arquivos), e uma pessoa decide se o relatório concluído é salvo como conhecimento. Até a liberação, o relatório continua sendo um rascunho.

**Por que esta arquitetura:** O 8D define uma ordem fixa em que cada disciplina se apoia na anterior; por isso uma cadeia sequencial combina melhor do que um orquestrador, e só a contenção de emergência depende do caso e é uma ramificação. Os relatórios anteriores são conhecimento pesquisável em vez de texto no prompt: o arquivo cresce a cada caso salvo, a pesquisa traz apenas os trechos relevantes e as citações mostram de onde vem uma causa recorrente. Um loop de revisão foi deixado de fora de propósito, porque a liberação por uma pessoa no final revisa o relatório inteiro de qualquer forma.

**Arquivos de conhecimento (sintéticos, criados ao copiar):** Relatorios_8D_anteriores_Plastiform: Arquivo fictício com quatro relatórios 8D encerrados do fornecedor de carcaças plásticas Plastiform Ltda.; um deles é um caso comparável.

**Como adaptar:** Substitua os dados de teste pela sua reclamação e anexe diretamente registros de inspeção, desenhos ou fotos. Substitua os relatórios anteriores fictícios da coleção de conhecimento pelos seus próprios relatórios 8D encerrados (Markdown, PDF ou Word); títulos claros com peça, defeito e causa em cada relatório tornam a pesquisa mais precisa. Se você usa um formulário próprio, ajuste os campos do agente de relatório em "Formato de saída".

## 3 · Comparar propostas de fornecedores {#supplier-comparison}
<!-- keywords: logística e compras, analista de custos, analista de riscos, recomendação de compra -->

**Área:** Logística e compras · **Agentes:** 3 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada, conexão MCP opcional

O menor preço unitário raramente é a proposta mais barata, e as promessas de um fornecedor não são o seu histórico. O fluxo de trabalho compara propostas por custo total e risco de fornecimento, verifica o histórico dos fornecedores quando ele existe e justifica uma recomendação para compras.

**Como os agentes trabalham juntos:** O analista de custos e o analista de riscos trabalham em paralelo. Um calcula o custo total de propriedade por proposta com a calculadora, o outro avalia prazo de entrega, dependências, capacidade e qualidade. Se a sua cópia estiver conectada ao ERP, o analista de riscos lê a avaliação de cada fornecedor, apenas para leitura, com list_suppliers e supplier_scorecard; sem conexão, usa uma exportação do ERP anexada ou só as propostas e diz qual histórico falta. A recomendação de compra pondera os dois e entrega um resultado estruturado.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de custos** | Calcula o custo total por proposta com a calculadora. (Ferramentas: `calculator`) | Propostas |
| **Analista de riscos** | Avalia riscos de prazo, dependência, capacidade e qualidade. | Propostas |
| **Recomendação de compra** | Pondera custos e riscos e recomenda um fornecedor. (saída estruturada) | Analista de custos, Analista de riscos |

**Entrada:** Várias propostas com preço, frete, prazo de entrega, quantidade mínima, condições de pagamento e dados de qualidade, além dos seus custos internos. Você pode escrever as propostas no texto ou anexá-las como arquivos, inclusive misturando PDF, Word e Excel; os três arquivos de exemplo mostram exatamente isso. Opcionalmente, anexe uma exportação do ERP com a avaliação de fornecedores (Excel ou CSV); na exportação de exemplo falta de propósito o fornecedor da proposta B, que é novo e ainda não tem histórico.

**Arquivos de exemplo:** `Proposta_A_Exemplo_Precisao.pdf`, `Proposta_B_Exemplo_Componentes.docx`, `Proposta_C_Amostra_Pecas_Metalicas.xlsx`, `ERP_avaliacao_fornecedores.xlsx`

**Casos de teste:** Três propostas no texto; Três propostas em PDF, Word e Excel; Três propostas como arquivos mais exportação do ERP

**Resultado:** Uma recomendação estruturada com classificação, justificativas, riscos, pontos de negociação e premissas usadas. A avaliação de riscos informa, para cada fornecedor, de onde vem o seu histórico: do ERP, da exportação anexada ou só da proposta. A execução também salva a recomendação como relatório em PDF e como arquivo Excel com uma planilha por lista.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: as duas análises e a ponderação rodam sem pausa; a calculadora faz as contas, e a execução registra cada etapa e cada chamada de ferramenta. A conexão com o ERP é opcional e só lê: a cópia recebe as ferramentas list_suppliers e supplier_scorecard somente se você a conectar a um servidor MCP cujas ferramentas um administrador aprovou como somente leitura; caso contrário, ela roda em um modo offline claramente identificado e nunca finge ter dados do ERP. Execuções sem uma pessoa presente (agendamentos, séries de testes, processamento em lote) não podem usar ferramentas MCP, a menos que um administrador permita expressamente o MCP sem supervisão; por isso, use uma cópia conectada de forma interativa. Nenhuma etapa aguarda aprovação: a recomendação é um rascunho, e a decisão de compra continua sendo sua.

**Por que esta arquitetura:** Custo e risco são questões independentes, por isso dois especialistas trabalham em paralelo e um terceiro pondera os resultados; é mais rápido e mais fácil de conferir do que um único agente para tudo. O histórico dos fornecedores vem por uma integração porque está no ERP e muda o tempo todo; um arquivo de conhecimento ficaria desatualizado, e o modo offline com uma exportação mantém o exemplo utilizável sem conexão. Não há laço nem etapa de aprovação porque o resultado é uma recomendação, não uma ação.

**Conexão opcional: ERP (avaliação de fornecedores)** (Ferramentas: `list_suppliers`, `supplier_scorecard`). Acesso somente leitura via MCP aos dados de fornecedores do seu ERP: list_suppliers lista os fornecedores, supplier_scorecard retorna a avaliação de um fornecedor dos últimos 12 meses (pontualidade, qualidade em ppm, reclamações, relatórios 8D abertos, última auditoria). O analista de riscos a usa para confrontar as propostas com o histórico registrado.

**Configuração:** Um administrador adiciona o servidor MCP do ERP da sua empresa em Ferramentas → Serviços conectados e aprova as duas ferramentas list_suppliers e supplier_scorecard como somente leitura. Ao copiar o exemplo, você escolhe esse servidor como conexão; sem conexão, a cópia roda no modo offline. Para testar sem ERP, execute `python -m nodestro_examples.demo_mcp --language pt-BR` no computador com o aplicativo desktop do Nodestro, adicione http://127.0.0.1:8765/mcp em Ferramentas → Serviços conectados com o consentimento para um servidor de desenvolvimento local, aprove as ferramentas dele como somente leitura e escolha-o ao copiar. O servidor de demonstração só lê e fornece os dados sintéticos da exportação de exemplo, nunca dados reais de empresa. Execuções sem uma pessoa presente (agendamentos, séries de testes, processamento em lote) não podem usar ferramentas MCP, a menos que um administrador permita expressamente o MCP sem supervisão.

**Sem conexão:** Modo offline: nenhum ERP está conectado. O analista de riscos usa somente uma exportação do ERP anexada ou as propostas e aponta o histórico de fornecedores que falta; ele não consulta nada.

**Como adaptar:** Anexe as suas propostas como arquivos e informe a demanda e os custos no texto. Para usar o histórico real dos fornecedores, peça a configuração da integração com o ERP e escolha o servidor ao copiar o exemplo; caso contrário, anexe uma exportação da avaliação de fornecedores. Se você tem pesos fixos (por exemplo 50 % custo, 30 % risco, 20 % qualidade), acrescente-os no prompt de sistema da recomendação de compra. Contratos-quadro podem ser salvos como conhecimento e atribuídos ao analista de riscos.

## 4 · Estratégia SWOT para uma pequena empresa {#sme-swot}
<!-- keywords: empresas e pmes, análise interna, análise do ambiente, desenvolvedor de estratégia, revisor crítico -->

**Área:** Empresas e PMEs · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** arquivos de resultado

Muitas pequenas empresas conhecem seus problemas, mas não a melhor ordem para enfrentá-los. O fluxo de trabalho cria uma análise SWOT, deriva estratégias dela e as submete a um revisor crítico.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Tudo roda automaticamente e nenhuma etapa espera por uma pessoa. O revisor crítico recebe a estratégia e o perfil original da empresa e devolve um parecer estruturado com pontos sólidos, pontos fracos, informações que faltam e próximos passos; ele não devolve a estratégia para revisão, de modo que a sua crítica fica visível no resultado. A análise do ambiente não pesquisa na web: trabalha com o perfil e com conhecimento geral do setor e marca o que precisa ser verificado localmente. A estratégia e o plano de 90 dias são um rascunho para a sua própria decisão.

**Por que esta arquitetura:** Forças e fraquezas vêm de dentro da empresa, oportunidades e ameaças vêm do mercado; as duas análises não dependem uma da outra e por isso rodam em paralelo. A estratégia precisa de ambas e vem depois como etapa fixa. O revisor é um agente separado que também vê o perfil original, então confronta a estratégia com os fatos, e não só com o próprio raciocínio dela. Um ciclo de revisão foi deixado de fora de propósito: uma estratégia não deve ser polida até o revisor concordar, porque contradições em aberto são informação valiosa para quem decide.

**Como adaptar:** Descreva sua empresa no mesmo estilo. Quanto mais precisos os números e as metas, mais concreta a estratégia. Você pode carregar estudos setoriais ou pesquisas com clientes como conhecimento e atribuí-los à análise do ambiente.

## 5 · Análise financeira {#financial-analysis}
<!-- keywords: finanças e investimentos, agente de pesquisa, agente de análise, agente de revisão -->

**Área:** Finanças e investimentos · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento

Números de relatórios anuais são citados rapidamente, mas raramente recalculados e colocados em contexto. O fluxo de trabalho extrai os números, calcula margens e crescimento com exatidão e faz revisar o resultado criticamente.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o agente de pesquisa extrai os números, o agente de análise calcula cada indicador com a calculadora e o agente de revisão confere cálculos e lógica com base nos números extraídos. O seu parecer sim/não diz se a análise é considerada correta; esse parecer não interrompe a execução nem dispara um novo cálculo, de modo que os erros encontrados continuam visíveis no resultado. Sobre o conhecimento decide uma pessoa: os números extraídos só são adotados se você os confirmar. O resultado não é recomendação de investimento; antes de decisões, alguém responsável pelos números deve conferi-lo.

**Por que esta arquitetura:** Cada etapa precisa do resultado da anterior: sem números limpos não há indicadores corretos, e sem indicadores não há o que revisar. Por isso uma cadeia estrita funciona melhor do que trabalho em paralelo ou um orquestrador. Calcular com a calculadora em vez do modelo de linguagem e ter a revisão feita por um agente separado evitam indicadores que parecem plausíveis, mas estão errados. A revisão também recebe os números extraídos e pode, assim, rastrear cada indicador até a sua fonte.

**Como adaptar:** Anexe diretamente o relatório anual ou a sua tabela de indicadores. Outros indicadores, como alavancagem ou fluxo de caixa livre, são acrescentados no prompt de sistema do agente de análise. Para muitas empresas em sequência, use o processamento em lote com uma linha por empresa.

## 6 · Artigo de blog {#blog-article}
<!-- keywords: marketing e conteúdo, briefing, redator, revisão -->

**Área:** Marketing e conteúdo · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** arquivos de resultado

Bons artigos nascem de um briefing claro: quem vai ler, de qual ângulo e com quais mensagens-chave. O fluxo de trabalho trabalha como uma pequena redação e verifica o resultado antes da publicação.

**Como os agentes trabalham juntos:** Um modelo rápido cria um briefing estruturado com público, abordagem, estrutura e mensagens-chave. O redator transforma o briefing no artigo; uma verificação de qualidade integrada garante que ele siga a estrutura e responda às perguntas dos leitores e, caso contrário, o devolve uma vez para revisão. Uma revisão rápida verifica extensão e legibilidade com a ferramenta de estatísticas de texto e marca afirmações não verificadas.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Briefing** | Define público, abordagem, estrutura e mensagens-chave em um briefing estruturado. (saída estruturada) | Tema |
| **Redator** | Escreve o artigo a partir do briefing. (com verificação de qualidade) | Briefing |
| **Revisão** | Verifica extensão e legibilidade e entrega a versão final. (Ferramentas: `text_statistics`) | Redator |

**Entrada:** Um tema em uma frase. Opcionalmente, acrescente o público, o tom ou a extensão desejada diretamente na entrada.

**Casos de teste:** Tema em uma frase

**Resultado:** Um artigo pronto em Markdown com títulos, uma meta descrição e breves notas de revisão com a contagem de palavras e indicações de afirmações que devem ser comprovadas antes da publicação. A execução também salva o resultado como arquivo Markdown e HTML, que você pode levar para o seu CMS.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: briefing, artigo e revisão rodam um após o outro; nenhuma etapa espera por uma pessoa. Uma verificação de qualidade separada avalia o artigo por dois critérios (segue a estrutura, responde às perguntas dos leitores) e, se um deles não for atendido, faz o redator revisá-lo uma vez. A revisão não muda o conteúdo; ela marca as afirmações que precisam de fonte. O artigo é um rascunho: você decide se e onde ele será publicado.

**Por que esta arquitetura:** Um único briefing estruturado substitui dois planejadores em paralelo cujos resultados o redator precisava conciliar: antes, a estrutura era criada sem conhecer o público. Agora público, abordagem, estrutura e mensagens-chave vêm da mesma ideia e chegam ao redator como campos bem separados. O redator tem uma verificação de qualidade com revisão automática porque é ali que surge a maioria das falhas. Como exemplo para iniciantes, o fluxo de trabalho continua sendo de propósito uma cadeia curta, sem ramificações, loops ou aprovações, para que cada etapa possa ser acompanhada na execução.

**Como adaptar:** Mude o tema na entrada. Você pode carregar seu guia de estilo como conhecimento e atribuí-lo ao redator e à revisão. Defina a extensão desejada no prompt de sistema do redator e o número de seções ou de mensagens-chave no prompt de sistema do briefing.

## 7 · Preparar uma proposta sob medida {#sales-offer}
<!-- keywords: vendas, analista de necessidades, consultor de soluções, redator da proposta -->

**Área:** Vendas · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Avançado · **Elementos:** aprovação, ciclo de revisão, formulário de entrada, arquivos de resultado, arquivos como entrada

Uma boa proposta responde à necessidade real do cliente, não só às palavras-chave dele. O fluxo de trabalho esclarece a necessidade, calcula uma solução adequada e redige uma proposta completa que uma pessoa aprova.

**Como os agentes trabalham juntos:** O analista de necessidades separa requisitos explícitos e implícitos e reúne perguntas em aberto. O consultor de soluções monta itens da tabela de preços e calcula com a calculadora, incluindo uma variante dentro do orçamento. O redator da proposta redige a proposta; uma verificação de qualidade integrada confere completude e preços. Um formulário de entrada recebe os dados principais (cliente, prazo, orçamento, montagem no fim de semana). Depois uma pessoa aprova o rascunho; uma rejeição com comentário o devolve por um loop ao redator da proposta, que o revisa e o apresenta de novo.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de necessidades** | Identifica requisitos explícitos e implícitos. | Solicitação do cliente |
| **Consultor de soluções** | Monta itens adequados e calcula com a calculadora. (Ferramentas: `calculator`) | Analista de necessidades, Solicitação do cliente |
| **Redator da proposta** | Redige o rascunho da proposta para o cliente. (com verificação de qualidade; Ferramentas: `calculator`) | Analista de necessidades, Consultor de soluções |

**Entrada:** A solicitação do cliente e a sua tabela de preços com descontos e condições. O formulário recebe os dados principais; a tabela de preços você pode escrever no texto ou anexar como arquivo Excel, CSV ou PDF, como mostra o arquivo de exemplo.

**Arquivos de exemplo:** `Tabela_precos_moveis_escritorio.xlsx`

**Casos de teste:** Solicitação e tabela de preços no texto; Tabela de preços como arquivo Excel

**Resultado:** Um rascunho de proposta com carta de apresentação, tabela de itens, totais, variantes, premissas e perguntas em aberto. Só depois da sua aprovação a execução salva a proposta em PDF e como arquivo Word editável; o envio ao cliente continua sendo com você.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: análise de necessidades, cálculo e rascunho rodam sem espera; uma verificação de qualidade separada avalia a proposta por três critérios (todos os requisitos tratados, preços de acordo com o cálculo, pontos em aberto indicados) e, se necessário, faz revisá-la uma vez. Depois uma pessoa decide: a aprovação gera os arquivos; a rejeição exige um comentário e devolve a proposta ao redator junto com o rascunho anterior. O loop permite no máximo três rodadas de revisão; depois disso, a execução termina com falha. A análise de necessidades e o cálculo do consultor de soluções não são repetidos; se o comentário mudar quantidades, descontos ou itens de entrega, o redator da proposta recalcula os totais afetados com a calculadora. O fluxo de trabalho nunca envia nada ao cliente.

**Por que esta arquitetura:** Toda solicitação precisa das mesmas etapas na mesma ordem, por isso uma cadeia fixa funciona melhor do que um orquestrador. Os preços são calculados com a calculadora em uma etapa própria, de modo que o redator pega dali os preços de tabela em vez de inventá-los. O loop na aprovação existe porque as rejeições costumam ser pequenas correções, como uma formulação, uma observação sobre desconto ou uma pergunta em aberto que faltou; revisar com o comentário é mais rápido do que recomeçar. Ele volta de propósito só ao redator da proposta, que recalcula com a calculadora quantidades ou descontos alterados, mas não acrescenta novos preços de tabela; assim a base conferida da solução se mantém.

**Como adaptar:** Anexe a sua tabela de preços atual como arquivo; assim basta a solicitação do cliente como texto. Condições de pagamento e textos padrão são acrescentados no prompt de sistema do redator da proposta.

## 8 · Responder solicitações de clientes {#customer-service}
<!-- keywords: atendimento ao cliente, classificador, verificador de políticas, redator de respostas, desescalada -->

**Área:** Atendimento ao cliente · **Agentes:** 4 · **Padrão:** com ramificações · **Nível:** Iniciante · **Elementos:** decisão, aprovação, ciclo de revisão, formulário de entrada, arquivos como entrada, conexão MCP opcional

No atendimento ao cliente muitas solicitações chegam ao mesmo tempo, e cada uma precisa da regra certa, dos dados de pedido certos e do tom certo. O fluxo de trabalho classifica as solicitações, verifica políticas e prazos com base nos dados do pedido e prepara respostas para aprovação.

**Como os agentes trabalham juntos:** Um classificador rápido organiza cada solicitação por assunto, urgência e humor. O verificador de políticas aplica a política de atendimento e recalcula prazos com a ferramenta de datas; se a sua cópia estiver conectada à loja, ele consulta cada pedido, somente para leitura, com get_order, caso contrário usa os dados de pedido das solicitações ou uma exportação de pedidos anexada. O redator de respostas redige as respostas; uma verificação de qualidade garante que nada seja prometido além da política. Um nó de decisão envia os escalonamentos primeiro a um agente de desescalada. Cada rascunho aguarda aprovação; uma rejeição com comentário devolve os rascunhos, por um laço, ao redator de respostas, que os revisa e os envia de novo para aprovação (no máximo três rodadas).

| Agente | Tarefa | Recebe |
|---|---|---|
| **Classificador** | Organiza cada solicitação por assunto, urgência e humor. (saída estruturada) | Solicitações |
| **Verificador de políticas** | Aplica a política de atendimento e verifica prazos com a ferramenta de datas. (Ferramentas: `days_between`) | Classificador, Solicitações |
| **Redator de respostas** | Redige rascunhos de resposta cordiais para aprovação. (com verificação de qualidade) | Classificador, Verificador de políticas, Desescalada |
| **Desescalada** | Prepara como lidar com clientes irritados e o que precisa de aprovação. | Escalonar? |

**Entrada:** Várias solicitações de clientes com números de pedido, a data de hoje e a sua política de atendimento, como trecho no texto ou como arquivo (PDF, Word, Markdown); o arquivo de exemplo contém uma política mais detalhada. As datas de pedido e entrega vêm das solicitações, de uma exportação de pedidos da sua loja anexada (JSON, CSV ou Excel) ou, com conexão, diretamente da loja; a exportação de exemplo contém os três pedidos das solicitações de exemplo.

**Arquivos de exemplo:** `Politica_atendimento_Cozinha_Amostra.pdf`, `Pedidos_loja_Cozinha_Amostra.json`

**Casos de teste:** Quatro solicitações, uma delas irritada; Uma pergunta gentil sobre um produto; Política como arquivo PDF; Só números de pedido, exportação de pedidos anexada

**Resultado:** Para cada solicitação, uma classificação, a regra aplicável com verificação de prazo e um rascunho de resposta que uma pessoa aprova antes do envio. A verificação de políticas informa de onde vêm os dados do pedido (loja, exportação ou solicitação) e quais faltam.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: a classificação, a decisão de escalonamento (para a desescalada quando pelo menos um cliente está irritado ou pede mais do que a política permite), a verificação de políticas e os rascunhos; a ferramenta de datas calcula os prazos, uma verificação de qualidade testa os rascunhos com três critérios (conforme a política, tom, sem promessas) e cada etapa é registrada. Uma pessoa aprova cada rascunho antes de qualquer envio: uma rejeição exige um comentário e devolve os rascunhos ao redator de respostas; se continuarem rejeitados depois de no máximo três rodadas, a execução termina como falha. As respostas continuam sendo rascunhos; nada é enviado automaticamente. A conexão com a loja é opcional e só lê: a cópia recebe get_order somente se você a conectar a um servidor MCP cuja ferramenta um administrador aprovou como somente leitura; caso contrário, ela roda em um modo offline claramente identificado. Execuções sem uma pessoa presente (agendamentos, séries de testes, processamento em lote) não podem usar ferramentas MCP, a menos que um administrador permita expressamente o MCP sem supervisão.

**Por que esta arquitetura:** As etapas dependem umas das outras (classificar, verificar, redigir), então basta uma cadeia fixa com um desvio para escalonamentos; um orquestrador traria custo sem benefício, e para classificar basta um modelo rápido. Os dados de pedido vêm por uma integração porque estão na loja e mudam a cada hora; o modo offline com uma exportação mantém o exemplo utilizável sem conexão. A aprovação com laço de revisão permanece porque as respostas vão para clientes: a última palavra é de uma pessoa.

**Conexão opcional: Loja online (pedidos)** (Ferramentas: `get_order`). Consulta de pedidos somente leitura na sua loja via MCP: get_order retorna as datas de pedido e entrega, o status, os itens e a última nota da transportadora de um pedido. O verificador de políticas a usa para conferir prazos com dados reais do pedido em vez do que os clientes dizem.

**Configuração:** Um administrador adiciona o servidor MCP da sua loja em Ferramentas → Serviços conectados e aprova a ferramenta get_order como somente leitura. Ao copiar o exemplo, você escolhe esse servidor como conexão; sem conexão, a cópia roda no modo offline. Para testar sem loja, execute `python -m nodestro_examples.demo_mcp --language pt-BR` no computador com o aplicativo desktop do Nodestro, adicione http://127.0.0.1:8765/mcp em Ferramentas → Serviços conectados com o consentimento para um servidor de desenvolvimento local, aprove as ferramentas dele como somente leitura e escolha-o ao copiar. O servidor de demonstração só lê e fornece os pedidos sintéticos da exportação de exemplo, nunca dados reais de clientes. Execuções sem uma pessoa presente (agendamentos, séries de testes, processamento em lote) não podem usar ferramentas MCP, a menos que um administrador permita expressamente o MCP sem supervisão.

**Sem conexão:** Modo offline: nenhuma loja está conectada. O verificador de políticas usa somente os dados de pedido das solicitações ou de uma exportação de pedidos anexada e aponta os que faltam; ele não consulta nada.

**Como adaptar:** Anexe a sua política completa e as perguntas frequentes como arquivo, ou carregue-as como conhecimento e atribua-as ao verificador de políticas se valerem de forma permanente. Para verificar pedidos ao vivo, peça a configuração da integração com a loja e escolha o servidor ao copiar o exemplo. O tom da sua marca (você ou senhor/senhora, despedida) é definido no prompt de sistema do redator de respostas. O processamento em lote atende muitas solicitações de uma vez, mas execuções sem uma pessoa presente não podem usar a conexão com a loja; por isso, anexe uma exportação de pedidos aos lotes.

## 9 · Divulgar uma vaga e preparar entrevistas {#hr-recruiting}
<!-- keywords: recursos humanos, perfil da vaga, anúncio da vaga, roteiro de entrevista, revisor de imparcialidade, revisão -->

**Área:** Recursos humanos · **Agentes:** 5 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, aprovação, arquivos de resultado

Uma boa contratação começa com um perfil claro e entrevistas justas e comparáveis. O fluxo de trabalho transforma anotações soltas em perfil da vaga, anúncio e roteiro de entrevista, verifica a imparcialidade de tudo e deixa a aprovação com uma pessoa.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** O agente de perfil organiza atividades e requisitos. A partir disso, o anúncio da vaga e o roteiro de entrevista são criados em paralelo. O revisor de imparcialidade verifica os dois em busca de formulações discriminatórias ou não permitidas, por exemplo sobre idade ou língua materna, e indica o que uma pessoa precisa verificar. Se ele tiver objeções, um nó de decisão encaminha os documentos para uma revisão que aplica as sugestões; caso contrário, ficam as primeiras versões. Por fim, o gestor da vaga ou o RH analisa anúncio, roteiro, revisão de imparcialidade e, se houver, a versão revisada, e aprova os documentos.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Perfil da vaga** | Organiza atividades, requisitos obrigatórios e desejáveis e competências. | Necessidade de contratação |
| **Anúncio da vaga** | Redige um anúncio de vaga atraente e inclusivo. | Perfil da vaga |
| **Roteiro de entrevista** | Prepara perguntas de entrevista estruturadas com critérios de avaliação. | Perfil da vaga |
| **Revisor de imparcialidade** | Verifica anúncio e roteiro quanto a discriminação e perguntas inadmissíveis. (saída estruturada) | Anúncio da vaga, Roteiro de entrevista |
| **Revisão** | Aplica ao anúncio e ao roteiro as alterações sugeridas pela revisão de imparcialidade. | Precisa de revisão? |

**Entrada:** Anotações sobre a vaga: atividades, qualificações desejadas, equipe, condições e remuneração.

**Casos de teste:** Anotações com desejos problemáticos

**Resultado:** Perfil da vaga, anúncio da vaga e roteiro de entrevista com âncoras de avaliação, uma revisão de imparcialidade estruturada e, se houver objeções, uma versão revisada com a lista de alterações. A execução só cria o arquivo Word depois da aprovação.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o revisor de imparcialidade entrega um parecer estruturado; se os documentos não puderem ser usados sem alterações, um nó de decisão os envia para a revisão; caso contrário, eles seguem direto para a aprovação. O ramo escolhido fica visível na execução. A decisão final fica com uma pessoa: o gestor da vaga ou o RH verifica todos os documentos na aprovação; uma rejeição exige um comentário e encerra a execução, e só uma aprovação cria o arquivo Word. O fluxo de trabalho apenas produz documentos: ele nunca vê, avalia ou classifica candidatos reais.

**Por que esta arquitetura:** Anúncio e roteiro dependem apenas do perfil, por isso são criados em paralelo e verificados juntos, o que mantém requisitos e formulações coerentes. A revisão de imparcialidade funciona como um filtro automático: a revisão só custa uma etapa a mais quando há objeções. De propósito não há um loop de verificação e revisão, porque questões de imparcialidade e jurídicas não devem ser dadas como resolvidas só porque os modelos concordam entre si; quem aprova vê a verificação, a versão revisada e os pontos em aberto lado a lado. A triagem de candidatos fica de fora de propósito, pois seria IA de alto risco pelo Regulamento de IA da UE.

**Como adaptar:** Substitua as anotações pela sua necessidade de contratação. Você pode guardar seu perfil de empregador e seus benefícios como conhecimento e atribuí-los ao agente do anúncio. Acrescente as exigências legais do seu país ao prompt de sistema do revisor de imparcialidade. Não amplie o fluxo para triar, avaliar ou classificar candidatos sem uma análise jurídica: pelo Regulamento de IA da UE, esses sistemas são IA de alto risco.

## 10 · Transformar uma pergunta de pesquisa em hipóteses {#research-hypotheses}
<!-- keywords: pesquisa e desenvolvimento, analista da pergunta, coordenação de pesquisa, planejador do estudo -->

**Área:** Pesquisa e desenvolvimento · **Agentes:** 3 · **Padrão:** adaptativo (orquestração) · **Nível:** Avançado · **Elementos:** orquestrador com equipes, formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento, orçamento e limites

Boa pesquisa começa com uma pergunta precisa e testável e com os métodos certos. Um ensaio de materiais precisa de uma análise de poder, um estudo com entrevistas precisa de um plano de amostragem e de um termo de consentimento, e muitas perguntas precisam de ambos. O fluxo de trabalho analisa a pergunta e deixa uma coordenação de pesquisa envolver exatamente as equipes de métodos de que a pergunta precisa.

**Como os agentes trabalham juntos:** O analista da pergunta a estrutura e resume os dados anexados, porque as equipes trabalham sem os arquivos. A coordenação de pesquisa, um orquestrador, sempre começa com a equipe de hipóteses e então decide: desfechos mensuráveis vão para a equipe de estatística, cujo desenho de estudo e nível de significância ela define como parâmetros; experiências e motivos vão para a equipe de métodos qualitativos; pessoas ou dados pessoais trazem a equipe de ética e proteção de dados. Se uma equipe considera uma hipótese não testável, a coordenação a devolve uma vez à equipe de hipóteses. O planejador do estudo transforma tudo em um plano.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista da pergunta** | Esclarece objetivo, variáveis, restrições e lacunas de conhecimento. | Pergunta de pesquisa |
| **Coordenação de pesquisa** | Decide de quais equipes de métodos a pergunta precisa e define os parâmetros da equipe de estatística. (Orquestrador) | Analista da pergunta |
| **Planejador do estudo** | Deriva o plano de estudo da análise e dos resultados das equipes de métodos. | Analista da pergunta, Coordenação de pesquisa |

**Equipes que o orquestrador pode acionar:**

| Equipe | Tarefa | Capacidades |
|---|---|---|
| **Equipe de hipóteses** | Transforma uma pergunta de pesquisa analisada em hipóteses testáveis com hipóteses nulas e previsões mensuráveis; revisa-as após uma crítica metodológica. | hypotheses, operationalisation |
| **Equipe de estatística** | Confronta hipóteses quantitativas com os dados, avalia dados preliminares com a calculadora e estima o tamanho da amostra para um desenho, um nível de significância e um poder dados. (Parâmetros: Desenho do estudo, Nível de significância α, Poder desejado) | statistics, power analysis, quantitative methods |
| **Equipe de métodos qualitativos** | Planeja entrevistas, observações ou grupos focais para perguntas sobre experiências, motivos e comportamentos: amostra, roteiro e análise. | qualitative methods, interviews, observation |
| **Equipe de ética e proteção de dados** | Verifica estudos com pessoas ou dados pessoais: consentimento, minimização de dados, anonimização, participação da representação dos trabalhadores e parecer ético. | research ethics, data protection, informed consent |

**Entrada:** Uma pergunta de pesquisa com seu objetivo, dados existentes de ensaios preliminares e restrições como material, tempo e equipamentos. Você pode anexar dados de medição e documentos como arquivos; o arquivo de exemplo contém as notas do ensaio preliminar por painel.

**Arquivos de exemplo:** `Ensaio_preliminar_PL-7.csv`

**Casos de teste:** Pergunta e ensaio preliminar no texto; Dados do ensaio preliminar em CSV; Estudo com entrevistas sem medições

**Resultado:** Um plano de estudo com hipóteses, desenho, tamanho da amostra, método de medição ou de entrevista, análise, critérios de parada e riscos em aberto, também como arquivo Word. A visão de orquestração da execução mostra quais equipes de métodos participaram, com quais parâmetros, e quais ficaram de fora e por quê. O planejador propõe o plano para o conhecimento; você decide se ele é salvo.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: a coordenação decide quais equipes de métodos trabalham e preenche o formulário da equipe de estatística (desenho, nível de significância, poder); cada decisão fica registrada com seu motivo. Limites: no máximo 7 decisões, cada equipe no máximo duas vezes, um orçamento de 4 USD por execução. Nenhuma etapa espera por uma pessoa; o plano é um rascunho para a pessoa pesquisadora responsável.

**Por que esta arquitetura:** Uma cadeia fixa sempre executaria uma crítica estatística, mesmo em um estudo com entrevistas em que não há nada a calcular, e só incluiria a ética se alguém se lembrasse. A coordenação escolhe por pergunta e passa à equipe de estatística parâmetros estruturados em vez de texto livre, de modo que a análise de poder calcula com um desenho definido. A análise e o plano final continuam sendo etapas fixas: todo estudo precisa deles.

**Como adaptar:** Substitua a pergunta e o ensaio preliminar pelos seus e anexe diretamente os dados de medição. Acrescente suas diretrizes estatísticas ao agente da equipe de estatística. Se sua área precisar de outra equipe de métodos, por exemplo uma equipe de laboratório, salve-a como fluxo de trabalho com descrição clara e adicione-a às equipes da coordenação.

## 11 · Revisão de código com testes {#code-review}
<!-- keywords: desenvolvimento de software, analista de bugs, revisor de segurança, correção e testes -->

**Área:** Desenvolvimento de software · **Agentes:** 3 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

Um segundo olhar encontra bugs antes que cheguem à produção. O fluxo de trabalho verifica o código ao mesmo tempo quanto a erros de lógica e problemas de segurança e entrega uma versão melhorada com testes.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: uma verificação de qualidade feita por um segundo modelo confere a resposta de Correção e testes com três critérios (cada achado tratado, um teste para cada achado corrigido, código completo sem marcadores); se um critério falhar, o agente revisa a resposta uma vez, e o resultado da verificação fica registrado com a execução. A verificação avalia o texto, não executa o código. Nenhuma etapa espera por uma pessoa, não há orçamento próprio (vale o orçamento padrão do seu workspace) e arquivos compactados enviados são apenas lidos, nunca executados. O código corrigido e os testes são uma proposta: revise-os e rode os testes localmente antes de adotar qualquer coisa.

**Por que esta arquitetura:** Bugs e problemas de segurança são dois olhares independentes sobre o mesmo código, por isso o analista de bugs e o revisor de segurança trabalham em paralelo e nenhum espera pelo outro; o agente de correção recebe também o código original para unir as constatações e remover duplicatas. A verificação de qualidade com uma revisão existe porque, ao juntar duas revisões, o erro típico é esquecer um achado ou um teste. Um coordenador não foi usado de propósito, porque toda revisão precisa dos dois olhares; executar código ou testes no fluxo de trabalho também ficou de fora, para que código desconhecido nunca rode na plataforma.

**Como adaptar:** Anexe o seu projeto como ZIP ou cole o código e informe a linguagem e o framework. Para outras linguagens, ajuste o framework de testes no agente de correção, por exemplo Jest ou JUnit. As suas diretrizes de código podem ser salvas como conhecimento. Pela API do fluxo de trabalho, a revisão também pode ser disparada a partir de um pipeline de CI.

## 12 · Estruturar um contrato e encontrar pontos de verificação {#contract-review}
<!-- keywords: direito e administração, estruturador do contrato, explicador de cláusulas, analista de pontos de verificação, visão geral do contrato, cláusulas críticas -->

**Área:** Direito e administração · **Agentes:** 5 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento, arquivos de conhecimento

Contratos são longos, e cláusulas importantes se escondem nos detalhes. Se uma cláusula é aceitável depende também dos padrões próprios da empresa. O fluxo de trabalho estrutura um contrato, explica-o em linguagem simples e o confronta com o manual de negociação contratual (playbook) do cliente, para que uma pessoa qualificada veja logo onde ele se desvia. Ele não substitui aconselhamento jurídico.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** O estruturador levanta partes, vigência, serviços e prazos. Com base nisso, o explicador de cláusulas (linguagem simples) e o analista de pontos de verificação trabalham em paralelo; os dois leem o contrato por conta própria, como texto ou como arquivo enviado. O analista pesquisa cada cláusula no playbook da empresa, cita a seção do playbook e classifica a cláusula como padrão, posição alternativa, desvio ou linha vermelha. Se encontrar uma linha vermelha ou outra cláusula crítica, um nó de decisão acrescenta uma análise aprofundada dessas cláusulas. O agente de relatório reúne tudo em uma visão geral estruturada com perguntas para a assessoria jurídica.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Estruturador do contrato** | Registra partes, objeto, vigência, preços e prazos. | Texto do contrato |
| **Explicador de cláusulas** | Explica cada cláusula em linguagem simples. | Estruturador do contrato, Texto do contrato |
| **Analista de pontos de verificação** | Confronta cada cláusula com o playbook do cliente e encontra disposições incomuns, desequilibradas ou ausentes. (saída estruturada) | Estruturador do contrato, Texto do contrato |
| **Visão geral do contrato** | Reúne explicações e pontos de verificação em uma visão geral estruturada. (saída estruturada) | Explicador de cláusulas, Analista de pontos de verificação, Cláusulas críticas |
| **Cláusulas críticas** | Examina a fundo as cláusulas críticas e prepara perguntas para a negociação. | Cláusulas críticas? |

**Entrada:** O contrato como arquivo (PDF, Word, Markdown ou texto) no campo "Contrato como arquivo" ou como texto, de preferência com a numeração das cláusulas. Você envia o arquivo diretamente ao iniciar; o contrato não vai para a coleção de conhecimento. O playbook vem da coleção de conhecimento; o playbook fictício da Comércio Amostra Ltda. está incluído. O arquivo de exemplo contém o contrato fictício da tarefa de teste.

**Arquivos de exemplo:** `Contrato_servico_software_exemplo.docx`

**Casos de teste:** Contrato no texto, com cláusulas críticas; Contrato como arquivo Word, sem texto; Contrato de manutenção equilibrado

**Resultado:** Uma visão geral estruturada com resumo, dados principais, cláusulas explicadas, pontos de verificação e perguntas para um advogado ou uma advogada, também em PDF e como arquivo Word editável. Cada ponto de verificação indica a seção do playbook com que foi comparado, e os temas sobre os quais o playbook não diz nada são marcados como tal. O estruturador propõe os dados principais do contrato para o conhecimento, por exemplo para um cadastro de contratos; só é salvo o que você confirmar. O resultado é uma ferramenta de trabalho, não aconselhamento jurídico.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o analista de pontos de verificação classifica cada cláusula com base no playbook e conta as críticas; toda linha vermelha conta como crítica. Se o número for maior que zero, o nó de decisão acrescenta a análise aprofundada das cláusulas críticas; caso contrário, ela é pulada. Nenhuma etapa espera por uma pessoa, e o fluxo de trabalho não envia nada. A visão geral e as perguntas são a base para a análise por um advogado ou uma advogada; o que é negociado, decidem as pessoas envolvidas.

**Por que esta arquitetura:** Explicar e verificar não dependem um do outro e, por isso, rodam em paralelo sobre a estrutura. O playbook é conhecimento pesquisável em vez de texto no prompt: o jurídico o mantém em um só lugar, a pesquisa traz apenas a seção relevante e a citação torna cada classificação rastreável. A análise aprofundada é uma ramificação porque só compensa o custo quando uma linha vermelha é ultrapassada. Não se usou um orquestrador, porque todo contrato precisa das mesmas etapas.

**Arquivos de conhecimento (sintéticos, criados ao copiar):** Playbook_contratos_Comercio_Amostra: Manual de negociação contratual fictício da Comércio Amostra Ltda. para contratos de software e nuvem: posição padrão, alternativa e linha vermelha por tema.

**Como adaptar:** Envie o seu contrato como arquivo ao iniciar ou cole-o. Substitua o playbook fictício da coleção de conhecimento pelo seu, de preferência com a mesma estrutura por tema: posição padrão, posição alternativa aceitável e linha vermelha. Temas importantes para você, como seguros ou direitos de auditoria, basta acrescentá-los ao playbook; o analista os encontra pela pesquisa.

## 13 · Criar um plano de estudos pessoal {#learning-plan}
<!-- keywords: educação e formação, diagnóstico de aprendizagem, planejador de estudos, tutor, autor do quiz -->

**Área:** Educação e formação · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada, memória

Aprender funciona melhor com um plano que começa de onde você está. O fluxo de trabalho cria um plano de estudos pessoal, explica os primeiros temas e verifica a compreensão com um quiz.

**Como os agentes trabalham juntos:** O diagnóstico de aprendizagem determina o ponto de partida e as lacunas, e o planejador de estudos cria com isso um plano semanal. Com base nele, o tutor (conteúdos da semana escolhida, apoiados no seu material do curso se você quiser) e o autor do quiz (verificação de conhecimentos com gabarito) trabalham em paralelo. O resultado contém as três partes. O diagnóstico e o planejador compartilham uma memória: primeiro leem o progresso das semanas anteriores e no final o atualizam, de modo que cada semana se apoia na anterior.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Diagnóstico de aprendizagem** | Determina o ponto de partida, o objetivo de aprendizagem e as lacunas. | Objetivo de aprendizagem |
| **Planejador de estudos** | Cria um plano semanal com objetivos de aprendizagem e exercícios. | Diagnóstico de aprendizagem |
| **Tutor** | Explica o conteúdo da primeira semana com exemplos e exercícios. | Planejador de estudos, Objetivo de aprendizagem |
| **Autor do quiz** | Cria uma verificação de conhecimentos com respostas para a primeira semana. | Planejador de estudos |

**Entrada:** Quem está aprendendo, o objetivo, o tempo disponível, os conhecimentos prévios e o estilo de aprendizagem preferido. No formulário você escolhe a semana a ser elaborada e pode anexar material próprio; o arquivo de exemplo é um guia curto sobre tabelas dinâmicas. A partir da segunda semana, acrescente uma nota curta sobre como foi a última semana (resultado do quiz, o que foi difícil); o nível, os objetivos, os temas concluídos e as dificuldades das semanas anteriores ficam na memória.

**Arquivos de exemplo:** `Guia_rapido_tabelas_dinamicas.docx`

**Casos de teste:** Semana 1 sem material; Semana 2 com material do curso

**Resultado:** Um plano de estudos de quatro semanas com objetivos por semana, explicações claras com exercícios para a semana escolhida e um quiz com gabarito e explicações, também em PDF para imprimir.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: no início de cada execução, o diagnóstico de aprendizagem e o planejador de estudos leem a memória "learning-progress" e a atualizam no final. Ela guarda o nível, os objetivos, os temas concluídos, as dificuldades e o plano resumido, mas nenhum dado pessoal sensível. A memória pertence à sua cópia e se mantém entre execuções; no editor do fluxo de trabalho você vê e apaga as entradas na memória de qualquer um dos dois agentes, por exemplo para corrigir uma entrada errada ou recomeçar com outra pessoa. Na primeira semana a memória está vazia e o fluxo de trabalho trabalha apenas com a sua descrição. Nenhuma etapa espera por uma pessoa: plano, explicações e quiz são sugestões que você adapta ao seu próprio ritmo.

**Por que esta arquitetura:** Aprender leva semanas, mas cada execução começa do zero. Sem memória, você teria de descrever o seu progresso toda semana, e o plano seria refeito do início em vez de se apoiar na semana anterior. A memória guarda exatamente esse estado que muda; o material do curso que não muda pertence ao conhecimento. Só o diagnóstico e o planejador lembram, porque decidem o que vem a seguir; o tutor e o autor do quiz trabalham em paralelo na semana escolhida do plano e não precisam de histórico próprio.

**Como adaptar:** Descreva o seu próprio objetivo; funciona para quase qualquer tema. Para as semanas seguintes, inicie o fluxo de trabalho de novo e mude a semana no formulário. Material que você usa sempre pode ser carregado como conhecimento e atribuído ao tutor.

## 14 · Verificar o orçamento doméstico e economizar {#household-budget}
<!-- keywords: pessoas físicas – finanças, analista de orçamento, consultor de economia, verificação de realidade -->

**Área:** Pessoas físicas – finanças · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

No fim do mês muitas vezes sobra menos do que o esperado. O fluxo de trabalho recalcula um orçamento doméstico, encontra potenciais de economia e verifica se as sugestões são realistas no dia a dia.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o analista de orçamento e o consultor de economia calculam cada total com a calculadora, e a verificação de realidade devolve campos fixos (saldo mensal, potencial de economia, medidas, primeiros passos, observações) que vão para o arquivo Excel. O exemplo está marcado como sensível: cada agente é instruído a apontar o que uma pessoa qualificada deve verificar e a não soar mais seguro do que os dados permitem. Não há etapa de aprovação nem revisão automática; não há orçamento próprio (vale o orçamento padrão do seu workspace). Nada é transferido, cancelado ou contratado: o resultado é um apoio para as suas próprias decisões, não aconselhamento financeiro ou de endividamento.

**Por que esta arquitetura:** Cada etapa se apoia na anterior: a economia só pode ser estimada quando o orçamento é conhecido, e só pode ser verificada quando os dois existem, por isso basta uma cadeia fixa. A calculadora faz com que os números sejam calculados em vez de chutados, e os campos estruturados tornam saldo e potencial comparáveis entre execuções. Em vez de um loop há uma verificação de realidade própria e enxuta, porque o papel dela é descartar ideias irrealistas, não polir o texto. Não foram usados de propósito uma conexão bancária nem uma memória, para que os dados pessoais da conta só sejam entregues como arquivo para esta execução e não fiquem guardados entre execuções.

**Como adaptar:** Anexe o seu próprio extrato ou informe os seus números; prioridades pessoais, como "o carro fica", vão no texto. Extratos bancários contêm dados pessoais: eles ficam com você e só são passados ao modelo para esta execução.

## 15 · Planejar uma viagem pessoal {#travel-plan}
<!-- keywords: pessoas físicas – viagens, planejador de roteiro, planejador de orçamento, planejador de organização, documentos de viagem -->

**Área:** Pessoas físicas – viagens · **Agentes:** 4 · **Padrão:** com ramificações · **Nível:** Iniciante · **Elementos:** decisão, formulário de entrada, arquivos de resultado

Uma boa viagem combina com os interesses, o orçamento e as limitações de todos os viajantes. O fluxo de trabalho planeja um roteiro, recalcula o orçamento e cria uma checklist para a organização.

**Como os agentes trabalham juntos:** O planejador de roteiro monta um plano dia a dia conforme interesses e restrições. O planejador de orçamento calcula noites e custos com a calculadora e a ferramenta de datas. O planejador de organização reúne tudo em um plano de viagem com checklist; uma verificação de qualidade confere orçamento e restrições. Um formulário de entrada recebe destino, datas, viajantes e orçamento. Para viagens ao exterior, um nó de decisão acrescenta uma lista de documentos e regras de entrada.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Planejador de roteiro** | Monta um plano diário conforme interesses e limitações. | Desejos de viagem |
| **Planejador de orçamento** | Calcula noites e custos com a calculadora e a ferramenta de datas. (Ferramentas: `calculator`, `days_between`) | Planejador de roteiro |
| **Planejador de organização** | Reúne roteiro e orçamento em um plano de viagem com checklist. (com verificação de qualidade) | Planejador de roteiro, Planejador de orçamento, Documentos de viagem |
| **Documentos de viagem** | Lista documentos, seguro e regras de entrada para viagens ao exterior. | Exterior? |

**Entrada:** Quem viaja, destino e datas, orçamento, interesses e limitações.

**Casos de teste:** Viagem em família para Lisboa (exterior); Fim de semana no próprio país

**Resultado:** Um plano de viagem com roteiro diário, tabela de orçamento e checklist, também em PDF para levar. Preços e horários são estimativas com base em conhecimento geral e precisam ser verificados antes da reserva, porque o fluxo de trabalho não usa dados em tempo real.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o nó de decisão lê o campo do formulário "Viagem ao exterior" e só executa o agente Documentos de viagem quando ele está marcado; o planejador de orçamento conta as noites com a ferramenta de datas e soma os custos com a calculadora. Uma verificação de qualidade feita por um segundo modelo confere o plano do planejador de organização com três critérios (dentro do orçamento, todas as restrições respeitadas, dados não verificados marcados); se um falhar, o plano é revisado uma vez e o resultado da verificação fica registrado com a execução. Nenhuma etapa espera por uma pessoa e não há orçamento próprio (vale o orçamento padrão do seu workspace). Nada é reservado: preços, horários e regras de entrada são estimativas que você confere antes de reservar.

**Por que esta arquitetura:** Roteiro, orçamento e organização se apoiam uns nos outros e por isso formam uma cadeia; só a lista de documentos depende de uma pergunta de sim ou não, que um nó de decisão responde a partir do formulário, assim um fim de semana no próprio país não paga por uma lista de passaportes. Noites e totais vêm de ferramentas, porque erros de datas e de contas são a fraqueza típica dos modelos de linguagem. Uma busca na web em tempo real ficou de fora de propósito: os resultados mudam de um dia para o outro, as execuções não seriam reproduzíveis, o exemplo dependeria de uma ferramenta de servidor paga e não poderia ser repassado como está; em vez disso, cada preço está marcado como estimativa, e você mesmo pode adicionar a busca na web.

**Como adaptar:** Insira seus desejos de viagem. Se quiser preços e horários atuais, você pode adicionar a ferramenta de servidor "busca na web" ao planejador de roteiro; ela tem custo extra por busca.

## 16 · Avaliar uma ideia de negócio {#business-idea}
<!-- keywords: autônomos e empreendedores, mentora de empreendedorismo, júri de investidores -->

**Área:** Autônomos e empreendedores · **Agentes:** 2 · **Padrão:** adaptativo (orquestração) · **Nível:** Avançado · **Elementos:** orquestrador com equipes, arquivos de resultado, orçamento e limites

Antes de abrir um negócio, vale olhar com sobriedade para mercado, números e riscos. Mas nem toda ideia precisa dos mesmos especialistas: um serviço de conserto de bicicletas não precisa de uma especialista em licenças, uma startup de bebidas precisa. O fluxo de trabalho deixa uma mentora de empreendedorismo montar as equipes de especialistas certas e um júri de investidores chegar a um veredito fundamentado.

**Como os agentes trabalham juntos:** A mentora de empreendedorismo é um orquestrador: ela lê a ideia e decide quais das cinco equipes de especialistas envolver. Mercado, rentabilidade e riscos trabalham em paralelo em toda ideia; regulação e operações entram apenas quando a ideia exige. Se os resultados se contradizem, a mentora faz a uma equipe uma pergunta de acompanhamento específica. Em seguida, o júri de investidores pondera todos os relatórios e dá um veredito estruturado com uma nota.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Mentora de empreendedorismo** | Decide de quais equipes de especialistas a ideia precisa, faz com que trabalhem em paralelo e faz perguntas de acompanhamento. (Orquestrador) | Ideia de negócio |
| **Júri de investidores** | Pondera mercado, números e riscos e chega a um parecer. (saída estruturada) | Ideia de negócio, Mentora de empreendedorismo |

**Equipes que o orquestrador pode acionar:**

| Equipe | Tarefa | Capacidades |
|---|---|---|
| **Equipe de mercado** | Estima públicos-alvo, demanda, disposição a pagar e concorrência de uma ideia de negócio. | market analysis, target groups, competition |
| **Equipe de rentabilidade** | Calcula margem de contribuição, ponto de equilíbrio, retorno e cenários de uma ideia de negócio com a calculadora. | profitability, break-even, financial planning |
| **Equipe de riscos** | Busca os pontos fracos de uma ideia de negócio e formas baratas de testá-los antes de abrir a empresa. | risk analysis, validation experiments |
| **Equipe de regulação** | Identifica licenças, registros, rotulagem, higiene, seguros e obrigações de proteção de dados que uma ideia de negócio envolve. | regulation, permits, licences, data protection |
| **Equipe de operações** | Verifica se uma ideia de negócio pode ser executada como descrito: processos, capacidade, equipamentos, fornecedores e logística. | operations, technology, logistics, suppliers |

**Entrada:** Uma descrição da ideia com oferta, públicos-alvo, preços, custos, capacidade e concorrentes conhecidos.

**Casos de teste:** Serviço móvel de conserto de bicicletas; Fábrica de kombucha (alimento regulado)

**Resultado:** Um veredito estruturado (seguir em frente, adaptar ou descartar) com nota, pontos fortes, riscos, premissas a testar e próximos passos concretos, também como relatório em PDF. Na execução, a visão de orquestração mostra quais equipes a mentora escolheu, por quê, com qual tarefa e o que cada equipe entregou.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: a mentora decide quais equipes trabalham, em que ordem e com qual tarefa; cada decisão fica registrada com seu motivo. Limites mantêm isso sob controle: no máximo 6 decisões, cada equipe no máximo duas vezes, no máximo 3 equipes ao mesmo tempo e um orçamento de 3 USD por execução. Nenhuma etapa espera por uma pessoa; o veredito é a base para a sua própria decisão.

**Por que esta arquitetura:** Um fluxo de trabalho fixo rodaria sempre as cinco equipes e pagaria uma análise de licenças de que um serviço de bicicletas não precisa, ou as deixaria de fora quando importam. A mentora faz exatamente essa escolha, de forma rastreável e dentro de limites. O júri continua sendo uma etapa fixa, porque um veredito estruturado e comparável não deve depender de como a mentora dividiu o trabalho.

**Como adaptar:** Descreva sua ideia com seus próprios números. Para incluir outro especialista, por exemplo para questões tributárias, salve um fluxo de trabalho com descrição clara e capacidades e adicione-o às equipes da mentora; ela decide sozinha quando ele é necessário. Seus próprios dados de mercado podem ser enviados como conhecimento e atribuídos ao analista de mercado da equipe de mercado.

## 17 · Desenvolver uma estratégia para redes sociais {#creator-strategy}
<!-- keywords: influenciadores e criadores de conteúdo, agente de estratégia, desenvolvedor de ideias, planejador de conteúdo -->

**Área:** Influenciadores e criadores de conteúdo · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada, memória

Publicar com regularidade exige uma direção clara e um plano que caiba no seu tempo disponível. O fluxo de trabalho deriva uma estratégia das métricas, reúne ideias adequadas e planeja a publicação.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o desenvolvedor de ideias lê a memória "creator-ideas" antes de começar e, ao fim de cada execução, salva ele mesmo ali os títulos provisórios das novas ideias, sem etapa de confirmação; você pode ver ou limpar a memória em Memória. Uma verificação de qualidade feita por um segundo modelo confere o calendário do planejador de conteúdo com três critérios (frequência compatível com o tempo disponível, pilares equilibrados, metas apoiadas); se um falhar, o calendário é revisado uma vez e o resultado da verificação fica registrado com a execução. Nenhuma etapa espera por uma pessoa e não há orçamento próprio (vale o orçamento padrão do seu workspace). Nada é publicado: o plano é um rascunho que você ajusta e posta por conta própria.

**Por que esta arquitetura:** Estratégia, ideias e calendário se apoiam estritamente uns nos outros, por isso basta uma cadeia de três agentes; o planejador de conteúdo recebe também a estratégia diretamente para medir o mix pelos pilares. Só o desenvolvedor de ideias tem memória, porque ideias repetidas são o verdadeiro problema de execuções mensais, enquanto a estratégia deve surgir sempre dos números atuais. Não foram usadas de propósito uma busca na web por tendências em tempo real nem uma conexão com as plataformas: resultados de tendências mudam todo dia e tornariam as execuções nem reproduzíveis nem portáveis, e um rascunho de plano não deve ser postado automaticamente; a estratégia se baseia, em vez disso, nas suas próprias estatísticas.

**Como adaptar:** Informe o seu perfil e os seus números ou anexe capturas de tela das suas estatísticas. O estilo da sua marca e os temas proibidos são acrescentados no prompt de sistema do desenvolvedor de ideias. A memória "creator-ideas" fica em Memória; limpe-a se quiser recomeçar. Para um plano mensal, você pode agendar a cópia.

## 18 · Comparar ofertas de imóveis {#real-estate}
<!-- keywords: imóveis, calculista de rentabilidade, analista de imóvel e localização, avaliação de oportunidades e riscos -->

**Área:** Imóveis · **Agentes:** 3 · **Padrão:** paralelo · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

Em imóveis, números e localização decidem juntos. O fluxo de trabalho recalcula rentabilidade e fluxo de caixa, analisa o imóvel e sua localização e confronta oportunidades e riscos.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: as duas análises rodam em paralelo em toda execução, e o calculista de rentabilidade calcula cada indicador com a calculadora, de modo que cada cálculo pode ser acompanhado na execução. Nenhuma etapa espera por uma pessoa e nenhum controle de qualidade revisa o resultado; você pode anexar no máximo 8 arquivos. Como decisões imobiliárias são sensíveis, todos os agentes são instruídos a apontar os pontos que uma pessoa qualificada precisa verificar e a não transmitir mais certeza do que os dados permitem. Não há orçamento próprio, então vale o orçamento padrão do seu espaço de trabalho; a comparação é um apoio para a sua própria decisão, não uma recomendação de compra.

**Por que esta arquitetura:** Rentabilidade e localização são perguntas independentes, por isso rodam em paralelo, e só a avaliação as pondera entre si; a estrutura fixa (comparação, oferta preferida, riscos, verificações) torna as ofertas comparáveis de uma execução para outra. Um orquestrador não acrescentaria nada, porque toda comparação precisa das duas análises. De propósito não há busca na web ao vivo por preços anunciados ou níveis de aluguel: os resultados mudariam a cada execução e não seriam rastreáveis, enquanto seus anúncios, atas e um índice de aluguéis salvo mantêm a base fixa e verificável.

**Como adaptar:** Informe as suas ofertas e dados de financiamento e anexe diretamente anúncios, atas de assembleia ou plantas. Um índice de aluguéis de que você precisa com frequência pode ser salvo como conhecimento e atribuído ao analista de imóvel e localização.

## 19 · Analisar atrasos de obra {#construction-delay}
<!-- keywords: construção civil, analista de cronograma, coordenação de obra, relatório ao contratante -->

**Área:** Construção civil · **Agentes:** 3 · **Padrão:** adaptativo (orquestração) · **Nível:** Avançado · **Elementos:** orquestrador com equipes, aprovação, formulário de entrada, arquivos de resultado, arquivos como entrada, contrato de saída, orçamento e limites

Atrasos na obra têm causas diferentes, e cada causa precisa de outro conhecimento: geada precisa ser documentada, um fornecedor atrasado exige uma notificação de impedimento à parte certa, uma alteração de projeto determinada pelo contratante pode justificar uma prorrogação de prazo, e a falta de pessoal exige um plano de aceleração. O fluxo de trabalho calcula os desvios e deixa uma coordenação de obra envolver exatamente as equipes especializadas de que a situação precisa.

**Como os agentes trabalham juntos:** O analista de cronograma calcula com a ferramenta de datas o atraso de cada marco e lista as causas supostas. A coordenação de obra, um orquestrador, primeiro monta uma equipe de no máximo três a partir das quatro equipes especializadas e depois distribui tarefas: a equipe de obra para clima, solo e alterações de projeto, a equipe de suprimentos para fornecedores e subempreiteiros, a equipe de pleitos para notificações de impedimento e prorrogações de prazo, a equipe de recuperação para medidas de aceleração com custo. Equipes independentes trabalham em paralelo. A equipe de pleitos para por uma pessoa: seu rascunho de notificação só é usado depois que a gerência de obra responsável o visar. O agente de relatório redige o relatório de status e, antes que ele chegue ao contratante, uma pessoa o libera.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Analista de cronograma** | Calcula os atrasos e o caminho crítico com as ferramentas de datas e de cálculo. (saída estruturada; Ferramentas: `days_between`, `calculator`) | Situação do projeto |
| **Coordenação de obra** | Monta as equipes especializadas de que o atraso precisa e distribui suas tarefas. (Orquestrador) | Analista de cronograma |
| **Relatório ao contratante** | Resume de forma objetiva para o contratante o cronograma, as causas, os pleitos e as medidas. | Analista de cronograma, Coordenação de obra |

**Equipes que o orquestrador pode acionar:**

| Equipe | Tarefa | Capacidades |
|---|---|---|
| **Equipe de obra e projeto** | Examina causas técnicas de atrasos de obra: clima, solo, alterações de projeto e sequência dos serviços; atribui dias de atraso com evidências. | technical causes, design changes, ground conditions, weather |
| **Equipe de suprimentos** | Examina atrasos causados por fornecedores, entregas de material e efetivo de subempreiteiros; atribui dias de atraso com evidências. | supply chain, subcontractors, material delivery |
| **Equipe de pleitos** | Redige notificações de impedimento e avalia pleitos de prorrogação de prazo para atrasos fora da esfera da construtora; uma gerência de obra visa o rascunho. (para por uma liberação) | contract, claims, notice of obstruction |
| **Equipe de recuperação** | Desenvolve medidas de aceleração para uma obra atrasada com dias recuperados, custo adicional e nova previsão de conclusão. | recovery planning, acceleration, cost estimate |

**Entrada:** Uma visão geral do cronograma com marcos planejados e reais, observações sobre as causas, data do relatório e condições contratuais, como texto ou como arquivos: cronograma em Excel, diário de obra em PDF, fotos como imagens. Os arquivos de exemplo contêm um cronograma e um trecho do diário de obra.

**Arquivos de exemplo:** `Cronograma_creche_Sol_Nascente.xlsx`, `Diario_de_obra_trecho_abril_maio.pdf`

**Casos de teste:** Cronograma no texto; Cronograma e diário de obra como arquivos

**Resultado:** Um relatório de status objetivo com situação do cronograma, causas e esferas de responsabilidade, notificações e pleitos de prorrogação, medidas de recuperação com custo, decisões necessárias e riscos; após a liberação, em PDF e em um arquivo Word editável. A visão de orquestração mostra quais equipes a coordenação montou, o que cada uma entregou como dados estruturados e por quê. Questões sobre multas contratuais e prorrogações de prazo continuam sujeitas a revisão técnica e jurídica.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: a coordenação escolhe no máximo três equipes, faz no máximo duas trabalharem ao mesmo tempo e dá a cada equipe no máximo duas tarefas; cada decisão de composição e de tarefa é registrada com o motivo. Uma pessoa decide duas vezes: a gerência de obra visa o rascunho da notificação de impedimento dentro da equipe de pleitos (rejeitá-lo encerra a execução), e uma pessoa libera o relatório de status antes que arquivos sejam criados. Limites: no máximo 8 decisões da coordenação, 50 passos, 40 minutos e 4 USD por execução.

**Por que esta arquitetura:** Uma cadeia fixa tratava todo atraso da mesma forma: um analista de causas, um planejador de medidas, fosse o problema geada ou uma notificação ausente. Com a coordenação, um atraso puramente climático não custa uma análise de pleitos, enquanto uma alteração de projeto determinada pelo contratante traz a equipe de pleitos com o seu visto. As equipes devolvem resultados estruturados (dias, responsabilidade, evidências), de modo que o relatório pode somá-los em vez de reformular texto. O cálculo do cronograma, o relatório e a liberação final continuam sendo passos fixos, porque todo relatório precisa deles.

**Como adaptar:** Exporte o seu cronograma do software de projetos em Excel e anexe o diário de obra e as fotos. Adapte a equipe de pleitos ao seu tipo de contrato (por exemplo FIDIC ou condições próprias) e informe na equipe de recuperação as taxas de custo da sua empresa. Se você precisar de outra especialidade, como instalações prediais, salve-a como fluxo de trabalho com uma descrição clara e adicione-a às equipes da coordenação.

## 20 · Desenvolver e precificar um cardápio {#restaurant-menu}
<!-- keywords: gastronomia, desenvolvedor de conceito, precificação, redator do cardápio -->

**Área:** Gastronomia · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

Um cardápio precisa agradar aos clientes e dar lucro. O fluxo de trabalho desenvolve pratos para um público, calcula o custo de insumos e os preços e escreve textos de cardápio apetitosos.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: as três etapas rodam sempre na mesma ordem; a precificação calcula com a calculadora e recebe seus preços de compra direto da entrada, no máximo um arquivo CSV ou Excel de até 5 MB. Um controle de qualidade avalia o cardápio por três critérios (público, preços conforme a precificação, aviso sobre alergênicos); se um falhar, o redator do cardápio o revisa uma vez, e o resultado do controle fica registrado na execução com sua justificativa (se ainda falhar, o fluxo continua e o controle conta como não aprovado). Nenhuma etapa espera por uma pessoa e não há orçamento próprio, então vale o orçamento padrão do seu espaço de trabalho. Cardápio e precificação são rascunhos: você confere preços, porções e a indicação de alergênicos antes de imprimir.

**Por que esta arquitetura:** Cada etapa se apoia na anterior: sem pratos não há precificação e sem preços não há cardápio, por isso uma cadeia fixa é o formato certo; a precificação também recebe a lista de preços diretamente, para não depender de o desenvolvedor de conceito repetir números. O controle de qualidade fica no cardápio porque é ali que os preços podem se afastar da precificação. De propósito não se usa um orquestrador, porque as etapas são sempre as mesmas, nem uma busca na web ao vivo por preços de atacado, que variariam a cada execução e não bateriam com o seu fornecedor; sua própria lista de preços torna a precificação reproduzível.

**Como adaptar:** Anexe a sua lista atual de preços de compra e descreva o seu público. As suas fichas técnicas podem ser carregadas como conhecimento e atribuídas à precificação; regras da casa, como tamanho das porções, vão no desenvolvedor de conceito. Para a troca a cada duas semanas, você pode agendar a cópia.

## 21 · Planejamento de culturas de uma propriedade {#farm-planning}
<!-- keywords: agricultura, planejador de rotação, cálculo de margem bruta, verificação de plausibilidade -->

**Área:** Agricultura · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Avançado · **Elementos:** formulário de entrada, arquivos de resultado, arquivos como entrada

O planejamento de culturas precisa considerar ao mesmo tempo rotação, solos, contratos e rentabilidade. O fluxo de trabalho propõe uma rotação, calcula margens brutas e verifica o plano segundo suas próprias regras.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: as três etapas rodam sempre na mesma ordem; o cálculo de margem bruta calcula cada talhão e o total com a calculadora, de modo que os números podem ser acompanhados na execução. Não há revisão automática: a verificação de plausibilidade não altera o plano, mas lista verificações de regras, riscos e perguntas em aberto em um resultado estruturado com a margem bruta total como número. Nenhuma etapa espera por uma pessoa; você pode anexar até 3 arquivos de 10 MB cada, e não há orçamento próprio, então vale o orçamento padrão do seu espaço de trabalho. O plano é um rascunho que você confere com as regras locais vigentes antes de comprar sementes ou pedir subsídios.

**Por que esta arquitetura:** Primeiro vem a escolha das culturas, as margens brutas dependem dela e a verificação precisa das duas, por isso uma cadeia fixa é o formato certo; a verificação de plausibilidade também recebe a rotação diretamente para compará-la com as suas regras. De propósito há uma etapa de verificação própria que aponta violações abertamente, em vez de um ciclo de qualidade que reescreveria o plano sem avisar, porque desvios na rotação são escolhas que cabem a você. Sem busca na web ao vivo por preços ou exigências e sem orquestrador: preços e regras encontrados online mudam diariamente e variam por região, suas próprias premissas mantêm o cálculo reproduzível e as etapas são as mesmas para toda propriedade.

**Como adaptar:** Anexe o seu cadastro de talhões e os seus dados de cálculo em Excel e informe as suas regras de planejamento. Análises de solo de que você precisa todo ano podem ser carregadas como conhecimento e atribuídas ao planejador de rotação.

## 22 · Planejar a festa de uma associação {#club-event}
<!-- keywords: associações e clubes, planejador de cronograma, planejador de orçamento, planejador de comunicação, documento para a diretoria -->

**Área:** Associações e clubes · **Agentes:** 4 · **Padrão:** paralelo · **Nível:** Iniciante · **Elementos:** arquivos de resultado

Festas de associações são organizadas por voluntários no tempo livre. O fluxo de trabalho cria cronograma, tarefas, orçamento e comunicação e resume tudo em um documento para a reunião da diretoria.

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

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: cronograma e orçamento são feitos em paralelo; o planejador de cronograma conta regressivamente a partir da data da festa com a ferramenta de datas e o planejador de orçamento calcula com a calculadora. Uma verificação de qualidade avalia o documento para a diretoria quanto a completude, responsabilidades e coerência com o orçamento; se um critério falhar, o documento é revisado uma vez, e o resultado da verificação fica registrado na execução com sua justificativa (se ainda falhar, o fluxo continua e a verificação conta como não aprovada). Nenhuma etapa espera por uma pessoa e nada é enviado; não há orçamento próprio, então vale o orçamento padrão do seu espaço de trabalho. O documento é um rascunho, e a diretoria decide sobre as propostas de deliberação.

**Por que esta arquitetura:** Cronograma e orçamento não dependem um do outro e rodam em paralelo, enquanto o planejador de comunicação precisa do cronograma e por isso vem depois; o documento para a diretoria reúne tudo. De propósito não há etapa de aprovação no fluxo, porque a aprovação de verdade é a própria reunião da diretoria, nem integração com e-mail ou agenda, porque os voluntários enviam os convites eles mesmos depois que a diretoria decide. Um orquestrador não acrescentaria nada, já que toda festa precisa das mesmas quatro partes.

**Como adaptar:** Insira as informações-chave da sua festa. Licenças e exigências variam conforme o município; acrescente as exigências conhecidas na entrada. Logotipos e modelos de cartaz podem ser guardados como conhecimento.

## 23 · Desenvolver uma campanha de doações {#nonprofit-campaign}
<!-- keywords: organizações sem fins lucrativos, desenvolvedor da campanha, analista de impacto, revisor de credibilidade -->

**Área:** Organizações sem fins lucrativos · **Agentes:** 3 · **Padrão:** com ramificações · **Nível:** Avançado · **Elementos:** decisão, ciclo de revisão, arquivos de resultado, propostas de conhecimento

Campanhas de doação precisam de uma história tocante, mas também de afirmações honestas sobre impacto. O fluxo de trabalho desenvolve uma campanha, avalia o possível impacto e verifica se as promessas são críveis e eticamente corretas.

**Como os agentes trabalham juntos:** O desenvolvedor da campanha e o analista de impacto trabalham em paralelo: um concebe mensagem, públicos e ações, o outro constrói um modelo de impacto com indicadores e calcula o custo por criança com a calculadora. O revisor de credibilidade verifica os dois. Se ele considerar a campanha não crível, uma condição a devolve ao desenvolvedor da campanha junto com as observações da revisão; a campanha revisada é verificada de novo, no máximo duas vezes. O resultado contém as três partes.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Desenvolvedor da campanha** | Concebe mensagem, públicos, canais e cronograma da campanha. | Descrição do projeto |
| **Analista de impacto** | Constrói um modelo de impacto com indicadores e o custo por criança. (Ferramentas: `calculator`) | Descrição do projeto |
| **Revisor de credibilidade** | Verifica afirmações quanto a exagero, ética e evidências. (saída estruturada) | Desenvolvedor da campanha, Analista de impacto |

**Entrada:** Organização, projeto, resultados até agora, meta, necessidade de recursos, período da campanha e canais existentes.

**Casos de teste:** Padrinhos de leitura nas escolas

**Resultado:** Um conceito de campanha com cronograma e rascunhos de textos, um modelo de impacto com indicadores e uma revisão estruturada de afirmações exageradas, observações éticas e um plano de medição de impacto, também como arquivo Word. O analista de impacto propõe o seu modelo de impacto para o conhecimento, por exemplo para futuros pedidos de financiamento; só é salvo o que você confirmar.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: o parecer sim/não do revisor de credibilidade sobre a credibilidade decide se a campanha volta para revisão; a execução mostra qual ramo foi seguido. O desenvolvedor da campanha revisa no máximo duas vezes, cada vez com as observações da revisão e o seu rascunho anterior. Se depois disso a campanha ainda não for considerada crível, a execução segue mesmo assim para o resultado, e as observações da revisão mostram o que continua em aberto. Nenhuma etapa espera por uma pessoa: textos e números são rascunhos que a sua organização confere antes de publicar, principalmente as afirmações sobre impacto e as fotos de crianças. Modelos de impacto propostos só são salvos como conhecimento se você os confirmar.

**Por que esta arquitetura:** Problemas de credibilidade são mais bem corrigidos por quem escreveu o texto; por isso a revisão volta ao desenvolvedor da campanha em vez de apenas listar problemas. O ciclo é limitado a duas rodadas: uma campanha que ainda exagera depois disso precisa de evidências melhores da organização, não de mais reformulações. O modelo de impacto fica fora do ciclo porque se baseia nos dados do projeto, não nos textos da campanha. Não há etapa de aprovação, porque a campanha continua sendo um rascunho e é publicada de qualquer forma fora do fluxo de trabalho.

**Como adaptar:** Descreva seu projeto e seus resultados da forma mais honesta possível. Carregue relatórios anuais ou avaliações como conhecimento e atribua-os ao analista de impacto.

## 24 · Responder a uma solicitação de cidadão {#citizen-inquiry}
<!-- keywords: instituições públicas, análise de assuntos, preparação das informações, rascunho de resposta -->

**Área:** Instituições públicas · **Agentes:** 3 · **Padrão:** sequencial · **Nível:** Iniciante · **Elementos:** aprovação, ciclo de revisão, formulário de entrada, arquivos de resultado, arquivos como entrada, propostas de conhecimento, arquivos de conhecimento

Solicitações de cidadãos muitas vezes contêm vários assuntos e precisam ser respondidas de forma correta, clara e sem compromissos precipitados. O fluxo de trabalho decompõe a solicitação, encontra as regras relevantes do município, prepara uma resposta e deixa a decisão de enviá-la com o servidor responsável.

> Exige revisão especializada: os resultados são ferramentas de apoio e precisam ser verificados por uma pessoa qualificada.

**Como os agentes trabalham juntos:** Uma cadeia de três agentes e uma aprovação: a análise de assuntos separa os assuntos e atribui responsabilidades. A preparação das informações pesquisa as regras salvas do município e os documentos da solicitação, cita os trechos usados e informa quando nenhuma regra cobre um assunto. O rascunho de resposta redige uma resposta acessível ao cidadão; uma verificação de qualidade garante que apenas regras documentadas sejam citadas e que nenhum compromisso vinculante seja assumido. Depois, o servidor responsável confere a resposta; uma rejeição com comentário a devolve ao rascunho de resposta para revisão.

| Agente | Tarefa | Recebe |
|---|---|---|
| **Análise de assuntos** | Separa os assuntos e atribui responsabilidades e urgência. | Solicitação do cidadão |
| **Preparação das informações** | Pesquisa as regras do município e cita os trechos relevantes para cada assunto. | Análise de assuntos, Solicitação do cidadão |
| **Rascunho de resposta** | Redige uma resposta objetiva e acessível para aprovação. (com verificação de qualidade) | Análise de assuntos, Preparação das informações |

**Entrada:** A solicitação da cidadã ou do cidadão, opcionalmente com informações internas sobre o caso, como texto ou como arquivos. Você também pode anexar fotos da solicitação. As regras do município vêm da coleção de conhecimento; um conjunto fictício de regras de Cidade Exemplo está incluído. O arquivo de exemplo é um folheto informativo fictício da prefeitura.

**Arquivos de exemplo:** `Folheto_anexos_e_iluminacao.pdf`

**Casos de teste:** Depósito de jardim e poste de luz; Regras como arquivo de folheto

**Resultado:** Um rascunho de resposta em linguagem simples com responsabilidades, próximos passos e observações para o servidor responsável; após a aprovação, também como arquivo Word para o seu papel timbrado. O arquivo Word é higienizado: dados pessoais, como nomes, endereços, telefones e e-mails, e credenciais são substituídos por marcadores, então você insere os dados do destinatário a partir do processo. A preparação das informações propõe as regras encontradas, com a referência, para o conhecimento; só é salvo o que você confirmar.

**O que é decidido automaticamente e quando uma pessoa intervém:** Automático: a análise de assuntos, a pesquisa de regras com citações e a verificação de qualidade do rascunho (somente regras documentadas, linguagem simples, nenhum compromisso vinculante). Uma pessoa decide: o servidor responsável confere cada resposta antes do envio. Uma rejeição exige um comentário e devolve o rascunho com esse retorno ao rascunho de resposta; após no máximo 2 revisões, uma nova rejeição faz a execução falhar sem arquivo. O fluxo de trabalho não envia nada sozinho; mesmo aprovada, a resposta é um rascunho que o servidor responsável envia pelos canais habituais.

**Por que esta arquitetura:** Toda solicitação precisa das mesmas etapas, então uma cadeia fixa basta, e um orquestrador só aumentaria o custo. As regras são conhecimento pesquisável em vez de texto colado em cada solicitação: a preparação das informações encontra os trechos relevantes, cita-os e percebe quando nada se aplica. A aprovação com loop de revisão existe porque uma resposta ao cidadão tem efeito fora da administração e quem trata o caso o conhece melhor. Uma conexão com o sistema de e-mail foi deixada de fora de propósito, para que o envio continue sendo uma decisão humana.

**Arquivos de conhecimento (sintéticos, criados ao copiar):** Regras_municipio_Cidade_Exemplo: Regras fictícias do município de Cidade Exemplo sobre anexos, o plano de zoneamento nº 17, iluminação pública, resíduos volumosos, árvores e o atendimento de solicitações.

**Como adaptar:** Substitua as regras fictícias da coleção de conhecimento pelos seus regulamentos, folhetos e listas de responsabilidades; títulos e números claros tornam as citações precisas. Papel timbrado e despedida vão no prompt de sistema do rascunho de resposta. Para muitas solicitações de uma vez, use o processamento em lote.

<!-- examples:end -->
