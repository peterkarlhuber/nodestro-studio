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
- **Marcadores:** en la tarea de un paso del bucle, `{{iteration}}` es la ronda (desde 1), `{{previous}}` su propio resultado de la ronda anterior y `{{feedback}}` lo que volvió por el bucle (por ejemplo, la justificación de la revisión o la nota para el agente de una aprobación rechazada, nunca su comentario). En la primera ronda ambos valen «-».
- **Aprobaciones en bucles:** una aprobación rechazada puede volver a una revisión por su rama *Rechazado*; la siguiente ronda vuelve a esperar una decisión.

Durante una ejecución, cada paso muestra su **ronda**; en los detalles eliges entre los resultados de todas las rondas. Los bucles pueden anidarse, pero no solaparse. Al [continuar](#fortsetzen) una ejecución fallida, un bucle siempre se repite por completo.

## Aprobaciones {#freigabe}
<!-- keywords: aprobación, visto bueno, human in the loop, revisar, rechazar, comentario, nota para el agente, agent note, pausa -->

Una **aprobación** detiene la ejecución hasta que una persona **aprueba** o **rechaza** los resultados. Nunca se aprueba nada automáticamente, tampoco en programaciones, ejecuciones por lotes o series de pruebas.

- **Indicación para quien revisa:** en qué debe fijarse.
- **Resultados mostrados:** qué resultados ve esa persona; sin selección, todo lo que llega.
- **Comentario:** opcional u obligatorio al rechazar. El comentario es solo para personas: queda guardado con la aprobación en la ejecución y aparece en la vista de la ejecución y en el registro. Ningún agente, subflujo ni orquestador lo lee.
- **Permitir una nota para el agente:** quien revisa puede escribir una **nota para el agente** (como máximo 2.000 caracteres). Es el único texto de la decisión que leen los agentes posteriores, con el nombre de la aprobación (`{{<nombre de la aprobación>}}` o junto con las entradas); sin nota leen «-». Los nodos de resultado, los archivos de resultado y las decisiones no la reciben. Útil en bucles de revisión, donde la nota dice qué cambiar; desactívala en aprobaciones que detienen la ejecución al rechazar. Las aprobaciones nuevas la permiten. Las aprobaciones guardadas antes de que existiera la nota cuentan como permitidas, y la comprobación del flujo de trabajo lo indica una vez hasta que guardes el flujo de trabajo.
- **Al rechazar:** seguir la rama **Rechazado** o terminar la ejecución. Si no hay nada conectado a *Rechazado*, ese camino simplemente termina.

Mientras espera, la ejecución tiene el estado **En pausa** y la aprobación **Pendiente de aprobación**. Puedes decidir en el resumen de ejecución del editor, en la vista de detalle de la ejecución o en la página **Aprobaciones**. Después la ejecución continúa donde se detuvo. Las aprobaciones abiertas sobreviven a un reinicio de Nodestro.

## La página Aprobaciones {#freigaben-seite}
<!-- keywords: aprobaciones, aprobaciones abiertas, cola, decidir, navegación, contador -->

La página **Aprobaciones** (navegación, grupo *Ejecutar y revisar*) lista todas las aprobaciones abiertas, la más antigua primero, con flujo de trabajo, origen (manual, programación, lote, serie de pruebas) y tiempo de espera. El número junto a la entrada del menú indica cuántas esperan.

Cada tarjeta muestra la indicación, los resultados que revisar (los resultados estructurados como campos con etiqueta y el JSON a un clic), un campo de comentario (solo para personas), el campo *Nota para el agente* si la aprobación la permite y los botones *Aprobar* y *Rechazar*; los botones siguen a la vista aunque los resultados sean largos. Las aprobaciones dentro de subflujos también aparecen aquí, con la ruta hasta la ejecución principal. Las tarjetas de [llamadas a herramientas](/docs/verzweigungen#tool-freigabe) indican el flujo de trabajo y el paso («*flujo* · paso *nombre*»).

Las ejecuciones que esperan una [decisión de presupuesto](/docs/workflows#budget-freigabe) aparecen arriba en una sección propia **Decisiones de presupuesto**, con un enlace a la ejecución.

## Aprobar llamadas a herramientas {#tool-freigabe}
<!-- keywords: aprobación de herramienta, llamada a herramienta, por llamada, aprobar llamadas a herramientas, no activado, reglas para llamadas a herramientas -->

Las aprobaciones de **llamadas individuales a herramientas** no están activadas en esta versión. Las herramientas que un agente puede usar se ejecutan sin preguntar antes de cada llamada. En la página **Aprobaciones**, *Reglas para llamadas a herramientas* muestra este estado.

Si una persona debe revisar los resultados antes de que la ejecución continúe, usa una [aprobación](/docs/verzweigungen#freigabe). Para limitar lo que puede hacer un agente, asígnale solo las herramientas que necesita (consulta [Asignar herramientas](/docs/agenten#tools)).

## Permisos y bloqueos {#erlaubnisse}
<!-- keywords: permiso, bloqueo, recordar decisión, quién puede qué, límites de seguridad, revocar -->

Los permisos y bloqueos **no están activados** a menos que quien opera Nodestro los active junto con las aprobaciones de llamadas a herramientas. Mientras están desactivados, nada de esta sección se aplica y no se muestra nada de ellos.

Cuando están activados, un administrador puede **recordar una decisión** sobre una llamada:

- **Cuánto tiempo**: solo esta llamada (lo predeterminado), hasta que se revoque o hasta una fecha.
- **Para quién**: el agente que preguntó o todos los agentes.

Aprobar guarda entonces un **permiso** para la herramienta, y rechazar guarda un **bloqueo**. Un bloqueo siempre gana sobre un permiso. Un permiso para una herramienta termina en cuanto la herramienta cambia (una versión nueva, otra clasificación u otra definición MCP). Si la herramienta cambió después de mostrarse la tarjeta, el permiso se rechaza y vuelves a revisar la llamada.

Algunas llamadas no se pueden permitir por adelantado. Las herramientas que eliminan definitivamente necesitan una confirmación cada vez, y las herramientas MCP mantienen sus propias reglas. Para ellas solo se puede recordar el rechazo.

La página **Permisos y bloqueos** (enlazada desde **Aprobaciones**) muestra cada permiso y bloqueo con quién lo dio, para quién, hasta cuándo y su estado, y cada uno se puede revocar. Una revocación se aplica desde el próximo acceso. La página también nombra los **límites de seguridad** fijos, como el modo sin conexión o la carpeta de datos de Nodestro. Ningún permiso los levanta.

## Carpetas compartidas {#ordner}
<!-- keywords: carpeta, carpeta compartida, leer archivos, archivos locales, registro de accesos, revocar, contenido protegido -->

Las carpetas compartidas **no están activadas** salvo que la persona que administra Nodestro las active. En un servidor no existen nunca. Mientras están desactivadas, la página **Carpetas compartidas** (enlazada desde **Aprobaciones**) solo lo indica, y ningún agente puede leer una carpeta de este equipo.

Cuando están activadas, un administrador comparte una carpeta **para lectura**: un nombre, la ruta completa de la carpeta, opcionalmente qué archivos incluir o excluir, para qué agentes, para qué ejecuciones y hasta cuándo. Los archivos secretos como `.env`, claves y bases de datos de contraseñas quedan excluidos salvo que lo desactives. Nodestro comprueba la ruta al compartirla e indica por qué se rechaza una carpeta: las carpetas del sistema, la carpeta personal y las carpetas con claves o contraseñas nunca se comparten. Los agentes ven el nombre, nunca la ruta, y pueden listar, leer y buscar los archivos, nunca modificarlos. La ruta se elige con **Examinar …** en un explorador de carpetas que solo muestra carpetas, nunca archivos, y ningún lugar protegido; solo funciona en la ventana que abrió la aplicación. Si no, escribes la ruta completa.

La página muestra cada carpeta compartida con quién la compartió y su estado. El **registro de accesos** muestra qué agente leyó qué, en qué ejecución y si estaba permitido. **Revocar** termina el permiso desde el próximo acceso.

Con **Mantener un índice de búsqueda** (desactivado hasta que lo activas), Nodestro mantiene un índice de los archivos de texto y PDF de la carpeta, en el que los agentes buscan por significado. La lista muestra su estado: **Indexando …**, **Índice listo** con el número de archivos y la hora de la última actualización, **Índice incompleto** si se omitieron archivos al llegar a un límite, o **Índice fallido** con el motivo. Nunca nombra un archivo. Cuando termina el uso compartido, su índice se elimina.

## Paquetes de extensión {#erweiterungspakete}
<!-- keywords: paquete de extensión, almacén de extensiones, wheel, sha-256, revocar, sandbox -->

Los paquetes de extensión de otros autores se guardan aparte de los archivos de programa de Nodestro, en la carpeta de datos de esta instalación; un servidor no tiene ninguno. Un administrador abre **Paquetes de extensión** (enlazado en **Aprobaciones**), elige un wheel de Python puro (`.whl`), indica la suma de verificación SHA-256 que da el editor y su procedencia, y selecciona **Comprobar y añadir**. Nodestro comprueba el archivo antes de guardar nada: suma de verificación, tamaño, cada nombre de archivo y cada archivo, la descripción y que no necesite otras bibliotecas. Un paquete rechazado nunca se guarda, y la página dice por qué. Un paquete nunca se instala en Nodestro mismo.

Las herramientas de un paquete guardado quedan **bloqueadas**. Solo se ejecutan cuando el interruptor de desarrollo de las herramientas de extensión está activado, y entonces solo en el sandbox de Docker aislado, sin red, archivos del equipo ni secretos; todavía no se ha habilitado ningún tipo de herramienta de extensión. Un paquete añadido después del inicio aparece con sus herramientas en el siguiente inicio. **Eliminar** quita un paquete; se puede añadir de nuevo y se vuelve a comprobar. **Revocar** lo quita para siempre: un archivo con esa suma de verificación no se vuelve a aceptar nunca. Para actualizar un paquete, añade la nueva versión y elige la instalada en **Actualización de**; la antigua se quita en el mismo paso.

## Contenido protegido {#geschuetzte-inhalte}
<!-- keywords: contenido protegido, fuente compartida, procedencia, modelo en la nube, permiso, salida -->

Cuando la protección de contenido está activada, una ejecución que lee una carpeta compartida, conocimiento, memoria o un archivo adjunto se marca como **Contenido protegido**, igual que la conversación en la que responde. La marca se mantiene. A partir de ahí, enviar ese contenido fuera de este equipo necesita un [permiso](/docs/verzweigungen#erlaubnisse): cada solicitud a un modelo en la nube y cada herramienta que llega al exterior se consulta o se rechaza hasta que una persona lo permita. Esto también se aplica cuando comentas una ejecución así con el asistente o cuando un juez de IA la evalúa. Los detalles de la ejecución y la cabecera de la conversación muestran la marca y lo explican.

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

El inspector de un orquestador empieza con una frase que resume cómo trabaja («Así trabaja este orquestador: …») y agrupa los ajustes en cuatro áreas desplegables; cada una muestra en su cabecera un resumen y los posibles problemas:

- **Pool de equipos:** los **Flujos de trabajo elegidos** son los flujos de trabajo guardados entre los que el modelo puede elegir (como máximo 20). De cada equipo, el modelo solo ve su nombre, descripción, capacidades y contrato de salida.
- **Equipos por capacidad** (también en el pool de equipos): en lugar de elegir cada equipo, nombras capacidades (como máximo 10). Al iniciar una ejecución, los equipos guardados con una capacidad coincidente entran en el grupo (hasta *Como máximo tantos equipos*): primero los que tienen más etiquetas coincidentes, luego por nombre. Los equipos con errores quedan fuera; los equipos con pasos de aprobación se incluyen. La selección queda fija para esa ejecución (y para una versión publicada); los detalles muestran qué etiquetas coincidieron en cada equipo. No se puntúa ni se estima nada.
- **Encargo:** **Tarea** e **Instrucciones** (lo que hay que resolver y, opcionalmente, cómo planificarlo), además del **Modelo** del orquestador.
- **Límites:** **Máximo de decisiones** (de 1 a 50, por defecto 8), **Usos máximos por equipo** y **Equipos a la vez**. Si no hay respuesta tras la última decisión, el paso falla.
- **Alineación activa:** las opciones de [Equipos dinámicos](/docs/verzweigungen#dynamische-teams).

El orquestador solo elige. No tiene herramientas, no crea agentes, herramientas ni equipos y no tiene permisos propios. Cada equipo elegido se ejecuta como una **ejecución vinculada propia**, con su parte del presupuesto, sus límites y sus aprobaciones de herramientas. Las decisiones no permitidas (un equipo desconocido, la misma tarea otra vez, un equipo agotado) no se ejecutan y se muestran al modelo; los detalles de la ejecución las llaman *No válida, no ejecutada*. Aun así cuentan como decisión.

Los detalles de la ejecución muestran cada decisión con su motivo, tarea, resultado y un enlace a la ejecución del equipo. Cuando un equipo se detiene para una **aprobación** (también en un subflujo o bajo otro orquestador), el orquestador espera con él: la ejecución queda *en pausa* y aparece en **Aprobaciones**. Tras la decisión continúa la misma ejecución del equipo, también después de un reinicio, y no se vuelve a preguntar al modelo por esa delegación. Si un rechazo termina la ejecución del equipo (*Al rechazar: terminar la ejecución*), también termina esta ejecución; ningún otro equipo puede eludir el rechazo. Al cancelar una ejecución en espera se cancelan también sus equipos en espera. Un equipo no puede volver a llamar al flujo de trabajo del orquestador.

**Durante la ejecución** puedes hacer preguntas al líder de equipo y darle instrucciones para su próxima decisión, en la pestaña **Líder de equipo** de la vista de detalle; consulta [Hablar con el líder de equipo](/docs/ausfuehrungen#teamleitung). **Dirección en vivo**, en el área *Límites*, fija quién puede dar instrucciones.

## Equipos dinámicos {#dynamische-teams}
<!-- keywords: equipo dinámico, formar equipo, paralelo, a la vez, parámetros, formulario de inicio, plantilla, composición del equipo, staffing -->

En el área **Alineación activa** de un orquestador (campo *Equipos dinámicos*) el modelo tiene más margen, siempre dentro del pool y de los límites. Todo empieza desactivado.

- **Equipos a la vez** (1 a 5, en el área *Límites*): una decisión puede encargar trabajo a varios equipos distintos a la vez, para partes que no dependen entre sí. Cada equipo obtiene su propio resultado.
- **Formar la alineación activa por sí mismo:** el orquestador incorpora equipos del pool a su alineación y los vuelve a retirar cuando los resultados intermedios lo sugieren. Solo los equipos de la alineación activa reciben trabajo; *Como máximo en la alineación activa* limita su tamaño. El mismo equipo puede trabajar varias veces (hasta *Usos máximos por equipo*). Sin esta opción, el orquestador elige de todo el pool.
- **Rellenar el formulario de inicio de los equipos:** el orquestador puede fijar los campos del formulario de entrada de un equipo (nunca archivos). Los valores se comprueban como en un inicio manual; un campo desconocido o un valor no válido se rechaza y se muestra al modelo.

El pool queda fijo al iniciar la ejecución, en las versiones de ese momento. Nunca aparecen equipos, agentes ni herramientas nuevos, y las aprobaciones, el presupuesto y los límites de cada equipo se aplican sin cambios.

**Qué muestran los detalles de la ejecución:** qué orquestador trabaja con qué modelo, cuántas decisiones se han usado, el coste de las decisiones y el total (los costes desconocidos se muestran como *no se conoce del todo*, nunca como 0), el pool con versiones, la **Alineación activa a lo largo del tiempo**, los equipos en espera y cada decisión con su motivo, tarea, valores y el resultado de cada equipo: *Correcto*, *Esperando aprobación*, *Fallido*, *Rechazado*, *Cancelado* o *Caducado*. Solo se muestran las decisiones registradas, ningún razonamiento del modelo.

**Guardar la composición del equipo como plantilla:** una alineación activa solo existe durante la ejecución. Al terminar, este botón guarda un **flujo de trabajo nuevo** con el mismo orquestador, su formulario de inicio, sus límites y exactamente los equipos que trabajaron, en las versiones de la ejecución. Nada se guarda sin este clic.

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

Si una ejecución se interrumpió porque Nodestro se detuvo mientras se ejecutaba, su vista de detalle nombra los pasos que no terminaron y ofrece **Continuar** en el mismo aviso; esos pasos se vuelven a ejecutar con el motivo *Se interrumpió*.

Si no se puede reutilizar nada con seguridad, Nodestro ofrece un reinicio completo. Las trazas importadas y las ejecuciones sueltas de subflujos no se pueden continuar; continúa en su lugar la ejecución principal.
