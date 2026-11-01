# Nodestro Assistant

O Nodestro Assistant é um chat que ajuda você em qualquer parte do Nodestro. Ele responde perguntas sobre o uso com base nesta documentação, analisa os fluxos, agentes, ferramentas, memórias, conhecimentos e execuções que você mostra explicitamente e, se você pedir, prepara uma transferência para o arquiteto de fluxos, a criação de agentes ou a criação de ferramentas. Ele nunca altera nada por conta própria.

## Visão geral {#ueberblick}
<!-- keywords: assistant, assistente, chat, abrir, painel, barra lateral, atalho, ctrl j, largo, ajuda -->

Abra o assistente com o botão **Assistente** no canto superior direito do cabeçalho ou com **Ctrl+J** (macOS: **⌘J**). Ele aparece como um painel à direita; o mesmo botão ou **Fechar** o oculta novamente. **Mais largo** dá mais espaço ao chat; em telas pequenas ele fica sobre a página.

O chat continua como está enquanto você navega entre páginas, e também depois de recarregar. As respostas aparecem ao vivo; Markdown com listas, tabelas e blocos de código é formatado. Enquanto uma resposta é escrita, você vê o que o assistente está fazendo de fato: pesquisando na documentação, lendo seções, processando anexos, escrevendo a resposta ou preparando uma transferência.

O assistente usa o **modelo dos assistentes** definido nas [configurações](/docs/einstellungen#modelle) e o acesso ao provedor dele. Se esse provedor não estiver configurado, você pode abrir o chat, mas não enviar perguntas.

## Perguntas sobre a documentação {#fragen}
<!-- keywords: pergunta, documentação, fontes, citação, link, inventado, não documentado, como -->

O assistente responde perguntas como “Como testo meu agente?” ou “Qual é a diferença entre conhecimento e memória?” com base nesta documentação integrada. Ele procura as seções adequadas, lê e as cita com links na resposta. Abaixo da resposta, as seções lidas aparecem como **Fontes**; um clique as abre.

A documentação é a sua única fonte de conhecimento sobre o Nodestro. Se não encontrar algo nela, ele diz isso explicitamente em vez de inventar uma função. Conhecimento geral, por exemplo sobre como escrever prompts, é indicado como tal.

## Anexar objetos {#anhaenge}
<!-- keywords: anexar, anexo, contexto, clipe, conversar, fluxo, agente, ferramenta, memória, conhecimento, execução, trace -->

Para que o assistente possa analisar um objeto específico, você o anexa. Há duas formas:

- **Conversar com o assistente** na própria visualização: no editor de fluxos, no inspetor do agente, na biblioteca de agentes, em uma ferramenta, em uma execução, em um espaço de memória e em um arquivo de conhecimento.
- O **clipe** no campo de entrada abre uma seleção com todos os fluxos, modelos de agentes, ferramentas, espaços de memória, arquivos de conhecimento e execuções.

O que o assistente recebe depende do tipo:

| Tipo | Conteúdo |
| --- | --- |
| Fluxo | agentes, conexões, ordem de execução, configurações e o resultado da [verificação antes da execução](/docs/workflows#pruefung) |
| Agente | a configuração completa com ferramentas, conhecimento e avisos de configuração |
| Ferramenta | código, testes, esquema de entrada, bibliotecas Python com suas aprovações e onde é usada |
| Memória | a lista de arquivos; o conteúdo apenas dos arquivos que você seleciona explicitamente |
| Conhecimento | nome, descrição e tipo; o texto apenas se você ativar **Enviar conteúdo** |
| Execução | status, entrada, resultados, erros, chamadas de ferramentas, tokens e custo de cada agente |

Você pode anexar vários objetos de uma vez e remover cada um com **×**. Um anexo continua ativo até você removê-lo e vai junto com cada mensagem seguinte. Os anexos ficam sempre visíveis acima do campo de entrada.

## Sugestões de contexto {#vorschlaege}
<!-- keywords: sugestão, sugerido, fluxo atual, automático, confirmar, ignorar -->

Com o assistente aberto, o objeto da visualização atual é sugerido como contexto, por exemplo o fluxo no editor ou a execução aberta. Sugestões têm borda tracejada e a marca **Sugestão**; objetos anexados têm borda contínua.

Uma sugestão não é enviada. Só **Adicionar** a transforma em anexo; **Ignorar** a oculta neste chat. As sugestões vêm da visualização que você tem aberta, sem nenhuma chamada à IA.

## Versões e alterações não salvas {#versionen}
<!-- keywords: versão, rascunho, não salvo, salvo, alterado, atualizar contexto, desatualizado, excluído -->

Ao anexar um objeto, o Nodestro registra o seu estado. Cada mensagem guarda exatamente os estados com que foi enviada; você os vê abaixo da sua mensagem como **Enviado com**. Um clique mostra o que o assistente realmente recebeu.

Se um objeto anexado mudar depois, o anexo é marcado como **alterado**. **Atualizar contexto** usa o novo estado nas mensagens seguintes. Mensagens e respostas anteriores não mudam e mantêm o estado daquele momento. Se um objeto for excluído, o anexo mostra **não existe mais**; o chat continua funcionando.

Se o fluxo no editor tiver alterações não salvas, você decide: **Versão salva** envia o último estado salvo, **Rascunho não salvo** o estado atual do editor. Um rascunho aparece no chat como **Rascunho**. Se você continuar editando depois, ele também é marcado como alterado.

## Análises {#analyse}
<!-- keywords: análise, melhorar, revisar, encontrar erros, otimizar, reduzir custo, executado, testado -->

Com objetos anexados, o assistente pode, por exemplo, procurar pontos fracos em um fluxo, melhorar um prompt de sistema, explicar por que uma execução falhou ou apontar testes que faltam em uma ferramenta.

Ele trabalha apenas com os dados que você anexou. Não executa nem testa nada, e também não afirma isso. Se uma melhoria funciona, você verifica, por exemplo com o [teste de agente](/docs/agenten#agent-testen) ou uma nova execução.

## Transferência para outras funções {#uebergabe}
<!-- keywords: transferência, aplicar, arquiteto, implementar, criar agente, criar ferramenta, aplicar proposta -->

Se você pedir explicitamente que uma melhoria seja aplicada, o assistente prepara uma transferência. Ela aparece como um cartão na resposta. O botão do cartão abre a função existente adequada, já preenchida com a descrição:

- **[Arquiteto de fluxos](/docs/ki-architekt)**: revisar um fluxo anexado ou projetar um novo.
- **[Criação de agentes](/docs/agenten#ki-entwurf)**: descrever um novo agente para um fluxo anexado.
- **Criação de ferramentas** em *Ferramentas → Criar com IA*: deixar o agente programador escrever uma nova ferramenta.

Nada começa lá até você iniciar, e você revisa o resultado como de costume antes de qualquer alteração. O próprio assistente não altera fluxos, não executa ferramentas e não aplica nada sem a sua confirmação.

## Gerenciar chats {#verlauf}
<!-- keywords: histórico, chats, conversa, novo chat, renomear, excluir, título, continuar -->

**Novo chat** começa uma nova conversa, **Histórico** mostra todas as anteriores. Lá você abre um chat para continuá-lo, renomeia ou exclui. O Nodestro cria o título a partir da sua primeira pergunta, sem chamada à IA.

Os chats ficam salvos localmente no banco de dados do Nodestro e fazem parte do [backup e restauração](/docs/einstellungen#backup). Eles nunca são traduzidos; um chat fica no idioma em que foi escrito.

## Privacidade e segurança {#datenschutz}
<!-- keywords: privacidade, segurança, chave de api, segredo, senha, mascarado, enviado, prompt injection, instruções -->

Ao modelo só vai o que você escreve, o que anexou e as seções da documentação que o assistente lê. O objeto que você tem aberto nunca é enviado automaticamente.

Chaves de API, senhas, tokens e valores semelhantes são substituídos por marcadores antes do envio, inclusive a sua chave de API cadastrada. Um aviso no anexo mostra quando algo foi substituído. Para ver exatamente o que foi enviado, clique em um anexo ou em **Enviado com**.

Objetos muito grandes são encurtados; o anexo é então marcado como **parcial**, e o assistente sabe que viu apenas uma parte. Instruções dentro do conteúdo anexado, por exemplo em um arquivo de conhecimento ou na saída de uma ferramenta, são tratadas pelo assistente como dados, não como instruções para ele.

## Custos {#kosten}
<!-- keywords: custo, tokens, uso, preço, custo do chat, cobrado -->

Cada resposta é uma ou mais solicitações ao modelo. Abaixo de cada resposta você vê os tokens e o custo estimado, e o cabeçalho do chat mostra o total do chat. Na [página de uso](/docs/nutzung), todas as solicitações aparecem na origem **Nodestro Assistant**, cada uma exatamente uma vez.

Em uma resposta cancelada, parte do custo já ocorreu; ela é estimada e marcada como **estimado**.

## Cancelamento e erros {#fehler}
<!-- keywords: cancelar, parar, erro, tentar novamente, repetir, chave inválida, modelo indisponível, conexão -->

**Parar** cancela uma resposta em andamento; o que já foi escrito permanece. Se uma resposta falhar, o assistente informa o motivo, por exemplo uma chave de API ausente ou inválida, um modelo indisponível, uma conexão interrompida ou contexto demais. **Tentar novamente** repete a última resposta.

O chat nunca se perde. Se o Nodestro for encerrado enquanto uma resposta é escrita, ela aparece como interrompida depois de reiniciar.

## Idioma {#sprache}
<!-- keywords: idioma, português, inglês, idioma da resposta, traduzir -->

O assistente responde no idioma da interface (veja [Idioma](/docs/einstellungen#sprache)), a menos que você peça explicitamente outro. Ele lê a documentação nesse mesmo idioma. Identificadores técnicos, como nomes de ferramentas, nomes de campos e código, ficam em inglês.
