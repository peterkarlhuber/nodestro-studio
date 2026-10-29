# Uso y costes

Nodestro cuenta los tokens de cada solicitud a un proveedor de IA y estima los costes. Este capítulo explica los tipos de tokens, cómo se calculan los costes, cómo ahorra el caché y qué muestra la página *Uso*.

## Resumen {#ueberblick}
<!-- keywords: uso, costes, tokens, estadísticas, consumo, facturación -->

Los tokens y los costes se ven en cuatro lugares:

- en cada nodo de agente después de una ejecución,
- en el *Resumen de la ejecución* del editor (en directo),
- en la vista de detalle de cada ejecución, en total y por agente,
- en la página **Uso**, resumidos por día, flujo de trabajo y modelo.

Todos los costes son **estimaciones según precios de lista**; lo que cuenta es la facturación de cada proveedor. Nodestro solo conoce precios de los modelos de Anthropic. Con otros modelos los costes quedan **desconocidos** (se muestran como «–»): nunca cuentan como 0, y un presupuesto solo limita costes con precio conocido. Los importes se muestran siempre en dólares estadounidenses, con hasta seis decimales y en el formato numérico del idioma elegido (por ejemplo «0,0042 US$» en español o «$0.0042» en inglés).

## Tipos de tokens {#tokens}
<!-- keywords: token, entrada, salida, input, output, cache read, cache write, tokens de razonamiento, solicitudes, requests -->

| Tipo | Significado |
|---|---|
| **Entrada** | Todo lo que se envía al modelo y no procede de la caché: prompt de sistema, tarea, conversación, resultados de herramientas, conocimiento. |
| **Salida** | Todo lo que escribe el modelo, **razonamiento incluido**, y las llamadas a herramientas. |
| **De la caché** | Entrada leída de la caché de prompts; mucho más barata. |
| **A la caché** | Entrada escrita en la caché; algo más cara que la entrada normal. |
| **Razonamiento** | La parte de la salida dedicada al razonamiento (si la API la indica). |

**Solicitudes a la API** cuenta cada llamada a la API. Un agente necesita al menos una solicitud, más una por cada ronda de herramientas, y el control de calidad necesita más por cada control y revisión. Pasa el ratón por el número de tokens de un agente para ver el desglose.

## Cómo se calculan los costes {#kosten}
<!-- keywords: calcular costes, precio, lista de precios, estimación, mtok, coste de búsqueda web, precio desconocido -->

Para cada solicitud, Nodestro multiplica los tipos de tokens por los precios del modelo (en dólares por millón de tokens) y suma las tarifas de búsquedas web (10 $ por cada 1.000 búsquedas). La suma de todas las solicitudes da los costes del agente y de la ejecución; si una parte es desconocida, la suma también lo es. La lista de precios procede de la biblioteca Orkexa (modelos de Anthropic):

<!-- widget: models -->

Si una ejecución muestra **«–»** en lugar de un importe, al menos una solicitud no se pudo valorar (por ejemplo, un modelo desconocido). Nodestro prefiere entonces no mostrar ningún importe antes que uno demasiado bajo. Para el presupuesto, esas solicitudes cuentan como 0.

## Caché {#caching}
<!-- keywords: caché, caching, prompt caching, cache, ahorrar, ttl, 5 minutos, 1 hora, cache write -->

Con la **caché de prompts** (por agente en *Avanzado*, activada por defecto), la API recuerda el inicio invariable de una solicitud. Las solicitudes siguientes con el mismo inicio lo leen de la caché:

- **Leer** de la caché cuesta, según el modelo, solo entre un 2,5 y un 10 % del precio normal de entrada.
- **Escribir** en la caché de 5 minutos cuesta 1,25 veces el precio de entrada; en la de 1 hora, 2 veces.

La caché compensa especialmente cuando un agente hace **varias solicitudes** (rondas de herramientas, control de calidad, memoria) o cuando el mismo flujo se ejecuta **varias veces seguidas**. El conocimiento en modo *En el contexto* está al principio del prompt y por eso se beneficia especialmente.

**Duración de la caché:** la caché de 5 minutos se prolonga con cada uso. Elige *1 hora* solo si entre solicitudes suelen pasar más de cinco minutos.

Cuánto procedía de la caché se ve en el desglose de tokens («de la caché», «a la caché»).

## La página Uso {#statistik}
<!-- keywords: página de uso, estadísticas, gráfico, por día, por flujo de trabajo, por modelo, periodo, prueba de agente, asistente, origen -->

Elige el periodo arriba (7, 30 o 90 días). La página muestra:

- **Indicadores:** ejecuciones, otras operaciones de IA, solicitudes a la API, tokens (entrada y salida) y coste estimado.
- **Coste por día** como gráfico de barras; pasa el ratón por una barra para ver coste y número de ejecuciones.
- **Por flujo de trabajo** y **Por modelo** como tablas con cantidad, tokens, coste y proporción del coste total.
- **Por origen:** ejecuciones de flujos de trabajo, pruebas de agentes, diseño de agentes con IA, asistente de memoria y creación de herramientas con IA.
- **Últimas operaciones de IA fuera de los flujos de trabajo** con momento, modelo, tokens y coste.

Las ejecuciones se asignan por su **momento de inicio**. En *Por modelo* cada agente cuenta para el modelo de su configuración; el coste de su control de calidad está incluido. Las demás operaciones de IA cuentan para el modelo que usaron. Cada solicitud se cuenta exactamente una vez: las ejecuciones de flujos de trabajo desde las ejecuciones guardadas, todo lo demás desde un registro propio. Las **trazas importadas** no se incluyen.

## Ahorrar costes {#sparen}
<!-- keywords: ahorrar, más barato, reducir costes, optimizar, consejos -->

- **El modelo adecuado más pequeño:** Haiku para pasos sencillos, Sonnet para la mayoría, Opus solo donde haga falta.
- **Reducir el esfuerzo:** *Bajo* o *Medio* basta para muchas tareas y ahorra tokens de razonamiento.
- **Dejar la caché activada.**
- **Usar el conocimiento de forma selectiva:** *Búsqueda* o *Bajo demanda* en lugar de archivos grandes *En el contexto*.
- **Limitar los tokens y las rondas de herramientas** para que un agente no se pierda.
- **Fijar un presupuesto** para que una ejecución nunca cueste más de lo previsto.
- **Usar el control de calidad de forma selectiva:** cada control y revisión cuesta más.
