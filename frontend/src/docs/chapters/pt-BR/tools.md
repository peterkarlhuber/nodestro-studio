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

Ferramentas próprias e criadas por IA **nunca rodam no processo do Nodestro**. Os testes e cada chamada posterior rodam isolados:

| Sandbox | Isolamento | Limites |
|---|---|---|
| **Processo Python** (padrão) | processo separado com ambiente vazio em um diretório temporário | 15 segundos, 1 GB de memória |
| **Docker** | contêiner descartável sem rede, com sistema de arquivos somente leitura, sem privilégios | 20 segundos, 512 MB de memória, 1 CPU |

A sandbox é escolhida nas [configurações](/docs/einstellungen#sandbox). O Docker isola mais, mas precisa estar instalado e em execução; caso contrário, testes e chamadas falham. Se uma chamada ultrapassar o tempo limite, ela conta como erro.

## Versões e exclusão {#versionen}
<!-- keywords: versão, excluir, retirar, revoke, atualizar, sobrescrever -->

Se você salvar uma ferramenta própria com um nome que já existe, é criada uma **nova versão** e a anterior é retirada. Os agentes sempre usam a versão atual. A biblioteca mostra o número da versão.

**Excluir** retira uma ferramenta. Os agentes que a têm atribuída passam a informar "Ferramentas desconhecidas" e não podem iniciar até que você remova a ferramenta deles ou a crie de novo. Ferramentas integradas não podem ser excluídas.

## Entender erros de ferramentas {#fehler}
<!-- keywords: erros de ferramentas, falhou, tempo esgotado, erro da sandbox, entrada inválida -->

Na execução, cada chamada de ferramenta pode ser expandida: entrada, resultado, momento e duração. Chamadas com falha ficam marcadas. Causas comuns:

- **Entrada inválida:** o modelo preencheu os parâmetros errado. Melhore as descrições dos parâmetros na docstring.
- **Erro esperado da ferramenta** (por exemplo, divisão por zero): o agente vê a mensagem e pode tentar de novo.
- **Tempo esgotado ou falha na sandbox:** teste a ferramenta em *Experimentar* com a mesma entrada.
- **Docker inacessível:** inicie o Docker ou mude para a sandbox *Processo Python*.

A configuração [Erros de ferramentas](/docs/agenten#tool-fehler) controla se erros inesperados encerram o agente.
