# Herramientas

Las herramientas son funciones que un agente puede llamar por sí mismo para calcular, consultar o ejecutar algo con exactitud. Este capítulo explica los tipos de herramientas, cómo escribir las tuyas o encargarlas a la IA y cómo las ejecuta Nodestro de forma segura.

## Cómo funcionan las herramientas {#ueberblick}
<!-- keywords: herramienta, tool, función, function calling, tool use, tipos, integradas, propias, generadas por ia -->

Una herramienta tiene un **nombre**, una **descripción** y un **esquema de entrada** (los parámetros). El modelo ve estos datos y decide si una llamada le ayuda. Si llama a una herramienta, Nodestro ejecuta la función y devuelve el resultado al modelo. Esa vuelta se llama **ronda de herramientas**; un agente puede hacer varias seguidas.

La página **Herramientas** tiene tres secciones: *Biblioteca*, *Escribirla tú* y *Crear con IA*. Hay cuatro tipos de herramientas:

| Tipo | Origen | Ejecución |
|---|---|---|
| **Integrada** | Incluida con Nodestro, escrita y revisada a mano | en el proceso de Nodestro |
| **Herramienta propia** | Creada por ti en *Escribirla tú* | en el sandbox |
| **Creada por IA** | Escrita por el agente programador y aprobada por ti | en el sandbox |
| **Herramientas de servidor** | De Anthropic (búsqueda web, obtención web, ejecución de código) | en los servidores de Anthropic |

Las herramientas de la biblioteca se asignan en el inspector de un agente, y allí también se activan las herramientas de servidor (consulta [Asignar herramientas](/docs/agenten#tools)).

## Herramientas integradas {#eingebaut}
<!-- keywords: calculator, calculadora, current_datetime, fecha, hora, days_between, días, text_statistics -->

| Herramienta | Finalidad | Entrada de ejemplo |
|---|---|---|
| `calculator` | Calcula una expresión con exactitud: `+ - * / // % **`, paréntesis, `pi`, `e` y `sqrt`, `log`, `log10`, `exp`, `abs`, `round`, `min`, `max`, `sin`, `cos`, `tan`. | `{"expression": "(1250 - 980) / 980 * 100"}` |
| `current_datetime` | Fecha, hora y día de la semana actuales en una zona horaria (por defecto *Europe/Vienna*). | `{"timezone": "Europe/Madrid"}` |
| `days_between` | Días naturales entre dos fechas (negativo si el final es anterior). | `{"start": "2026-01-01", "end": "2026-03-01"}` |
| `text_statistics` | Cuenta los caracteres, palabras, frases y párrafos de un texto. | `{"text": "…"}` |

Los modelos de lenguaje se equivocan al calcular de cabeza. Da la `calculator` a los agentes que trabajan con números e indícales en el prompt de sistema que la usen.

La biblioteca muestra las descripciones de las herramientas integradas en el idioma de la interfaz. El modelo recibe siempre la descripción original en inglés, para que los agentes existentes se comporten igual en todos los idiomas.

## Herramientas de servidor de Anthropic {#server-tools}
<!-- keywords: búsqueda web, web search, obtención web, web fetch, ejecución de código, code execution, herramientas de servidor, fuentes -->

| Herramienta de servidor | Efecto | Notas |
|---|---|---|
| **Búsqueda web** | Busca en la web y cita las fuentes. | Cuesta 10 $ adicionales por cada 1.000 búsquedas; como máximo 5 búsquedas por solicitud. |
| **Obtención web** | Carga el contenido de una página web o un PDF a partir de una URL. | Como máximo 5 obtenciones por solicitud. |
| **Ejecución de código** | Ejecuta Python en un sandbox de Anthropic. | No la uses junto con la búsqueda web o la obtención web (la comprobación lo advierte). |

Las herramientas de servidor se ejecutan en Anthropic, no en tu ordenador. Sus llamadas también aparecen en la ejecución.

## La biblioteca de herramientas {#bibliothek}
<!-- keywords: biblioteca, probar, test, esquema de entrada, ver código -->

A la izquierda están todas las herramientas con su tipo y descripción; a la derecha, los detalles de la herramienta seleccionada:

- **Esquema de entrada:** los parámetros como esquema JSON, tal como los ve el modelo.
- **Ver código y pruebas** (en herramientas propias y creadas por IA).
- **Probar:** escribe una entrada en JSON (Nodestro rellena un esqueleto) y haz clic en **Ejecutar**. La herramienta se ejecuta exactamente como la llamaría un agente; las herramientas propias, por tanto, en el sandbox. No cuesta nada porque no interviene ningún modelo. Los errores se muestran en rojo.

## Escribir tus propias herramientas {#selbst-schreiben}
<!-- keywords: herramienta propia, python, escribir función, docstring, tipos, pruebas, escribirla tú -->

En **Escribirla tú** creas una herramienta como función de Python. Nodestro rellena un ejemplo (de Celsius a Fahrenheit).

1. **Nombre de la función:** exactamente el nombre de la función en el código. Se convierte en el nombre de la herramienta.
2. **Código:** una función con **anotaciones de tipo** para todos los parámetros y el valor de retorno, y un **docstring** al estilo de Google. La primera línea se convierte en la descripción; la sección `Args:` describe los parámetros.
3. **Pruebas:** funciones `test_*` que importan la herramienta con `from tool import <name>` y la comprueban con `assert`.
4. **Comprobar y probar** ejecuta la comprobación estática y las pruebas sin guardar.
5. **Guardar** vuelve a comprobar y solo guarda si todo se ha superado.

**Ejemplo:**

```python
def net_price(gross: float, vat_percent: float = 21.0) -> float:
    """Compute the net price from a gross price.

    Args:
        gross: Gross price including VAT.
        vat_percent: VAT rate in percent, e.g. 21 for 21 %.

    Returns:
        The net price, rounded to cents.
    """
    return round(gross / (1 + vat_percent / 100), 2)
```

```python
from tool import net_price


def test_standard_vat():
    assert net_price(121) == 100.0


def test_reduced_rate():
    assert net_price(110, 10) == 100.0
```

Una buena descripción es decisiva: el modelo elige herramientas solo por su nombre, su descripción y las descripciones de los parámetros. Escríbelas en inglés, como el código.

## Reglas para el código propio {#regeln}
<!-- keywords: reglas, comprobación estática, imports, módulos permitidos, prohibido, open, eval, reservado, seguridad -->

El código propio y el creado por IA se **comprueba de forma estática** antes de cada ejecución. Se permite el cálculo puro, sin entrada ni salida:

- **Importaciones permitidas:** `bisect`, `calendar`, `cmath`, `collections`, `dataclasses`, `datetime`, `decimal`, `enum`, `fractions`, `functools`, `heapq`, `itertools`, `json`, `math`, `numbers`, `operator`, `pydantic`, `re`, `statistics`, `string`, `textwrap`, `typing`, `typing_extensions`.
- Las **bibliotecas de terceros** como `numpy` o `pandas` están permitidas una vez que las apruebas. Se ejecutan en un entorno propio (consulta [Bibliotecas de Python](/docs/python-bibliotheken#erkennung)). Estas bibliotecas pueden acceder a la red y a archivos: aprueba solo lo que conozcas.
- **Están prohibidos**, entre otros, `open`, `eval`, `exec`, `compile`, `getattr`, `globals`, el acceso a atributos con doble guion bajo, `global`, `async`/`await` y las instrucciones fuera de funciones (salvo importaciones, clases y asignaciones).
- **Sin acceso a red ni a archivos desde la biblioteca estándar:** módulos como `os`, `socket` o `urllib` no están permitidos.
- **Nombres reservados:** los nombres de las herramientas integradas y `list_agents`, `create_agent`, `run_agent`, `find_tools`, `create_tool` y `load_tool` ya están ocupados.
- **Las pruebas son obligatorias:** sin al menos una prueba superada no se guarda nada.

El **resultado de la comprobación** muestra los errores de la comprobación estática, cada prueba como superada o con su mensaje de error, y la salida del sandbox.

## Encargar herramientas a la IA {#ki-erstellen}
<!-- keywords: herramienta ia, agente programador, coding agent, generar, encargar herramienta, dinámico, requisito -->

En **Crear con IA** describes lo que debe hacer la herramienta (al menos 10 caracteres), por ejemplo: «Calcula la cuota de un préstamo a partir del importe, el interés anual en porcentaje y el plazo en meses.»

Después, en segundo plano:

1. El **agente programador** (el modelo de asistentes de los ajustes) escribe la función y las pruebas.
2. El código y las pruebas se **comprueban de forma estática**, y las pruebas se ejecutan en el **sandbox**.
3. Si algo falla, el agente programador recibe el mensaje de error y corrige su propuesta; **como máximo tres intentos** en total.
4. Cuando todas las pruebas se superan, el encargo espera tu **aprobación**.

Cada encargo muestra su estado, el número de intentos y los costes. En *Ver intentos* encontrarás el código de cada intento.

Puedes escribir el requisito en cualquier idioma. La herramienta en sí se escribe siempre en inglés (código, nombres, docstring y pruebas), porque el docstring se convierte en la descripción que leen los agentes.

**Muy adecuados** son los cálculos puros: fórmulas, conversiones, cálculos con fechas, análisis de texto, validaciones. **No es posible** crear herramientas que necesiten internet, archivos o servicios externos (consulta [Reglas](/docs/tools#regeln)).

## Aprobación {#freigabe}
<!-- keywords: aprobación, aprobar, rechazar, approval, revisar, autorizar -->

Antes de que se añada una herramienta creada por IA, ves su código, sus pruebas y los resultados. Comprueba:

- ¿Hace la función exactamente lo que describiste?
- ¿Cubren las pruebas los casos importantes, también los casos límite?
- ¿Es clara la descripción, para que los agentes usen bien la herramienta?

**Aprobar** añade la herramienta a la biblioteca; a partir de entonces todos los agentes pueden usarla. **Rechazar** la descarta. Sin decisión, un encargo se rechaza automáticamente al cabo de **una hora**.

> **Nota:** los encargos solo se guardan en memoria. Si cierras Nodestro, la lista de encargos desaparece; las herramientas aprobadas se conservan.

## El sandbox {#sandbox}
<!-- keywords: sandbox, docker, subprocess, proceso de python, aislamiento, seguridad, tiempo límite -->

Las herramientas propias y las creadas por IA **nunca se ejecutan en el proceso de Nodestro**. Las pruebas y cada llamada posterior se ejecutan en un sandbox:

| Sandbox | Aislamiento | Límites |
|---|---|---|
| **Proceso de Python** (predeterminado para tus herramientas) | proceso aparte con un entorno vacío en una carpeta temporal; **no** es una barrera de seguridad | 15 segundos, 1 GB de memoria |
| **Sandbox de Linux integrado** (automático para herramientas creadas por IA en Ubuntu 24.04 y Debian 13) | sin red, sin acceso a tus archivos, claves, los datos de Nodestro u otros programas; sin procesos nuevos; solo su propia carpeta temporal admite escritura | 15 segundos (60 con bibliotecas), 1 GB de memoria, 64 MB de archivos temporales |
| **Docker** | contenedor desechable sin red, con sistema de archivos de solo lectura, sin privilegios | 20 segundos, 512 MB de memoria, 1 CPU |

El sandbox de Linux integrado no necesita instalación: usa funciones del núcleo de Linux (Landlock y seccomp). Nodestro comprueba una vez al iniciar si están presentes y funcionan; *Ajustes → Sandbox* muestra el resultado y, si no está disponible, el motivo. No protege contra errores del propio núcleo de Linux ni oculta si un archivo existe en otro lugar; Docker sigue disponible como alternativa.

El sandbox se elige en los [ajustes](/docs/einstellungen#sandbox). Docker debe estar instalado y en ejecución; si no, las pruebas y llamadas fallan. Si una llamada supera el límite de tiempo, cuenta como error y el proceso se detiene.

## Confianza y aislamiento {#vertrauen}
<!-- keywords: confianza, no confiable, origen, generado por ia, docker necesario, aislamiento necesario, bloqueado, restringido, necesita aislamiento -->

Nodestro decide según el **origen del código** dónde puede ejecutarse:

| Origen | Se muestra como | Sin aislamiento (solo *Proceso de Python*) | Sandbox de Linux integrado o Docker |
|---|---|---|---|
| Herramientas integradas e integraciones | *Integrada* | en el proceso de Nodestro | en el proceso de Nodestro |
| Escrita por ti en *Escribirla tú* | *Escrita por ti* | se ejecuta, sin aislamiento en este equipo | se ejecuta (en el *Proceso de Python* o aislada en Docker) |
| Creada por IA (también tras tu aprobación), borradores del arquitecto de IA, herramientas de origen desconocido | *Necesita aislamiento* | **bloqueada** | se ejecuta aislada |

El proceso de Python no es una barrera de seguridad: el código que contiene se ejecuta con tus permisos. Por eso Nodestro nunca ejecuta allí código generado por IA, y ni tu aprobación ni un ajuste lo cambian; no hay ningún interruptor que lo permita igualmente. Donde el sandbox de Linux integrado está disponible, Nodestro lo usa automáticamente para ese código. Sin él y sin Docker:

- **Crear con IA** no se inicia, y los borradores de herramientas no se pueden probar ni aprobar;
- los agentes con una herramienta que necesita aislamiento no pueden ejecutarse; la comprobación del flujo lo indica antes del inicio;
- las herramientas que necesitan aislamiento no pueden usar bibliotecas de terceros.

Las herramientas guardadas antes de esta versión, y todas las herramientas tras restaurar una copia de seguridad, se consideran de origen desconocido, también las que escribiste tú, porque su origen no se registró. Con aislamiento siguen funcionando. Una nueva versión de esa herramienta, o una copia de su código en una herramienta nueva, conserva ese estado.

## Servicios conectados {#verbundene-dienste}
<!-- keywords: mcp, model context protocol, servicio externo, servicios conectados, servidor, token, aprobación, modificada -->

Con el **Model Context Protocol (MCP)** conectas servicios externos, por ejemplo una búsqueda de documentos o un sistema de tickets. Sus herramientas están disponibles para los agentes como cualquier otra, pero solo después de tu revisión. Las encuentras en *Herramientas → Servicios conectados*.

1. **Conectar un servicio:** nombre y dirección del endpoint MCP (solo `https`) y, si hace falta, un token de acceso. En el escritorio puedes permitir `http://127.0.0.1` para un servidor que desarrollas en este equipo.
2. **Probar la conexión:** Nodestro negocia la versión del protocolo y consulta las herramientas del servicio. Cada herramienta empieza como **Nueva**.
3. **Revisar y clasificar:** ves la descripción, los parámetros y las indicaciones del servicio. Es **texto ajeno**: Nodestro lo muestra, pero nunca lo trata como una instrucción. Clasifica la herramienta: **Solo lectura**, **Modifica datos** o **Borra o destruye**. La indicación del servicio es solo una pista; en caso de duda, vale «Modifica datos».
4. **Aprobar:** solo entonces los agentes ven la herramienta, como `mcp__<servicio>__<herramienta>`. La asignas a un agente como cualquier otra.

Por ahora solo se pueden usar las herramientas que clasifiques como **solo lectura**; las que modifican datos siguen bloqueadas hasta que exista la aprobación por llamada. Una herramienta de lectura recibe igualmente todo lo que el agente le envía: conecta solo servicios a los que confíes esos datos.

**Cambios:** Nodestro guarda una huella de cada definición aprobada y la comprueba antes de cada llamada. Si el servicio modifica una herramienta, queda **bloqueada**; las ejecuciones que la usan fallan con un mensaje claro. Ves el cambio lado a lado (aprobado hasta ahora, ofrecido ahora) y lo apruebas o rechazas.

**Los tokens de acceso** se guardan cifrados: en el escritorio con una clave del llavero del sistema operativo, en el servidor con la clave del servidor, por separado para cada inquilino. Sin un almacén de claves seguro, un token solo vale hasta cerrar la aplicación. Los tokens nunca aparecen en flujos de trabajo, exportaciones ni registros.

**Límites:** Nodestro nunca se conecta a direcciones internas, locales o de metadatos, comprueba cada dirección resuelta en el momento de conectar e ignora la configuración de proxy del entorno. En un servidor, el operador permite las direcciones con `NODESTRO_MCP_ENDPOINTS`. Las planificaciones, los lotes y las API publicadas solo usan herramientas de servicios si el operador lo activa expresamente. Nodestro no conoce el coste de los servicios externos; aparece como **desconocido**, nunca como cero.

## Versiones y eliminación {#versionen}
<!-- keywords: versión, eliminar, retirar, revoke, actualizar, sobrescribir -->

Si guardas una herramienta propia con un nombre que ya existe, se crea una **versión nueva** y la anterior se retira. Los agentes usan siempre la versión actual. La biblioteca muestra el número de versión.

**Eliminar** retira una herramienta. Los agentes que la tienen asignada indican entonces «Herramientas desconocidas» y no pueden iniciarse hasta que quites allí la herramienta o la vuelvas a crear. Las herramientas integradas no se pueden eliminar. Debajo de la descripción, **Se usa en** muestra qué flujos de trabajo y agentes de la biblioteca usan la herramienta; el diálogo de eliminación los nombra antes de eliminarla. Las API publicadas no aparecen a propósito: contienen su propia copia de la herramienta.

## Entender los errores de herramientas {#fehler}
<!-- keywords: errores de herramientas, fallida, tiempo agotado, error del sandbox, entrada no válida -->

En la ejecución, cada llamada a herramienta se puede desplegar: entrada, resultado, momento y duración. Las llamadas fallidas están marcadas. Causas habituales:

- **Entrada no válida:** el modelo ha rellenado mal los parámetros. Mejora las descripciones de los parámetros en el docstring.
- **Error previsto de la herramienta** (por ejemplo, división por cero): el agente ve el mensaje y puede volver a intentarlo.
- **Tiempo agotado o fallo en el sandbox:** prueba la herramienta en *Probar* con la misma entrada.
- **Docker no accesible:** inicia Docker o cambia al sandbox *Proceso de Python*.

El ajuste [Errores de herramientas](/docs/agenten#tool-fehler) controla si los errores imprevistos terminan el agente.
