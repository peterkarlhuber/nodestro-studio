# Ferramentas

Ferramentas são funções que um agente pode chamar sozinho para calcular, consultar ou executar algo com exatidão. Este capítulo explica os tipos de ferramentas, como escrever as suas ou pedir que a IA as crie e como o Nodestro as executa com segurança.

## Como as ferramentas funcionam {#ueberblick}
<!-- keywords: ferramenta, tool, função, function calling, tool use, tipos, integradas, próprias, geradas por ia -->

Uma ferramenta tem um **nome**, uma **descrição** e um **esquema de entrada** (os parâmetros). O modelo vê essas informações e decide se uma chamada ajuda. Se ele chamar uma ferramenta, o Nodestro executa a função e devolve o resultado ao modelo. Essa ida e volta se chama **rodada de ferramentas**; um agente pode fazer várias em sequência.

A página **Ferramentas** tem três seções: *Biblioteca*, *Escrever você mesmo* e *Criar com IA*. Há quatro tipos de ferramentas:

| Tipo | Origem | Execução |
|---|---|---|
| **Integrada** | Vem com o Nodestro, escrita e verificada à mão | no processo do Nodestro |
| **Ferramenta própria** | Criada por você em *Escrever você mesmo* | na sandbox |
| **Criada por IA** | Escrita pelo agente programador e aprovada por você | na sandbox |
| **Ferramentas de servidor** | Da Anthropic (pesquisa na web, busca na web, execução de código) | nos servidores da Anthropic |

As ferramentas da biblioteca são atribuídas no inspetor de um agente, onde também se ativam as ferramentas de servidor (veja [Atribuir ferramentas](/docs/agenten#tools)).

## Ferramentas integradas {#eingebaut}
<!-- keywords: calculator, calculadora, current_datetime, data, hora, days_between, dias, text_statistics -->

| Ferramenta | Finalidade | Entrada de exemplo |
|---|---|---|
| `calculator` | Calcula uma expressão com exatidão: `+ - * / // % **`, parênteses, `pi`, `e` e `sqrt`, `log`, `log10`, `exp`, `abs`, `round`, `min`, `max`, `sin`, `cos`, `tan`. | `{"expression": "(1250 - 980) / 980 * 100"}` |
| `current_datetime` | Data, hora e dia da semana atuais em um fuso horário (padrão *Europe/Vienna*). | `{"timezone": "America/Sao_Paulo"}` |
| `days_between` | Dias corridos entre duas datas (negativo se o fim for anterior). | `{"start": "2026-01-01", "end": "2026-03-01"}` |
| `text_statistics` | Conta caracteres, palavras, frases e parágrafos de um texto. | `{"text": "…"}` |

Modelos de linguagem erram em contas de cabeça. Dê a `calculator` aos agentes que trabalham com números e peça no prompt de sistema que a usem.

A biblioteca mostra as descrições das ferramentas integradas no idioma da interface. O modelo sempre recebe a descrição original em inglês, para que os agentes existentes se comportem igual em todos os idiomas.

## Ferramentas de servidor da Anthropic {#server-tools}
<!-- keywords: pesquisa na web, web search, busca na web, web fetch, execução de código, code execution, ferramentas de servidor, fontes -->

| Ferramenta de servidor | Efeito | Observações |
|---|---|---|
| **Pesquisa na web** | Pesquisa na web e cita as fontes. | Custa US$ 10 extras a cada 1.000 pesquisas; no máximo 5 pesquisas por solicitação. |
| **Busca na web** | Carrega o conteúdo de uma página web ou PDF a partir de uma URL. | No máximo 5 buscas por solicitação. |
| **Execução de código** | Executa Python em uma sandbox da Anthropic. | Não use junto com pesquisa na web ou busca na web (a verificação avisa). |

As ferramentas de servidor rodam na Anthropic, não no seu computador. As chamadas delas também aparecem na execução.

## A biblioteca de ferramentas {#bibliothek}
<!-- keywords: biblioteca, experimentar, testar, esquema de entrada, ver código -->

À esquerda ficam todas as ferramentas com tipo e descrição; à direita, os detalhes da ferramenta selecionada:

- **Esquema de entrada:** os parâmetros como esquema JSON, do jeito que o modelo os vê.
- **Ver código e testes** (em ferramentas próprias e criadas por IA).
- **Experimentar:** digite uma entrada em JSON (o Nodestro preenche um esqueleto) e clique em **Executar**. A ferramenta roda exatamente como um agente a chamaria; ferramentas próprias, portanto, na sandbox. Isso não custa nada, porque nenhum modelo participa. Os erros aparecem em vermelho.

## Escrever suas próprias ferramentas {#selbst-schreiben}
<!-- keywords: ferramenta própria, python, escrever função, docstring, tipos, testes, escrever você mesmo -->

Em **Escrever você mesmo** você cria uma ferramenta como função Python. O Nodestro preenche um exemplo (Celsius para Fahrenheit).

1. **Nome da função:** exatamente o nome da função no código. Ele vira o nome da ferramenta.
2. **Código:** uma função com **anotações de tipo** para todos os parâmetros e o valor de retorno, e uma **docstring** no estilo Google. A primeira linha vira a descrição; a seção `Args:` descreve os parâmetros.
3. **Testes:** funções `test_*` que importam a ferramenta com `from tool import <name>` e a verificam com `assert`.
4. **Verificar e testar** executa a verificação estática e os testes sem salvar.
5. **Salvar** verifica de novo e só salva se tudo for aprovado.

**Exemplo:**

```python
def net_price(gross: float, vat_percent: float = 20.0) -> float:
    """Compute the net price from a gross price.

    Args:
        gross: Gross price including VAT.
        vat_percent: VAT rate in percent, e.g. 20 for 20 %.

    Returns:
        The net price, rounded to cents.
    """
    return round(gross / (1 + vat_percent / 100), 2)
```

```python
from tool import net_price


def test_standard_vat():
    assert net_price(120) == 100.0


def test_reduced_rate():
    assert net_price(110, 10) == 100.0
```

Uma boa descrição é decisiva: o modelo escolhe ferramentas apenas pelo nome, pela descrição e pelas descrições dos parâmetros. Escreva-as em inglês, como o código.

## Regras para o código próprio {#regeln}
<!-- keywords: regras, verificação estática, imports, módulos permitidos, proibido, open, eval, reservado, segurança -->

O código próprio e o criado por IA é **verificado estaticamente** antes de cada execução. É permitido cálculo puro, sem entrada e saída:

- **Imports permitidos:** `bisect`, `calendar`, `cmath`, `collections`, `dataclasses`, `datetime`, `decimal`, `enum`, `fractions`, `functools`, `heapq`, `itertools`, `json`, `math`, `numbers`, `operator`, `pydantic`, `re`, `statistics`, `string`, `textwrap`, `typing`, `typing_extensions`.
- **Bibliotecas de terceiros** como `numpy` ou `pandas` são permitidas depois que você as aprova. Elas rodam em um ambiente próprio (veja [Bibliotecas Python](/docs/python-bibliotheken#erkennung)). Essas bibliotecas podem acessar a rede e arquivos: aprove apenas o que você conhece.
- **São proibidos**, entre outros, `open`, `eval`, `exec`, `compile`, `getattr`, `globals`, acesso a atributos com sublinhado duplo, `global`, `async`/`await` e instruções fora de funções (exceto imports, classes e atribuições).
- **Sem acesso à rede ou a arquivos pela biblioteca padrão:** módulos como `os`, `socket` ou `urllib` não são permitidos.
- **Nomes reservados:** os nomes das ferramentas integradas e também `list_agents`, `create_agent`, `run_agent`, `find_tools`, `create_tool` e `load_tool` já estão em uso.
- **Testes são obrigatórios:** nada é salvo sem pelo menos um teste aprovado.

O **resultado da verificação** mostra os erros da verificação estática, cada teste como aprovado ou com a mensagem de erro, e a saída da sandbox.

## Pedir que a IA crie ferramentas {#ki-erstellen}
<!-- keywords: ferramenta de ia, agente programador, coding agent, gerar, pedir ferramenta, dinâmico, requisito -->

Em **Criar com IA** você descreve o que a ferramenta deve fazer (pelo menos 10 caracteres), por exemplo: "Calcule a parcela de um empréstimo a partir do valor, da taxa de juros anual em porcentagem e do prazo em meses."

Depois, em segundo plano:

1. O **agente programador** (o modelo dos assistentes definido nas configurações) escreve a função e os testes.
2. O código e os testes são **verificados estaticamente**, e os testes rodam na **sandbox**.
3. Se algo falhar, o agente programador recebe a mensagem de erro e corrige a proposta; **no máximo três tentativas** no total.
4. Quando todos os testes passam, o pedido aguarda sua **aprovação**.

Cada pedido mostra o status, o número de tentativas e os custos. Em *Ver tentativas* você encontra o código de cada tentativa.

Você pode escrever o requisito em qualquer idioma. A ferramenta em si é sempre escrita em inglês (código, nomes, docstring e testes), porque a docstring vira a descrição que os agentes leem.

**Funcionam bem** cálculos puros: fórmulas, conversões, cálculos com datas, análises de texto, validações. **Não é possível** criar ferramentas que precisem de internet, arquivos ou serviços externos (veja [Regras](/docs/tools#regeln)).

## Aprovação {#freigabe}
<!-- keywords: aprovação, aprovar, recusar, approval, verificar, autorizar -->

Antes que uma ferramenta criada por IA seja incluída, você vê o código, os testes e os resultados dos testes. Verifique:

- A função faz exatamente o que você descreveu?
- Os testes cobrem os casos importantes, inclusive casos-limite?
- A descrição é clara, para que os agentes usem a ferramenta corretamente?

**Aprovar** inclui a ferramenta na biblioteca; a partir daí todos os agentes podem usá-la. **Recusar** a descarta. Sem decisão, um pedido é recusado automaticamente depois de **uma hora**.

> **Observação:** os pedidos ficam apenas na memória. Se você encerrar o Nodestro, a lista de pedidos some; as ferramentas aprovadas são mantidas.

## A sandbox {#sandbox}
<!-- keywords: sandbox, docker, subprocess, processo python, isolamento, segurança, tempo limite -->

Ferramentas próprias e criadas por IA **nunca rodam no processo do Nodestro**. Os testes e cada chamada posterior rodam em um sandbox:

| Sandbox | Isolamento | Limites |
|---|---|---|
| **Processo Python** (padrão para suas ferramentas) | processo separado com ambiente vazio em uma pasta temporária; **não** é uma barreira de segurança | 15 segundos, 1 GB de memória |
| **Sandbox Linux integrado** (automático para ferramentas criadas por IA no Ubuntu 24.04 e no Debian 13) | sem rede, sem acesso aos seus arquivos, chaves, aos dados do Nodestro ou a outros programas; sem novos processos; só a própria pasta temporária aceita gravação | 15 segundos (60 com bibliotecas), 1 GB de memória, 64 MB de arquivos temporários |
| **Docker** | contêiner descartável sem rede, com sistema de arquivos somente leitura, sem privilégios | 20 segundos, 512 MB de memória, 1 CPU |

O sandbox Linux integrado não precisa de instalação: ele usa funções do kernel Linux (Landlock e seccomp). O Nodestro verifica uma vez na inicialização se elas existem e funcionam; *Configurações → Sandbox* mostra o resultado e, se não estiver disponível, o motivo. Ele não protege contra erros no próprio kernel Linux e não esconde se um arquivo existe em outro lugar; o Docker continua disponível como alternativa.

Você escolhe o sandbox nas [configurações](/docs/einstellungen#sandbox). O Docker precisa estar instalado e em execução; caso contrário, testes e chamadas falham. Se uma chamada passar do limite de tempo, ela conta como erro e o processo é encerrado.

## Confiança e isolamento {#vertrauen}
<!-- keywords: confiança, não confiável, origem, gerado por ia, docker necessário, isolamento necessário, bloqueado, restrito, precisa de isolamento -->

O Nodestro decide pela **origem do código** onde ele pode rodar:

| Origem | Mostrada como | Sem isolamento (só *Processo Python*) | Sandbox Linux integrado ou Docker |
|---|---|---|---|
| Ferramentas integradas e integrações | *Integrada* | no processo do Nodestro | no processo do Nodestro |
| Escrita por você em *Escrever você mesmo* | *Escrita por você* | roda, sem isolamento neste computador | roda (no *Processo Python* ou isolada no Docker) |
| Criada por IA (também depois da sua aprovação), rascunhos de ferramentas do arquiteto de IA, ferramentas de origem desconhecida | *Precisa de isolamento* | **bloqueada** | roda isolada |

O processo Python não é uma barreira de segurança: o código nele roda com as suas permissões. Por isso o Nodestro nunca executa ali código gerado por IA, e nem a sua aprovação nem uma configuração mudam isso; não existe nenhuma chave que permita mesmo assim. Onde o sandbox Linux integrado está disponível, o Nodestro o usa automaticamente para esse código. Sem ele e sem Docker:

- **Criar com IA** não inicia, e rascunhos de ferramentas não podem ser testados nem aprovados;
- agentes com uma ferramenta que precisa de isolamento não podem rodar; a verificação do workflow avisa antes do início;
- ferramentas que precisam de isolamento não podem usar bibliotecas de terceiros.

Ferramentas salvas antes desta versão, e todas as ferramentas depois de restaurar um backup, contam como de origem desconhecida, inclusive as escritas por você, porque a origem não foi registrada. Com isolamento, continuam funcionando. Uma nova versão dessa ferramenta, ou uma cópia do código dela em uma ferramenta nova, mantém esse status.

## Serviços conectados {#verbundene-dienste}
<!-- keywords: mcp, model context protocol, serviço externo, serviços conectados, servidor, token, aprovação, alterada -->

Com o **Model Context Protocol (MCP)** você conecta serviços externos, por exemplo uma busca de documentos ou um sistema de tickets. As ferramentas deles ficam disponíveis para os agentes como qualquer outra, mas só depois da sua revisão. Você as encontra em *Ferramentas → Serviços conectados*.

1. **Conectar um serviço:** nome e endereço do endpoint MCP (somente `https`) e, se preciso, um token de acesso. No desktop você pode permitir `http://127.0.0.1` para um servidor que desenvolve neste computador.
2. **Testar a conexão:** o Nodestro negocia a versão do protocolo e consulta as ferramentas do serviço. Cada ferramenta começa como **Nova**.
3. **Revisar e classificar:** você vê a descrição, os parâmetros e as indicações do serviço. Isso é **texto externo**: o Nodestro o exibe, mas nunca o trata como instrução. Classifique a ferramenta: **Somente leitura**, **Altera dados** ou **Exclui ou destrói**. A indicação do serviço é só uma dica; na dúvida, vale "Altera dados".
4. **Aprovar:** só então os agentes veem a ferramenta, como `mcp__<serviço>__<ferramenta>`. Você a atribui a um agente como qualquer outra.

Por enquanto só podem ser usadas as ferramentas que você classificar como **somente leitura**; as que alteram dados continuam bloqueadas até existir a aprovação por chamada. Mesmo uma ferramenta de leitura recebe tudo o que o agente envia a ela: conecte apenas serviços aos quais você confia esses dados.

**Alterações:** o Nodestro guarda uma impressão digital de cada definição aprovada e a verifica antes de cada chamada. Se o serviço alterar uma ferramenta, ela fica **bloqueada**; execuções que a usam falham com uma mensagem clara. Você vê a alteração lado a lado (aprovado até agora, oferecido agora) e a aprova ou rejeita.

**Tokens de acesso** são salvos criptografados: no desktop com uma chave do chaveiro do sistema operacional, no servidor com a chave do servidor, separadamente por inquilino. Sem um cofre de chaves seguro, um token vale só até fechar o app. Tokens nunca aparecem em workflows, exportações ou registros.

**Limites:** o Nodestro nunca se conecta a endereços internos, locais ou de metadados, verifica cada endereço resolvido no momento da conexão e ignora as configurações de proxy do ambiente. Em um servidor, o operador libera os endereços com `NODESTRO_MCP_ENDPOINTS`. Agendamentos, lotes e APIs publicadas só usam ferramentas de serviços se o operador ativar isso expressamente. O Nodestro não conhece o custo de serviços externos; ele aparece como **desconhecido**, nunca como zero.

**Operação:** em *Operação* os administradores veem quantas chamadas de serviço estão em andamento, os limites do operador e, por serviço, chamadas, falhas e a duração da última chamada. Um serviço que falha várias vezes seguidas é pausado por pouco tempo.

## Fazer login em um serviço {#mcp-anmeldung}
<!-- keywords: mcp, oauth, login, entrar, autorização, acesso, renovar -->

Alguns serviços não usam um token fixo, mas um **login (OAuth)**. Escolha *OAuth* como login ao conectar o serviço e salve. Depois clique em **Fazer login**: o Nodestro abre a página de login do serviço, você confirma o acesso lá e volta para *Ferramentas → Serviços conectados*. Teste a conexão para carregar as ferramentas.

- O Nodestro guarda o acesso criptografado como um token e o renova sozinho. Você vê onde fez login, com quais permissões e quando o acesso se renova; o acesso em si nunca é mostrado.
- **Sair** remove o acesso guardado. Quando o serviço pede um novo login, execuções que o usam falham com uma mensagem clara até você fazer login de novo.
- Em um servidor, o operador configura o endereço público do Nodestro; o retorno do login vai só para lá.

## Documentos de um serviço {#mcp-dokumente}
<!-- keywords: mcp, resources, recursos, documentos, contexto, ler -->

Se um serviço oferece **documentos** (recursos MCP), o teste da conexão mostra mais uma ferramenta, `resources/read`, com a indicação *Documentos do serviço*. Você a revisa como qualquer outra ferramenta: a descrição lista os documentos que um agente pode ler.

- Só os documentos listados podem ser lidos; padrões de endereço e outros endereços ficam excluídos.
- Se o serviço mudar a lista, a ferramenta fica bloqueada até você revisar a nova lista.
- Os conteúdos são dados externos, como qualquer resultado de um serviço. O Nodestro não passa conteúdo binário, como imagens, ao modelo.
- O Nodestro não permite que um serviço faça perguntas a você, faça as próprias chamadas ao modelo ou acesse suas pastas.

## Servidores locais {#lokale-dienste}
<!-- keywords: mcp, stdio, servidor local, pypi, contêiner, docker, pacotes -->

Além de serviços remotos, você pode rodar um **servidor MCP local** do PyPI, por exemplo um serviço de horário ou de cálculo. Escolha *Servidor local* como tipo, informe os pacotes (um por linha) e o módulo iniciado com `python -m`.

1. **Revisar os pacotes:** o Nodestro resolve as versões exatas com hashes. Você as vê e as aprova, como nas bibliotecas de uma ferramenta. Nada é instalado antes disso.
2. **Instalação:** os pacotes vão para uma imagem de contêiner própria.
3. **Testar a conexão:** o servidor inicia em um contêiner isolado e lista suas ferramentas. A partir daí, revisão e aprovação são as mesmas dos serviços remotos.

O contêiner **não tem rede**, nem acesso aos seus arquivos, chaves ou outros processos, e tem memória e processos limitados. Por isso servidores locais só estão disponíveis quando o sandbox Docker é usado; servidores que precisam da internet ou do Node.js não podem rodar assim. Um servidor local não recebe token nem login.

## Versões e exclusão {#versionen}
<!-- keywords: versão, excluir, retirar, revoke, atualizar, sobrescrever -->

Se você salvar uma ferramenta própria com um nome que já existe, é criada uma **nova versão** e a anterior é retirada. Os agentes sempre usam a versão atual. A biblioteca mostra o número da versão.

**Excluir** retira uma ferramenta. Os agentes que a têm atribuída passam a informar "Ferramentas desconhecidas" e não podem iniciar até que você remova a ferramenta deles ou a crie de novo. Ferramentas integradas não podem ser excluídas. Abaixo da descrição, **Usado em** mostra quais fluxos de trabalho e agentes da biblioteca usam a ferramenta; a caixa de exclusão os nomeia antes de excluir. APIs publicadas ficam de fora de propósito: elas contêm sua própria cópia da ferramenta.

## Entender erros de ferramentas {#fehler}
<!-- keywords: erros de ferramentas, falhou, tempo esgotado, erro da sandbox, entrada inválida -->

Na execução, cada chamada de ferramenta pode ser expandida: entrada, resultado, momento e duração. Chamadas com falha ficam marcadas. Causas comuns:

- **Entrada inválida:** o modelo preencheu os parâmetros errado. Melhore as descrições dos parâmetros na docstring.
- **Erro esperado da ferramenta** (por exemplo, divisão por zero): o agente vê a mensagem e pode tentar de novo.
- **Tempo esgotado ou falha na sandbox:** teste a ferramenta em *Experimentar* com a mesma entrada.
- **Docker inacessível:** inicie o Docker ou mude para a sandbox *Processo Python*.

A configuração [Erros de ferramentas](/docs/agenten#tool-fehler) controla se erros inesperados encerram o agente.
