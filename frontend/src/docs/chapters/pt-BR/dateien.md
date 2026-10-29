# Arquivos e documentos

Se você quiser, o Nodestro grava os resultados como arquivos (Markdown, JSON, CSV, HTML, PDF, Word ou Excel) e, além de PDFs e textos, também lê arquivos do Word e do Excel. PDFs digitalizados podem, opcionalmente, ficar legíveis com reconhecimento de texto local (OCR). Tudo roda no seu computador, sem contas adicionais.

## Arquivos de resultado {#ergebnisdateien}
<!-- keywords: arquivo de resultado, arquivo, exportar, relatório, markdown, json, csv, html, pdf, baixar, higienizar -->

No inspetor do nó **Resultado**, *Arquivos de resultado* define em quais formatos o resultado é salvo ao final de cada execução. Sem nenhuma entrada, nenhum arquivo é gravado.

| Formato | Conteúdo |
|---|---|
| Markdown (.md) | o resultado como texto; resultados estruturados como seções |
| JSON (.json) | o resultado como dados |
| CSV (.csv) | uma tabela; precisa de uma lista de registros ou de um objeto com valores simples |
| HTML (.html) | uma página independente com títulos, listas e tabelas |
| PDF (.pdf) | o mesmo conteúdo em páginas A4 |
| Word (.docx) | um documento com títulos, parágrafos, listas, tabelas e destaques |
| Excel (.xlsx) | tabelas com colunas de números, datas e sim/não; várias tabelas como planilhas separadas |

É possível usar vários formatos por execução. Todos os arquivos são criados localmente, sem requisição de IA; ficam disponíveis da mesma forma pela API publicada e no projeto exportado.

- **Nome do arquivo:** vazio significa o nome do fluxo de trabalho.
- **Higienizar:** substitui credenciais e dados pessoais por marcadores, como na [exportação de trace higienizada](/docs/ausfuehrungen#trace-export).
- Na visão detalhada de uma execução, a área **Arquivos de resultado** lista todos os arquivos para ver, baixar e excluir. Com *Criar arquivo* você também cria um arquivo depois, a partir do resultado geral ou do resultado de uma única etapa.
- Os arquivos pertencem à execução: fazem parte dos backups e são excluídos junto com ela. Um arquivo tem no máximo 10 MB.
- O HTML é exibido na pré-visualização sem scripts. O PDF usa as fontes padrão; caracteres fora do conjunto da Europa Ocidental aparecem como "?".

Se um arquivo não puder ser gravado (por exemplo, CSV a partir de texto corrido), a execução mostra o arquivo com o motivo; o resultado em si é mantido.

## Word e Excel {#dokumentformate}
<!-- keywords: word, docx, excel, xlsx, planilha, fórmula, converter, formatos de documento, office -->

Você pode enviar **Word (DOCX)** e **Excel (XLSX)** para o [Conhecimento](/docs/wissen#formate) como outros arquivos. O Nodestro os converte em Markdown no envio e salva e pesquisa esse texto; o arquivo leva a indicação "convertido de DOCX/XLSX".

- **Word:** parágrafos, títulos, listas e tabelas na ordem do documento.
- **Excel:** uma seção por planilha com uma tabela das células usadas. **Fórmulas nunca são calculadas:** a célula mostra o valor que o Excel salvou e, ao lado, a fórmula como texto.
- Tabelas muito grandes são encurtadas (no máximo 5.000 linhas e 200 colunas por planilha); o arquivo mostra então "encurtado".

Para [execuções em lote](/docs/automatisierung#stapel), o Nodestro lê tabelas do Excel diretamente como linhas.

## Reconhecimento de texto (OCR) {#ocr}
<!-- keywords: ocr, reconhecimento de texto, digitalização, digitalizado, tesseract, pdf de imagem, camada de texto, incerto -->

PDFs digitalizados sem camada de texto não são pesquisáveis a princípio. O **reconhecimento de texto local** os torna legíveis:

1. Instale o **Tesseract** e o **pdftoppm** (Poppler) no seu computador, por exemplo com o gerenciador de pacotes do seu sistema.
2. Em [Configurações](/docs/einstellungen), em *Reconhecimento de texto (OCR)*, ative *Usar OCR para digitalizações*. A configuração mostra se o Tesseract foi encontrado.
3. Novas digitalizações são reconhecidas no envio; para as existentes, clique em *Reconhecer texto (OCR)* no Conhecimento.

O reconhecimento roda totalmente local; nenhum dado é enviado. Palavras incertas são marcadas no texto como `[?palavra]` e contadas, para que os agentes e você saibam que o texto pode conter erros. Confira números importantes no original.
