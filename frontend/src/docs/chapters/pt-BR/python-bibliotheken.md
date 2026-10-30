# Bibliotecas Python

Ferramentas próprias e criadas com IA podem usar bibliotecas de terceiros como `numpy`, `pandas`, `scipy` ou `requests`. Este capítulo explica como o Nodestro as detecta, por que você aprova cada biblioteca explicitamente e como funcionam os ambientes Python separados.

## Visão geral {#ueberblick}
<!-- keywords: bibliotecas, pacotes, pypi, numpy, pandas, terceiros, dependências, uv -->

A biblioteca padrão do Python basta para muitas ferramentas. Se você precisar de mais:

1. **Detectar:** O Nodestro lê as importações do código da ferramenta e deduz os pacotes necessários. Nada é baixado.
2. **Aprovar:** Antes de instalar qualquer coisa, você vê cada pacote com sua versão e o aprova. Sem aprovação nada é instalado.
3. **Instalar:** O Nodestro instala exatamente as versões aprovadas com a ferramenta de pacotes **uv** em um ambiente próprio na pasta de dados.
4. **Executar:** A ferramenta roda no sandbox com o Python desse ambiente.

O Python que executa o próprio Nodestro nunca muda. Fluxos de trabalho cujas ferramentas usam apenas a biblioteca padrão não precisam de nada disso e funcionam como antes.

> **Importante:** Aprovar uma biblioteca não aprova o código de uma ferramenta. Você verifica e aprova código e testes como de costume (veja [Aprovação](/docs/tools#freigabe)).

## Como as bibliotecas são detectadas {#erkennung}
<!-- keywords: import, from import, detecção, nome do módulo, nome do pacote, pil, pillow, script, pep 723, dependencies, ambíguo -->

O Nodestro avalia `import x` e `from x import y`:

- A **biblioteca padrão** (`math`, `json`, `datetime` …) e o módulo `tool` nos testes não precisam de nada.
- **Módulos conhecidos** são associados ao pacote certo mesmo quando os nomes diferem: `PIL` → `Pillow`, `sklearn` → `scikit-learn`, `yaml` → `PyYAML`, `bs4` → `beautifulsoup4`, `cv2` → `opencv-python-headless`.
- **Módulos desconhecidos** nunca são adivinhados. O Nodestro os indica e pede uma declaração explícita.
- **Importações dinâmicas** como `importlib.import_module(name)` não podem ser resolvidas e são indicadas.
- Importações dentro de `try: … except ImportError:` são consideradas opcionais.

Você declara pacotes e faixas de versão explicitamente em um cabeçalho no início do código (formato “inline script metadata”):

```python
# /// script
# dependencies = ["numpy>=1.26", "python-dateutil"]
# ///
import numpy as np
from dateutil import parser
```

São permitidos apenas o nome do pacote e a especificação de versão, sem links nem caminhos locais.

## Aprovação {#freigabe}
<!-- keywords: aprovação, aprovar, autorizar, versão, indireto, transitivo, visão geral, instalar -->

Com **Revisar e aprovar** o Nodestro resolve as versões (baixando informações dos pacotes; um pacote sem wheel pré-compilado é compilado a partir do código-fonte, o que executa seu script de build) e mostra uma visão geral:

| Coluna | Significado |
|---|---|
| **Pacote** e **Versão** | A versão exata que seria instalada |
| **Tipo** | *direto* (uma ferramenta o importa), *indireto* (outro pacote precisa dele) ou *execução* (o Nodestro sempre o traz) |
| **Exigido por** | As ferramentas ou pacotes que precisam dele |
| **Status** | *Novo*, *Aprovado*, *Alteração antiga → nova* ou *Removido* |

Revise a lista e clique em **Aprovar e instalar**. Bibliotecas de terceiros podem acessar arquivos e a rede: aprove apenas pacotes que você conhece.

O Nodestro guarda cada aprovação com pacote, versão e data. Enquanto nada mudar, o Nodestro não pergunta de novo. Uma nova aprovação é necessária quando:

- uma ferramenta precisa de um **pacote novo**,
- um **requisito** muda (por exemplo, uma nova faixa de versões) e outra versão se torna necessária,
- a **versão do Python** mudou,
- as aprovações vêm de **outro computador** ou de uma **importação**.

O Nodestro nunca atualiza em silêncio: versões já aprovadas têm preferência ao resolver de novo, e qualquer outra versão aparece como *Alteração*.

## Bibliotecas no fluxo de trabalho {#workflow}
<!-- keywords: fluxo de trabalho, ambiente, inspetor, status, iniciar, execução, ambiente próprio, instalar -->

Cada fluxo de trabalho com bibliotecas recebe um **ambiente próprio** com aprovações próprias. No inspetor do fluxo de trabalho (sem nó selecionado), a seção **Bibliotecas Python** mostra:

- o **status**: *Aprovação necessária*, *Instalação pendente*, *Instalando*, *Aprovadas e instaladas* ou *A instalação falhou*,
- cada pacote necessário com a versão instalada e as ferramentas que o usam,
- as ações **Revisar e aprovar**, **Instalar** e **Ver versões**,
- o **histórico de alterações** com aprovações, instalações e importações.

A [verificação](/docs/workflows#pruefung) indica aprovações ausentes como erros. Um fluxo de trabalho só inicia quando todas as bibliotecas estão aprovadas. Se um ambiente aprovado ainda não estiver instalado (por exemplo, depois de excluí-lo), o Nodestro o instala ao iniciar a partir das versões aprovadas.

O ambiente só é criado quando necessário. Os pacotes baixados ficam em um cache compartilhado e são reutilizados por todos os ambientes, então um segundo ambiente com os mesmos pacotes é instalado rapidamente.

## Bibliotecas em ferramentas {#tools}
<!-- keywords: ferramenta, ferramenta própria, ferramenta ia, coding agent, ambiente de teste, testes, experimentar, sem bibliotecas -->

Para os **testes** de uma ferramenta com bibliotecas, o Nodestro cria um **ambiente de teste** próprio:

- **Escrever você mesmo:** *Verificar e testar* indica quais bibliotecas a ferramenta precisa. Os testes só rodam depois que você as aprovar na seção **Bibliotecas Python da ferramenta**. Depois verifique de novo e salve.
- **Criar com IA:** Se o Coding Agent propõe bibliotecas, a tarefa aguarda com o status *Aguardando bibliotecas*. Você vê a visão geral e escolhe **Aprovar bibliotecas** (instalar e depois testar) ou **Reescrever sem bibliotecas**. Depois você aprova o código separadamente, como de costume.
- **Experimentar** na biblioteca também usa o ambiente de teste da ferramenta.

A aprovação para os testes não vale automaticamente para fluxos de trabalho. Se um fluxo de trabalho usa a ferramenta, você aprova as bibliotecas lá; a visão geral mostra onde elas já estão aprovadas.

Ferramentas com bibliotecas rodam com limites maiores (60 segundos, 2 GB de memória), porque carregar pacotes como `pandas` leva tempo.

## Arquiteto de fluxos com IA {#architekt}
<!-- keywords: arquiteto, rascunho, rascunho de ferramenta, bibliotecas, não instalado -->

O [Arquiteto de fluxos com IA](/docs/ki-architekt#tools-freigeben) pode propor rascunhos de ferramentas com bibliotecas. Ele reúne os pacotes necessários e os mostra na revisão do rascunho, **mas não instala nada**. Ao testar um rascunho de ferramenta, você aprova as bibliotecas para o ambiente de teste; depois de aplicar o rascunho, você as aprova no fluxo de trabalho.

## Versões e reprodutibilidade {#versionen}
<!-- keywords: versão, lock, reprodutível, fixada, atualizar, upgrade, conflito -->

Após a aprovação, o Nodestro guarda uma **definição completa** de todos os pacotes com a versão exata, inclusive os indiretos. A partir dela, um ambiente sempre pode ser restaurado de forma idêntica. A instalação acontece em uma pasta separada e só substitui o ambiente anterior quando tudo está instalado e todas as importações funcionam. Se falhar, o ambiente anterior permanece inalterado.

Se duas ferramentas de um fluxo de trabalho precisam de versões incompatíveis, o Nodestro indica um **conflito** e cita os pacotes envolvidos nos detalhes técnicos. Ajuste então as especificações de versão no cabeçalho `# /// script`.

## Exportação, importação e backup {#export}
<!-- keywords: exportar, importar, backup, cópia de segurança, outro computador, portátil, definição -->

- A **exportação** de um fluxo de trabalho inclui a definição das bibliotecas (pacotes e versões), mas nenhum arquivo instalado.
- A **importação** adota a definição. Os pacotes precisam ser **aprovados novamente** neste computador; a visão geral mostra as versões trazidas.
- **Duplicar** também adota as versões, mas exige uma aprovação própria.
- Um **backup** contém definições e aprovações. No mesmo computador as aprovações continuam válidas após a restauração; em outro, precisam ser concedidas de novo. Os ambientes são reinstalados quando necessário.

## Manutenção e limpeza {#wartung}
<!-- keywords: manutenção, limpar, organizar, armazenamento, cache, órfão, excluir, configurações -->

Nas [configurações](/docs/einstellungen), a seção **Ambientes Python** mostra as versões do uv e do Python, o tamanho do cache e cada ambiente com proprietário, número de pacotes, tamanho e data de instalação.

- **Excluir ambiente** remove os arquivos instalados. As aprovações permanecem; o ambiente é reinstalado na próxima vez que for necessário.
- Ambientes **órfãos** pertencem a um fluxo de trabalho ou ferramenta que foi excluído.
- **Limpar órfãos** exclui todos os ambientes órfãos com sua definição e organiza o cache.

O Nodestro nunca exclui um ambiente sem uma ação sua.

## Resolver problemas {#probleme}
<!-- keywords: erro, conflito, não encontrado, rede, uv ausente, docker, instalação falhou, registro -->

| Mensagem | Solução |
|---|---|
| **Nenhum pacote é conhecido para o módulo** | Declare o pacote no cabeçalho `# /// script`. |
| **Uma importação por nome não pode ser resolvida** | Importe o módulo diretamente com `import`. |
| **O pacote não existe** | Verifique a grafia do nome do pacote. |
| **Nenhuma versão compatível** / **Conflito** | Flexibilize a especificação de versão ou alinhe-a entre as ferramentas. |
| **Índice de pacotes inacessível** | Verifique a conexão com a internet; ambientes instalados também funcionam offline. |
| **O uv não foi encontrado** | Reinstale o Nodestro; o uv é instalado junto. |
| **Somente no sandbox de processos** | Ferramentas com bibliotecas não rodam no sandbox Docker. Mude o [sandbox](/docs/einstellungen#sandbox) para *Processo Python*. |

Se uma instalação falhar, o **registro da instalação** mostra a saída do uv. **Instalar novamente** inicia uma nova tentativa.
