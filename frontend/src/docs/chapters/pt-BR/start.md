# Introdução

O Nodestro é um estúdio visual para fluxos de trabalho multiagente. Você conecta agentes de IA em uma tela para formar uma sequência, inicia e acompanha cada etapa. Este capítulo explica os conceitos básicos e guia você pelo seu primeiro fluxo de trabalho.

## O que é o Nodestro? {#ueberblick}
<!-- keywords: visão geral, ideia, n8n, orkexa, biblioteca, provedor, anthropic, claude, openai, gemini -->

O Nodestro (de *Node* e *Maestro*) torna a biblioteca Python **Orkexa** utilizável por meio de uma interface gráfica. Cada **nó** na área de trabalho é um agente: um modelo de IA da Anthropic, da OpenAI, do Google Gemini ou de um servidor próprio, com seu próprio papel, suas próprias ferramentas e seu próprio conhecimento. Pelas **conexões**, os agentes repassam seus resultados.

Usos típicos:

- **Pesquisa e relatório:** um agente reúne fatos, um segundo confere os cálculos e um terceiro escreve o relatório.
- **Perspectivas paralelas:** vários agentes trabalham ao mesmo tempo na mesma entrada (por exemplo, público-alvo e estrutura) e um último agente junta tudo.
- **Avaliação estruturada:** um agente retorna um objeto JSON validado com campos fixos que outros programas podem processar.
- **Textos com controle de qualidade:** um juiz verifica o resultado segundo critérios e faz o agente melhorá-lo.

O Nodestro roda localmente no seu computador. Fluxos de trabalho, execuções, conhecimento e memória ficam em um banco de dados SQLite. Os dados só saem do seu computador para solicitações aos provedores de IA que você configurou.

## Conceitos básicos {#begriffe}
<!-- keywords: glossário, conceitos, nó, execução, trace, token -->

| Conceito | Significado |
|---|---|
| **Fluxo de trabalho** | Um processo salvo formado por nós e conexões. |
| **Nó** | Um bloco na tela: *Início*, *Agente* ou *Resultado*. |
| **Agente** | Um modelo de IA com prompt de sistema, tarefa e, opcionalmente, ferramentas, conhecimento, memória e formato de saída. |
| **Conexão** | Passa o resultado de um nó para o nó seguinte. |
| **Execução** | Uma única execução de um fluxo de trabalho com uma entrada específica. |
| **Trace** | O registro completo de uma execução: entradas, resultados, chamadas de ferramentas, erros, tempos, tokens e custos. |
| **Ferramenta** | Uma função que um agente pode chamar sozinho, como uma calculadora ou a busca na web. |
| **Conhecimento** | Arquivos enviados (PDFs, imagens, textos) que os agentes usam como material de referência. |
| **Memória** | Anotações que um agente escreve sozinho e lê de novo em tarefas posteriores. |
| **Token** | A unidade de cobrança dos modelos: mais ou menos um pedaço de palavra. 1.000 tokens equivalem a cerca de 600 palavras em português. |
| **Orçamento** | Um limite de custo por execução; se for ultrapassado, a execução para. |

## Primeiros passos {#erste-schritte}
<!-- keywords: guia, tutorial, início rápido, primeiro fluxo, quickstart -->

Crie seu primeiro fluxo de trabalho em poucos minutos:

1. **Configure um provedor de IA.** Abra *Configurações → Provedores de IA* e informe a chave de API de um provedor, por exemplo a Anthropic (ou defina antes de iniciar uma variável de ambiente como `ANTHROPIC_API_KEY`). Se você usar outro provedor, troque também o modelo padrão ali. Sem um provedor configurado você pode editar tudo, mas não executar nada; a página *Fluxos de trabalho* avisa isso no topo e leva às configurações. Copiar um exemplo funciona também sem provedor.
2. **Crie um fluxo de trabalho.** Em *Fluxos de trabalho*, clique em **Novo fluxo de trabalho**, digite um nome e confirme com **Criar e abrir**. O editor abre com três nós já conectados: *Início*, *Novo agente* e *Resultado*.
3. **Configure o agente.** Clique no agente. O inspetor aparece à direita. Dê um nome ao agente e escreva um prompt de sistema, por exemplo: "Você é um revisor experiente. Melhore a ortografia e o estilo sem mudar o conteúdo."
4. **Inicie.** Clique em **Iniciar fluxo de trabalho**, digite um texto e confirme com **Iniciar**. O Nodestro salva o fluxo automaticamente. Se o botão estiver bloqueado, o motivo aparece logo ao lado, com um link para a solução.
5. **Acompanhe.** Na *Visão geral da execução*, abaixo da tela, você vê ao vivo o que o agente escreve, quais ferramentas chama, quantos tokens usa e quanto custa.
6. **Analise.** Em **Detalhes** você chega à execução completa com sua linha do tempo.

> **Dica:** Abaixo dos seus fluxos de trabalho fica a galeria com 24 [workflows de exemplo](/docs/beispiele) para tarefas típicas, por exemplo **Análise financeira** e **Artigo de blog**. A prévia é gratuita; exemplos copiados são cópias suas, que você pode mudar livremente.

## A interface {#oberflaeche}
<!-- keywords: navegação, barra lateral, menu, tema, escuro, claro, layout -->

A **barra lateral** à esquerda segue o seu jeito de trabalhar: criar, executar e revisar, e depois automatizar.

- **Criar:** *Fluxos de trabalho* (seus processos), *Biblioteca de agentes* (modelos reutilizáveis), *Ferramentas*, *Conhecimento* e *Memória*.
- **Executar e revisar:** *Execuções* (todas as execuções em detalhe), *Aprovações* (decisões que as execuções aguardam) e *Uso* (tokens e custos ao longo do tempo).
- **Automatizar e testar:** *Séries de testes*, *Execuções em lote* e *Agendamentos*.
- **Ajuda:** esta *Documentação* e a página de *Boas-vindas*.

Embaixo ficam as *Configurações* e, abaixo delas, onde o Nodestro roda: no aplicativo de desktop e com o comando `nodestro` aparece **Local e privado**; em um servidor, **O servidor da sua organização** (veja [Nodestro em um servidor](/docs/einstellungen#server)). No canto superior direito você alterna entre o esquema de cores escuro e claro; a escolha fica salva no navegador. Se o provedor do modelo padrão não estiver configurado, aparece ali um aviso (*Configurar provedor de IA* ou, se outro provedor já estiver configurado, *O modelo padrão precisa de …*) que leva direto às configurações. Em um servidor, sua conta também aparece no canto superior direito.

**Ajuda bem onde você precisa:** muitos controles têm um pequeno símbolo **?** ao lado. Passe o mouse sobre ele, foque-o com a tecla Tab ou toque nele em telas sensíveis ao toque: aparece uma explicação curta, muitas vezes com um link para a seção correspondente desta documentação. O símbolo de livro ao lado dos títulos de página abre o capítulo correspondente. **Esc** fecha a explicação.

Os status são sempre mostrados como texto e símbolo, nunca só por cor. Todos os controles também podem ser acessados pelo teclado.

## Busca {#suche}
<!-- keywords: busca, buscar, encontrar, pesquisar, ctrl+k, cmd+k, busca rápida -->

O campo de busca no topo da barra de título (ou **Ctrl+K**, no Mac **⌘K**) busca em fluxos de trabalho, agentes dos fluxos de trabalho, biblioteca de agentes, ferramentas, conhecimento e nesta documentação. Os resultados são agrupados por tipo; favoritos aparecem com estrela.

Com as setas você escolhe um resultado; **Enter** o abre onde ele fica: um agente no editor do seu fluxo de trabalho, um modelo na biblioteca de agentes, uma ferramenta na biblioteca de ferramentas, um arquivo de conhecimento na lista e uma seção na documentação. Maiúsculas, minúsculas e acentos não importam.

## Onde ficam meus dados? {#daten}
<!-- keywords: privacidade, local de armazenamento, banco de dados, sqlite, backup, nodestro_data_dir, ~/.nodestro -->

Todos os dados ficam em um banco de dados SQLite no diretório de dados, por padrão `~/.nodestro` (pode ser alterado com `--data-dir` ou com a variável de ambiente `NODESTRO_DATA_DIR`). Nele ficam:

- `nodestro.db` com fluxos de trabalho, modelos de agentes, execuções, configurações, arquivos de conhecimento, índice de busca e espaços de memória,
- a pasta `tools` com as ferramentas próprias e as criadas pela IA.

Para fazer **backup**, copie o diretório de dados com o Nodestro encerrado. Ao provedor de um agente só vai o conteúdo de que o agente precisa para sua solicitação: prompt de sistema, tarefa, conhecimento atribuído, conteúdo de memória que ele lê e resultados de ferramentas. As chaves de API nunca são exibidas na interface. Se você trabalha com o Nodestro em um servidor, os dados ficam salvos nesse servidor (veja [Nodestro em um servidor](/docs/einstellungen#server)).

## O aplicativo de desktop {#desktop}
<!-- keywords: desktop, aplicativo, janela, linux, instalação, link de início, tauri -->

Além do comando `nodestro`, o Nodestro está disponível como aplicativo de desktop (prévia para Linux x86_64, ainda sem assinatura). Ele traz o próprio Python; além do WebKitGTK 4.1 (`libwebkit2gtk-4.1-0`), nada precisa ser instalado. Descompacte o arquivo e inicie `nodestro-desktop`.

- O aplicativo usa o mesmo diretório de dados do comando (`~/.nodestro` ou `NODESTRO_DATA_DIR`). Só um dos dois pode usá-lo por vez.
- Somente a janela do aplicativo pode usar este Nodestro. Outros programas do computador e páginas da web no navegador são recusados (*Este Nodestro pertence ao aplicativo de desktop que o iniciou*). O link de início da janela funciona uma única vez; para abrir uma nova janela, reinicie o aplicativo.
- Links para outros sites abrem no navegador.
- Fechar a janela encerra o Nodestro. Se ele parar inesperadamente, a janela avisa e informa o arquivo de log.
- Ferramentas criadas por IA rodam isoladas no sandbox Linux integrado; não é preciso instalar nada para isso (veja [Ferramentas](/docs/tools#sandbox)). Se *Configurações → Sandbox* disser que ele não está disponível, e sempre no macOS e no Windows, elas só rodam com Docker ([Instalar o Docker](/docs/einstellungen#sandbox-docker)).
- Ainda não existem versões para macOS e Windows.
