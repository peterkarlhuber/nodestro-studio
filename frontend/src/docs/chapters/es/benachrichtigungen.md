# Notificaciones

Nodestro te avisa en la **campana** de la barra superior cuando algo necesita tu atención: una ejecución ha fallado, un paso espera tu aprobación o un agente te ha escrito un mensaje. Las notificaciones se quedan dentro de Nodestro; no se envía nada por correo electrónico.

## Qué genera notificaciones {#ueberblick}
<!-- keywords: notificación, campana, evento, ejecución fallida, aprobación, decisión de presupuesto, control de calidad, ejecución terminada, bandeja de entrada -->

Se crea una notificación con estos eventos de una ejecución:

- **Una ejecución falla**: la ejecución terminó con un error.
- **Un paso espera una aprobación**: un paso de aprobación espera la decisión de una persona.
- **Una ejecución espera una decisión de presupuesto**: el presupuesto de la ejecución se ha agotado y alguien tiene que aumentarlo o terminar la ejecución (consulta [Decisiones de presupuesto durante una ejecución](/docs/workflows#budget-freigabe)).
- **Un control de calidad no se supera**: un resultado no superó su control, por ejemplo el de un juez (consulta [Control de calidad](/docs/agenten#qualitaet)).
- **Una ejecución termina**: cada ejecución terminada, también las correctas.

Además, un agente puede escribirte un mensaje corto con la herramienta **Mensaje para mí** (ver más abajo).

## Reglas por flujo de trabajo {#regeln}
<!-- keywords: reglas de notificación, ajustes del flujo de trabajo, eventos, predeterminado, ejecuciones fallidas, aprobaciones, desactivar -->

Cada flujo de trabajo decide cuáles de sus eventos generan notificaciones. Abre el flujo de trabajo en el editor, haz clic en un lugar vacío del lienzo para que no haya ningún paso seleccionado y busca la sección **Notificaciones** en los ajustes del flujo de trabajo (consulta [Ajustes del flujo de trabajo](/docs/workflows#einstellungen)). Marca los eventos que quieras; las reglas se guardan con el flujo de trabajo, igual que su presupuesto y sus límites.

De forma predeterminada, un flujo de trabajo notifica las **ejecuciones fallidas** y los **pasos que esperan una aprobación**. Los flujos de trabajo guardados antes de que existieran las notificaciones también reciben este valor predeterminado. Desmarca todos los eventos para desactivar las notificaciones de un flujo de trabajo. Notificar cada ejecución terminada es útil para ejecuciones raras e importantes; con ejecuciones frecuentes pronto son muchas.

## A quién se notifica {#empfaenger}
<!-- keywords: destinatarios, miembros, quien inició, acceso, a quién se notifica, persona que inició -->

En la misma sección eliges quién recibe las notificaciones:

- **Todas las personas con acceso**: todas las personas que pueden ver el flujo de trabajo. En la aplicación de escritorio, eres tú.
- **Solo la persona que inició la ejecución**: las demás personas con acceso no reciben notificación.

## La campana {#glocke}
<!-- keywords: campana, sin leer, contador, insignia, marcar como leída, marcar todo como leído, abrir ejecución, cargar más, teclado, escape -->

El número de la campana cuenta tus notificaciones sin leer. Haz clic en la campana (o ponle el foco y pulsa Intro) para abrir la lista, con las más recientes primero. Cada entrada muestra qué pasó, el flujo de trabajo y cuándo. Las entradas sin leer están resaltadas.

- **Abrir ejecución** abre la vista de detalle de la ejecución y marca la entrada como leída (consulta [La vista de detalle](/docs/ausfuehrungen#details)).
- **Marcar como leída** (la marca de verificación) marca una sola entrada; **Marcar todo como leído**, todas.
- **Cargar más** muestra notificaciones más antiguas.
- Escape cierra la lista y vuelve a la campana.

Nodestro lee el número de notificaciones sin leer aproximadamente una vez por minuto mientras la ventana está visible, y la lista completa cada vez que la abres. Los lectores de pantalla anuncian las notificaciones nuevas sin interrumpir.

## Mensajes de agentes {#agenten-nachrichten}
<!-- keywords: notify_user, mensaje para mí, mensaje de agente, herramienta, nivel, título, tres mensajes, texto sin formato, de un agente -->

La herramienta integrada **Mensaje para mí** (`notify_user`) permite que un agente te envíe un mensaje corto con un título, el texto y un nivel (información, éxito, advertencia o error). Asígnala a un agente como cualquier otra herramienta (consulta [Asignar herramientas](/docs/agenten#tools)) y dile al agente en su tarea cuándo usarla, por ejemplo «Envíame un mensaje si encuentras un contrato con un plazo de preaviso inferior a 30 días».

- Un agente puede enviar **como máximo 3 mensajes por ejecución**. Los intentos siguientes se rechazan y el agente lo sabe.
- El mensaje se muestra como **texto sin formato**: sin formato ni enlaces en los que hacer clic. Está marcado claramente como **De un agente**, porque lo escribió un modelo. Trátalo como cualquier otra salida de un modelo.
- La herramienta no envía nada fuera de Nodestro y funciona sin conexión.

## Conservación y privacidad {#aufbewahrung}
<!-- keywords: conservación, 90 días, eliminar, correo electrónico, webhook, privacidad, servidor, bandeja de la plataforma, dentro de nodestro -->

Las notificaciones se conservan **90 días** y después se eliminan, leídas o no.

Nada sale de Nodestro: no hay correo electrónico, ni webhook, ni notificaciones push. Enviar notificaciones a otros lugares está previsto para una versión posterior.

En un servidor de Nodestro conectado a la bandeja de entrada de la plataforma, la campana muestra esa bandeja en lugar de la propia de Nodestro. Sus notificaciones pueden llegar en inglés y con su propia redacción; las reglas por flujo de trabajo se aplican igual.
