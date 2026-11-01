# Arquivos como entrada

Fluxos de trabalho podem receber arquivos diretamente como entrada: contratos, faturas, planilhas, imagens ou arquivos ZIP inteiros. Você os envia ao iniciar, sem incorporá-los antes ao conhecimento. O Nodestro os verifica e lê localmente e entrega aos agentes exatamente o que eles precisam.

## Visão geral {#ueberblick}
<!-- keywords: arquivo, arquivos, enviar, upload, entrada, documento, anexo, início -->

- No formulário de entrada do nó **Início** você adiciona campos do tipo **Arquivo**. Ao iniciar, arraste arquivos para o campo ou escolha-os.
- Mesmo sem formulário, você pode enviar arquivos ou escolhê-los do conhecimento em *Arquivos* no diálogo de início.
- Os arquivos enviados pertencem à **execução**, não ao conhecimento. Eles aparecem na visão detalhada da execução em *Arquivos recebidos*.
- O que deve ficar disponível para todos os agentes de forma permanente, você incorpora explicitamente [ao conhecimento](/docs/wissen#sammlungen).

## Campos de arquivo {#datei-felder}
<!-- keywords: campo de arquivo, formulário, arrastar e soltar, pasta, escolher -->

Um campo de arquivo aceita arquivos arrastados ou via **Escolher arquivos**. Cada arquivo é enviado e verificado na hora. A lista mostra nome, formato, tamanho, estado e, se recusado, o motivo. Antes do início você pode remover arquivos e ver com o ícone de olho o que o Nodestro leu.

A execução só começa quando todos os arquivos foram enviados. Arquivos recusados nunca fazem parte da execução.

Na tarefa de um agente, `{{form.<nome>}}` representa os nomes dos arquivos do campo. O agente recebe também os conteúdos, como descrito em [Entrega aos agentes](/docs/datei-eingaben#uebergabe). Mais sobre formulários: [Formulários de entrada](/docs/verzweigungen#eingabeformular).

## Configurações do campo {#feld-einstellungen}
<!-- keywords: configurações, tipos permitidos, vários arquivos, máximo, tamanho, mb, limite -->

No inspetor do nó Início, cada campo de arquivo tem a seção *Opções de arquivo*. Fechada, ela resume a escolha atual em uma linha, por exemplo “todos os formatos · até 20 MB · vários arquivos · Automática”. Aberta, mostra estas configurações:

| Configuração | Significado |
|---|---|
| Tipos de arquivo permitidos | grupos (texto, dados, documentos, imagens, arquivos ZIP) ou formatos individuais; sem seleção, todos são aceitos |
| Vários arquivos | desligado: exatamente um arquivo; ligado: vários arquivos |
| Número máximo de arquivos | limite opcional com vários arquivos |
| MB máximos por arquivo | 20 MB por padrão, no máximo 50 MB |
| Entrega aos agentes | *Automática*, *Sempre o conteúdo* ou *Visão geral, conteúdo sob demanda* |

## Campos obrigatórios e opcionais {#optionale-felder}
<!-- keywords: obrigatório, opcional, vazio, faltando, não informado, está vazio -->

Todo campo, não só os de arquivo, é **obrigatório** ou **opcional**. Um campo obrigatório precisa ser preenchido antes do início. Um campo opcional vazio continua vazio:

- Na tarefa de um agente ele aparece como “(not provided)”, para que o agente saiba que nada foi informado.
- Nós de decisão veem um valor vazio e podem testá-lo com *está vazio*.
- Campos de arquivo vazios não criam referências a arquivos. Isso vale também para subfluxos, APIs publicadas e projetos exportados.

## Formatos compatíveis {#formate}
<!-- keywords: formatos, txt, markdown, csv, json, xlsx, excel, pdf, docx, word, png, jpg, webp, imagem, zip -->

| Grupo | Formatos | O que o Nodestro lê |
|---|---|---|
| Texto | TXT, Markdown, código-fonte | o texto |
| Dados | CSV, JSON, Excel (XLSX) | tabelas com colunas; Excel com todas as planilhas |
| Documentos | PDF, Word (DOCX) | texto com títulos e tabelas; páginas nos PDFs |
| Imagens | PNG, JPG, WebP | a imagem; texto reconhecido se o OCR estiver ligado |
| Arquivos compactados | ZIP | a estrutura de pastas e cada arquivo contido separadamente |

O Nodestro verifica o **conteúdo real**, não só a extensão: um arquivo renomeado, um arquivo danificado ou um JSON inválido é recusado com um motivo compreensível. PDFs digitalizados sem camada de texto são lidos com OCR se o reconhecimento de texto estiver ligado. Fórmulas do Excel nunca são calculadas; o valor salvo é lido.

## Vários arquivos e pastas {#mehrere-dateien}
<!-- keywords: vários arquivos, pasta, diretório, coleção, caminhos relativos -->

Com **Escolher pasta**, ou arrastando uma pasta, você envia todos os arquivos dela. Os caminhos relativos ficam no nome do arquivo (ex.: `Recibos/2024/Fatura.pdf`). Arquivos ocultos do sistema são ignorados. Para muitíssimos arquivos, um arquivo ZIP funciona melhor.

## Arquivos ZIP {#zip-archive}
<!-- keywords: zip, arquivo compactado, descompactar, árvore, estrutura, pasta, arquivos individuais -->

Um arquivo ZIP é uma coleção estruturada. O Nodestro mostra o conteúdo como árvore com tamanhos e marca o que pode ser lido. Clique em um arquivo da árvore para ver o que o Nodestro lê dele.

Os agentes recebem primeiro uma **visão geral** do arquivo e depois leem arquivos específicos com a ferramenta `input_files` (comandos `list`, `read` e `search`). Assim um arquivo grande cabe no contexto. Arquivos compactados dentro do arquivo são listados, mas não abertos.

## Entrega aos agentes {#uebergabe}
<!-- keywords: entrega, contexto, arquivos grandes, tokens, limite de contexto, multimodal, imagem, ocr, visão geral -->

Agentes que recebem entradas do nó Início obtêm os arquivos da execução. O Nodestro escolhe a forma de modo a manter a estrutura e não estourar o contexto:

- **Textos e tabelas** vão ao agente como texto enquanto couberem (cerca de 60.000 caracteres por arquivo, 150.000 para todos juntos).
- **PDFs** com camada de texto vão como documento (texto e layout), até 100 páginas.
- **Imagens** o próprio agente vê, se o modelo entende imagens. Caso contrário, isso é indicado. Com OCR você vê se o agente recebeu o texto reconhecido ou a imagem.
- **Arquivos grandes e compactados** chegam como visão geral. O agente lê as partes necessárias com `input_files`, ex.: certas páginas, uma planilha ou faixas de linhas.

A configuração *Entrega aos agentes* força o conteúdo ou a visão geral. Para os agentes, o conteúdo enviado é sempre **dado, não instrução**: o Nodestro o marca assim.

## Rastreabilidade {#nachvollziehen}
<!-- keywords: rastreabilidade, trace, contexto, quais arquivos, pré-visualização, enviado ao modelo, transparência -->

- A **pré-visualização da entrada** de um agente mostra antes do início quais arquivos ele recebe e de que forma.
- Na visão detalhada de uma execução, a aba *Contexto* de cada etapa mostra quais arquivos foram ao modelo e como (como texto, como documento PDF, como imagem, como texto reconhecido ou como visão geral).
- Chamadas a `input_files` aparecem com entrada e saída em *Ferramentas*.
- *Arquivos recebidos* lista tudo o que a execução recebeu e se já foi incorporado ao conhecimento.

## Entrada ou conhecimento? {#eingabe-oder-wissen}
<!-- keywords: diferença, entrada, conhecimento, knowledge, memória, permanente, pontual -->

| | Arquivo como entrada | Conhecimento | Memória |
|---|---|---|---|
| Para quê | material desta execução | documentos para muitas execuções e agentes | notas que o próprio agente escreve |
| Onde fica | com a execução | na página *Conhecimento* | no espaço de memória |
| Pesquisável | só dentro da execução | sim, para agentes atribuídos | pela ferramenta de memória |

Arquivos de entrada nunca vão para o conhecimento automaticamente.

## Incorporar ao conhecimento {#knowledge-uebernahme}
<!-- keywords: incorporar, conhecimento, coleção, confirmar, origem, duplicado, resultado -->

Com **Ao conhecimento** você incorpora explicitamente:

- arquivos enviados de uma execução; em arquivos ZIP, arquivos específicos da árvore,
- arquivos de resultado (veja [Arquivos de resultado](/docs/dateien#ergebnisdateien)),
- o resultado de uma etapa e propostas de agentes.

Antes de salvar, o diálogo mostra o que seria salvo, se o arquivo é pesquisável, se o mesmo conteúdo já existe (ele não é salvo duas vezes) e conteúdos parecidos. Textos gerados podem ser editados antes de salvar e marcados como *extraído de fontes*, *gerado por um agente* ou *suposição*. Você escolhe uma coleção ou cria uma nova.

Nada é salvo antes da sua confirmação, e só exatamente o conteúdo verificado: se você mudar algo depois, verifica de novo. Cada arquivo mantém sua origem (workflow, etapa, agente, execução, momento, arquivos de origem). Fluxos de trabalho em andamento não mudam.

## Propostas de agentes {#vorschlaege}
<!-- keywords: proposta, propostas, agente propõe, propose_knowledge, propor conhecimento -->

Na seção *Conhecimento* de um agente, ligue **Pode propor conteúdo para o conhecimento**. O agente recebe então a ferramenta `propose_knowledge` e seu resultado é oferecido como proposta após a execução. As propostas aparecem na etapa da execução e só são salvas depois que você as verifica e confirma.

## Subworkflows, testes e agendamentos {#subfluxos}
<!-- keywords: subworkflow, série de testes, lote, agendamento, aprovação, continuar, reinício -->

- **Subworkflows:** um campo de arquivo do subfluxo recebe com `{{form.<campo>}}` os arquivos de um campo ou com `{{files}}` todos os arquivos da execução. Os mesmos arquivos salvos são repassados, sem cópias.
- **Aprovações e continuação:** os arquivos ficam salvos enquanto uma execução espera, roda ou está pausada, também após reiniciar o Nodestro.
- **Casos de teste e agendamentos:** arquivos enviados ali ficam salvos para o caso de teste ou o [agendamento](/docs/automatisierung#zeitplaene) e são usados por cada execução. Arquivos de execuções anteriores nunca são reutilizados silenciosamente.

## Arquivos pela API {#api-uploads}
<!-- keywords: api, multipart, form-data, base64, envio, curl, exportação, fastapi -->

Fluxos de trabalho publicados aceitam arquivos de duas formas:

- como JSON com `name`, `media_type` e `content_base64` no valor do campo de arquivo,
- como `multipart/form-data`: uma parte por arquivo com o nome do campo de arquivo e os demais campos como JSON na parte `values`.

```bash
curl -X POST http://127.0.0.1:8000/api/published/verificar-contratos/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -F 'values={"cliente": "ACME"}' \
  -F "contrato=@contrato.pdf"
```

Valem as mesmas verificações e limites do Nodestro. Um [projeto FastAPI exportado](/docs/api-und-export#export) processa arquivos com o mesmo motor. Arquivos enviados nunca fazem parte da exportação.

## Armazenamento e limpeza {#speicherung}
<!-- keywords: armazenamento, limpeza, excluir, espaço em disco, backup, restaurar -->

Os arquivos enviados ficam na pasta de dados em `inputs`, não no banco de dados nem no fluxo de trabalho. Conteúdo idêntico é salvo só uma vez.

- Arquivos de execuções na fila, em andamento ou pausadas nunca são removidos.
- Ao iniciar, o Nodestro limpa arquivos que nada usa há mais de um dia. Em *Configurações* você vê o espaço usado e remove arquivos sem uso ou de execuções concluídas a partir de certa idade.
- Excluir uma execução libera os arquivos dela se nada mais os usa.
- Backups contêm os arquivos de entrada e os restauram.

## Segurança {#sicherheit}
<!-- keywords: segurança, bomba zip, caminho, link simbólico, executar, macro, confiança -->

- Arquivos compactados nunca são executados nem descompactados no disco. O Nodestro lê entradas específicas na memória.
- Caminhos inseguros (como `../`), links, entradas criptografadas e arquivos de programa são ignorados e marcados na árvore.
- Limites protegem contra bombas ZIP: arquivos com mais de 5.000 entradas, mais de 512 MB descompactados ou compressão suspeita são recusados; entradas acima de 25 MB são ignoradas.
- O conteúdo de arquivos enviados não é confiável. Os agentes não seguem instruções nele como instruções de sistema.
