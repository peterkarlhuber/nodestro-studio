# Borradores de correo y de webhook

Los agentes pueden **preparar** un correo o los datos de una llamada de webhook, pero no pueden enviarlos. El borrador queda en los archivos de resultado de la ejecución; tú lo revisas y lo envías. Este capítulo explica las dos herramientas de borrador, dónde encuentras sus borradores, cómo compruebas una conexión con un envío de prueba y por qué Nodestro, por ahora, no envía nada por su cuenta.

## Resumen {#ueberblick}
<!-- keywords: borrador, borrador de correo, borrador de webhook, draft_email, draft_webhook, no envía, comunicación, sin conexión -->

Nodestro incluye dos herramientas integradas de la categoría *Comunicación*:

- **Borrador de correo** (`draft_email`) escribe un correo como archivo `.eml`.
- **Borrador de webhook** (`draft_webhook`) escribe los datos JSON de una llamada de webhook como archivo `.json`.

Ambas llevan el distintivo **No envía** en la página [Herramientas](/tools) y en el selector de herramientas del agente. No necesitan Internet ni una conexión, funcionan sin conexión y escriben como máximo **10 borradores por ejecución**. Asígnalas a un agente como cualquier otra herramienta (ver [Asignar herramientas](/docs/agenten#tools)) y dile en su tarea cuándo debe escribir un borrador, por ejemplo «Prepara un recordatorio de pago al cliente para cada factura vencida».

## Borradores de correo {#e-mail}
<!-- keywords: draft_email, eml, destinatarios, para, cc, asunto, html, adjuntos, dirección del remitente, from_address, programa de correo -->

Un borrador de correo contiene los destinatarios (*Para* y *CC*, como máximo 50 en total), un asunto de una línea (como máximo 200 caracteres), el texto y, si se quiere, una versión HTML. De la versión HTML, Nodestro quita scripts, estilos, imágenes, formularios y todo lo demás salvo texto, títulos, listas, tablas y enlaces.

Los **adjuntos** provienen solo de la propia ejecución: de los archivos con los que se inició y de los archivos de resultado que ha escrito hasta ese momento. Un borrador tiene como máximo 10 adjuntos y, con ellos, ocupa como máximo 10 MB.

La **dirección del remitente** la defines en el agente: al asignar la herramienta, las herramientas del agente muestran un área desplegable con el campo *Dirección del remitente*. El modelo no la ve ni la cambia. Si el campo queda vacío, tu programa de correo pone el remitente.

## Borradores de webhook {#webhook}
<!-- keywords: draft_webhook, json, datos, payload, json schema, esquema, payload_schema, comprobación -->

Un borrador de webhook contiene los datos JSON que más adelante irán a un webhook: un objeto o una lista, como máximo 256 KB.

En el área desplegable de la herramienta en el agente puedes guardar un **esquema de los datos** como objeto JSON (JSON Schema). Entonces la herramienta solo escribe datos que se ajustan a él; si no, el agente recibe un error con los lugares que no se ajustan. Nodestro comprueba estas palabras clave: `type`, `properties`, `required`, `additionalProperties`, `items`, `enum`, `const`, `minLength`, `maxLength`, `minimum`, `maximum`, `minItems` y `maxItems`. Un esquema con otras palabras clave se rechaza, para que nunca parezca más estricto de lo que se comprueba.

## Borradores en una ejecución {#im-lauf}
<!-- keywords: archivos de resultado, tarjeta de borrador, descargar, descargar .eml, abrir en el programa de correo, no enviado, vista previa -->

Los borradores aparecen en la vista de detalle de la ejecución, en **Archivos de resultado**, como una tarjeta propia marcada **No enviado** (ver [Archivos de resultado](/docs/dateien#ergebnisdateien)). La tarjeta de un borrador de correo muestra el remitente, los destinatarios, CC, el asunto, si hay una versión HTML, los adjuntos con sus tamaños y el tamaño del mensaje completo. Nodestro no muestra el texto del correo; para leerlo, abre el archivo.

- **Descargar .eml** guarda el borrador.
- **Abrir en el programa de correo** descarga el mismo archivo. Ábrelo con tu programa de correo, por ejemplo con doble clic. Muchos programas lo abren como un mensaje nuevo que puedes revisar, cambiar y enviar; otros lo muestran como un mensaje recibido que puedes reenviar o copiar.

La tarjeta de un borrador de webhook muestra el tamaño y si los datos se comprobaron con un esquema; **Descargar .json** los guarda.

## Envío de prueba de una conexión {#testversand}
<!-- keywords: enviar prueba, envío de prueba, dirección de prueba, test_address, servidor de correo, smtp, webhook, límite, cinco por hora, confirmación, comprobar -->

Si una conexión a un servidor de correo o a un webhook funciona de verdad lo compruebas en *Herramientas → Conexiones* (ver [Conexiones de servicio](/docs/verbindungen#pruefen)). **Comprobar conexión** contacta con el servicio: con un servidor de correo, Nodestro inicia sesión cifrada y la cierra; con un webhook, consulta la dirección sin enviar datos.

**Enviar prueba** va un paso más allá y envía un mensaje de prueba fijo:

- **Servidor de correo:** un breve correo de prueba a la **dirección de prueba** de la conexión y a ninguna otra. Para ello, introduce tu propia dirección como *Dirección de prueba* en la configuración de la conexión.
- **Webhook:** una pequeña llamada de prueba firmada a la dirección del webhook, con el método de la conexión. Cualquier respuesta con un estado 2xx cuenta como éxito.

Antes de enviar nada, un diálogo de confirmación indica exactamente adónde va la prueba. La envías tú mismo, y Nodestro registra cada intento con tu nombre en los cambios de la conexión. Solo los administradores pueden hacer pruebas. Cada conexión permite **como máximo 5 envíos de prueba por hora**, y todas las conexiones juntas como máximo 20 por hora. En un servidor de Nodestro, la comprobación y la prueba solo llegan a un servidor de correo por los puertos 25, 465, 587 y 2525.

## Por qué no se envía nada automáticamente {#kein-versand}
<!-- keywords: sin envío, enviar automáticamente, aprobación por llamada, seguridad, versión posterior, el agente no envía -->

Un correo o una llamada de webhook no se pueden deshacer. Por eso, en esta versión, ningún agente ni ningún flujo de trabajo puede enviar nada por su cuenta: las herramientas de borrador no tienen acceso a la red, y el envío de prueba solo lo puede hacer una persona desde la interfaz, nunca desde una ejecución.

Una versión posterior añadirá el envío desde flujos de trabajo, con una **aprobación para cada llamada**: una persona ve los destinatarios y el contenido y decide antes de que algo salga. Hasta entonces, los borradores son el camino seguro: el agente se encarga de escribir y el envío queda en tus manos.
