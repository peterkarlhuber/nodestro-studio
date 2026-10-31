# Agentes

Un agente es un modelo de IA con un rol, una tarea y herramientas opcionales. El modelo puede ser de Anthropic, OpenAI, Google Gemini o de un servidor propio. Este capítulo explica cada ajuste del inspector, su efecto y valores típicos.

## Fundamentos {#grundlagen}
<!-- keywords: nombre, descripción, símbolo, icono, inspector, estructura -->

Selecciona un agente en el lienzo; el inspector muestra su configuración. Los ajustes frecuentes están arriba y los menos usados, en secciones desplegables (*Herramientas*, *Conocimiento*, *Memoria*, *Formato de salida*, *Razonamiento y esfuerzo*, *Control de calidad*, *Avanzado*). Junto al título de cada sección aparece un resumen, por ejemplo «2 asignadas». El resumen nombra cada ajuste que difiere de un agente nuevo, por ejemplo «1 modelo de respaldo · sin caché» en *Avanzado*. Los problemas siguen visibles aunque una sección esté cerrada: su título muestra «1 error» o «2 advertencias», y los enlaces de *Problemas en*, arriba, abren la sección y saltan a ella. Una sección queda abierta o cerrada tal como la dejaste, también en el siguiente agente y tras recargar. Solo lo recuerda este navegador; el flujo de trabajo y sus exportaciones no cambian.

- **Icono:** haz clic en el icono de arriba a la izquierda para elegir otro. Solo sirve para orientarse.
- **Nombre:** aparece en el lienzo y es también el marcador `{{Nombre}}` para los sucesores.
- **Descripción:** una frase sobre el rol del agente. Aparece en el nodo y sirve de punto de partida para el diseño con IA.

Con los símbolos de arriba a la derecha guardas el agente como **plantilla** en la biblioteca, lo **duplicas** (Ctrl+D) o lo **eliminas**.

## Modelo {#modell}
<!-- keywords: modelo, model, opus, sonnet, haiku, fable, precio, elección, qué modelo -->

El modelo determina las capacidades, la velocidad y el precio. Elige primero el **proveedor** y luego el **modelo**: de la lista de modelos conocidos o como cualquier id de modelo del proveedor que escribas (por ejemplo un modelo nuevo de OpenAI o `llama3.1:8b` en Ollama). Los proveedores aún sin configurar llevan la indicación «sin configurar». La tabla muestra los modelos conocidos con sus precios por millón de tokens; «–» significa que el precio es desconocido. Para esos modelos los costes quedan **desconocidos** y nunca cuentan como 0.

<!-- widget: models -->

**Reglas generales:**

- **Haiku 5.5** para clasificar, extraer y tareas cortas y bien delimitadas.
- **Sonnet 5.5** para la mayoría de las tareas de agente; el predeterminado para agentes nuevos.
- **Opus 5.5** para razonamiento exigente, planificación, código y tareas largas con muchas herramientas.
- **Fable 5.1** para las tareas más difíciles, cuando la calidad importa más que el coste.

El modelo predeterminado para agentes nuevos se define en los [ajustes](/docs/einstellungen#modelle), y el acceso a los proveedores en [Proveedores de IA](/docs/einstellungen#anbieter). Algunas opciones solo existen para modelos de Anthropic: thinking y mostrar razonamiento, caché de prompts, modelos alternativos y herramientas de servidor. Con otros proveedores el inspector las oculta; si alguna sigue activada, la comprobación notifica un error en lugar de omitirla en silencio.

## Prompt de sistema {#system-prompt}
<!-- keywords: prompt de sistema, system prompt, rol, instrucción, persona, ingeniería de prompts -->

El prompt de sistema describe de forma permanente **quién** es el agente y **cómo** trabaja. Se aplica a todas las tareas del agente y, con la caché activada, se reutiliza a bajo coste.

Un buen prompt de sistema contiene:

1. **Rol:** «Eres un analista financiero especializado en empresas industriales.»
2. **Método:** «Comprueba el periodo y la unidad de cada cifra. Calcula con la herramienta calculadora.»
3. **Nivel de calidad:** «Indica expresamente las incertidumbres.»
4. **Salida:** idioma, longitud y formato («Responde en español en un máximo de 200 palabras, en forma de lista.»).

Evita instrucciones que dependan de la entrada concreta; esas van en la **tarea**.

## Tarea {#aufgabe}
<!-- keywords: tarea, task, plantilla, marcador -->

La tarea es el mensaje que recibe el agente en cada ejecución. Puede contener marcadores: `{{input}}`, `{{run.input}}` y `{{Nombre de un predecesor}}`. Las reglas están en [Marcadores de posición en las tareas](/docs/workflows#platzhalter).

Si la tarea no contiene ningún marcador, el inspector lo indica: los resultados de los predecesores se añaden entonces bajo `# Eingaben`.

## Asignar herramientas {#tools}
<!-- keywords: asignar herramientas, tools, herramientas de servidor, búsqueda web, obtención web, ejecución de código -->

En la sección **Herramientas** eliges de la biblioteca de herramientas qué funciones puede llamar el agente. La lista está agrupada en *Integradas*, *Propias* y *Generadas por IA*; al pasar el ratón aparece la descripción.

Debajo activas las **herramientas de servidor de Anthropic**: *Búsqueda web*, *Obtención web* y *Ejecución de código*. Se ejecutan en los servidores de Anthropic (consulta [Herramientas de servidor](/docs/tools#server-tools)). Las herramientas de servidor solo están disponibles para modelos de Anthropic.

El agente decide por sí mismo si llama a una herramienta y cuándo, según su nombre y su descripción. Cuántas veces puede hacerlo lo controlan [Máx. rondas de herramientas y Herramientas en paralelo](/docs/agenten#limits); si está obligado, lo controla [Tool choice](/docs/agenten#tool-choice).

## Asignar conocimiento {#wissen}
<!-- keywords: asignar conocimiento, archivos, pdf, contexto, bajo demanda, búsqueda, citas -->

En la sección **Conocimiento** asignas archivos subidos y eliges **cómo** los recibe el agente:

- **En el contexto:** los archivos están completos en el prompt desde el principio.
- **Bajo demanda:** el agente ve un catálogo y carga los archivos por sí mismo (herramienta `files`).
- **Búsqueda:** el agente busca los fragmentos adecuados (herramienta `search`).

**Activar citas** hace que las respuestas remitan a los pasajes exactos. Los detalles y recomendaciones están en el capítulo [Conocimiento](/docs/wissen#modi).

**Subir archivo**, en la misma sección, sube uno o varios archivos directamente a [Conocimiento](/docs/wissen#hochladen) y los asigna a este agente. El archivo queda guardado de forma permanente en Conocimiento al instante y otros agentes también pueden usarlo; la asignación es un cambio normal del agente y se guarda con el flujo de trabajo. *Deshacer* o *Descartar* solo quitan la asignación, no el archivo. Los archivos que entregas al iniciar una ejecución no son archivos de conocimiento: pertenecen solo a esa ejecución.

## Memoria {#memory}
<!-- keywords: memoria, memory, notas, por ejecución, permanente, espacio -->

En la sección **Memoria** eliges *Desactivada*, *Por ejecución* o *Permanente* y, para la memoria permanente, un **espacio de memoria**. Puedes crear espacios nuevos aquí mismo. **Configurar con IA** propone una estructura de archivos adecuada. Todo lo demás está en el capítulo [Memoria](/docs/memory).

## Formato de salida {#ausgabeformat}
<!-- keywords: formato de salida, estructurado, json, esquema, campos, pydantic, nombre del campo, tipo, obligatorio, output format -->

**Texto (Markdown)** es el predeterminado: el agente responde libremente.

**Estructurado (JSON)** obliga al agente a devolver un objeto con campos fijos. Nodestro genera con ellos un esquema JSON, la API devuelve un objeto que lo cumple y el resultado se valida contra el esquema. Los sucesores lo reciben como JSON; la ejecución lo muestra formateado.

Cada campo tiene:

| Ajuste | Significado |
|---|---|
| **Nombre del campo** | Clave en el JSON, por ejemplo `summary` o `key_metrics`. Se permiten letras, cifras y `_`; el nombre no puede empezar por una cifra y debe ser único. Los demás caracteres se sustituyen por `_` al escribir. |
| **Tipo** | *Texto*, *Número* (decimal), *Número entero*, *Sí/No*, *Lista (texto)* o *Lista (números)*. |
| **Descripción** | Explica al modelo qué va en el campo. Cuanto más precisa, mejor. |
| **Obligatorio** | Los campos obligatorios siempre se rellenan; los opcionales pueden ser `null`. |

**Ejemplo** de una evaluación:

| Nombre del campo | Tipo | Descripción |
|---|---|---|
| `summary` | Texto | Resumen en 2–3 frases |
| `key_metrics` | Lista (texto) | Las cifras clave más importantes con su unidad |
| `risk_score` | Número entero | Riesgo de 1 (bajo) a 5 (alto) |
| `approved` | Sí/No | ¿Es correcto el análisis? |

El resultado tiene entonces este aspecto:

```json
{
  "summary": "Los ingresos y el margen han aumentado claramente …",
  "key_metrics": ["Crecimiento de ingresos 27,6 %", "Margen EBIT 16,8 %"],
  "risk_score": 2,
  "approved": true
}
```

**Limitaciones:**

- Un formato estructurado necesita al menos un campo.
- Las citas no se pueden combinar con un formato estructurado.
- Si el modelo rechaza una solicitud, no hay objeto; el agente falla siempre, independientemente del ajuste *Si se niega*.

## Razonamiento y esfuerzo {#denken}
<!-- keywords: esfuerzo, effort, razonamiento, thinking, adaptativo, between_tools, mostrar razonamiento, reasoning -->

El **esfuerzo (effort)** determina lo minucioso que es el modelo: *Bajo*, *Medio* (predeterminado), *Alto*, *Muy alto* o *Máximo*. Más esfuerzo significa más razonamiento, más tokens de salida y costes más altos, pero da mejores resultados en tareas difíciles. *Valor del modelo* deja la elección al modelo.

El **razonamiento (thinking)** determina si el modelo piensa antes de responder:

| Ajuste | Efecto | Restricción |
|---|---|---|
| *Valor del modelo* / *Adaptativo* | El modelo razona cuando es útil. | – |
| *Solo entre llamadas a herramientas* | Razona solo entre llamadas a herramientas, no antes de la primera respuesta. | Solo Sonnet 5.5 y solo hasta esfuerzo *Alto*. |
| *Desactivado* | Sin razonamiento. | No es posible con Opus 5.5, Sonnet 5.5, Fable 5.1 y Fable 5; con Opus 5 y Haiku 5.5, solo hasta esfuerzo *Alto*. |

**Mostrar razonamiento** controla si las reflexiones aparecen en la ejecución: *Mostrar resumido* (un resumen del razonamiento), *Mensajes de progreso* (breves estados intermedios) u *Omitir*. El razonamiento mostrado aparece en la pestaña *Razonamiento*. Este ajuste no se puede combinar con razonamiento *Desactivado* ni con *Solo entre llamadas a herramientas*.

El razonamiento cuenta como **tokens de salida** y se cobra como tal.

Si se desconoce si un modelo admite esfuerzo de razonamiento (servidores propios, ids de modelo desconocidos), un esfuerzo definido produce un error. Elige entonces *Predeterminado del modelo* o declara la capacidad en [Proveedores de IA](/docs/einstellungen#anbieter).

## Control de calidad {#qualitaet}
<!-- keywords: control de calidad, juez, judge, evaluador, criterios, revisión, refine, llm as a judge, evaluación -->

Con el control de calidad, un segundo modelo, el **juez**, revisa el resultado del agente:

1. El agente realiza su tarea.
2. El juez evalúa el resultado **por criterio** como *superado* o *no superado*, con una justificación. También ve las llamadas a herramientas y sus resultados.
3. Si un criterio obligatorio no se ha superado, el agente recibe la justificación y revisa su respuesta.
4. Esto se repite hasta el número de **revisiones** configurado (0–5).

El resultado del control aparece en la ejecución junto al agente: superado o no, número de intentos y la justificación del juez. Un resultado no superado también se transmite; la ejecución no falla por ello.

**Los buenos criterios** se pueden comprobar uno a uno: «Cada cifra procede de un resultado de herramienta», «Nombra al menos un riesgo concreto», «Como máximo 150 palabras». Los criterios vagos como «bien escrito» llevan a juicios poco fiables.

**Costes:** cada control y cada revisión es una solicitud adicional. Los costes del juez cuentan para el agente y para el presupuesto de la ejecución. Un control recién activado empieza con el modelo predeterminado de los ajustes como **modelo juez**; puedes cambiarlo cuando quieras, y los controles existentes conservan su modelo. El resumen de la sección nombra al juez. Si el juez es el mismo modelo que el agente, un aviso lo indica: un modelo tiende a valorar bien sus propias respuestas.

## Límites {#limits}
<!-- keywords: máx. tokens, max_tokens, rondas de herramientas, max_tool_rounds, herramientas en paralelo, max_parallel_tools, límite -->

| Ajuste | Predeterminado | Efecto |
|---|---|---|
| **Máx. tokens** | 8.000 | Número máximo de tokens de salida por respuesta, razonamiento incluido (hasta 128.000). Al alcanzarlo, el agente se detiene con `IncompleteResponseError`. |
| **Máx. rondas de herramientas** | 8 | Cuántas rondas de llamadas a herramientas puede hacer el agente por tarea (0–50). Después termina con `MaxToolRoundsError`. Con 0 no puede llamar a ninguna herramienta. |
| **Herramientas en paralelo** | 1 | Cuántas llamadas a herramientas de una respuesta se ejecutan a la vez (1–16). Útil con herramientas lentas e independientes, como las búsquedas web. |

Aumenta *Máx. tokens* para textos largos o esfuerzo alto, y *Máx. rondas de herramientas* cuando un agente necesita muchos pasos de investigación.

## Tool choice {#tool-choice}
<!-- keywords: tool choice, tool_choice, forzar, any, none, auto, elección de herramienta -->

| Ajuste | Efecto |
|---|---|
| *Automático* | El modelo decide si usa herramientas (predeterminado). |
| *Sin herramientas* | El modelo responde sin llamadas a herramientas. |
| *Forzar alguna herramienta* | La primera respuesta debe ser una llamada a herramienta. |
| *Herramienta concreta* | La primera respuesta debe llamar a la herramienta elegida. |

Opus 5.5, Sonnet 5.5 y Fable 5.1 rechazan las llamadas forzadas a herramientas; la comprobación lo indica. Usa ahí *Automático* con una instrucción en el prompt de sistema o un formato de salida estructurado.

## Errores de herramientas {#tool-fehler}
<!-- keywords: errores de herramientas, raise_tool_errors, gestión de errores, toolexecutionerror -->

Una herramienta puede fallar de dos maneras:

- **Errores previstos** (la herramienta indica, por ejemplo, «zona horaria desconocida»): el agente siempre recibe el mensaje como resultado y puede reaccionar.
- **Errores imprevistos** (entrada no válida, fallo, tiempo agotado en el sandbox): con **Devolver al modelo los errores de herramientas** (predeterminado: activado), el agente también los ve como resultado de error. Si la opción está desactivada, el agente termina con `ToolExecutionError`.

Las llamadas a herramientas fallidas se marcan en la ejecución con un símbolo de advertencia.

## Caché de prompts {#caching}
<!-- keywords: caché, cache, prompt caching, ttl, 5 minutos, 1 hora -->

Con la **caché de prompts** activada (predeterminado), la API guarda temporalmente el inicio invariable de una solicitud (prompt de sistema, herramientas, conocimiento en el contexto, conversación anterior). Las solicitudes siguientes lo leen a una fracción del precio. Merece la pena con rondas de herramientas, controles de calidad y ejecuciones repetidas.

La **duración de la caché** es de *5 minutos* o *1 hora*. Escribir en la caché de 1 hora cuesta más. Detalles y precios en [Caché y costes](/docs/nutzung#caching).

## Rechazos y modelos de respaldo {#ablehnung}
<!-- keywords: rechazo, refusal, fallback, modelo de respaldo, seguridad, refusalerror -->

Los modelos pueden rechazar solicitudes por motivos de seguridad; a veces es una falsa alarma.

**Si el modelo se niega:**

- *Tratar como error* (predeterminado): el agente falla con `RefusalError`; los sucesores se omiten.
- *Aceptar igualmente el texto de la respuesta:* el texto (normalmente vacío) se transmite como resultado.

**Modelos de respaldo:** si el modelo se niega, la API responde a la misma solicitud con el siguiente modelo de la lista. Los costes se calculan según el modelo que responde. Sonnet 5.5 no admite una lista propia; no uses modelos de respaldo con él.

## Mensajes de ejemplo {#beispiele-nachrichten}
<!-- keywords: ejemplos, few shot, mensajes de ejemplo, messages, diálogo -->

Los mensajes de ejemplo van antes de la tarea real y muestran al modelo el formato deseado (few-shot prompting). Alternan entre **Usuario** y **Asistente**, empiezan con un mensaje del usuario y terminan con una respuesta del asistente. Los mensajes vacíos se ignoran.

**Ejemplo:** Usuario: «El envío llegó dañado.» – Asistente: «Categoría: reclamación · Urgencia: alta».

## Request options {#request-options}
<!-- keywords: request options, opciones de solicitud, betas, mcp, inference_geo, json, avanzado -->

Para usuarios avanzados: un objeto JSON cuyos campos se incluyen sin cambios en cada solicitud a la API del agente, como `betas` o ajustes que Nodestro no ofrece por separado. El JSON no válido se marca de inmediato y no se aplica. Los valores incorrectos solo provocan un error de la API durante la ejecución.

## Diseñar un agente con IA {#ki-entwurf}
<!-- keywords: diseño con ia, describir agente, arquitecto, agent architect, crear automáticamente, dinámico -->

En lugar de configurarlo todo tú, describes el agente con tus propias palabras: tarea, entradas, resultado deseado, nivel de calidad. El **arquitecto de agentes** (el modelo de asistentes de los ajustes) propone entonces:

- nombre, descripción y un prompt de sistema completo,
- el modelo adecuado más económico y el esfuerzo adecuado más bajo,
- herramientas existentes y herramientas de servidor adecuadas,
- límites de tokens y rondas de herramientas.

Ves la propuesta con el coste del diseño y solo la adoptas con **Aplicar**; después todo sigue siendo editable. En el editor, el agente conserva su tarea anterior al aplicar.

Si al arquitecto le faltan capacidades, indica las **herramientas que faltan** con una descripción. Puedes generarlas en [Herramientas → Crear con IA](/docs/tools#ki-erstellen). El arquitecto solo usa modelos actuales, esfuerzo como máximo *Muy alto*, como máximo 32.000 tokens y 20 rondas de herramientas.

El diseño se redacta en el idioma de la interfaz, salvo que tu descripción pida otro idioma. Los nombres de campo y demás identificadores técnicos siguen en inglés.

Disponible con **Diseñar con IA** en el inspector, **Describir un agente** en la paleta o en la página *Agentes*.

## Biblioteca de agentes {#bibliothek}
<!-- keywords: biblioteca, plantilla, template, reutilizar, página de agentes -->

En la página **Agentes** gestionas plantillas de agentes reutilizables:

- **Plantilla vacía** o **Describir un agente** crea una plantilla nueva.
- En el editor, el símbolo de guardar del inspector guarda un agente como plantilla.
- Las plantillas se editan a la derecha con el mismo formulario que en el editor; **Guardar** aplica los cambios y **Descartar** restaura el último estado guardado.
- Las ocho plantillas más recientes aparecen en la paleta del editor en **De la biblioteca**.

Un agente creado a partir de una plantilla es una **copia**: los cambios posteriores en la plantilla no afectan a los agentes ya insertados.

## Probar un agente {#agent-testen}
<!-- keywords: probar, prueba, probar agente, ejecución de prueba, ejecutar solo -->

**Probar agente** en el inspector (en el editor y en la biblioteca de agentes) ejecuta solo este agente con su **configuración actual, incluidos los cambios sin guardar**:

1. Escribe una **entrada de prueba**. Se inserta en la tarea como la entrada de una ejecución; los marcadores de los predecesores quedan vacíos. Con *Enviar la entrada directamente como tarea* solo tu texto llega al agente.
2. **Iniciar prueba** muestra la respuesta, todas las llamadas a herramientas, errores, tokens, coste, duración y, si está activo, el control de calidad.

Una prueba **no es una ejecución del flujo**: no aparece en *Ejecuciones* y no cambia resultados. La memoria persistente solo se lee; la prueba trabaja sobre una copia. Una prueba llama al proveedor del modelo y **puede costar dinero**; el diálogo indica los precios del modelo cuando se conocen, y el coste aparece en la página [Uso](/docs/nutzung#statistik).

## Validación y mensajes {#validierung}
<!-- keywords: validación, mensaje de error, problema, advertencia, rojo, mensaje del inspector -->

El inspector comprueba cada cambio con las reglas de la biblioteca, sin llamar a la API:

- Los **mensajes rojos** (errores) impiden iniciar, por ejemplo una herramienta desconocida, un nombre de campo no válido, ajustes de razonamiento que el modelo no admite o un control de calidad sin criterio.
- Los **mensajes amarillos** (advertencias) permiten iniciar, por ejemplo ejecución de código junto con búsqueda web.
- Las **notas grises** informan, por ejemplo, de que se añaden entradas porque la tarea no contiene ningún marcador.

Los mensajes frecuentes y su solución están en [Errores frecuentes](/docs/faq#haeufige-fehler).
