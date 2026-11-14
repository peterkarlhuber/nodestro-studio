# Búsqueda web y lectura de páginas web

Dos herramientas integradas dan acceso a la web a un agente: `search_web` busca a través de un servicio de búsqueda que tú eliges, y `fetch_web_page` lee una sola página. Este capítulo explica qué hacen, cómo eliges un servicio de búsqueda, cuánto cuesta, dónde están disponibles las herramientas y cómo compruebas qué fuentes usó una ejecución.

## Las dos herramientas {#werkzeuge}
<!-- keywords: search_web, fetch_web_page, búsqueda web, leer página, internet, herramienta integrada -->

- **`search_web`** busca en la web o en noticias y devuelve resultados con título, dirección, un breve fragmento y, si se conoce, la fecha. Necesita un **servicio de búsqueda**, una conexión de tipo *Búsqueda web* (consulta [Conexiones de servicio](/docs/verbindungen)).
- **`fetch_web_page`** lee una página (HTML, texto o PDF) y devuelve su texto. No necesita conexión. Se rechazan las direcciones de red internas, las direcciones con usuario o contraseña y los puertos que no sean los habituales de la web.

Asignas ambas como cualquier otra herramienta en la sección **Herramientas** del agente (consulta [Asignar herramientas](/docs/agenten#tools)). El inspector las marca con la insignia **Internet**. Una buena pareja: el agente busca con `search_web` y lee los resultados más prometedores con `fetch_web_page` antes de fiarse de algo más que un fragmento.

## Elegir un servicio de búsqueda {#suchdienst}
<!-- keywords: servicio de búsqueda, proveedor, ddgs, brave, tavily, mojeek, searxng, proveedor de prueba, clave de api -->

En *Herramientas → Conexiones → Configurar servicio de búsqueda* configuras un servicio de búsqueda. Nodestro no elige ninguno por ti: cada tarjeta dice con honestidad qué necesita el servicio y qué puedes esperar.

| Servicio | Clave | Notas |
|---|---|---|
| DDGS | no | Gratis y sin ninguna garantía. Usa otros buscadores, que pueden bloquearlo o cambiar en cualquier momento. No disponible en un servidor Nodestro. |
| Brave Search | sí | Los resultados no se pueden guardar. Unos 5 USD por cada 1000 solicitudes. |
| Tavily | sí | Se factura según el plan: indica tu precio por solicitud. |
| Mojeek | sí | Operado en Europa. Se factura según el plan: indica tu precio por solicitud. |
| SearXNG | opcional | Tu propio servidor: indica su dirección. |
| Proveedor de prueba | cualquiera | Proveedor de prueba sin conexión para probar: resultados inventados, sin internet. |

Comprueba tú mismo las condiciones y los precios de un servicio antes de usarlo; Nodestro no recomienda ninguno. Después asigna la conexión a `search_web` en el inspector del agente.

## Costes y límites {#kosten}
<!-- keywords: costes, precio por solicitud, presupuesto, llamadas, resultados, dominios permitidos, dominios bloqueados, avanzado -->

Una búsqueda de pago cuesta dinero por solicitud. Nodestro anota cada solicitud con el precio del servicio en los costes de la ejecución y comprueba el presupuesto de la ejecución antes de una solicitud de pago. Para Brave se usa el precio publicado, salvo que la conexión indique uno propio; Tavily y Mojeek necesitan el precio por solicitud en la conexión; si no, `search_web` no se llama. DDGS, SearXNG y el proveedor de prueba no cuestan nada en Nodestro.

En **Avanzado**, debajo de cada herramienta web en el inspector del agente, limitas lo que el agente puede hacer: el máximo de resultados por búsqueda, la región, el idioma y el periodo de las búsquedas, los **dominios permitidos** y **bloqueados**, el máximo de caracteres por página y el máximo de llamadas por ejecución. Los campos vacíos mantienen los valores predeterminados; `search_web` permite como mucho 10 llamadas por ejecución, `fetch_web_page` como mucho 20.

## Modo sin conexión y servidores {#offline-server}
<!-- keywords: sin conexión, modo estricto sin conexión, servidor, perfil de servidor, operador, no disponible -->

Las dos herramientas necesitan internet. En el modo estricto sin conexión, la comprobación previa a una ejecución las rechaza. En un servidor Nodestro no se ofrecen: la comprobación las señala y cada llamada se rechaza. El operador del servidor puede activarlas con `NODESTRO_WEB_TOOLS_SERVER=1`. DDGS nunca se ofrece en un servidor.

## Fuentes de una ejecución {#quellen}
<!-- keywords: fuentes, fuentes web, registro de fuentes, S1, fuentes citadas, leída, solo resultado, resultado estructurado -->

Cada resultado de búsqueda y cada página que ven las herramientas web quedan registrados en la ejecución con un identificador (`S1`, `S2` …). La vista de detalle de la ejecución los muestra en **Fuentes web** con título, dominio, hora y estado: **Leída** si la página se leyó, **Solo resultado** si solo apareció en una búsqueda. Los enlaces se abren en una pestaña nueva. Solo se guardan las direcciones y los títulos, nunca el texto de la página, y solo en esa ejecución.

Puedes exigir que un agente cite sus fuentes: en un resultado estructurado, activa **Cita fuentes web** en un campo de texto o de lista (consulta [Formato de salida](/docs/agenten#ausgabeformat)). Cada valor debe nombrar entonces una fuente registrada por su identificador o su dirección. Si el agente nombra una fuente que no encontró, recibe una corrección; si lo vuelve a hacer, el paso falla, de modo que nunca se entrega una fuente inventada.

## El ejemplo Investigación web {#beispiel}
<!-- keywords: investigación web, ejemplo, agente de investigación, respuesta con fuentes, lista de fuentes, consulta, a fondo -->

El ejemplo **Investigación web con fuentes** entre los [flujos de trabajo de ejemplo](/docs/beispiele) responde a una pregunta con fuentes. Al copiarlo, elige uno de tus servicios de búsqueda en **Servicios para las herramientas** o configura uno con **Configurar servicio de búsqueda**; no hay nada preseleccionado. Sin elegir, la copia se crea igualmente, y la comprobación antes de ejecutar te recuerda elegir una conexión en el agente.

El resultado contiene la respuesta, los hallazgos y las contradicciones con identificadores de fuente como `[S1]`, las lagunas, la **lista de fuentes** y el **momento de consulta**. La lista de fuentes y el momento de consulta los escribe Nodestro después del paso a partir de las fuentes registradas, no el modelo. En el agente lo configuras para cada campo de texto en **Fuentes web**: **Cita fuentes web**, **Cita una fuente por afirmación [S1]**, **Lista de fuentes (automática)** o **Momento de consulta (automático)**. Con **Investigación exhaustiva** en el formulario de inicio, el agente busca y lee más (8 búsquedas y 12 páginas en lugar de 3 y 4).

## El texto de las páginas son datos {#sicherheit}
<!-- keywords: seguridad, inyección de prompt, manipulación, contenido externo, no fiable -->

Los resultados de búsqueda y los textos de las páginas proceden de terceros. Nodestro los marca para el modelo como contenido externo que son datos, no instrucciones. Aun así, las páginas pueden contener intentos de manipular al agente, por ejemplo texto oculto que le pide ignorar su tarea o enviar datos a algún sitio. Da a los agentes con herramientas web solo las demás herramientas que necesiten, usa [aprobaciones](/docs/tools#freigabe) para las herramientas que cambian algo y revisa los resultados que se basan en fuentes web antes de actuar en consecuencia.
