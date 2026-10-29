# Ejecuciones

Cada ejecución de un flujo de trabajo se registra por completo: entrada, resultados, tareas, llamadas a herramientas, razonamiento, memoria, errores, tiempos, tokens y costes. Este capítulo explica las vistas, los estados, la exportación e importación de trazas y cómo interpretar los errores.

## Resumen {#ueberblick}
<!-- keywords: ejecuciones, runs, historial, registro, traza, trace -->

Las ejecuciones se ven en dos lugares:

- **En el editor**, en el *Resumen de la ejecución* debajo del lienzo: la última ejecución de ese flujo, en directo mientras se ejecuta.
- En la página **Ejecuciones**: todas las ejecuciones de todos los flujos, con vista de detalle.

Las ejecuciones se conservan aunque cambies o elimines el flujo de trabajo; cada ejecución guarda el flujo tal como era al iniciarse.

## Ver en directo {#live}
<!-- keywords: en directo, streaming, observar, resumen de la ejecución, progreso, tiempo real -->

Durante una ejecución, el **Resumen de la ejecución** muestra:

- arriba, el número de agentes, solicitudes a la API, tokens y los costes estimados, actualizados continuamente,
- a la izquierda, todos los agentes con su estado; un clic muestra sus detalles a la derecha, y *Resultado global*, el resultado del flujo,
- a la derecha, el texto que está escribiendo el agente seleccionado, sus llamadas a herramientas y (si está activado) su razonamiento.

En el lienzo, cada agente muestra su estado y, tras la ejecución, también tokens y costes. Las conexiones por las que han pasado datos aparecen resaltadas.

## La lista de ejecuciones {#liste}
<!-- keywords: lista, filtro, filtro de estado, filtro de flujo, eliminar, origen -->

La página **Ejecuciones** lista las ejecuciones, de la más reciente a la más antigua, con flujo de trabajo, estado, hora de inicio, duración, solicitudes, tokens y costes. Debajo del nombre del flujo aparece la entrada o el mensaje de error.

- **Filtros:** por flujo de trabajo, por estado y por origen (*Ejecuciones propias* o *Trazas importadas*).
- **Eliminar:** símbolo de la papelera; las ejecuciones en curso no se pueden eliminar.
- **Importar traza:** consulta [Importar trazas](/docs/ausfuehrungen#trace-import).

La lista se actualiza cada cinco segundos.

## La vista de detalle {#details}
<!-- keywords: detalles, vista de detalle, desarrollo, cascada, cronología, pestañas, resultado, tarea, razonamiento -->

Al hacer clic en una ejecución se abre la vista de detalle:

1. **Cifras clave:** estado con duración total, solicitudes a la API, tokens (desglosados en entrada, salida, caché y razonamiento) y costes estimados.
2. **Entrada y resultado** del flujo, uno al lado del otro.
3. **Desarrollo:** una barra de tiempo por agente, en el orden en que empezaron. Cada barra muestra cuándo se ejecutó el agente; las barras superpuestas se ejecutaron en paralelo. Al lado se indican la duración, los tokens y el número de llamadas a herramientas.
4. **Detalles del agente seleccionado:** duración, hora de inicio y fin, tokens, solicitudes y costes, un posible error, el resultado del control de calidad y las pestañas:

| Pestaña | Contenido |
|---|---|
| **Resultado** | La salida del agente, como Markdown o JSON formateado. |
| **Tarea** | La tarea tal como llegó al agente tras sustituir los marcadores. Ideal para encontrar problemas de flujo de datos. |
| **Herramientas** | Cada llamada a herramienta con entrada, resultado, momento, duración y éxito. |
| **Razonamiento** | Las reflexiones del modelo (solo si *Mostrar razonamiento* estaba activado). |
| **Memoria** | Las notas de un agente con memoria *Por ejecución*. |

**Abrir en el editor** lleva al flujo de trabajo; **Cancelar** detiene una ejecución en curso.

La pestaña **Contexto** muestra lo que recibió el agente en esta ejecución: prompt del sistema, tarea con las entradas resaltadas, mensajes de ejemplo, herramientas, conocimiento, memoria, formato de salida y control de calidad, siempre con la configuración del momento de inicio. Las credenciales nunca se muestran.

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
| **Cancelado** | Detenido con *Cancelar*, rechazado, o una traza exportada antes de estar completa. |

Una ejecución fallida o cancelada se puede [continuar](/docs/verzweigungen#fortsetzen). Las ejecuciones de programaciones, lotes, series de pruebas y subflujos muestran su origen en la lista y en los detalles.

## El resultado de una ejecución {#ergebnis}
<!-- keywords: resultado, output, resultado global, salida del flujo, sumidero -->

- Si hay **nodos de resultado**, su contenido es el resultado. Un nodo de resultado con un predecesor adopta su salida; con varios predecesores, un objeto con una entrada por predecesor.
- Si **no** hay nodo de resultado, los agentes sin sucesor cuentan como resultado.
- Con varios nodos de resultado (o últimos agentes), el resultado es un objeto con una entrada por nodo, con el nombre del nodo.

## Cancelar ejecuciones {#abbrechen}
<!-- keywords: cancelar, detener, cancel, terminar -->

**Cancelar** (en el resumen de la ejecución o en la vista de detalle) detiene la ejecución. Los agentes en curso se detienen en el siguiente paso (siguiente fragmento de texto, siguiente solicitud o siguiente llamada a herramienta); los agentes que aún no han empezado ya no se ejecutan. Los tokens consumidos hasta ese momento se cobran y se muestran.

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

Los errores aparecen en la ejecución junto a la ejecución (resumen «Fallido: …») y junto al agente afectado (mensaje en rojo). El mensaje aparece en el idioma de la interfaz y suele indicar el tipo de error. En **Detalles técnicos** está el texto original del servidor o de la API, por ejemplo para incluirlo en un informe de error.

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
