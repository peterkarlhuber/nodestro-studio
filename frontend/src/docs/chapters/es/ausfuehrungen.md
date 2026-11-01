# Ejecuciones

Cada ejecución de un flujo de trabajo se registra por completo: entrada, resultados, tareas, llamadas a herramientas, razonamiento, memoria, errores, tiempos, tokens y costes. Este capítulo explica las vistas, los estados, la exportación e importación de trazas y cómo interpretar los errores.

## Resumen {#ueberblick}
<!-- keywords: ejecuciones, runs, historial, registro, traza, trace -->

Las ejecuciones se ven en dos lugares:

- **En el editor**, en el *Resumen de la ejecución* debajo del lienzo: la última ejecución de ese flujo, en directo mientras se ejecuta.
- En la página **Ejecuciones**: todas las ejecuciones de todos los flujos, con vista de detalle.

Las ejecuciones se conservan aunque cambies o elimines el flujo de trabajo; cada ejecución guarda el flujo tal como era al iniciarse.

## Ver en directo {#live}
<!-- keywords: en directo, streaming, observar, resumen de la ejecución, progreso, tiempo real, te espera, cancelar ejecución -->

Durante una ejecución, el **Resumen de la ejecución** muestra:

- en la cabecera, el estado de la ejecución y **Cancelar ejecución** (consulta [Cancelar ejecuciones](/docs/ausfuehrungen#abbrechen)); al terminar, un enlace a los **Detalles**,
- arriba, el número de agentes, solicitudes a la API, tokens y los costes estimados, actualizados continuamente,
- a la izquierda, todos los agentes con su estado; un clic muestra sus detalles a la derecha, y *Resultado global*, el resultado del flujo,
- a la derecha, el texto que está escribiendo el agente seleccionado, sus llamadas a herramientas y (si está activado) su razonamiento.

Si una [llamada a herramienta](/docs/verzweigungen#tool-freigabe) espera tu decisión, la ejecución, el paso y su nodo muestran **Te espera**: la ejecución solo sigue cuando has decidido. Si la ejecución se detiene por una aprobación, el resumen muestra la aprobación para que decidas; una decisión tomada en otro lugar (la página *Aprobaciones*, otra pestaña, la API) también aparece aquí sin recargar.

Tras la ejecución, el resumen muestra lo mismo que la vista de detalle: por qué falló, llamadas a herramientas sin resultado y pasos que no terminaron (consulta [La vista de detalle](/docs/ausfuehrungen#details)).

En el lienzo, cada agente muestra su estado y, tras la ejecución, también tokens y costes. Las conexiones por las que han pasado datos aparecen resaltadas.

## La lista de ejecuciones {#liste}
<!-- keywords: lista, filtro, filtro de estado, filtro de flujo, eliminar, origen, cargar ejecuciones anteriores, actualizar, terminada con problemas -->

La página **Ejecuciones** lista las ejecuciones, de la más reciente a la más antigua, con flujo de trabajo, estado, hora de inicio, duración, solicitudes, tokens y costes. Debajo del nombre del flujo aparece la entrada o el mensaje de error. Si una ejecución terminada tuvo llamadas a herramientas sin resultado, junto a *Terminado* aparece **Terminada con problemas**, siempre que el servidor envíe este dato.

- **Filtros:** por flujo de trabajo, por estado y por origen (*Ejecuciones propias* o *Trazas importadas*).
- **Eliminar:** símbolo de la papelera; las ejecuciones en curso no se pueden eliminar.
- **Importar traza:** consulta [Importar trazas](/docs/ausfuehrungen#trace-import).
- **Cargar ejecuciones anteriores:** la lista muestra primero las 100 ejecuciones más recientes y lo indica debajo. Los filtros por estado y origen solo buscan en las ejecuciones cargadas. Si el servidor no admite paginación, la lista termina en 500 ejecuciones; las anteriores siguen guardadas y se alcanzan con el filtro por flujo de trabajo.

La lista se actualiza cada cinco segundos mientras una ejecución está en cola o en curso y, si no, cada 30 segundos. En una pestaña en segundo plano no consulta nada; al volver, se actualiza enseguida.

## La vista de detalle {#details}
<!-- keywords: detalles, vista de detalle, desarrollo, cascada, cronología, pestañas, resultado, tarea, razonamiento, falló en, terminada con problemas, llamadas sin resultado, sin terminar, interrumpida, mostrar como json, resultado estructurado, cronología -->

Al hacer clic en una ejecución se abre la vista de detalle:

1. **Cifras clave:** estado con duración total, solicitudes a la API, tokens (desglosados en entrada, salida, caché y razonamiento) y costes estimados.
2. **Resumen de la ejecución:** cuántos pasos salieron bien y cuántos se omitieron, qué camino tomaron las decisiones, cómo se decidieron las aprobaciones, qué herramientas se llamaron y cuántas veces (con errores) y en qué paso falló la ejecución, con *Ir al paso*. Se construye solo con los datos guardados de la ejecución, sin llamar a ningún modelo; lo que la ejecución no registró aparece como *no registrado*.
3. **Avisos sobre el desenlace** (solo cuando hace falta; consulta más abajo).
4. **Entrada y resultado** del flujo, uno al lado del otro.
5. **Cronología:** una barra de tiempo por agente, en el orden en que empezaron; los pasos que nunca empezaron van al final. Cada barra muestra cuándo se ejecutó el agente; las barras superpuestas se ejecutaron en paralelo. Al lado se indican la duración, los tokens y el número de llamadas a herramientas. Primero se abre el paso que falló o, si no, uno que espera a una persona.
6. **Detalles del agente seleccionado:** duración, hora de inicio y fin, tokens, solicitudes y costes, un posible error, el resultado del control de calidad y las pestañas:

| Pestaña | Contenido |
|---|---|
| **Resultado** | La salida del agente: el texto como Markdown y un resultado estructurado como campos con etiqueta (las descripciones breves de los campos sirven de etiqueta). El JSON queda a un clic con **Mostrar como JSON**. |
| **Tarea** | La tarea tal como llegó al agente tras sustituir los marcadores. Ideal para encontrar problemas de flujo de datos. |
| **Herramientas** | Cada llamada a herramienta con entrada, resultado, momento, duración y éxito. |
| **Razonamiento** | Las reflexiones del modelo (solo si *Mostrar razonamiento* estaba activado). |
| **Memoria** | Las notas de un agente con memoria *Por ejecución*. |

**Abrir en el editor** lleva al flujo de trabajo; **Cancelar ejecución** detiene una ejecución en curso.

La pestaña **Contexto** muestra lo que recibió el agente en esta ejecución: prompt del sistema, tarea con las entradas resaltadas, mensajes de ejemplo, herramientas, conocimiento, memoria, formato de salida y control de calidad, siempre con la configuración del momento de inicio. Las credenciales nunca se muestran.

**Avisos sobre el desenlace.** Lo que no fue bien aparece debajo de las cifras clave:

- **Falló en *paso*:** si un paso falló, el mensaje lo nombra con su propio problema en palabras y qué hacer, por ejemplo una respuesta cortada en su límite de tokens o una clave de API rechazada. En los fallos del proveedor se indica también el modelo. Cuando la solución es un ajuste, un enlace lleva allí: **Abrir Ajustes** o **Abrir «Avanzado» de *agente***. Si fallaron más pasos, su número aparece debajo. El texto original está en *Detalles técnicos*.
- **Terminada con problemas:** una ejecución puede estar *Terminado* aunque algunas llamadas a herramientas no tuvieran resultado: rechazadas por una persona, caducadas sin decisión, no permitidas por las reglas de aprobación, canceladas, fallidas o con un error de la herramienta. Entonces aparece junto a *Terminado* la insignia ámbar **Terminada con problemas**, y un aviso enumera cada una de esas llamadas con paso, herramienta y motivo, cada una con *Ir al paso*. Comprueba si el resultado depende de ellas.
- **Sin terminar:** si una ejecución acabó mientras había pasos en curso o en espera (por ejemplo, porque Nodestro se detuvo), esos pasos muestran **Sin terminar** en lugar de *En espera* o *En curso*. El aviso nombra los pasos que nunca obtuvieron resultado o dice que Nodestro se detuvo mientras la ejecución estaba en marcha. Con **Continuar**, en el mismo aviso, los completas; los pasos terminados se reutilizan (consulta [Continuar ejecuciones fallidas](/docs/verzweigungen#fortsetzen)).

## Estado {#status}
<!-- keywords: estado, terminado, error, omitido, cancelado, en espera, en curso, en cola -->

| Estado | Significado |
|---|---|
| **En espera** | El nodo espera a que terminen todos sus predecesores. |
| **En cola** | La ejecución se ha creado y empezará enseguida. |
| **En curso** | Se está ejecutando ahora. |
| **Terminado** | Completado con éxito. |
| **Error** | Ha fallado; el mensaje está en los detalles. Una ejecución pasa a *Error* en cuanto un nodo falla. |
| **Omitido** | El nodo no se ejecutó porque su rama no fue elegida. No es un error. |
| **Bloqueado** | El nodo no se ejecutó porque un predecesor falló o se canceló. |
| **Pendiente de aprobación** | Una [aprobación](/docs/verzweigungen#freigabe) espera la decisión de una persona. |
| **En pausa** | La ejecución espera una aprobación y continúa tras la decisión. |
| **Cancelado** | Detenido con *Cancelar ejecución*, rechazado, o una traza exportada antes de estar completa. |
| **Te espera** | Una llamada a herramienta espera tu aprobación; la ejecución sigue en cuanto decides. |
| **Sin terminar** | Un paso de una ejecución finalizada que nunca terminó (por ejemplo, porque Nodestro se detuvo). |
| **Terminada con problemas** | No es un estado propio, sino una insignia junto a *Terminado*: algunas llamadas a herramientas de la ejecución no tuvieron resultado. |

Una ejecución fallida o cancelada se puede [continuar](/docs/verzweigungen#fortsetzen). Las ejecuciones de programaciones, lotes, series de pruebas y subflujos muestran su origen en la lista y en los detalles.

## El resultado de una ejecución {#ergebnis}
<!-- keywords: resultado, output, resultado global, salida del flujo, sumidero -->

- Si hay **nodos de resultado**, su contenido es el resultado. Un nodo de resultado con un predecesor adopta su salida; con varios predecesores, un objeto con una entrada por predecesor.
- Si **no** hay nodo de resultado, los agentes sin sucesor cuentan como resultado.
- Con varios nodos de resultado (o últimos agentes), el resultado es un objeto con una entrada por nodo, con el nombre del nodo.

## Cancelar ejecuciones {#abbrechen}
<!-- keywords: cancelar, detener, cancel, terminar, cancelar de verdad, confirmar -->

**Cancelar ejecución** (en el resumen de la ejecución o en la vista de detalle) pregunta otra vez por seguridad: un segundo clic en **¿Cancelar de verdad?** en menos de cinco segundos detiene la ejecución; **Esc** o un clic en otro sitio la deja seguir. Esto vale también para una ejecución en pausa. Los agentes en curso se detienen en el siguiente paso (siguiente fragmento de texto, siguiente solicitud o siguiente llamada a herramienta); los agentes que aún no han empezado ya no se ejecutan. Los tokens consumidos hasta ese momento se cobran y se muestran.

## Hablar con el líder de equipo {#teamleitung}
<!-- keywords: líder de equipo, orquestador, chat en vivo, hacer una pregunta, dar una instrucción, dirigir, dirección en vivo, live_steering, presupuesto del chat, run_chat -->

Si una ejecución tiene un **orquestador** (también en una ejecución de equipo anidada), la vista de detalle muestra la pestaña **Líder de equipo** junto a **Resumen**. Las aprobaciones y el estado de la ejecución siguen visibles encima. Si hay varios líderes de equipo, eliges uno; cada uno muestra su flujo de trabajo, su nivel y su estado. Debajo ves lo que está haciendo: decisiones (usadas del máximo), sus equipos con su estado y los especialistas que trabajan ahora.

Eliges de forma explícita lo que escribes:

- **Hacer una pregunta:** un modelo de IA la responde a partir del estado actual de la ejecución. Una pregunta nunca cambia la ejecución. La respuesta se marca como *Respuesta del chat, no una decisión* e indica el estado en el que se basa.
- **Dar una instrucción:** el líder de equipo la tiene en cuenta en su **próxima decisión**. Una decisión que ya se está tomando y los equipos que ya trabajan no se interrumpen ni se cambian; los especialistas en marcha no notan nada hasta la próxima decisión.

Cada instrucción muestra su estado: *Esperando la próxima decisión* (con cuántos equipos trabajan ahora), *En manos del líder de equipo para la decisión N*, *Incluida en la decisión N* con lo que se decidió, o *Ya no se tendrá en cuenta* con el motivo. «Incluida» significa que el líder de equipo conocía la instrucción al tomar esta decisión; si la sigue y cómo, lo decide él mismo dentro de sus límites. Intro envía, Mayús+Intro empieza una línea nueva.

**Costes:** las respuestas a preguntas tienen su propio **presupuesto del chat** por ejecución, separado del presupuesto de la ejecución. Sus costes aparecen en la página [Uso](/docs/nutzung#statistik) bajo **Chat en vivo de ejecuciones**, no en los costes de la ejecución. En el [modo de precios](/docs/nutzung#preismodus) estricto se rechazan las preguntas a modelos sin precio conocido. Las instrucciones no cuestan nada extra; pasan a formar parte de la próxima decisión.

**Permisos y límites:** para leer basta el permiso *Leer*; para enviar necesitas *Ejecutar*. Un mensaje tiene como máximo 2000 caracteres; por ejecución y líder de equipo hay un número máximo de mensajes, instrucciones y preguntas, y un límite de preguntas por minuto. La línea bajo el campo de texto muestra el presupuesto del chat y las preguntas restantes.

**Pausa, reinicio, continuar:** mientras un equipo espera una aprobación, las instrucciones siguen abiertas y valen para la próxima decisión cuando la ejecución continúa. Si un reinicio del servidor hace perder una decisión, la instrucción se entrega de nuevo a la próxima decisión. Cuando la ejecución o el líder de equipo terminan, las instrucciones abiertas se marcan como *Ya no se tendrá en cuenta* y no se trasladan al continuar la ejecución. Tras el final, la conversación solo se puede leer.

**Ejecuciones desatendidas:** en el inspector del orquestador, **Dirección en vivo** fija quién puede dar instrucciones: *Ejecuciones iniciadas por una persona* (predeterminado), *Siempre* (también programación, API, ejecución por lotes y serie de pruebas) o *Desactivada*. Las preguntas no se ven afectadas. Más sobre el orquestador en [Orquestador](/docs/verzweigungen#orchestrator).

## Exportar traza {#trace-export}
<!-- keywords: exportar traza, exportar, json, run json, compartir, archivar, depurar, anonimizar, privacidad, datos personales -->

**Exportar traza** en la vista de detalle guarda una ejecución como archivo JSON: el flujo de trabajo en el momento de inicio, entrada, estado, resultado y, por agente, tarea, resultado, texto, razonamiento, llamadas a herramientas con entradas y salidas, errores, control de calidad, memoria, marcas de tiempo, tokens y coste. El diálogo ofrece dos tipos:

- **Completa:** todo tal como se guardó. Comparte el archivo solo si no contiene nada confidencial.
- **Depurada para compartir:** las claves de API, tokens, contraseñas y claves privadas se sustituyen siempre. Opcionalmente Nodestro también sustituye los **datos personales** (direcciones de correo, números de teléfono, IBAN, números de tarjeta, direcciones IP) y elimina **contenidos** completos (entradas, prompts, salidas, datos de herramientas, memoria); quedan el flujo, los estados, los modelos, los tiempos y los tokens.

Las partes sustituidas reciben marcadores como `[EMAIL_1]`; los valores iguales reciben el mismo marcador. Solo se depura la copia descargada; la ejecución guardada no cambia. La detección funciona con patrones y **no garantiza encontrarlo todo**, por ejemplo nombres o direcciones. Revisa el archivo antes de compartirlo.

Los resultados de herramientas se acortan a 20.000 caracteres por llamada.

## Importar trazas {#trace-import}
<!-- keywords: importar traza, importar, json, abrir, ver, duplicado, restaurar, trace -->

**Importar traza** en la página *Ejecuciones* vuelve a abrir archivos de traza exportados, también varios a la vez y en otro ordenador.

Así funciona la importación:

- La traza aparece como ejecución propia con la marca **Importada** y se abre en la vista de detalle habitual: resultados, agentes, llamadas a herramientas, entradas y salidas, errores, marcas de tiempo, controles de calidad, tokens y costes, en la medida en que la traza los contenga.
- **No se ejecuta nada.** No hay ninguna solicitud a un proveedor de IA ni costes.
- Las trazas importadas se **guardan de forma permanente** y, como cualquier ejecución, se pueden volver a abrir, filtrar, exportar y eliminar.
- **Las ejecuciones existentes nunca se sobrescriben:** cada importación recibe un ID nuevo; el ID original aparece en la vista de detalle.
- **Duplicados:** si la misma ejecución ya existe (el original o una importación anterior del mismo archivo), Nodestro no crea una copia, sino que abre la ejecución existente y lo indica.
- **Trazas incompletas:** si una ejecución se exportó mientras seguía en curso, aparece como *Cancelado* con un aviso.
- **Uso:** las ejecuciones importadas no cuentan para las estadísticas de uso, porque sus costes no se produjeron en esta instalación.
- **Abrir en el editor** no está disponible en las trazas importadas, porque normalmente el flujo correspondiente no existe aquí. El flujo en sí se transfiere con la [exportación del flujo de trabajo](/docs/workflows#import-export).

Los **archivos no válidos** se rechazan con un mensaje claro y no se guarda nada: no es JSON, es una exportación de flujo en lugar de una traza, faltan campos obligatorios o hay valores dañados. Una traza puede ocupar como máximo 50 MB.

## Comparar ejecuciones {#vergleich}
<!-- keywords: comparar, comparación, diferencia, diff, lado a lado, dos ejecuciones -->

Marca dos ejecuciones en la lista de ejecuciones con la casilla al inicio de la fila y haz clic en **Comparar**. La vista de comparación las pone lado a lado:

- **Indicadores:** estado, duración, solicitudes, tokens de entrada y de salida, coste, llamadas a herramientas y agentes fallidos. Las filas distintas se resaltan con la diferencia de A a B.
- **Resultado final:** como comparación por líneas (solo en A, solo en B) o lado a lado.
- **Agentes:** por agente, modelo, estado, duración, tokens, coste, herramientas, errores y evaluación. Las insignias indican qué es distinto; las salidas y los comentarios de la evaluación se pueden comparar directamente.

Solo se comparan datos guardados; no se vuelve a ejecutar nada. Si las ejecuciones pertenecen al mismo flujo de trabajo, los agentes se emparejan por su nodo; si no, por su nombre. Si el flujo de trabajo cambió entre las ejecuciones, la vista lo indica. También se pueden comparar trazas importadas.

## Interpretar errores {#fehler}
<!-- keywords: errores, mensaje de error, error, interpretar, causa, solución, refusalerror, budgetexceedederror -->

Los errores aparecen en los detalles junto a la ejecución («Falló en *paso*» con el problema de ese paso) y junto al agente afectado (mensaje en rojo). El mensaje aparece en el idioma de la interfaz, dice con palabras qué pasó y qué puedes hacer, por ejemplo subir *Máx. tokens* en «Avanzado» o revisar la clave en *Ajustes → Proveedores de IA*. Los fallos del proveedor distinguen una clave rechazada, demasiadas solicitudes (límite de frecuencia), un proveedor saturado y uno inaccesible. En **Detalles técnicos** está el texto original del servidor o de la API con el tipo de error, por ejemplo para incluirlo en un informe de error.

| Mensaje | Significado | Solución |
|---|---|---|
| `BudgetExceededError` | Se ha agotado el presupuesto de la ejecución. | Aumenta el presupuesto en el flujo o en los ajustes, o elige modelos más económicos. |
| `RefusalError` | El modelo ha rechazado la solicitud. | Reformula la tarea, define modelos de respaldo o elige *Aceptar igualmente el texto de la respuesta*. |
| `MaxToolRoundsError` | Más rondas de herramientas de las permitidas. | Aumenta *Máx. rondas de herramientas* o precisa la tarea. |
| `IncompleteResponseError` | La respuesta alcanzó *Máx. tokens* o la ventana de contexto. | Aumenta *Máx. tokens*, reduce el conocimiento. |
| `ToolExecutionError` | Una herramienta falló de forma imprevista y *Devolver al modelo los errores de herramientas* estaba desactivado. | Prueba la herramienta en *Probar* y activa la opción. |
| *El proveedor de IA informó de un error …* | El proveedor informó de un error (por ejemplo clave no válida, sobrecarga, id de modelo desconocido, opciones de solicitud no válidas). | Comprueba la clave y el id del modelo, inténtalo más tarde, revisa las opciones de solicitud. |
| *Omitido porque un nodo anterior no tuvo éxito.* | Consecuencia de un error anterior. | Corrige el primer agente que falló. |
| *La ejecución se ha cancelado.* | Alguien eligió *Cancelar*. | – |

Más mensajes y soluciones en [Errores frecuentes](/docs/faq#haeufige-fehler).
