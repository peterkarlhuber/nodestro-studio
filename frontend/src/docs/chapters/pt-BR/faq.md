# Solução de problemas e perguntas frequentes

Aqui você encontra soluções para mensagens comuns e respostas a perguntas típicas.

## Erros comuns {#haeufige-fehler}
<!-- keywords: erros, problema, solução, mensagem, troubleshooting, não funciona -->

| Mensagem ou sintoma | Causa | Solução |
|---|---|---|
| “Não há chave de API para …” | O provedor do modelo não está configurado. | Informe a chave em *Configurações → Provedores de IA* ou defina a variável de ambiente do provedor, por exemplo `ANTHROPIC_API_KEY`. |
| "Iniciar fluxo de trabalho" está bloqueado | Há problemas no fluxo, uma execução está ativa ou, em um servidor, sua função não tem a permissão. | O motivo aparece logo ao lado do botão; **Mostrar** leva ao problema. Todos os problemas aparecem no inspetor quando nada está selecionado. |
| "O fluxo de trabalho contém um ciclo …" | Uma conexão volta para trás. | Exclua a conexão que volta para trás. |
| "Ferramentas desconhecidas: …" | Uma ferramenta atribuída foi excluída ou falta depois de uma importação. | Remova a ferramenta no inspetor ou crie-a de novo na biblioteca de ferramentas. |
| "… não permite forçar uma ferramenta …" | O modelo não permite ferramenta forçada. | Defina tool choice como *Automático*. |
| "Não é possível desligar o raciocínio no …" | O modelo não permite raciocínio *Desligado*. | Defina o raciocínio como *Padrão do modelo* e reduza o esforço. |
| "'Só entre chamadas de ferramentas' só é aceito pelo …" | Só o Sonnet 5.5 até o esforço *Alto* aceita isso. | Ajuste o modelo ou o esforço. |
| "Esta forma de mostrar o raciocínio não combina com a configuração de raciocínio" | *Mostrar raciocínio* não combina com raciocínio *Desligado* nem com *Só entre chamadas de ferramentas*. | Mude uma das duas configurações. |
| "Nome de campo inválido …" | Um nome de campo do formato de saída contém caracteres especiais ou começa com dígito. | Use apenas letras, dígitos e `_`. |
| "Citações não podem ser combinadas com um formato de saída estruturado" | As duas opções estão ativas. | Desligue uma delas. |
| "As mensagens de exemplo devem …" | Os exemplos não se alternam corretamente. | Comece pelo usuário, alterne e termine com o assistente. |
| "A memória permanente precisa de um espaço de memória" | Memória *Permanente* sem espaço. | Escolha ou crie um espaço. |
| Erros do Docker em ferramentas | O Docker está escolhido, mas não está rodando. | Inicie o Docker ou escolha a sandbox *Processo Python*. |
| Um agente foi *ignorado* | Um antecessor falhou. | Veja o primeiro agente vermelho na linha do tempo e corrija-o. |
| O resultado contém "{{Nome}}" literalmente | O marcador não corresponde a nenhum antecessor direto (por exemplo, depois de renomear). | Insira o marcador de novo pelos botões abaixo da tarefa. |
| Importar trace: "Este é um fluxo de trabalho exportado …" | O arquivo é uma exportação de fluxo de trabalho. | Abra-o em *Fluxos de trabalho → Importar*. |

As mensagens aparecem no idioma da interface; **Detalhes técnicos** mostra o texto original do servidor. Erros que só surgem durante uma execução são explicados em [Interpretar erros](/docs/ausfuehrungen#fehler).

## Perguntas frequentes {#fragen}
<!-- keywords: faq, perguntas, respostas, como posso, por que -->

**Editar fluxos de trabalho custa alguma coisa?**
Não. Só há custos nas execuções e com os assistentes de IA (criar agentes, criar ferramentas, sugerir memória). A verificação no editor, a pesquisa no conhecimento e *Experimentar* ferramentas são gratuitas.

**Por que a estimativa de custos é diferente da minha fatura?**
O Nodestro calcula com preços de tabela. Descontos, impostos, outras plataformas ou condições especiais não são considerados.

**Um agente pode ver o resultado de um agente que não está logo antes dele?**
Não, só o dos antecessores diretos. Conecte-o também ao agente desejado; a entrada original sempre está disponível com `{{run.input}}`.

**Posso ramificar um fluxo conforme o resultado?**
Sim, com uma [decisão](/docs/verzweigungen#entscheidung): ela verifica o resultado com regras fixas e abre a ramificação correspondente. Não há laços.

**Como levo um fluxo de trabalho para outro computador?**
Com *Exportar* e *Importar*. Arquivos de conhecimento, espaços de memória e ferramentas próprias precisam ser criados lá separadamente.

**Como mostro uma execução para alguém?**
Com *Exportar trace*. A outra pessoa abre o arquivo em *Execuções → Importar trace*, sem executar o fluxo de novo.

**Minha chave de API fica salva na exportação do fluxo ou no trace?**
Não. As chaves ficam apenas em variáveis de ambiente ou no banco de dados local e não vão nem para exportações nem para backups.

**Por que um agente não vê um arquivo de conhecimento?**
Confira se ele está atribuído no inspetor e qual modo está escolhido. Imagens e PDFs digitalizados não são encontrados no modo *Pesquisa*.

**O que acontece com as execuções em andamento se eu encerrar o Nodestro?**
Elas são canceladas. O que foi salvo até ali fica guardado como execução.

**Trocar o idioma altera meus agentes?**
Não. O idioma muda só a interface. Agentes, prompts e resultados continuam como estão, e os agentes continuam respondendo no idioma do prompt deles. Veja [Idioma](/docs/einstellungen#sprache).

**Posso usar o Claude pelo Amazon Bedrock em vez de uma chave da Anthropic?**
Sim, com o provedor *Amazon Bedrock (AWS)*: em vez de uma chave, ele usa sua conta da AWS, a região e as permissões do IAM, e a AWS cobra por região. As opções exclusivas da Anthropic (pensamento, configurações de cache de prompts, modelos de reserva, ferramentas de servidor) não estão disponíveis lá. Veja [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).
