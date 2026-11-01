# Ramas y aprobaciones

Un flujo de trabajo puede ser más que una cadena fija de agentes: una **decisión** elige un camino según reglas fijas, una **aprobación** detiene la ejecución hasta que una persona aprueba o rechaza, y un **subflujo** ejecuta otro flujo de trabajo como un solo paso. Además hay **formularios de entrada** para entradas estructuradas y la opción de **continuar** ejecuciones fallidas. Todo funciona con el mismo motor que cualquier otro flujo de trabajo.

## Decisiones {#entscheidung}
<!-- keywords: decisión, rama, condición, if, router, desvío, regla, enrutamiento -->

Una **decisión** (paleta, grupo *Controlar el flujo*) comprueba un resultado con reglas fijas y abre las ramas que corresponden. **No hace ninguna petición a la IA** y no cuesta nada; el resultado siempre se puede rastrear.

- Cada regla es una **rama** con su propia salida a la derecha del nodo. Siempre existe además la rama **Si no**, que se toma cuando no se cumple ninguna regla.
- Arrastra las conexiones desde el punto de cada rama hasta el siguiente agente. No se puede conectar desde el propio nodo; en ese caso el editor te pide que elijas una rama.
- **Resultado comprobado:** vacío significa el resultado que llega por la conexión de entrada. Si llegan varios, elige uno. También se pueden comprobar los valores de un [formulario de entrada](/docs/verzweigungen#eingabeformular).
- Los agentes de las ramas no elegidas se **omiten**. No es un error; la ejecución puede terminar igualmente como *Terminado*.

En la ejecución, la decisión muestra qué reglas se cumplieron, qué valor se comprobó y, en su caso, por qué se tomó *Si no*.

## Reglas {#regeln}
<!-- keywords: regla, operador, comparación, igual, contiene, mayor, menor, vacío, campo, json, modo -->

Una regla compara un **campo** del resultado con un **valor**. El campo es una ruta dentro de una salida estructurada, por ejemplo `category` o `customer.tier`; vacío significa el resultado completo. Un texto que contiene JSON (también en un bloque de código) se lee como datos.

| Comparación | Significado |
|---|---|
| es igual a, es distinto de | texto, número o sí/no; mayúsculas y minúsculas solo si lo pides |
| contiene, no contiene, empieza por, termina en | texto |
| mayor que, mayor o igual que, menor que, menor o igual que | números o fechas (AAAA-MM-DD) |
| es verdadero, es falso | sí/no (también «sí», «yes», «true», «1») |
| es uno de, no es ninguno de | una lista, valores separados por comas |
| está vacío, no está vacío | valores ausentes o vacíos, o listas vacías |

- **Modo:** *Primera regla que se cumple* abre exactamente una rama (el orden importa). *Todas las reglas que se cumplen* abre cada rama que se cumple; entonces se ejecutan en paralelo.
- **Datos no válidos:** si falta el campo o el tipo no encaja (por ejemplo «mayor que» sobre un texto), la decisión toma la rama *Si no* o falla, según la configuración.

Para que las reglas funcionen de forma fiable, da al agente anterior una [salida estructurada](/docs/agenten#ausgabeformat) con campos fijos.

## Unir ramas {#zusammenfuehren}
<!-- keywords: unir, merge, combinar ramas, omitido, bloqueado -->

Un nodo espera hasta que todos sus predecesores han terminado. **Se ejecuta** en cuanto al menos una conexión de entrada aporta datos, se **omite** si ninguna lo hace y queda **bloqueado** si un predecesor ha fallado.

Por eso unir ramas no requiere ninguna configuración: un agente situado detrás de ambas ramas de una decisión se ejecuta con lo que llegue. El marcador de posición de una rama que no se ejecutó vale «-». La [comprobación antes de iniciar](/docs/workflows#pruefung) señala estos puntos.

Las decisiones y las aprobaciones dejan pasar los datos: un agente detrás de ellas recibe los resultados que llegaron allí, con los nombres de los agentes que los produjeron.

## Bucles {#schleifen}
<!-- keywords: bucle, loop, repetir, ronda, iteración, bucle de calidad, revisar, feedback, límite -->

Un **bucle** vuelve a ejecutar pasos hasta que un resultado encaja, por ejemplo *Borrador → Revisión → Decisión*: si la revisión no se supera, la ejecución vuelve al borrador.

- **Crearlo:** arrastra una conexión desde una **rama** de una decisión o aprobación hacia un paso anterior. Nodestro la crea como bucle (discontinua, con «↻ máx. 3×») y la abre en el inspector. No es posible volver desde un agente: cada ronda termina con una decisión o aprobación.
- **Límite:** *Rondas como máximo* (de 2 a 20) incluye la primera ejecución. Cada ronda vuelve a consumir tokens; el [presupuesto](/docs/workflows#budget) se aplica a toda la ejecución.
- **Al alcanzar el límite:** la ejecución termina como fallida («El bucle … se ejecutó … veces sin alcanzar su objetivo») o sigue las otras ramas de la decisión. Si no se sigue ninguna, los pasos posteriores se omiten.
- **Marcadores:** en la tarea de un paso del bucle, `{{iteration}}` es la ronda (desde 1), `{{previous}}` su propio resultado de la ronda anterior y `{{feedback}}` lo que volvió por el bucle (por ejemplo, la justificación de la revisión o el comentario de una aprobación rechazada). En la primera ronda ambos valen «-».
- **Aprobaciones en bucles:** una aprobación rechazada puede volver a una revisión por su rama *Rechazado*; la siguiente ronda vuelve a esperar una decisión.

Durante una ejecución, cada paso muestra su **ronda**; en los detalles eliges entre los resultados de todas las rondas. Los bucles pueden anidarse, pero no solaparse. Al [continuar](#fortsetzen) una ejecución fallida, un bucle siempre se repite por completo.

## Aprobaciones {#freigabe}
<!-- keywords: aprobación, visto bueno, human in the loop, revisar, rechazar, comentario, pausa -->

Una **aprobación** detiene la ejecución hasta que una persona **aprueba** o **rechaza** los resultados. Nunca se aprueba nada automáticamente, tampoco en programaciones, ejecuciones por lotes o series de pruebas.

- **Indicación para quien revisa:** en qué debe fijarse.
- **Resultados mostrados:** qué resultados ve esa persona; sin selección, todo lo que llega.
- **Comentario:** opcional u obligatorio al rechazar. Los agentes posteriores lo leen con el nombre de la aprobación; los nodos de resultado, los archivos de resultado y las decisiones no lo reciben. Queda guardado con la aprobación en la ejecución.
- **Al rechazar:** seguir la rama **Rechazado** o terminar la ejecución. Si no hay nada conectado a *Rechazado*, ese camino simplemente termina.

Mientras espera, la ejecución tiene el estado **En pausa** y la aprobación **Pendiente de aprobación**. Puedes decidir en el resumen de ejecución del editor, en la vista de detalle de la ejecución o en la página **Aprobaciones**. Después la ejecución continúa donde se detuvo. Las aprobaciones abiertas sobreviven a un reinicio de Nodestro.

## La página Aprobaciones {#freigaben-seite}
<!-- keywords: aprobaciones, aprobaciones abiertas, cola, decidir, navegación, contador -->

La página **Aprobaciones** (navegación, grupo *Automatización*) lista todas las aprobaciones abiertas, la más antigua primero, con flujo de trabajo, origen (manual, programación, lote, serie de pruebas) y tiempo de espera. El número junto a la entrada del menú indica cuántas esperan.

Cada tarjeta muestra la indicación, los resultados que revisar, un campo de comentario y los botones *Aprobar* y *Rechazar*. Las aprobaciones dentro de subflujos también aparecen aquí, con la ruta hasta la ejecución principal.

## Aprobar llamadas a herramientas {#tool-freigabe}
<!-- keywords: aprobación de herramienta, llamada a herramienta, por llamada, argumentos, plazo, aprobación previa, desatendida, excepción heredada -->

Además de los nodos de aprobación, Nodestro puede preguntar antes de **llamadas sueltas a herramientas** de un agente. Está pensado para herramientas que modifican datos o actúan hacia fuera, por ejemplo enviar un correo o escribir en un sistema de tickets. La administración lo activa tras la revisión de seguridad; hasta entonces no cambia nada.

Cuando un agente quiere hacer una llamada así, la ejecución sigue en marcha pero espera en esa llamada. La tarjeta aparece en la ejecución, en el paso y en la página **Aprobaciones**. Muestra la herramienta, lo que puede hacer (*solo lee*, *modifica datos*, *borra o destruye*; *se queda en Nodestro* o *actúa hacia fuera*), los **argumentos exactamente como se enviarán** y el tiempo restante.

- **Permitir esta llamada** deja pasar exactamente esta llamada. Una decisión solo vale para los argumentos y la versión de la herramienta que viste: si alguno cambió, Nodestro rechaza la decisión y muestra la llamada actual.
- **Rechazar** impide la llamada; el agente sabe que fue rechazada y puede seguir sin ella.
- **Sin decisión** dentro del plazo (15 minutos por defecto), la llamada cuenta como rechazada, también tras un reinicio. Una decisión rechazada o caducada nunca se reutiliza.
- Una herramienta **sin clasificar** cuenta como modificadora y externa.
- Para las herramientas de **servicios conectados** que modifican datos se pregunta en cada llamada.

Las ejecuciones que nadie supervisa (programaciones, lotes, series de pruebas) no pueden preguntar. Allí esa llamada se deniega, salvo que la administración haya **aprobado de antemano** esa versión de la herramienta para esa programación o lote concretos. Las herramientas que borran o destruyen y las de servicios conectados nunca se pueden aprobar de antemano.

**Aviso antes del inicio.** Mientras las aprobaciones están activas, el diálogo de programación, el inicio de lotes y series de pruebas y la comprobación antes de publicar una API muestran cada llamada a herramientas que esa ejecución rechazaría: qué agente y qué herramienta, por qué (sin aprobación previa o con una caducada, un lote que aún no existe, una API publicada, una herramienta que borra o destruye, una herramienta de un servicio conectado) y cómo solucionarlo. Es solo un aviso: nada se aprueba automáticamente y la llamada se sigue rechazando durante la ejecución. Una aprobación previa nombra una programación guardada o un lote o serie de pruebas ya iniciado, así que las llamadas anteriores se rechazan; inicia un lote a mano si cada llamada importa. Las API publicadas aún no tienen un paso de aprobación propio, así que sus llamadas que cambian datos siempre se rechazan. El aviso no ve las herramientas que un orquestador limita o elige durante la ejecución, ni las aprobaciones dadas o revocadas después de la comprobación.

**Activación, en este orden:**

1. En *Aprobaciones → Reglas para llamadas a herramientas*, la administración ejecuta **Marcar asignaciones existentes**. Cada asignación de herramienta que existe ahora en flujos de trabajo, sus versiones y API publicadas pasa a ser una **excepción heredada**, ligada a la versión de la herramienta con la que se ejecuta. Las API publicadas reciben una sola vez una nueva suma de comprobación (digest); su historial guarda la antigua y la nueva. El paso se ejecuta **una sola vez**: las asignaciones, flujos de trabajo y versiones creados después son nuevos y se preguntan.
2. **Revisa la lista.** Una excepción no deseada termina cuando quitas la herramienta del agente y guardas; si la vuelves a asignar, se pregunta como una nueva.
3. Solo entonces la administración activa las aprobaciones (`NODESTRO_TOOL_APPROVALS=1` y reiniciar Nodestro).

Si se activan sin el primer paso, nada queda exento: se pregunta por cada asignación y las ejecuciones desatendidas deniegan esas llamadas. Una nueva versión de la herramienta siempre termina una excepción. Una aprobación nunca levanta los límites del sandbox.

**No cubierto:** las herramientas de servidor del proveedor (búsqueda web, obtención web y ejecución de código en Anthropic) se ejecutan en el proveedor y no se pueden detener por llamada; desactívalas en el agente donde no deban usarse. Las herramientas propias de Nodestro para la ejecución (memoria, archivos de la ejecución) tampoco se preguntan. Las API publicadas no preguntan a nadie: tendrán más adelante su propia fase de aprobación.

En **Aprobaciones → Reglas para llamadas a herramientas** ves si las aprobaciones están activadas y qué excepciones heredadas existen. La administración también ejecuta allí el paso de activación, concede y revoca aprobaciones previas y consulta el registro: quién decidió, concedió o revocó qué, y cada decisión rechazada. Los argumentos de una llamada nunca aparecen en el registro.

En los detalles de la ejecución, cada llamada a herramienta muestra qué hicieron las reglas: permitida, aprobada o rechazada (por quién y cuándo), sin decisión a tiempo o denegada sin preguntar, con el motivo.

## Subflujos {#unterworkflow}
<!-- keywords: subflujo, sub-workflow, anidar, reutilizar, bloque, versión, ejecución hija -->

Un **subflujo** ejecuta otro flujo de trabajo guardado como un solo paso. Su resultado llega como el de un agente.

- **Versión:** *Versión más reciente* usa el estado actual; una versión fija no cambia aunque el otro flujo se edite más tarde. La comprobación avisa cuando existe una versión más nueva.
- **Entrada:** lo que recibe el subflujo como entrada; `{{input}}` es lo que llega aquí.
- **Valores para su formulario de entrada:** texto o marcadores como `{{form.cliente}}` o `{{Análisis}}`. La comprobación avisa de campos obligatorios sin valor.
- El subflujo se ejecuta como **ejecución propia y vinculada**; un enlace en los detalles lleva a ella. Costes y tokens cuentan una sola vez, en el presupuesto de la ejecución principal. Si el subflujo tiene presupuesto propio, se aplica además ese límite más estrecho.
- Un flujo no puede llamarse a sí mismo, tampoco de forma indirecta; no se permiten más de cinco niveles.
- Si el subflujo espera una aprobación, la ejecución principal espera con él.

## Equipos {#teams}
<!-- keywords: equipo, contrato de salida, contrato, capacidades, resultado estructurado, run.output_contract -->

Un **equipo** es un flujo que, ejecutado como subflujo, promete un resultado fijo. Dos ajustes convierten un flujo en equipo:

- **Contrato de salida** en el nodo de resultado: los campos (nombre, tipo, obligatorio) que entrega el flujo, como en el resultado estructurado de un agente. Al final de una ejecución se comprueba el resultado. Debe ser un objeto (o texto JSON de uno) con cada campo obligatorio en el tipo correcto. Los demás campos se omiten. Si el resultado no encaja, el nodo de resultado falla y con él la ejecución; un flujo superior nunca recibe un resultado sin comprobar.
- **Capacidades como equipo** en los ajustes del flujo: etiquetas breves de lo que sabe hacer el flujo (como máximo 20). Viajan con el flujo (versiones, exportación) y más adelante ayudan a encontrar un equipo adecuado. No conceden permisos.

En un flujo superior, un flujo con contrato de salida entrega un objeto con exactamente esos campos. Por eso una decisión posterior puede comprobar un campo directamente, por ejemplo `score` mayor o igual que 5.

La comprobación antes de iniciar avisa cuando un agente antes del resultado responde en texto (entonces solo sirve una respuesta JSON) o cuando ningún agente entrega un campo obligatorio. Los nombres de campo no válidos o repetidos impiden iniciar.

Los flujos con contrato de salida o capacidades aparecen en la paleta en **Equipos** y se pueden añadir directamente como subflujo. El inspector de un subflujo muestra lo que entrega el equipo. Un **doble clic** en el nodo abre el equipo en el editor; las migas de pan de arriba llevan de vuelta al flujo superior.

Un equipo puede probarse por sí solo: crea una [serie de pruebas](/docs/automatisierung#testreihen) para el flujo. Sus comprobaciones pueden usar los campos del contrato de salida, por ejemplo `score` mayor o igual que 5.

## Orquestador {#orchestrator}
<!-- keywords: orquestador, orquestación, delegar, grupo, equipos, decisiones, run.orchestration_limit -->

Un **orquestador** deja que un modelo de IA decida qué equipo recibe qué parte de la tarea. Toma una decisión tras otra: **delegar** una tarea a un equipo o **terminar** con una respuesta. La respuesta es el resultado del nodo.

- **Equipos:** los flujos de trabajo guardados entre los que el modelo puede elegir (como máximo 20). De cada equipo, el modelo solo ve su nombre, descripción, capacidades y contrato de salida.
- **Equipos por capacidad:** en lugar de elegir cada equipo, nombras capacidades (como máximo 10). Al iniciar una ejecución, los equipos guardados con una capacidad coincidente entran en el grupo (hasta *Como máximo tantos equipos*): primero los que tienen más etiquetas coincidentes, luego por nombre. Los equipos con errores quedan fuera; los equipos con pasos de aprobación se incluyen. La selección queda fija para esa ejecución (y para una versión publicada); los detalles muestran qué etiquetas coincidieron en cada equipo. No se puntúa ni se estima nada.
- **Tarea** e **Instrucciones:** lo que hay que resolver y, opcionalmente, cómo planificarlo.
- **Máximo de decisiones** (de 1 a 50, por defecto 8) y **Máximo por equipo:** si no hay respuesta tras la última decisión, el paso falla.

El orquestador solo elige. No tiene herramientas, no crea agentes, herramientas ni equipos y no tiene permisos propios. Cada equipo elegido se ejecuta como una **ejecución vinculada propia**, con su parte del presupuesto, sus límites y sus aprobaciones de herramientas. Las decisiones no permitidas (un equipo desconocido, la misma tarea otra vez, un equipo agotado) se rechazan y se muestran al modelo; aun así cuentan como decisión.

Los detalles de la ejecución muestran cada decisión con su motivo, tarea, resultado y un enlace a la ejecución del equipo. Cuando un equipo se detiene para una **aprobación** (también en un subflujo o bajo otro orquestador), el orquestador espera con él: la ejecución queda *en pausa* y aparece en **Aprobaciones**. Tras la decisión continúa la misma ejecución del equipo, también después de un reinicio, y no se vuelve a preguntar al modelo por esa delegación. Si un rechazo termina la ejecución del equipo (*Al rechazar: terminar la ejecución*), también termina esta ejecución; ningún otro equipo puede eludir el rechazo. Al cancelar una ejecución en espera se cancelan también sus equipos en espera. Un equipo no puede volver a llamar al flujo de trabajo del orquestador.

## Equipos dinámicos {#dynamische-teams}
<!-- keywords: equipo dinámico, formar equipo, paralelo, a la vez, parámetros, formulario de inicio, plantilla, composición del equipo, staffing -->

En el área **Equipos dinámicos** de un orquestador el modelo tiene más margen, siempre dentro del pool y de los límites. Todo empieza desactivado.

- **Equipos a la vez** (1 a 5): una decisión puede encargar trabajo a varios equipos distintos a la vez, para partes que no dependen entre sí. Cada equipo obtiene su propio resultado.
- **Formar el equipo por sí mismo:** el orquestador incorpora equipos del pool a su equipo y los vuelve a retirar cuando los resultados intermedios lo sugieren. Solo los equipos del equipo reciben trabajo; *Como máximo en el equipo* limita su tamaño. El mismo equipo puede trabajar varias veces (hasta *Como máximo por equipo*).
- **Rellenar el formulario de inicio de los equipos:** el orquestador puede fijar los campos del formulario de entrada de un equipo (nunca archivos). Los valores se comprueban como en un inicio manual; un campo desconocido o un valor no válido se rechaza y se muestra al modelo.

El pool queda fijo al iniciar la ejecución, en las versiones de ese momento. Nunca aparecen equipos, agentes ni herramientas nuevos, y las aprobaciones, el presupuesto y los límites de cada equipo se aplican sin cambios.

**Qué muestran los detalles de la ejecución:** qué orquestador trabaja con qué modelo, cuántas decisiones se han usado, el coste de las decisiones y el total (los costes desconocidos se muestran como *no se conoce del todo*, nunca como 0), el pool con versiones, el **equipo a lo largo del tiempo**, los equipos en espera y cada decisión con su motivo, tarea, valores y el resultado de cada equipo: *Correcto*, *Esperando aprobación*, *Fallido*, *Rechazado*, *Cancelado* o *Caducado*. Solo se muestran las decisiones registradas, ningún razonamiento del modelo.

**Guardar la composición del equipo como plantilla:** un equipo solo existe durante la ejecución. Al terminar, este botón guarda un **flujo de trabajo nuevo** con el mismo orquestador, su formulario de inicio, sus límites y exactamente los equipos que trabajaron, en las versiones de la ejecución. Nada se guarda sin este clic.

## Formularios de entrada {#eingabeformular}
<!-- keywords: formulario, formulario de entrada, campos, tipo, obligatorio, valor predeterminado, opción, fecha, número -->

En lugar de un cuadro de texto libre, el nodo **Inicio** puede tener un **formulario de entrada**. El diálogo de inicio pide entonces exactamente esos campos y los comprueba antes de que empiece la ejecución.

| Tipo | Entrada |
|---|---|
| Texto, Texto largo | texto libre |
| Número | un número, también con coma decimal |
| Fecha | AAAA-MM-DD |
| Sí/No | elegir sí o no |
| Opción | uno de los valores definidos |
| Archivo | uno o varios archivos de [Conocimiento](/docs/wissen#start-dateien) |

Cada campo tiene una **etiqueta**, un **nombre técnico** (solo letras, cifras y _) y, opcionalmente, un valor predeterminado, una explicación y *Obligatorio*. Los agentes leen valores sueltos con `{{form.nombre}}`; `{{run.input}}` contiene todos los valores como líneas «Etiqueta: valor», seguidas de la entrada adicional opcional. Las decisiones comparan los valores con su tipo correcto.

Las [programaciones](/docs/automatisierung#zeitplaene), las [ejecuciones por lotes](/docs/automatisierung#stapel) y las [series de pruebas](/docs/automatisierung#testreihen) también usan formularios. Los flujos sin formulario se comportan como antes.

## Continuar ejecuciones fallidas {#fortsetzen}
<!-- keywords: continuar, reanudar, resume, reintentar, reiniciar, fallida, cancelada -->

Una ejecución fallida o cancelada se puede **continuar** (botón *Continuar* en la vista de detalle). Se crea una **ejecución nueva y vinculada**; la anterior queda sin cambios.

- Antes, Nodestro muestra para cada paso si su resultado se **reutiliza** o se **vuelve a ejecutar**, y por qué.
- Un resultado solo se reutiliza si el paso tuvo éxito, ni él ni sus herramientas, conexiones, entrada o archivos han cambiado y todos sus predecesores también se reutilizan. Los pasos modificados y todo lo que viene después se vuelven a ejecutar.
- Los resultados reutilizados no cuestan nada en la nueva ejecución; su coste se queda en la ejecución anterior y no se cuenta dos veces en [Uso](/docs/nutzung).
- Las decisiones de aprobación de los pasos reutilizados siguen valiendo y se marcan como reutilizadas; a nadie se le pregunta dos veces.
- Si los pasos que se vuelven a ejecutar ya habían llamado a **herramientas propias** que pueden actuar fuera de Nodestro (como enviar un mensaje), tienes que confirmarlo expresamente.

Si no se puede reutilizar nada con seguridad, Nodestro ofrece un reinicio completo. Las trazas importadas y las ejecuciones sueltas de subflujos no se pueden continuar; continúa en su lugar la ejecución principal.
