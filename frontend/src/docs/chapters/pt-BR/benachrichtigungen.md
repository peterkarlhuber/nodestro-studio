# Notificações

O Nodestro avisa você no **sino** da barra superior quando algo precisa da sua atenção: uma execução falhou, uma etapa aguarda sua aprovação ou um agente escreveu uma mensagem para você. As notificações ficam dentro do Nodestro; nada é enviado por e-mail.

## O que gera notificações {#ueberblick}
<!-- keywords: notificação, sino, evento, execução com falha, aprovação, decisão de orçamento, controle de qualidade, execução concluída, caixa de entrada -->

Uma notificação é criada nestes eventos de uma execução:

- **Uma execução falha**: a execução terminou com um erro.
- **Uma etapa aguarda aprovação**: uma etapa de aprovação aguarda a decisão de uma pessoa.
- **Uma execução aguarda uma decisão de orçamento**: o orçamento da execução acabou e alguém precisa aumentá-lo ou encerrar a execução (veja [Decisões de orçamento durante uma execução](/docs/workflows#budget-freigabe)).
- **Um controle de qualidade não é aprovado**: um resultado não passou no controle, por exemplo o de um juiz (veja [Controle de qualidade](/docs/agenten#qualitaet)).
- **Uma execução termina**: toda execução concluída, inclusive as bem-sucedidas.

Além disso, um agente pode escrever uma mensagem curta para você com a ferramenta **Mensagem para mim** (veja abaixo).

## Regras por fluxo de trabalho {#regeln}
<!-- keywords: regras de notificação, configurações do fluxo de trabalho, eventos, padrão, execuções com falha, aprovações, desativar -->

Cada fluxo de trabalho decide quais dos seus eventos geram notificações. Abra o fluxo de trabalho no editor, clique em um ponto vazio da área de trabalho para que nenhuma etapa fique selecionada e procure a seção **Notificações** nas configurações do fluxo de trabalho (veja [Configurações do fluxo de trabalho](/docs/workflows#einstellungen)). Marque os eventos que quiser; as regras são salvas com o fluxo de trabalho, como o orçamento e os limites dele.

Por padrão, um fluxo de trabalho notifica as **execuções com falha** e as **etapas que aguardam aprovação**. Fluxos de trabalho salvos antes de as notificações existirem também recebem esse padrão. Desmarque todos os eventos para desativar as notificações de um fluxo de trabalho. Notificar cada execução concluída é útil para execuções raras e importantes; com execuções frequentes, logo são muitas.

## Quem é notificado {#empfaenger}
<!-- keywords: destinatários, membros, quem iniciou, acesso, quem é notificado, pessoa que iniciou -->

Na mesma seção você escolhe quem recebe as notificações:

- **Todas as pessoas com acesso**: todas as pessoas que podem ver o fluxo de trabalho. No aplicativo para desktop, é você.
- **Só a pessoa que iniciou a execução**: as outras pessoas com acesso não são notificadas.

## O sino {#glocke}
<!-- keywords: sino, não lida, contador, selo, marcar como lida, marcar todas como lidas, abrir execução, carregar mais, teclado, escape -->

O número no sino conta suas notificações não lidas. Clique no sino (ou coloque o foco nele e pressione Enter) para abrir a lista, com as mais recentes primeiro. Cada entrada mostra o que aconteceu, o fluxo de trabalho e quando. As entradas não lidas ficam destacadas.

- **Abrir execução** abre a visualização detalhada da execução e marca a entrada como lida (veja [A visualização detalhada](/docs/ausfuehrungen#details)).
- **Marcar como lida** (a marca de seleção) marca uma única entrada; **Marcar todas como lidas**, todas.
- **Carregar mais** mostra notificações mais antigas.
- Escape fecha a lista e volta ao sino.

O Nodestro lê o número de notificações não lidas mais ou menos uma vez por minuto enquanto a janela está visível, e a lista completa toda vez que você a abre. Leitores de tela anunciam as novas notificações sem interromper.

## Mensagens de agentes {#agenten-nachrichten}
<!-- keywords: notify_user, mensagem para mim, mensagem de agente, ferramenta, nível, título, três mensagens, texto simples, de um agente -->

A ferramenta integrada **Mensagem para mim** (`notify_user`) permite que um agente envie a você uma mensagem curta com um título, o texto e um nível (informação, sucesso, aviso ou erro). Atribua-a a um agente como qualquer outra ferramenta (veja [Atribuir ferramentas](/docs/agenten#tools)) e diga ao agente na tarefa dele quando usá-la, por exemplo “Envie-me uma mensagem se encontrar um contrato com aviso prévio inferior a 30 dias”.

- Um agente pode enviar **no máximo 3 mensagens por execução**. As tentativas seguintes são recusadas, e o agente fica sabendo.
- A mensagem aparece como **texto simples**: sem formatação e sem links clicáveis. Ela é marcada claramente como **De um agente**, porque um modelo a escreveu. Trate-a como qualquer outra saída de um modelo.
- A ferramenta não envia nada para fora do Nodestro e funciona offline.

## Armazenamento e privacidade {#aufbewahrung}
<!-- keywords: armazenamento, 90 dias, excluir, e-mail, webhook, privacidade, servidor, caixa da plataforma, dentro do nodestro -->

As notificações são guardadas por **90 dias** e depois excluídas, lidas ou não.

Nada sai do Nodestro: não há e-mail, nem webhook, nem notificação push. Enviar notificações para outros destinos está previsto para uma versão futura.

Em um servidor Nodestro conectado à caixa de entrada da plataforma, o sino mostra essa caixa em vez da própria do Nodestro. As notificações dela podem chegar em inglês e com redação própria; as regras por fluxo de trabalho valem da mesma forma.
