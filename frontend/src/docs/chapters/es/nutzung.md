# Uso y costes

Nodestro cuenta los tokens de cada solicitud a un proveedor de IA y estima los costes. Este capítulo explica los tipos de tokens, cómo se calculan los costes, cómo ahorra el caché y qué muestra la página *Uso*.

## Resumen {#ueberblick}
<!-- keywords: uso, costes, tokens, estadísticas, consumo, facturación -->

Los tokens y los costes se ven en cuatro lugares:

- en cada nodo de agente después de una ejecución,
- en el *Resumen de la ejecución* del editor (en directo),
- en la vista de detalle de cada ejecución, en total y por agente,
- en la página **Uso**, resumidos por día, flujo de trabajo y modelo.

Todos los costes son **estimaciones según precios de lista**; lo que cuenta es la facturación de cada proveedor. Qué precios se aplican lo ves en [Precios de modelos](/docs/nutzung#preise). Si no se conoce ningún precio para un modelo, los costes quedan **desconocidos** (se muestran como «–»): nunca cuentan como 0, y un presupuesto solo limita costes con precio conocido. Los importes se muestran siempre en dólares estadounidenses, con hasta seis decimales y en el formato numérico del idioma elegido (por ejemplo «0,0042 US$» en español o «$0.0042» en inglés).

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

Para cada solicitud, Nodestro multiplica los tipos de tokens por los precios del modelo (en dólares por millón de tokens) y suma las tarifas de búsquedas web (10 $ por cada 1.000 búsquedas). La suma de todas las solicitudes da los costes del agente y de la ejecución; si una parte es desconocida, la suma también lo es. El cálculo lo hace la biblioteca Orkexa, con la lista de precios que Nodestro mantiene al día. Los precios de los modelos del catálogo:

<!-- widget: models -->

Si una ejecución muestra **«–»** en lugar de un importe, al menos una solicitud no se pudo valorar (por ejemplo, un modelo desconocido). Nodestro prefiere entonces no mostrar ningún importe antes que uno demasiado bajo. Si solo una parte es desconocida, la página *Uso* muestra «al menos …»: la suma de los costes conocidos es entonces un límite inferior. Para el presupuesto solo cuenta la parte conocida; en el modo de precios estricto, esas solicitudes ni siquiera se envían.

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

## Precios de modelos {#preise}
<!-- keywords: precios de modelos, lista de precios, actualizar precios, sincronización, litellm, antiguo, precio individual, precio de contrato, revisión, cambio de precio -->

**Ajustes → Precios de modelos** muestra cada precio con su estado, calidad, fuente y la fecha de la última comprobación. Los precios vienen de tres fuentes, en este orden:

1. los precios verificados de la biblioteca Orkexa,
2. un archivo de precios revisado que indica el operador (`NODESTRO_PRICE_SNAPSHOT_FILE`),
3. la lista pública de precios del proyecto LiteLLM (se desactiva con `NODESTRO_PRICE_LITELLM=off`).

Nodestro comprueba los precios cada 24 horas y cuando pulsas *Comprobar precios ahora*. Si un precio cambia más de un 20 % sin confirmación de una fuente oficial, la nueva lista no se aplica, sino que espera tu **revisión**: *Aplicar* o *Rechazar*. Los precios no válidos (negativos, inverosímilmente altos, moneda incorrecta) nunca se aplican.

| Estado | Significado |
|---|---|
| **Actual** | Comprobado hace poco. |
| **Sin comprobar desde hace tiempo** / **Desactualizado** | Sin comprobar desde hace más de 48 horas o 7 días; los costes se siguen calculando, pero se marcan. |
| **Pendiente de revisión** | Un cambio grande espera tu decisión; hasta entonces se aplica el precio anterior. |
| **Individual** | Un precio que has definido tú. |
| **Desconocido** | Ningún precio conocido; los costes quedan desconocidos. |

Los **precios individuales**, por ejemplo precios de contrato o correcciones, se definen con el lápiz de la tabla. Tienen prioridad sobre el precio de referencia; con *Volver al precio de referencia* vuelve a aplicarse la lista. Cada cambio queda en el **historial de cambios**, y cada uso guardado recuerda con qué versión y fuente de precios se calculó (al final de la página *Uso*).

**Sin internet** se siguen usando los últimos precios válidos; solo pasan a los estados *Sin comprobar desde hace tiempo* y *Desactualizado*. Con `NODESTRO_PRICE_SYNC=off`, un precio solo cambia cuando inicias tú la comprobación.

**En un servidor**, el operador mantiene los precios de referencia: un worker los comprueba y él decide las revisiones con `nodestro-server pricing approve` o `reject`. Los espacios de trabajo ven los precios de referencia en modo de solo lectura y pueden definir sus propios precios individuales.

## Modo de precios {#preismodus}
<!-- keywords: modo de precios, estricto, estándar, rechazar precio desconocido, precio antiguo -->

El **modo de precios** en *Ajustes → Precios de modelos* decide qué pasa con precios que faltan o son antiguos:

- **Estándar:** las solicitudes se ejecutan; sus costes aparecen como desconocidos o como límite inferior, y los precios antiguos se marcan.
- **Estricto:** una solicitud a un modelo sin precio conocido, o con un precio sin comprobar desde hace más de 7 días, se rechaza antes de que cueste nada. Así un presupuesto se mantiene aunque falte un precio.

## Comparación con las facturas de los proveedores {#abgleich}
<!-- keywords: conciliación, factura, facturación, openai costs, anthropic cost report, clave de administrador, desviación -->

Opcionalmente, Nodestro compara sus estimaciones con lo que **OpenAI** y **Anthropic** facturaron realmente, por día y modelo (*Ajustes → Comparar con las facturas de los proveedores*). Para ello necesita una **clave de administrador** de la API de facturación del proveedor, distinta de las claves API normales. La comparación solo lee.

- **Escritorio:** las claves de administrador no se guardan. Define `NODESTRO_OPENAI_ADMIN_KEY` o `NODESTRO_ANTHROPIC_ADMIN_KEY`, o introduce una clave solo para una comparación.
- **Servidor:** la clave se guarda cifrada y no se vuelve a mostrar.

Una fila **se desvía** cuando la diferencia supera el 5 % **y** 1 dólar estadounidense (ambos umbrales se pueden ajustar). Los últimos días cuentan como *aún no definitivos*, porque los proveedores completan sus facturas más tarde. Los días en que Nodestro no conoce algunos costes aparecen como *Estimación incompleta*.

## Ahorrar costes {#sparen}
<!-- keywords: ahorrar, más barato, reducir costes, optimizar, consejos -->

- **El modelo adecuado más pequeño:** Haiku para pasos sencillos, Sonnet para la mayoría, Opus solo donde haga falta.
- **Reducir el esfuerzo:** *Bajo* o *Medio* basta para muchas tareas y ahorra tokens de razonamiento.
- **Dejar la caché activada.**
- **Usar el conocimiento de forma selectiva:** *Búsqueda* o *Bajo demanda* en lugar de archivos grandes *En el contexto*.
- **Limitar los tokens y las rondas de herramientas** para que un agente no se pierda.
- **Fijar un presupuesto** para que una ejecución nunca cueste más de lo previsto.
- **Usar el control de calidad de forma selectiva:** cada control y revisión cuesta más.
