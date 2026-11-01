# Solución de problemas y preguntas frecuentes

Aquí encontrarás soluciones para los mensajes más habituales y respuestas a preguntas típicas.

## Errores frecuentes {#haeufige-fehler}
<!-- keywords: errores, problema, solución, mensaje, troubleshooting, no funciona -->

| Mensaje o síntoma | Causa | Solución |
|---|---|---|
| «No hay clave de API para …» | El proveedor del modelo no está configurado. | Introduce la clave en *Ajustes → Proveedores de IA* o define la variable de entorno del proveedor, por ejemplo `ANTHROPIC_API_KEY`. |
| «Iniciar flujo de trabajo» está bloqueado | Hay problemas en el flujo, hay una ejecución activa o, en un servidor, a tu rol le falta el permiso. | El motivo aparece justo al lado del botón; **Mostrar** te lleva al problema. Todos los problemas aparecen en el inspector cuando no hay nada seleccionado. |
| «El flujo de trabajo contiene un ciclo …» | Una conexión vuelve hacia atrás. | Elimina la conexión que vuelve hacia atrás. |
| «Herramientas desconocidas: …» | Una herramienta asignada se eliminó o falta tras una importación. | Quita la herramienta en el inspector o vuelve a crearla en la biblioteca de herramientas. |
| «… no permite forzar una herramienta …» | El modelo no admite herramientas forzadas. | Pon tool choice en *Automático*. |
| «Con … no se puede desactivar el razonamiento» | El modelo no admite razonamiento *Desactivado*. | Pon el razonamiento en *Valor del modelo* y reduce el esfuerzo. |
| «'Solo entre llamadas a herramientas' solo lo admite …» | Solo Sonnet 5.5 hasta esfuerzo *Alto* lo admite. | Ajusta el modelo o el esfuerzo. |
| «Esta forma de mostrar el razonamiento no encaja con el ajuste de razonamiento» | *Mostrar razonamiento* no encaja con razonamiento *Desactivado* ni con *Solo entre llamadas a herramientas*. | Cambia uno de los dos ajustes. |
| «Nombre de campo no válido …» | Un nombre de campo del formato de salida contiene caracteres especiales o empieza por una cifra. | Usa solo letras, cifras y `_`. |
| «Las citas no se pueden combinar con un formato de salida estructurado» | Ambas opciones están activadas. | Desactiva una de ellas. |
| «Los mensajes de ejemplo deben …» | Los ejemplos no se alternan correctamente. | Empieza con el usuario, alterna y termina con el asistente. |
| «La memoria permanente necesita un espacio de memoria» | Memoria *Permanente* sin espacio. | Elige o crea un espacio. |
| Errores de Docker en herramientas | Docker está elegido, pero no se está ejecutando. | Inicia Docker o elige el sandbox *Proceso de Python*. |
| Un agente se ha *omitido* | Un predecesor falló. | Mira el primer agente en rojo del desarrollo y corrígelo. |
| El resultado contiene «{{Nombre}}» literalmente | El marcador no coincide con ningún predecesor directo (por ejemplo, tras renombrar). | Vuelve a insertar el marcador con los botones bajo la tarea. |
| Importar traza: «Esto es un flujo de trabajo exportado …» | El archivo es una exportación de flujo de trabajo. | Ábrelo en *Flujos de trabajo → Importar*. |

Los mensajes aparecen en el idioma de la interfaz; **Detalles técnicos** muestra el texto original del servidor. Los errores que solo surgen durante una ejecución se explican en [Interpretar errores](/docs/ausfuehrungen#fehler).

## Preguntas frecuentes {#fragen}
<!-- keywords: faq, preguntas, respuestas, cómo puedo, por qué -->

**¿Editar flujos de trabajo cuesta algo?**
No. Solo hay costes en las ejecuciones y con los asistentes de IA (diseñar agentes, crear herramientas, proponer memoria). La comprobación del editor, la búsqueda de conocimiento y *Probar* herramientas son gratuitas.

**¿Por qué la estimación de costes difiere de mi factura?**
Nodestro calcula con precios de lista. No tiene en cuenta descuentos, impuestos, otras plataformas ni condiciones especiales.

**¿Puede un agente ver el resultado de un agente que no esté justo antes que él?**
No, solo los de sus predecesores directos. Conéctalo también con el agente que quieras; la entrada original siempre está disponible con `{{run.input}}`.

**¿Puedo ramificar un flujo según el resultado?**
Sí, con una [decisión](/docs/verzweigungen#entscheidung): comprueba el resultado con reglas fijas y abre la rama que corresponde. No hay bucles.

**¿Cómo paso un flujo de trabajo a otro ordenador?**
Con *Exportar* e *Importar*. Los archivos de conocimiento, los espacios de memoria y las herramientas propias tienes que crearlos allí por separado.

**¿Cómo le enseño una ejecución a otra persona?**
Con *Exportar traza*. La otra persona abre el archivo en *Ejecuciones → Importar traza*, sin volver a ejecutar el flujo.

**¿Se guarda mi clave de API en la exportación del flujo o en la traza?**
No. Las claves solo están en variables de entorno o en la base de datos local y no van ni a exportaciones ni a copias de seguridad.

**¿Por qué un agente no ve un archivo de conocimiento?**
Comprueba si lo tiene asignado en el inspector y qué modo está elegido. Las imágenes y los PDF escaneados no se encuentran en el modo *Búsqueda*.

**¿Qué pasa con las ejecuciones en curso si cierro Nodestro?**
Se cancelan. Lo que se haya guardado hasta entonces se conserva como ejecución.

**¿Cambiar el idioma modifica mis agentes?**
No. El idioma solo cambia la interfaz. Los agentes, los prompts y los resultados no cambian, y los agentes siguen respondiendo en el idioma de su prompt. Consulta [Idioma](/docs/einstellungen#sprache).

**¿Puedo usar Claude a través de Amazon Bedrock en lugar de una clave de Anthropic?**
Sí, con el proveedor *Amazon Bedrock (AWS)*: en lugar de una clave usa tu cuenta de AWS, la región y los permisos de IAM, y AWS lo factura por región. Las opciones exclusivas de Anthropic (pensamiento, ajustes de caché de prompts, modelos de respaldo, herramientas de servidor) no están disponibles allí. Consulta [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).
