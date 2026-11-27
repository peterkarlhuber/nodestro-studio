# Conexiones de servicio

Algunas herramientas integradas acceden a un servicio externo, por ejemplo una búsqueda web, un servidor de correo o un webhook. Lo que necesitan para ello (la dirección, la configuración y un secreto) es una **conexión de servicio**. Este capítulo explica las fichas de las herramientas, cómo configuras una conexión y cómo la usa un agente.

## Fichas de las herramientas {#tool-steckbrief}
<!-- keywords: ficha, tool spec, categoría, red, sin conexión, tipo de conexión, límite de tiempo, límite de llamadas, filtro -->

Cada herramienta integrada tiene una **ficha**: su categoría (*Cálculo*, *Datos*, *Archivos*, *Internet*, *Comunicación*), si necesita Internet, si **funciona sin conexión**, qué tipo de conexión necesita, su límite de tiempo y cuántas veces puede llamarla un agente en una ejecución. La página [Herramientas](/tools) muestra estos datos como distintivos y te permite filtrar las herramientas integradas por ellos.

Una llamada que tarda más que el límite de tiempo termina con un error; cuando una herramienta alcanza su límite de llamadas, el agente recibe un error en las llamadas siguientes y responde con lo que tiene. En el modo sin conexión estricto, las herramientas que necesitan Internet se rechazan antes de empezar. Las herramientas integradas de Nodestro se describen en [Herramientas integradas](/docs/tools#eingebaut).

## Configurar una conexión {#einrichten}
<!-- keywords: conexión, servicio, búsqueda web, smtp, servidor de correo, webhook, configuración, proveedor -->

Gestionas las conexiones en *Herramientas → Conexiones*. **Añadir conexión** pide el tipo (búsqueda web, servidor de correo o webhook), el proveedor cuando el tipo ofrece varios, un nombre y la configuración del tipo, como la dirección del servidor y la dirección del remitente de un servidor de correo. Las direcciones deben usar `https` (en tu propio ordenador se permite `http` hacia un servidor local) y no pueden contener una contraseña; las direcciones internas se rechazan.

Cada conexión muestra los hosts a los que puede acceder, derivados de su configuración, y los agentes que la usan. Solo los administradores pueden añadir, modificar, comprobar o eliminar conexiones; los demás solo las ven. Nodestro registra quién modificó qué conexión, nunca los valores.

Para una búsqueda web, **Configurar servicio de búsqueda** ofrece los servicios de búsqueda con notas honestas sobre clave, costes y límites; consulta [Búsqueda web y lectura de páginas web](/docs/websuche).

Una conexión que los agentes todavía usan no se elimina enseguida: Nodestro nombra los agentes y ofrece **Eliminar de todos modos**. Su comprobación avisa después de la conexión que falta.

## El secreto {#geheimnis}
<!-- keywords: secreto, clave de api, contraseña, clave de firma, almacén, cifrado, sesión -->

Una conexión tiene como máximo un secreto: una clave de API, una contraseña o una clave de firma. Lo defines en los detalles de la conexión después de guardar. El secreto es **de solo escritura**: Nodestro no lo vuelve a mostrar nunca, ni en la interfaz, ni en las exportaciones, ni en los registros. Solo ves **Secreto definido** o **Sin secreto** y dónde se guarda.

Los secretos se guardan cifrados, como los tokens de acceso de los servicios conectados: en el escritorio con una clave del llavero del sistema operativo, en un servidor con la clave del servidor, por separado para cada inquilino. Sin un almacén de claves seguro, el secreto se guarda **solo para esta sesión** y hay que volver a introducirlo tras un reinicio. **Reemplazar secreto** lo sobrescribe y **Quitar secreto** lo borra.

## Comprobar una conexión {#pruefen}
<!-- keywords: comprobar, estado, funciona, la comprobación falló, código de error -->

**Comprobar conexión** prueba la conexión y muestra el resultado: *Funciona*, *La comprobación falló* o *Sin comprobar*, con la hora de la comprobación y, si falla, el código de error. En los servidores de correo y los webhooks, Nodestro contacta con el servicio: inicia sesión cifrada en el servidor de correo y la cierra, o consulta la dirección del webhook, sin enviar nada. **Enviar prueba** envía después, tras tu confirmación, un mensaje de prueba fijo a tu dirección de prueba o al webhook (ver [Envío de prueba de una conexión](/docs/entwuerfe#testversand)). Si cambias la configuración, el proveedor o el secreto, el estado vuelve a *Sin comprobar*. Una conexión que todavía no se ha comprobado con éxito aparece como advertencia en la comprobación previa a una ejecución.

## Usar una conexión en un agente {#zuweisen}
<!-- keywords: agente, inspector, configuración de la herramienta, selección de conexión -->

Cuando asignas una herramienta integrada que necesita una conexión, el inspector del agente muestra debajo de las herramientas una selección con las conexiones del tipo adecuado (ver [Asignar herramientas](/docs/agenten#tools)). Sin una conexión elegida, la comprobación del agente muestra un error. El modelo nunca ve la conexión, su configuración ni su secreto; solo ve la herramienta.

## Archivos de intercambio {#austausch}
<!-- keywords: intercambio, importar, exportar, archivo, nodestro-mcp, nodestro-connection, mover, otro espacio de trabajo, vista previa -->

**Exportar** en *Herramientas → Servicios conectados* y *Herramientas → Conexiones* guarda todos los servicios MCP o todas las conexiones como archivo (`nodestro-mcp/1`, `nodestro-connection/1`); **Importar…** lleva ese archivo a otro espacio de trabajo. Ambas acciones requieren derechos de administración.

- Una importación muestra primero una **vista previa**: cada entrada del archivo, si se puede importar y, si no, por qué. No se guarda nada hasta que haces clic en **Importar**. Una importación guarda todas las entradas o ninguna.
- **Los secretos nunca forman parte del archivo**: ni tokens, ni inicios de sesión, ni contraseñas, ni claves. Una exportación que contendría uno se rechaza e indica el campo de ajustes. Tras una importación, el diálogo lista las entradas cuyo secreto debes introducir de nuevo, cada una con un enlace.
- Los servicios importados quedan desactivados y sin herramientas aprobadas; revisa sus herramientas como en un servicio nuevo. Las conexiones importadas aún no están comprobadas.
- Un archivo de una versión más reciente de Nodestro se rechaza; actualiza Nodestro primero.
