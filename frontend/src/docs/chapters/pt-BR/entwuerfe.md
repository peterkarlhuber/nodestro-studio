# Rascunhos de e-mail e de webhook

Os agentes podem **preparar** um e-mail ou os dados de uma chamada de webhook, mas não podem enviá-los. O rascunho vai para os arquivos de resultado da execução; você confere e envia. Este capítulo explica as duas ferramentas de rascunho, onde você encontra os rascunhos, como conferir uma conexão com um envio de teste e por que o Nodestro, por enquanto, não envia nada sozinho.

## Visão geral {#ueberblick}
<!-- keywords: rascunho, rascunho de e-mail, rascunho de webhook, draft_email, draft_webhook, não envia, comunicação, offline -->

O Nodestro traz duas ferramentas integradas da categoria *Comunicação*:

- **Rascunho de e-mail** (`draft_email`) escreve um e-mail como arquivo `.eml`.
- **Rascunho de webhook** (`draft_webhook`) escreve os dados JSON de uma chamada de webhook como arquivo `.json`.

As duas levam o selo **Não envia** na página [Ferramentas](/tools) e na escolha de ferramentas do agente. Não precisam de internet nem de uma conexão, funcionam offline e escrevem no máximo **10 rascunhos por execução**. Atribua-as a um agente como qualquer outra ferramenta (veja [Atribuir ferramentas](/docs/agenten#tools)) e diga ao agente, na tarefa dele, quando escrever um rascunho, por exemplo “Prepare um lembrete de pagamento ao cliente para cada fatura vencida”.

## Rascunhos de e-mail {#e-mail}
<!-- keywords: draft_email, eml, destinatários, para, cc, assunto, html, anexos, endereço do remetente, from_address, programa de e-mail -->

Um rascunho de e-mail contém os destinatários (*Para* e *Cc*, no máximo 50 no total), um assunto de uma linha (no máximo 200 caracteres), o texto e, se quiser, uma versão HTML. Da versão HTML, o Nodestro remove scripts, estilos, imagens, formulários e todo o resto, exceto texto, títulos, listas, tabelas e links.

Os **anexos** vêm só da própria execução: dos arquivos com que ela foi iniciada e dos arquivos de resultado que escreveu até ali. Um rascunho tem no máximo 10 anexos e, com eles, no máximo 10 MB.

O **endereço do remetente** você define no agente: depois de atribuir a ferramenta, as ferramentas do agente mostram uma área expansível com o campo *Endereço do remetente*. O modelo não o vê nem o altera. Se o campo ficar vazio, seu programa de e-mail preenche o remetente.

## Rascunhos de webhook {#webhook}
<!-- keywords: draft_webhook, json, dados, payload, json schema, esquema, payload_schema, conferência -->

Um rascunho de webhook contém os dados JSON que depois irão para um webhook: um objeto ou uma lista, no máximo 256 KB.

Na área expansível da ferramenta no agente, você pode guardar um **esquema dos dados** como objeto JSON (JSON Schema). Então a ferramenta só escreve dados que correspondem a ele; caso contrário, o agente recebe um erro com os pontos que não correspondem. O Nodestro confere estas palavras-chave: `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`, `const`, `minLength`, `maxLength`, `minimum`, `maximum`, `minItems` e `maxItems`. Um esquema com outras palavras-chave é recusado, para que nunca pareça mais rigoroso do que é conferido.

## Rascunhos em uma execução {#im-lauf}
<!-- keywords: arquivos de resultado, cartão do rascunho, baixar, baixar .eml, abrir no programa de e-mail, não enviado, prévia -->

Os rascunhos aparecem na visão de detalhes da execução, em **Arquivos de resultado**, como um cartão próprio marcado **Não enviado** (veja [Arquivos de resultado](/docs/dateien#ergebnisdateien)). O cartão de um rascunho de e-mail mostra o remetente, os destinatários, Cc, o assunto, se há versão HTML, os anexos com seus tamanhos e o tamanho da mensagem inteira. O Nodestro não mostra o texto do e-mail; para lê-lo, abra o arquivo.

- **Baixar .eml** salva o rascunho.
- **Abrir no programa de e-mail** baixa o mesmo arquivo. Abra-o com seu programa de e-mail, por exemplo com um clique duplo. Muitos programas o abrem como uma nova mensagem que você pode conferir, alterar e enviar; outros o mostram como mensagem recebida, que você pode encaminhar ou copiar.

O cartão de um rascunho de webhook mostra o tamanho e se os dados foram conferidos com um esquema; **Baixar .json** os salva.

## Envio de teste de uma conexão {#testversand}
<!-- keywords: enviar teste, envio de teste, endereço de teste, test_address, servidor de e-mail, smtp, webhook, limite, cinco por hora, confirmação, verificar -->

Se uma conexão com um servidor de e-mail ou um webhook funciona de verdade, você verifica em *Ferramentas → Conexões* (veja [Conexões de serviço](/docs/verbindungen#pruefen)). **Verificar conexão** contata o serviço: com um servidor de e-mail, o Nodestro faz login criptografado e sai; com um webhook, consulta o endereço sem enviar dados.

**Enviar teste** vai um passo além e envia uma mensagem de teste fixa:

- **Servidor de e-mail:** um breve e-mail de teste para o **endereço de teste** da conexão e para nenhum outro. Para isso, informe o seu próprio endereço como *Endereço de teste* nas configurações da conexão.
- **Webhook:** uma pequena chamada de teste assinada para o endereço do webhook, com o método da conexão. Qualquer resposta com status 2xx conta como sucesso.

Antes de enviar algo, uma caixa de confirmação diz exatamente para onde vai o teste. Você mesmo o envia, e o Nodestro registra cada tentativa com o seu nome nas alterações da conexão. Só administradores podem testar. Cada conexão permite **no máximo 5 envios de teste por hora**, e todas as conexões juntas no máximo 20 por hora. Em um servidor Nodestro, a verificação e o teste só alcançam um servidor de e-mail pelas portas 25, 465, 587 e 2525.

## Por que nada é enviado automaticamente {#kein-versand}
<!-- keywords: sem envio, enviar automaticamente, aprovação por chamada, segurança, versão futura, o agente não envia -->

Um e-mail ou uma chamada de webhook não podem ser desfeitos. Por isso, nesta versão, nenhum agente e nenhum fluxo de trabalho pode enviar algo sozinho: as ferramentas de rascunho não têm acesso à rede, e o envio de teste só é possível pela interface, feito por uma pessoa, nunca por uma execução.

Uma versão futura vai acrescentar o envio a partir de fluxos de trabalho, com uma **aprovação para cada chamada**: uma pessoa vê os destinatários e o conteúdo e decide antes que algo saia. Até lá, os rascunhos são o caminho seguro: o agente escreve por você, o envio fica com você.
