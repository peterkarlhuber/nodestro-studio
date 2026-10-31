# Conhecimento

Em *Conhecimento* você guarda arquivos que os agentes usam como material de referência: manuais, relatórios, contratos, tabelas ou imagens. Este capítulo explica os formatos, as três formas de uso e como a pesquisa funciona.

## Visão geral {#ueberblick}
<!-- keywords: conhecimento, base de conhecimento, arquivos, conhecimento de apoio, rag, documentos -->

O conhecimento funciona em três etapas:

1. **Enviar** na página *Conhecimento*. Textos e PDFs são indexados automaticamente para a pesquisa de texto completo.
2. **Atribuir** no inspetor de um agente (seção *Conhecimento*). Um agente só vê os arquivos atribuídos a ele.
3. **Escolher o modo:** *No contexto*, *Sob demanda* ou *Pesquisa*.

Um arquivo pode ser atribuído a quantos agentes você quiser.

## Enviar arquivos {#hochladen}
<!-- keywords: enviar, upload, arrastar e soltar, arrastar, descrição -->

Clique em **Enviar arquivos** ou arraste arquivos para a área de envio; é possível enviar vários de uma vez. Cada arquivo mostra tamanho, tipo, número de trechos indexados e idade. O nome do arquivo abre o original em uma nova aba.

Se você enviar **exatamente o mesmo arquivo** de novo, não é criada uma duplicata: o identificador vem do conteúdo, e o nome e a descrição são atualizados.

Você também pode enviar arquivos direto na seção *Conhecimento* de um agente; eles chegam aqui, sem coleção, e ficam atribuídos a esse agente na hora ([Agentes](/docs/agenten#wissen)).

## Formatos e limites {#formate}
<!-- keywords: formatos, pdf, imagem, png, jpg, jpeg, gif, webp, txt, markdown, csv, json, yaml, html, xml, tamanho, limite, mb -->

| Tipo | Formatos | Tamanho | Pesquisável |
|---|---|---|---|
| Documentos | PDF | até 20 MB | sim, página por página (PDFs com camada de texto ou após OCR) |
| Office | Word (DOCX), Excel (XLSX), convertidos em Markdown | até 20 MB | sim |
| Textos | TXT, Markdown, CSV, JSON, YAML, HTML, XML | até 20 MB | sim |
| Imagens | PNG, JPEG, GIF, WebP | até 5 MB | não |

Os textos precisam estar em UTF-8. Word e Excel são convertidos no envio; fórmulas são mostradas, nunca calculadas (veja [Word e Excel](/docs/dateien#dokumentformate)). **PDFs digitalizados** sem camada de texto são salvos e podem ser lidos no contexto ou sob demanda, mas só ficam pesquisáveis depois de um [reconhecimento de texto (OCR)](/docs/dateien#ocr).

## Indexação {#indexierung}
<!-- keywords: índice, indexação, trechos, chunks, fts5, texto completo -->

No envio, o Nodestro divide o texto em **trechos** de cerca de 1.500 caracteres com 200 caracteres de sobreposição, nos limites de parágrafo. PDFs são indexados página por página; os resultados então têm títulos como "Relatório, p. 3". O número de trechos aparece ao lado de cada arquivo.

O índice é uma pesquisa de texto completo do SQLite (FTS5 com ranking BM25) dentro do próprio banco de dados do Nodestro. Não é preciso serviço externo nem modelo de embeddings, e a indexação não custa nada.

## Os três modos {#modi}
<!-- keywords: no contexto, sob demanda, pesquisa, on demand, context, search, ferramenta files, ferramenta search, modo -->

| Modo | O que o agente recebe | Indicado para | Custos |
|---|---|---|---|
| **No contexto** | Todos os arquivos atribuídos, completos, no início do prompt. | Poucos documentos curtos sempre necessários (guia de estilo, tabela de preços). Imagens também. | Cada solicitação contém todos os arquivos; o cache barateia as repetições. |
| **Sob demanda** | Um catálogo (nome, tipo, tamanho, descrição) e a ferramenta `files`, com a qual ele carrega arquivos inteiros. | Coleções médias em que cada tarefa só precisa de alguns arquivos. Imagens e PDFs digitalizados também. | Só os arquivos carregados custam tokens. |
| **Pesquisa** | A ferramenta `search`, que retorna os trechos mais adequados com a fonte (RAG). | Documentos e coleções grandes dos quais se precisam fatos específicos. | Só os trechos encontrados custam tokens. |

**Recomendações:**

- No modo *Sob demanda*, o agente decide qual arquivo carregar com base na **descrição**. Mantenha descrições claras.
- No modo *Pesquisa*, o agente pode pesquisar várias vezes com termos diferentes. Peça no prompt de sistema que ele comprove as afirmações com as fontes.
- Imagens e PDFs sem texto ficam invisíveis no modo *Pesquisa*.

## Citações {#zitate}
<!-- keywords: citações, citations, fontes, trechos, comprovar -->

**Ativar citações** vale para o modo *No contexto*: a resposta então remete aos trechos exatos dos documentos. No modo *Pesquisa*, os resultados sempre trazem as fontes.

Citações **não podem ser combinadas com um formato de saída estruturado**; a verificação informa isso como erro.

## Anexar arquivos ao iniciar {#start-dateien}
<!-- keywords: anexar arquivos, caixa de diálogo de início, uma vez, por execução, anexo -->

Na caixa de diálogo de início você pode escolher em **Anexar arquivos** arquivos de conhecimento para **esta execução específica**. Eles são colocados direto no contexto dos primeiros agentes, ou seja, os conectados ao início ou sem antecessores. Agentes posteriores não os recebem, apenas os resultados dos antecessores.

Assim você pode, por exemplo, iniciar um fluxo de trabalho com um contrato diferente a cada vez, sem reconfigurar os agentes. O arquivo precisa ter sido enviado antes em *Conhecimento*.

## Testar a pesquisa {#suche}
<!-- keywords: testar pesquisa, termo de pesquisa, pontuação, score, resultados, bm25, acentos -->

À direita da página *Conhecimento* você testa a pesquisa em **todos** os arquivos indexados, exatamente como um agente a usa no modo *Pesquisa* (o agente só pesquisa nos arquivos atribuídos a ele). Cada resultado mostra título, trecho e **pontuação** (relevância; quanto maior, melhor).

Características da pesquisa:

- Acentos são normalizados: "acao" encontra "ação".
- As palavras também correspondem como início de palavra: "garantia" encontra "garantias".
- É uma pesquisa por palavras-chave, não por significado: sinônimos não são encontrados. Escreva os termos como aparecem no documento.

O campo de filtro à esquerda só pesquisa nomes de arquivo e descrições.

## Coleções e origem {#sammlungen}
<!-- keywords: coleção, coleções, organizar, origem, incorporado, pesquisável -->

Coleções agrupam arquivos do conhecimento, ex.: “Contratos” ou “Dados de produtos”. Ao enviar, escolha uma coleção em *Enviar para a coleção*; depois você pode alterá-la em cada arquivo. Os chips acima da lista filtram por coleção. Os agentes continuam recebendo exatamente os arquivos atribuídos a eles.

Conteúdo de execuções (arquivos enviados, arquivos de resultado, resultados e propostas de agentes) só entra no conhecimento após sua confirmação, veja [Incorporar ao conhecimento](/docs/datei-eingaben#knowledge-uebernahme). Esses arquivos mostram em *Origem* de qual workflow, etapa e execução vieram e se o conteúdo foi extraído, gerado ou é uma suposição.

## Gerenciar arquivos {#verwalten}
<!-- keywords: editar descrição, excluir, gerenciar, remover -->

- **Descrição:** digite direto ao lado do arquivo; ela é salva quando você sai do campo. Boas descrições indicam conteúdo, período e finalidade, por exemplo "Relatório anual 2025 com balanço e relatório de riscos".
- **Excluir:** símbolo da lixeira. O arquivo e o índice dele são removidos. Agentes que o tinham atribuído continuam funcionando e simplesmente deixam de recebê-lo.

## Dicas e erros comuns {#tipps}
<!-- keywords: dicas, erros, agente não encontra nada, caro demais, contexto grande demais -->

- **O agente não encontra nada:** confira em *Testar a pesquisa* se o arquivo está indexado e se o termo é encontrado. Se o arquivo for um PDF digitalizado, use *Sob demanda*.
- **As execuções ficam caras:** muitos arquivos grandes *No contexto* enchem cada solicitação. Mude para *Sob demanda* ou *Pesquisa*.
- **Janela de contexto excedida:** arquivos demais, ou grandes demais, no contexto causam um erro da API. Distribua o conhecimento ou use a pesquisa.
- **Resposta sem fontes:** peça explicitamente no prompt de sistema que as afirmações sejam comprovadas com as fontes.
