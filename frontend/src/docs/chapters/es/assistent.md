# Nodestro Assistant

Nodestro Assistant es un chat que te ayuda en cualquier parte de Nodestro. Responde preguntas sobre el uso a partir de esta documentación, comenta los flujos, agentes, herramientas, memoria, conocimiento y ejecuciones que le muestras expresamente y, si lo pides, prepara un traspaso al arquitecto de flujos, al diseño de agentes o a la creación de herramientas. Nunca cambia nada por su cuenta.

## Resumen {#ueberblick}
<!-- keywords: assistant, asistente, chat, abrir, panel, barra lateral, atajo, ctrl j, ancho, ayuda -->

Abre el asistente con **Assistant** arriba a la derecha de la cabecera o con **Ctrl+J** (macOS: **⌘J**). Aparece como un panel a la derecha; el mismo botón o **Cerrar** lo oculta de nuevo. **Más ancho** da más espacio al chat; en pantallas pequeñas se coloca sobre la página.

El chat se mantiene mientras cambias de página, e incluso después de recargar. Las respuestas aparecen en directo; el Markdown con listas, tablas y bloques de código se formatea. Mientras se escribe una respuesta, ves lo que el asistente hace realmente: buscar en la documentación, leer secciones, procesar adjuntos, escribir la respuesta o preparar un traspaso.

El asistente usa el **modelo de los asistentes** de los [ajustes](/docs/einstellungen#modelle) y el acceso a su proveedor. Si ese proveedor no está configurado, puedes abrir el chat, pero no enviar preguntas.

## Preguntas sobre la documentación {#fragen}
<!-- keywords: pregunta, documentación, fuentes, cita, enlace, inventado, no documentado, cómo -->

El asistente responde preguntas como «¿Cómo pruebo mi agente?» o «¿Qué diferencia hay entre conocimiento y memoria?» a partir de esta documentación integrada. Busca las secciones adecuadas, las lee y las enlaza en la respuesta. Debajo de la respuesta aparecen las secciones leídas como **Fuentes**; un clic las abre.

La documentación es su única fuente de conocimiento sobre Nodestro. Si no encuentra algo en ella, lo dice expresamente en lugar de inventar una función. El conocimiento general, por ejemplo sobre cómo escribir prompts, lo marca como tal.

## Adjuntar objetos {#anhaenge}
<!-- keywords: adjuntar, adjunto, contexto, clip, comentar, flujo, agente, herramienta, memoria, conocimiento, ejecución, traza -->

Para que el asistente pueda comentar un objeto concreto, lo adjuntas. Hay dos formas:

- **Comentar con el asistente** en la propia vista: en el editor de flujos, en el inspector del agente, en la biblioteca de agentes, en una herramienta, en una ejecución, en un espacio de memoria y en un archivo de conocimiento.
- El **clip** del campo de entrada abre una selección con todos los flujos, plantillas de agentes, herramientas, espacios de memoria, archivos de conocimiento y ejecuciones.

Lo que recibe el asistente depende del tipo:

| Tipo | Contenido |
| --- | --- |
| Flujo | agentes, conexiones, orden de ejecución, ajustes y el resultado de la [comprobación previa](/docs/workflows#pruefung) |
| Agente | la configuración completa con herramientas, conocimiento y avisos de configuración |
| Herramienta | código, pruebas, esquema de entrada, bibliotecas de Python con sus aprobaciones y dónde se usa |
| Memoria | la lista de archivos; el contenido solo de los archivos que seleccionas expresamente |
| Conocimiento | nombre, descripción y tipo; el texto solo si activas **Enviar contenido** |
| Ejecución | estado, entrada, resultados, errores, llamadas a herramientas, tokens y coste de cada agente |

Puedes adjuntar varios objetos a la vez y quitar cada uno con **×**. Un adjunto sigue activo hasta que lo quitas y se envía con cada mensaje siguiente. Los adjuntos están siempre visibles encima del campo de entrada.

## Sugerencias de contexto {#vorschlaege}
<!-- keywords: sugerencia, sugerido, flujo actual, automático, confirmar, ignorar -->

Con el asistente abierto, se sugiere como contexto el objeto de la vista actual, por ejemplo el flujo del editor o la ejecución abierta. Las sugerencias tienen un borde discontinuo y la marca **Sugerencia**; los objetos adjuntos tienen un borde continuo.

Una sugerencia no se envía. Solo **Añadir** la convierte en adjunto; **Ignorar** la oculta en este chat. Las sugerencias salen de la vista que tienes abierta, sin ninguna llamada a la IA.

## Versiones y cambios sin guardar {#versionen}
<!-- keywords: versión, borrador, sin guardar, guardado, modificado, actualizar contexto, desactualizado, eliminado -->

Al adjuntar un objeto, Nodestro registra su estado. Cada mensaje recuerda exactamente los estados con los que se envió; los ves debajo de tu mensaje como **Enviado con**. Un clic muestra lo que el asistente recibió realmente.

Si un objeto adjunto cambia después, el adjunto se marca como **modificado**. **Actualizar contexto** usa el nuevo estado para los mensajes siguientes. Los mensajes y respuestas anteriores no cambian y conservan su estado de entonces. Si se elimina un objeto, el adjunto indica **ya no existe**; el chat sigue funcionando.

Si el flujo del editor tiene cambios sin guardar, decides tú: **Versión guardada** envía el último estado guardado, **Borrador sin guardar** el estado actual del editor. Un borrador aparece en el chat como **Borrador**. Si sigues editando después, también se marca como modificado.

## Análisis {#analyse}
<!-- keywords: análisis, mejorar, revisar, encontrar errores, optimizar, reducir coste, ejecutado, probado -->

Con objetos adjuntos, el asistente puede por ejemplo buscar puntos débiles en un flujo, mejorar un prompt de sistema, explicar por qué falló una ejecución o señalar pruebas que faltan en una herramienta.

Solo trabaja con los datos que adjuntaste. No ejecuta ni prueba nada, y tampoco lo afirma. Si una mejora funciona lo compruebas tú, por ejemplo con la [prueba de agente](/docs/agenten#agent-testen) o una ejecución nueva.

## Traspaso a otras funciones {#uebergabe}
<!-- keywords: traspaso, aplicar, arquitecto, implementar, crear agente, crear herramienta, aplicar propuesta -->

Si pides expresamente que se aplique una mejora, el asistente prepara un traspaso. Aparece como una tarjeta en la respuesta. El botón de la tarjeta abre la función existente adecuada, ya rellenada con la descripción:

- **[Arquitecto de flujos](/docs/ki-architekt)**: revisar un flujo adjunto o diseñar uno nuevo.
- **[Diseño de agentes](/docs/agenten#ki-entwurf)**: describir un agente nuevo para un flujo adjunto.
- **Creación de herramientas** en *Herramientas → Crear con IA*: dejar que el agente programador escriba una herramienta nueva.

Allí no empieza nada hasta que lo inicias, y revisas el resultado como siempre antes de que cambie algo. El asistente no modifica flujos, no ejecuta herramientas y no aplica nada sin tu confirmación.

## Gestionar chats {#verlauf}
<!-- keywords: historial, chats, conversación, nuevo chat, renombrar, eliminar, título, continuar -->

**Nuevo chat** empieza una conversación nueva; **Historial** muestra todas las anteriores. Allí abres un chat para continuarlo, lo renombras o lo eliminas. Nodestro crea el título a partir de tu primera pregunta, sin llamada a la IA.

Los chats se guardan localmente en la base de datos de Nodestro y forman parte de la [copia de seguridad y restauración](/docs/einstellungen#backup). Nunca se traducen; un chat queda en el idioma en que se escribió.

## Privacidad y seguridad {#datenschutz}
<!-- keywords: privacidad, seguridad, clave de api, secreto, contraseña, enmascarado, enviado, prompt injection, instrucciones -->

Al modelo solo llega lo que escribes, lo que adjuntaste y las secciones de la documentación que lee el asistente. El objeto que tienes abierto nunca se envía automáticamente.

Las claves de API, contraseñas, tokens y valores similares se reemplazan por marcadores antes del envío, también tu clave de API guardada. Un aviso en el adjunto indica cuándo se reemplazó algo. Para ver exactamente lo que se envió, haz clic en un adjunto o en **Enviado con**.

Los objetos muy grandes se acortan; el adjunto se marca entonces como **parcial**, y el asistente sabe que solo vio una parte. Las instrucciones dentro del contenido adjunto, por ejemplo en un archivo de conocimiento o en la salida de una herramienta, el asistente las trata como datos, no como instrucciones para sí mismo.

## Coste {#kosten}
<!-- keywords: coste, costo, tokens, uso, precio, coste del chat, facturado -->

Cada respuesta es una o varias solicitudes al modelo. Debajo de cada respuesta ves sus tokens y su coste estimado, y la cabecera del chat muestra el total del chat. En la [página de uso](/docs/nutzung) todas las solicitudes aparecen bajo el origen **Nodestro Assistant**, cada una exactamente una vez.

En una respuesta cancelada ya se ha generado parte del coste; se estima y se marca como **estimado**.

## Cancelar y errores {#fehler}
<!-- keywords: cancelar, detener, error, reintentar, repetir, clave no válida, modelo no disponible, conexión -->

**Detener** cancela una respuesta en curso; lo escrito hasta entonces se queda. Si una respuesta falla, el asistente indica el motivo, por ejemplo una clave de API ausente o no válida, un modelo no disponible, una conexión interrumpida o demasiado contexto. **Reintentar** repite la última respuesta.

El chat nunca se pierde. Si Nodestro se detiene mientras se escribe una respuesta, tras reiniciar la respuesta aparece como interrumpida.

## Idioma {#sprache}
<!-- keywords: idioma, español, inglés, idioma de la respuesta, traducir -->

El asistente responde en el idioma de la interfaz (consulta [Idioma](/docs/einstellungen#sprache)), salvo que le pidas expresamente otro. Lee la documentación en ese mismo idioma. Los identificadores técnicos, como nombres de herramientas, nombres de campos y código, quedan en inglés.
