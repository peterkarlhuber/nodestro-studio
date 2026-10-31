# Arquiteto de fluxos com IA

O arquiteto de fluxos projeta um fluxo multiagente completo a partir de uma descrição em linguagem natural, ou revisa um fluxo existente. Ele planeja os agentes, escreve os prompts, escolhe modelos, ferramentas, conhecimento e memória, conecta tudo e verifica o resultado. Ele só propõe: nada é salvo, sobrescrito ou executado sem a sua decisão.

## Visão geral {#ueberblick}
<!-- keywords: arquiteto, ia, rascunho, gerar, automático, criar fluxo, assistente -->

Você encontra o arquiteto em dois lugares:

- **Criar com IA** no diálogo de um novo fluxo, na página *Fluxos de trabalho*.
- **Arquiteto IA** na barra do editor, com os modos **Projetar um novo fluxo** e **Revisar este fluxo**.

Os dois usam a mesma lógica. O arquiteto trabalha em oito etapas: analisar requisitos, planejar a arquitetura, verificar recursos, configurar agentes, rascunhar ferramentas, criar conexões, validar o fluxo e apresentar o rascunho. Para validar, ele usa a mesma [verificação antes de iniciar](/docs/workflows#pruefung) que o editor.

Ele constrói da forma mais simples possível: só os agentes de que a tarefa precisa, e etapas em paralelo apenas onde são realmente independentes. Quando a tarefa pede, ele também planeja [decisões, aprovações](/docs/verzweigungen), um formulário de entrada e arquivos de resultado; não há laços. Se preferir partir de um modelo pronto, veja os [exemplos](/docs/beispiele).

O caminho manual não muda: você continua podendo criar e editar qualquer fluxo sem IA.

## Criar um novo fluxo {#neu-erstellen}
<!-- keywords: novo, criar, descrição, projeto, criar com ia -->

Descreva o que você quer: o objetivo, as entradas, os resultados esperados e as restrições importantes. Os detalhes que faltarem o arquiteto completa com suposições, que mostra depois. **Projetar fluxo** inicia o trabalho.

No fim você vê o rascunho para revisar. **Criar fluxo** salva-o como novo fluxo com a versão 1 no [histórico de versões](/docs/workflows#versionen) e o abre no editor. Antes você pode mudar o nome. O novo fluxo é igual a um [criado manualmente](/docs/workflows#anlegen) e nunca é executado automaticamente.

## Revisar um fluxo existente {#ueberarbeiten}
<!-- keywords: revisar, mudar, ampliar, adicionar agente, revisão, diff, desfazer -->

No editor, escolha **Revisar este fluxo** e descreva a mudança, por exemplo: "Adicione antes do resultado um agente que revise criticamente as análises anteriores." O arquiteto considera os agentes, as configurações e as conexões do fluxo, inclusive mudanças não salvas no editor.

Ele muda apenas o que a descrição pede. Os agentes que ele não menciona continuam como estão, com prompts, ferramentas e posições. A proposta é um rascunho separado; a visão **Mudanças** mostra agentes adicionados, alterados e removidos com os campos alterados, além das conexões novas e removidas.

**Aplicar mudanças** aplica o rascunho no editor como um único passo que **Desfazer** reverte por completo. Nada é salvo até você [salvar](/docs/workflows#speichern); a nova versão no [histórico de versões](/docs/workflows#versionen) recebe então automaticamente uma nota sobre a revisão com IA.

Se você tiver mudanças não salvas, a revisão oferece **Salvar antes o estado atual como versão**. Se o fluxo foi alterado no editor enquanto o arquiteto trabalhava, a revisão avisa antes de aplicar.

## Acompanhar o progresso {#fortschritt}
<!-- keywords: progresso, ao vivo, atividades, registro, etapas, prévia, grafo, marcações -->

Enquanto o arquiteto trabalha, você vê três coisas:

- **Etapas:** quais das oito etapas estão concluídas e qual está em andamento.
- **Atividades:** um registro do que realmente aconteceu, por exemplo quais papéis foram planejados, quais ferramentas existentes foram encontradas ou quais conexões foram corrigidas.
- **Prévia do fluxo:** o fluxo cresce ao vivo. Marcações mostram quais agentes são novos, alterados, inalterados, removidos ou ainda em configuração.

Tudo o que aparece se baseia em eventos reais do servidor. Não há porcentagens estimadas nem estados intermediários inventados, e o raciocínio interno do modelo não é mostrado.

## Perguntas e suposições {#rueckfragen}
<!-- keywords: pergunta, suposição, ambíguo, idioma, pouco claro -->

O arquiteto só pergunta quando nenhum fluxo sensato é possível sem a resposta. Você então responde com **Responder e continuar** ou deixa que ele decida com **Continuar com suposições**. Em todos os outros casos, ele faz suposições e as lista na revisão.

Ele escreve prompts, nomes e descrições no idioma da interface (veja [Idioma](/docs/einstellungen#sprache)), a menos que sua descrição peça explicitamente outro. Identificadores técnicos, nomes de campos da saída estruturada, nomes de ferramentas e código ficam em inglês. Ao revisar, ele nunca traduz o conteúdo existente.

## Revisar o rascunho {#pruefen}
<!-- keywords: revisão, verificação, validação, rascunho, aceitar, descartar, garantia -->

A revisão mostra:

- **Visão geral:** os requisitos analisados, as suposições, o custo e o resultado da validação com todos os avisos.
- **Mudanças** (só ao revisar): o que muda em relação ao fluxo no editor.
- **Agentes:** papel, modelo, prompt de sistema, tarefa, ferramentas, conhecimento, memória e saída estruturada de cada agente.
- **Fluxo de dados:** quais resultados cada agente recebe; as tarefas se referem a eles com [marcadores](/docs/workflows#platzhalter).
- **Ferramentas:** novos rascunhos de ferramentas com código e testes.

Problemas que dá para corrigir sem IA, como conexões ausentes ou marcadores errados, o próprio arquiteto corrige. O que ainda bloqueia depois disso ele pede à IA para corrigir, mas só um número limitado de vezes. Os problemas restantes aparecem na revisão.

Uma [verificação](/docs/workflows#pruefung) aprovada significa que o fluxo pode rodar tecnicamente. Ela não garante resultados corretos: leia os prompts e teste o fluxo com entradas reais. **Descartar rascunho** exclui o rascunho junto com seus rascunhos de ferramentas; **Alterar descrição** inicia um novo rascunho.

## Aprovar novas ferramentas {#tools-freigeben}
<!-- keywords: ferramenta, rascunho, aprovação, código, sandbox, testar, registrar, segurança -->

O arquiteto prefere ferramentas existentes. Só se nenhuma servir e **Escrever ferramentas ausentes como rascunho** estiver ativado é que ele escreve uma nova ferramenta Python com testes. O código é apenas verificado estaticamente e nunca roda, nem mesmo no [sandbox](/docs/tools#sandbox).

Um rascunho de ferramenta não está registrado. Você vê o código e os testes na revisão e em *Ferramentas*, nos rascunhos de ferramentas. **Testar no sandbox** executa os testes; **Aprovar e registrar** testa de novo e só adiciona a ferramenta à biblioteca se os testes passarem, como na [aprovação](/docs/tools#freigabe) normal. **Rejeitar** exclui o rascunho.

Enquanto uma ferramenta não for aprovada, a verificação marca o fluxo como bloqueado e ele não pode ser iniciado. As regras de segurança existentes para código próprio continuam valendo. As atribuições de conhecimento e memória também são apenas propostas, que você altera no editor.

Rascunhos de ferramentas são gerados por IA: testá-los e aprová-los precisa do sandbox Docker (veja [Confiança e isolamento](/docs/tools#vertrauen)).

## Custos e limites {#kosten}
<!-- keywords: custo, limite, orçamento, correções, uso, preço, usd -->

Cada rascunho chama a IA várias vezes: para a análise, o plano, cada agente, os rascunhos de ferramentas e as correções. Você vê o custo até o momento ao vivo no progresso e na revisão. Cada chamada aparece exatamente uma vez na [visão de uso](/docs/nutzung#statistik) em *Arquiteto de fluxos*, separada por etapa.

Em *Configurações*, junto aos [modelos](/docs/einstellungen#modelle), você define o **limite de custo** por rascunho (vazio significa sem limite) e quantas **correções com IA** são permitidas (0 a 5). Ao atingir o limite, o arquiteto para. Ele nunca inicia uma execução de fluxo e nunca chama serviços externos pagos.

## Cancelar {#abbrechen}
<!-- keywords: cancelar, parar, fechar, descartar, seguro -->

**Cancelar geração** para o arquiteto a qualquer momento. Nada é salvo e nenhum fluxo é alterado; o custo gerado até então continua na visão de uso. Se você fechar o diálogo durante a revisão, o Nodestro pergunta antes de descartar o rascunho.

## Limites {#grenzen}
<!-- keywords: limites, restrições, máximo, agentes, laços -->

- Um rascunho tem no máximo dez agentes; ciclos no fluxo são removidos.
- Valem as mesmas [restrições](/docs/workflows#grenzen) de qualquer fluxo: sem laços. O arquiteto não planeja subworkflows; adicione-os você mesmo se precisar.
- O arquiteto só conhece o que está na sua descrição, no fluxo e na biblioteca. A correção do conteúdo você mesmo precisa verificar.
