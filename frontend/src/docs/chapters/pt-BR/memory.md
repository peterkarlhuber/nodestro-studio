# Memória

Com a memória, um agente guarda informações além de uma única tarefa: preferências, decisões, andamento ou regras aprendidas. Este capítulo explica os tipos de memória, os espaços de memória e o navegador de memória.

## Como a memória funciona {#ueberblick}
<!-- keywords: memória, memory, ferramenta de memória, /memories, anotações, lembrar -->

O Nodestro usa a **ferramenta de memória** do Orkexa: com modelos da Anthropic, a ferramenta de memória própria da Anthropic; com outros provedores, uma ferramenta comum com os mesmos comandos (o modelo precisa suportar ferramentas). Um agente com memória recebe um pequeno sistema de arquivos em `/memories`, no qual ele mesmo cria, lê, altera, renomeia e apaga arquivos de texto. O modelo decide sozinho o que lembrar: normalmente consulta a memória no início de uma tarefa e registra novidades depois.

A memória é **texto puro** (quase sempre Markdown). Para documentos originais, como PDFs, use o [Conhecimento](/docs/wissen).

## Tipos de memória {#arten}
<!-- keywords: desligada, por execução, permanente, persistent, ephemeral, modo -->

| Tipo | Duração | Compartilhamento | Uso |
|---|---|---|---|
| **Desligada** | – | – | O agente não guarda nada além da tarefa (padrão). |
| **Por execução** | uma execução | não, cada agente tem a sua | Bloco de notas para tarefas longas com muitas rodadas de ferramentas; depois, as anotações aparecem na execução. |
| **Permanente** | até você excluir | sim, pelo espaço de memória | Conhecimento que cresce ao longo de muitas execuções: preferências de clientes, andamento de projetos, decisões. |

## Memória por execução {#pro-lauf}
<!-- keywords: por execução, ephemeral, bloco de notas, scratchpad, aba memória -->

Com *Por execução*, o agente começa cada execução com a memória vazia. O que ele anota aparece na execução, junto ao agente, na aba **Memória**. Outros agentes da mesma execução não veem essas anotações; as informações entre agentes passam pelas [conexões](/docs/workflows#datenfluss).

## Memória permanente e espaços de memória {#dauerhaft}
<!-- keywords: permanente, espaço de memória, space, compartilhar, comum, persistent, namespace -->

Com *Permanente* você escolhe um **espaço de memória**. Um espaço é um sistema de arquivos `/memories` próprio no banco de dados do Nodestro. Ele se mantém entre execuções e reinicializações.

- **Criar um espaço novo:** no inspetor, digite um nome em *Novo espaço de memória* e clique em **Criar**, ou use **Nova memória** na página *Memória*. São permitidos letras, dígitos, espaços, `_`, `.` e `-` (no máximo 64 caracteres).
- **Compartilhar:** vários agentes com o mesmo espaço leem e gravam os mesmos arquivos, mesmo em fluxos de trabalho diferentes. Assim, por exemplo, um agente pode registrar os desejos dos clientes e outro pode levá-los em conta.
- Um espaço criado no inspetor aparece na página *Memória* assim que o agente grava o primeiro arquivo.

Se dois agentes com o mesmo espaço rodarem em paralelo, eles acessam um de cada vez; cada alteração é completa, mas um pode sobrescrever o conteúdo do outro. Dê arquivos ou espaços diferentes a agentes em paralelo.

## O navegador de memória {#browser}
<!-- keywords: página de memória, navegador, editar, criar arquivo, esvaziar, ver conteúdo -->

A página **Memória** mostra todos os espaços com o número e o tamanho dos arquivos. Escolha um espaço para ver os arquivos dele:

- **Ver e editar um arquivo:** escolha o arquivo, altere o texto e clique em **Salvar**.
- **Criar um arquivo:** digite um caminho (por exemplo `clientes/preferencias.md`); ele é criado em `/memories`.
- **Excluir um arquivo:** símbolo da lixeira ao lado do caminho.
- **Esvaziar um espaço:** exclui definitivamente todos os arquivos do espaço após confirmação.

Assim você pode verificar, corrigir ou preencher a memória a qualquer momento. No inspetor, **Ver conteúdo** leva direto ao espaço do agente.

## Configurar a memória com IA {#assistent}
<!-- keywords: assistente de memória, configurar com ia, sugestão, estrutura, arquivos iniciais -->

**Configurar com IA** (no inspetor, com *Permanente*) sugere uma estrutura inicial:

1. Descreva o que o agente deve guardar, por exemplo "as preferências de cada cliente, as decisões tomadas e os pontos em aberto de cada projeto".
2. O assistente de memória (o modelo dos assistentes definido nas configurações) sugere de dois a cinco arquivos com conteúdo, entre eles um `README.md` que explica a estrutura ao agente. Ele não inventa fatos; deixa marcadores.
3. Revise e edite as sugestões, escolha o espaço e clique em **Salvar no espaço**. O agente passa a usar esse espaço.

Nada é salvo antes da sua confirmação. A sugestão custa uma solicitação ao modelo dos assistentes.

Os arquivos sugeridos são escritos no idioma da interface, a menos que sua descrição peça outro. Os nomes de arquivo continuam em inglês.

## Casos de uso {#anwendungsfaelle}
<!-- keywords: casos de uso, exemplos, clientes, projeto, aprender, preferências -->

- **Atendimento ao cliente:** um agente guarda preferências e pedidos anteriores de cada cliente em `customers/<nome>.md`.
- **Projetos em andamento:** um agente de projeto mantém `decisions.md` e `open-items.md` e continua dali na próxima execução.
- **Revisão que aprende:** um agente revisor reúne erros recorrentes em `error-catalogue.md` e passa a verificá-los de forma específica.
- **Pesquisas longas:** com *Por execução*, um agente registra resultados intermediários em vez de perdê-los na conversa.

## Observações e limites {#hinweise}
<!-- keywords: limites, segurança, segredos, senhas, custos, nome da ferramenta memory -->

- **Sem segredos:** o que um agente lê da memória passa a fazer parte da solicitação ao provedor de IA. Não guarde senhas nem chaves.
- **Custos:** acessos à memória são rodadas de ferramentas. Arquivos grandes custam tokens toda vez que são lidos; mantenha os arquivos pequenos e bem organizados.
- **Caminhos:** todos os caminhos ficam em `/memories`. Caminhos fora dele são recusados.
- **Nome reservado:** o nome de ferramenta `memory` pertence à ferramenta de memória; uma ferramenta própria com esse nome não pode ser usada junto com a memória.
- **Máx. de rodadas de ferramentas:** cada ação de memória conta como chamada de ferramenta. Aumente o limite se um agente lê e grava muito.
