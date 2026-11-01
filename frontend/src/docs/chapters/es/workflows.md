# Flujos de trabajo

Un flujo de trabajo conecta agentes para formar una cadena. Este capítulo explica cómo crear flujos de trabajo, conectar nodos, cómo fluyen los datos entre los agentes y cómo iniciar una ejecución.

## Crear y gestionar flujos de trabajo {#anlegen}
<!-- keywords: nuevo flujo de trabajo, crear, eliminar, duplicar, copia, resumen, workflow, continuar, ejecuciones recientes, equipos, insignia equipo, sin modelo de ia, galería, empieza aquí, nivel -->

La página **Flujos de trabajo** muestra todos los flujos como tarjetas con el número de agentes, el último cambio y el estado de la última ejecución.

La página ofrece tres formas equivalentes de empezar: **Crear con IA** abre el diálogo de un nuevo flujo de trabajo con el [Arquitecto IA](/docs/ki-architekt#neu-erstellen), **Empezar con un ejemplo** abre la [galería de ejemplos](/docs/beispiele) y **Crearlo tú mismo** abre el mismo diálogo para un flujo vacío. Mientras no haya ningún flujo aparecen como mosaicos grandes; después, como una fila estrecha **Empezar uno nuevo** sobre la lista.

**Sin modelo de IA:** si todavía no hay ningún proveedor de IA configurado para el modelo predeterminado, un aviso sobre los mosaicos grandes indica que los flujos solo se ejecutan con un modelo de IA conectado (una clave de API o un servidor de modelos local como Ollama), con el enlace **Configurar en Ajustes**. El ejemplo pasa entonces al primer lugar, porque una copia no necesita modelo, y *Crear con IA* lleva la nota *Necesita una conexión a un modelo de IA*. El diálogo también lo dice si eliges allí *Crear con IA*: el Arquitecto IA trabaja con tu modelo predeterminado.

- **Nuevo flujo de trabajo:** escribe un nombre y una descripción opcional. El nuevo flujo ya contiene *Inicio → Agente → Resultado*.
- **Crear con IA:** en el mismo diálogo describes lo que quieres y el [arquitecto de flujos](/docs/ki-architekt#neu-erstellen) diseña el flujo para que lo revises.
- **Abrir:** haz clic en la tarjeta.
- **Duplicar:** símbolo de copia en la tarjeta. La copia se llama «… (copia)»; las ejecuciones no se copian.
- **Eliminar:** símbolo de la papelera. Las ejecuciones anteriores siguen disponibles en *Ejecuciones*.

**Continuar:** en cuanto hay flujos y ejecuciones, sobre la lista aparece el área **Continuar**: cuántas aprobaciones te esperan (un clic abre la página *Aprobaciones*), las **Ejecuciones recientes** con su estado y, con más de seis flujos, los **Editados recientemente**. Las partes sin contenido no se muestran; si no hay nada, falta toda el área.

**Equipos:** los flujos con capacidades o contrato de salida llevan la insignia **Equipo**: un [orquestador](/docs/verzweigungen#orchestrator) puede delegarles trabajo. Aparecen debajo de tus propios flujos, en el área desplegable **Equipos**. Las copias de ejemplos orquestados traen sus equipos consigo.

**Galería de ejemplos:** debajo de la lista están los ejemplos destacados, el más sencillo primero y marcado con **Empieza aquí** mientras aún no tienes ningún flujo. Después, la galería es un área plegada que recuerda si la abriste. En la galería completa buscas por nombre, ámbito, bloque o nivel y filtras por categoría y **Nivel**; la búsqueda, los filtros y una vista previa abierta forman parte de la dirección, así que *Atrás* vuelve a la misma selección. En **Qué necesitas**, la vista previa indica qué proveedor de IA y qué modelos usa la copia (y si está configurado), si una ejecución se detiene para una aprobación, qué archivos de conocimiento y de ejemplo vienen incluidos y si hace falta una conexión con otro servicio. Más en [Flujos de trabajo de ejemplo](/docs/beispiele).

## Favoritos y etiquetas {#favoriten-tags}
<!-- keywords: favorito, favoritos, estrella, etiqueta, etiquetas, filtrar, ordenar -->

Los flujos de trabajo, las plantillas de agentes y las herramientas se pueden marcar como favoritos con la **estrella**. Los favoritos aparecen siempre primero en las listas. Con el **icono de etiqueta** añades etiquetas como «Cliente A» o «Borrador»; se sugieren las etiquetas existentes.

Encima de las listas filtras por **Solo favoritos** y por una etiqueta. Los favoritos y las etiquetas se guardan aparte de los objetos: no cambian ni flujos de trabajo ni agentes ni herramientas, y también aparecen en la [búsqueda](/docs/start#suche). No hay carpetas, a propósito.

## El editor {#editor}
<!-- keywords: lienzo, canvas, paleta, bloques, inspector, resumen de la ejecución, zoom, minimapa, barra de título, más acciones, equipos en la paleta -->

El editor tiene cuatro áreas:

1. **Barra de título:** nombre, *Arquitecto IA*, *API y exportación*, el menú **Más acciones** (*Versiones* y *Exportar como archivo*), *Guardar* e *Iniciar flujo de trabajo*. Con cambios sin guardar se añade *Descartar*. En ventanas estrechas, las acciones secundarias se muestran solo como iconos.
2. **Lienzo:** los nodos y las conexiones. Arriba a la izquierda se indica si hay cambios sin guardar y cuántos agentes y conexiones tiene el flujo. Abajo a la izquierda están el zoom, *Mostrar todo*, *Ordenar automáticamente* y también *Deshacer* y *Rehacer* (bloqueados cuando no hay nada que deshacer o rehacer). Arriba a la derecha, un mapa general muestra todo el flujo. Un flujo grande se abre con un tamaño legible en su nodo de inicio, en lugar de reducido hasta caber.
3. **Bloques (paleta):** *Agente* (vacío), *Describir un agente* (la IA diseña la configuración), *Inicio*, *Resultado*, hasta ocho plantillas de la biblioteca de agentes y, debajo, los **Equipos**, que puedes buscar y plegar; cada equipo indica sus capacidades. Arrastra un bloque al lienzo o haz clic en él. Un nodo nuevo aparece en la parte visible del lienzo y queda seleccionado.
4. **Inspector (derecha):** sin selección muestra la comprobación y los ajustes del flujo de trabajo; si no, la configuración del nodo seleccionado y, con varios nodos seleccionados, las acciones para todos ellos (consulta [Manejo y atajos de teclado](/docs/workflows#bedienung)).

Debajo del lienzo está el **Resumen de la ejecución** con la última ejecución de este flujo.

Los bloques, el inspector (con el título *Propiedades*) y el resumen de la ejecución son paneles. El botón de la cabecera de un panel lo oculta o lo muestra; un panel oculto deja una barra estrecha, y los bloques siguen disponibles como iconos. El separador entre un panel y el lienzo cambia su tamaño: arrástralo, o selecciónalo con *Tab* y usa las teclas de flecha (con *Mayús* en pasos más grandes). Un doble clic en el separador restablece el tamaño predeterminado. Mientras el inspector está oculto, su barra muestra el nodo seleccionado; un doble clic en un nodo muestra sus propiedades. Nodestro recuerda la distribución en este navegador para todos los flujos de trabajo. No forma parte del flujo: cambiarla nunca crea cambios sin guardar ni un paso de deshacer, y un flujo en ejecución sigue ejecutándose.

## Tipos de nodos {#knoten}
<!-- keywords: inicio, resultado, salida, agente, nodo, entrada -->

| Nodo | Función | Entradas | Salidas |
|---|---|---|---|
| **Inicio** | Proporciona la entrada que escribes al iniciar. Opcionalmente con una *Propuesta de entrada* o un [formulario de entrada](/docs/verzweigungen#eingabeformular). | ninguna | las que quieras |
| **Agente** | Llama a su modelo de IA con su configuración y devuelve un resultado (texto o JSON). | las que quieras | las que quieras |
| **Decisión** | Elige una o varias ramas según reglas fijas, sin petición a la IA. | una o varias | una salida por rama |
| **Aprobación** | Detiene la ejecución hasta que una persona aprueba o rechaza. | las que quieras | *Aprobado*, *Rechazado* |
| **Subflujo** | Ejecuta otro flujo de trabajo guardado como un solo paso. | las que quieras | las que quieras |
| **Resultado** | Reúne los resultados de los agentes conectados como salida del flujo de trabajo, si quieres también como archivos. | las que quieras | ninguna |

Los nodos de inicio y de resultado son opcionales: los agentes sin predecesor reciben automáticamente la entrada de la ejecución y, sin nodo de resultado, la salida de los últimos agentes cuenta como resultado (consulta [El resultado de una ejecución](/docs/ausfuehrungen#ergebnis)). Decisión, aprobación y subflujo están en la paleta, en *Controlar el flujo*; más información en [Ramas y aprobaciones](/docs/verzweigungen).

Cada nodo tiene un nombre único. Si creas un segundo agente con el mismo nombre, Nodestro añade un número («Agente 2»). El nombre de un agente es también su marcador de posición en las tareas.

## Conectar agentes {#verbinden}
<!-- keywords: conexión, arista, edge, puerto, arrastrar, círculo, ciclo, eliminar -->

Arrastra desde el **punto derecho** (salida) de un nodo hasta el **punto izquierdo** (entrada) de otro. Una conexión significa: el nodo de destino espera a que el nodo de origen termine y recibe su resultado.

Nodestro impide las conexiones no válidas y explica el motivo:

- Un nodo no se puede conectar consigo mismo.
- El nodo de inicio no tiene entrada y el nodo de resultado no tiene salida.
- La misma conexión solo puede existir una vez.
- **Ciclos solo como bucles:** los datos fluyen en una dirección. Una conexión de vuelta a un predecesor solo es posible desde una rama de una decisión o aprobación y entonces se convierte en un [bucle](/docs/verzweigungen#schleifen) con límite; cualquier otra se rechaza.

Para eliminar una conexión, selecciónala y pulsa **Supr** o **Retroceso**. Durante una ejecución se iluminan las conexiones por las que fluyen datos en ese momento.

## Flujo de datos entre agentes {#datenfluss}
<!-- keywords: flujo de datos, entrada, input, transmisión, predecesor, sucesor, json, varias entradas -->

Así recibe un agente su tarea:

1. Nodestro toma la **tarea** del agente (campo *Tarea* del inspector, por defecto: `{{input}}`).
2. Los marcadores de posición se sustituyen por los resultados de los **predecesores directos** y la entrada de la ejecución.
3. Los resultados de predecesores que no aparecen en la tarea se añaden bajo el encabezado **`# Eingaben`** («entradas»), cada uno con el nombre del predecesor como subtítulo. Así nunca se pierde nada sin avisar.
4. Si después la tarea está vacía, el agente recibe la entrada de la ejecución.

**Qué se transmite:**

- Un resultado de texto se transmite como texto.
- Un resultado estructurado se transmite como JSON formateado.
- El nodo de inicio transmite la entrada de la ejecución.
- Los agentes sin predecesor reciben la entrada de la ejecución.

Un agente solo ve los resultados de sus predecesores **directos**, no los de nodos más atrás. Si necesita la entrada original, usa `{{run.input}}`.

## Marcadores de posición en las tareas {#platzhalter}
<!-- keywords: marcadores de posición, placeholders, plantilla, {{input}}, {{run.input}}, variable, tarea -->

| Marcador | Se sustituye por |
|---|---|
| `{{input}}` | el resultado del único predecesor; con varios predecesores, todos los resultados, cada uno como sección `## Nombre`; sin predecesor, la entrada de la ejecución. Justo después de un nodo de inicio con formulario rellenado, son solo los valores del formulario; usa `{{run.input}}` para los valores del formulario y el texto adicional |
| `{{run.input}}` (o `{{workflow.input}}`) | la entrada al iniciar el flujo de trabajo, en cualquier punto del flujo |
| `{{Nombre del predecesor}}` | el resultado exactamente de ese predecesor directo |

En los marcadores no importan las mayúsculas y minúsculas. En el inspector aparecen, debajo del campo de tarea, botones para todos los predecesores directos; un clic inserta el marcador correspondiente.

**Ejemplo:** un agente redactor tiene los predecesores *Público* y *Esquema*:

```
Escribe el artículo sobre «{{run.input}}».

Público:
{{Público}}

Esquema:
{{Esquema}}
```

> **Error frecuente:** si cambias el nombre de un predecesor, los marcadores antiguos dejan de coincidir. Un marcador desconocido se queda como texto y el resultado del predecesor se añade bajo `# Eingaben`. Revisa las tareas de los sucesores después de renombrar.

## Vista previa de la entrada {#eingabe-vorschau}
<!-- keywords: vista previa, entrada, contexto, ver prompt, comprobar marcadores, qué recibe el agente -->

La sección **Vista previa de la entrada** en el inspector de un agente muestra lo que el agente recibiría en la próxima ejecución, sin llamar a la API:

- el **prompt del sistema** y la **tarea** con los marcadores sustituidos. Cada parte insertada está resaltada; al pasar el ratón ves su origen.
- qué **entradas** están disponibles. Los resultados de los predecesores proceden de la última ejecución de este flujo de trabajo. Si un predecesor todavía no tiene resultado, en su lugar aparece un aviso en amarillo en vez de un valor inventado.
- marcadores que no coinciden con ningún predecesor conectado.
- el resto del contexto: mensajes de ejemplo, herramientas, conocimiento, memoria, formato de salida y control de calidad.

Las credenciales de las opciones de la solicitud nunca se muestran. Para una ejecución terminada, la pestaña **Contexto** de los [detalles](/docs/ausfuehrungen#details) muestra lo que recibió el agente en su momento.

## Ejecución en paralelo {#parallel}
<!-- keywords: paralelo, simultáneo, ramificación, unir, orden -->

Cada nodo empieza en cuanto **todos** sus predecesores han terminado. Los nodos que no dependen entre sí se ejecutan a la vez. En el ejemplo *Artículo de blog*, *Público* y *Esquema* trabajan en paralelo; el *Redactor* empieza cuando ambos han terminado.

Las ramas paralelas acortan el tiempo de ejecución, pero cuestan los mismos tokens que agentes ejecutados uno tras otro.

**Errores en una rama:** si un agente falla, todos los nodos que dependen de él se **omiten**. Las ramas independientes siguen ejecutándose. La ejecución termina entonces con el estado *Error*.

## Ajustes del flujo de trabajo {#einstellungen}
<!-- keywords: nombre, descripción, inspector, ajustes del flujo de trabajo -->

Haz clic en un punto vacío del lienzo para ver en el inspector los ajustes del flujo de trabajo: **Nombre**, **Descripción**, **Presupuesto por ejecución** y los **límites** de pasos simultáneos y de duración. Debajo aparecen los problemas que impiden iniciar y un breve resumen del manejo.

## Presupuesto por ejecución {#budget}
<!-- keywords: presupuesto, budget, límite de coste, límite, usd, dólar, cancelación, budgetexceedederror, reserva, sin máximo estricto -->

El presupuesto limita los **costes estimados** de una ejecución en dólares estadounidenses, sumando todos los agentes y controles de calidad.

- Si el flujo no tiene presupuesto propio, se aplica el **presupuesto predeterminado** de los ajustes (al principio 2 USD).
- Si tampoco hay nada ahí, la ejecución no tiene límite.
- **Antes** de cada solicitud se reserva su coste máximo posible (tamaño de la entrada y la salida máxima que puede generar, a la tarifa más cara). Tras la respuesta, la reserva se sustituye por el coste real. Así, los agentes que se ejecutan a la vez no pueden superar juntos el presupuesto: si lo que queda no basta, una solicitud espera a que termine otra.
- Si el presupuesto no basta ni siquiera sin otras solicitudes, la solicitud no se envía y el agente se detiene (error `BudgetExceededError`).
- Si una sola solicitud es mayor que todo el presupuesto, se ejecuta sola en el modo de precios estándar; en el modo estricto se rechaza.

Los costes desconocidos **no** cuentan como 0. Si el coste máximo de una solicitud no puede determinarse de antemano (sin precio conocido, imágenes, archivos o herramientas del proveedor como la búsqueda web), en el modo estándar se ejecuta sin límite superior. La ejecución muestra entonces junto a los costes el aviso **Sin máximo estricto** con el número de esas solicitudes. En el modo de precios estricto, las solicitudes sin precio conocido no se envían.

## Límites por ejecución {#limits}
<!-- keywords: límites, a la vez, paralelo, límite de tiempo, duración, timeout, run.time_limit, pasos, run.step_limit -->

Tres límites opcionales se aplican a cada ejecución del flujo. Vacío significa sin límite.

- **Máximo de pasos ejecutándose a la vez** (de 1 a 32): si hay más pasos listos, los demás esperan a que quede un hueco libre. Con 1, todos los pasos se ejecutan uno tras otro.
- **Límite de tiempo por ejecución** (en minutos, como máximo 7 días): solo cuenta el tiempo de ejecución activo. La espera de una aprobación no cuenta. Cuando se agota el tiempo, no se inicia ningún paso más, se pide a los agentes en curso que se detengan y la ejecución falla con un error que indica el límite de tiempo.
- **Máximo de pasos por ejecución** (de 1 a 10 000): cada nodo ejecutado cuenta una vez, también el inicio y el resultado, y cada ronda de un bucle cuenta de nuevo. Si el siguiente paso fuera uno de más, no se inicia y la ejecución falla con un error que indica el límite. Esto protege frente a bucles que dan más rondas de lo previsto. Una ejecución continuada cuenta también los pasos que retoma.

Una solicitud al modelo o una llamada a una herramienta que ya está en curso se completa. Por eso la ejecución puede superar el límite de tiempo en lo que dure esa llamada.

## Comprobación antes de iniciar {#pruefung}
<!-- keywords: comprobación, validación, problemas, inicio bloqueado, error, advertencia, aviso -->

Nodestro comprueba el flujo de trabajo en cada cambio (tras una pausa de medio segundo), sin llamar a la API y sin coste:

- **Estructura:** ¿Hay al menos un agente? ¿El nodo de inicio no tiene entradas y el nodo de resultado no tiene salidas? ¿No hay ciclos, conexiones duplicadas ni conexiones que no lleven a ninguna parte? ¿Tiene entrada el nodo de resultado?
- **Agentes:** Cada configuración se comprueba con las reglas de la biblioteca. Los nodos con errores muestran «1 problema» en el lienzo, también Inicio y Resultado; las advertencias aparecen como «1 advertencia» con su propio color y un icono.
- **Conexiones y marcadores:** marcadores que no coinciden con ningún predecesor conectado, agentes sin entrada, resultados que no llegan a ninguna parte y nombres de agente duplicados.
- **Ajustes:** proveedores sin configurar, archivos de conocimiento o de inicio borrados, modelos sin precio conocido y un presupuesto de 0.

Los resultados aparecen en la parte superior del inspector del flujo de trabajo (clic en un lugar vacío del lienzo), ordenados en **errores** y **avisos**. Un clic en un mensaje selecciona el agente afectado o resalta la conexión afectada; las conexiones con errores aparecen en rojo discontinuo. Si seleccionas un nodo, sus propios mensajes aparecen encima de sus ajustes. Mientras falte un proveedor, los nodos no muestran «Listo».

Mientras haya **errores**, **Iniciar flujo de trabajo** está bloqueado. El motivo aparece justo al lado del botón; con varios problemas, el primero («3 problemas impiden el inicio. Primero: …»). **Mostrar** selecciona el nodo o la conexión afectados y abre el inspector; si falta un proveedor de IA, **Abrir ajustes** lleva directamente allí. El botón bloqueado sigue siendo accesible con el teclado, y los lectores de pantalla leen el motivo. Los **avisos** no bloquean el inicio; el diálogo de inicio los vuelve a mostrar.

## Iniciar una ejecución {#starten}
<!-- keywords: iniciar, ejecutar, run, diálogo de inicio, entrada, adjuntar archivos, tarea precargada, más archivos -->

**Iniciar flujo de trabajo** abre el diálogo de inicio:

- **Entrada:** el texto que reciben todos los agentes al inicio. Aparece rellenado con la *Propuesta de entrada* del nodo de inicio. Si el flujo tiene un [formulario de entrada](/docs/verzweigungen#eingabeformular), el campo está debajo de los campos del formulario; si viene rellenado, se llama **Tarea (ejemplo precargado)**: sustituye el ejemplo por tu propia petición.
- **Adjuntar archivos (opcional):** archivos de conocimiento que se colocan directamente en el contexto de los primeros agentes solo para esta ejecución (consulta [Adjuntar archivos al iniciar](/docs/wissen#start-dateien)). Si el formulario tiene campos de archivo propios, esta área está plegada en **Adjuntar más archivos (opcional)**.
- **Presupuesto:** el diálogo muestra qué presupuesto se aplica.

Con **Iniciar**, Nodestro guarda el flujo y comienza la ejecución. La ejecución usa el estado del flujo en el momento de iniciarla; los cambios posteriores solo surten efecto en la siguiente. Si el proveedor de un modelo no está configurado, el diálogo lo indica. Si la ejecución aún no puede empezar, el motivo aparece debajo de **Iniciar**: todavía se están subiendo archivos o primero hay que corregir errores (*Primero corrige los problemas de arriba.*).

## Manejo y atajos de teclado {#bedienung}
<!-- keywords: atajos de teclado, shortcuts, ctrl+s, ctrl+z, deshacer, rehacer, supr, duplicar, ordenar automáticamente -->

<!-- widget: shortcuts -->

Más consejos:

- **Ordenar automáticamente** coloca los nodos en columnas según su posición en el flujo de datos.
- **Mostrar todo** ajusta el zoom para que se vea todo el flujo.
- **Seleccionar varios nodos:** Mayús o Ctrl más clic añade nodos a la selección; Mayús y arrastrar sobre el lienzo selecciona con un marco. Arrastrar mueve todos los nodos seleccionados, **Supr** los elimina todos y **Ctrl+D** los duplica todos. El inspector ofrece entonces *Duplicar todos*, *Eliminar nodos* y *Quitar selección*.
- **Deshacer una eliminación:** tras eliminar nodos aparece un mensaje con **Deshacer**.
- **Trazar conexiones:** ya mientras arrastras, el lienzo muestra dónde no se permite una conexión; si la sueltas ahí, un mensaje indica el motivo.
- Si sales del editor con cambios sin guardar, Nodestro pregunta si quieres guardarlos, descartarlos o **Seguir editando**.
- Deshacer recuerda hasta 80 pasos. Mover un nodo es un paso, igual que escribir en un campo hasta que cambias a otro campo o nodo. El nombre, la descripción y el presupuesto del flujo también cuentan. Si deshaces todo hasta el estado guardado, ya no quedan cambios sin guardar.

- **Eliminar conexiones:** Haz clic en una conexión. Se resalta, y **Supr** o **Retroceso** la elimina. Mientras escribes en un campo de entrada, estas teclas solo borran texto. Eliminar una conexión también se puede deshacer.
- En ventanas estrechas (menos de 1100 píxeles de ancho), la barra **Bloques** empieza plegada; después se aplica la distribución que elegiste por última vez.

## Guardar y descartar {#speichern}
<!-- keywords: guardar, descartar, sin guardar, descartar cambios, restablecer -->

**Guardar** (o **Ctrl+S**) conserva el estado actual y crea una nueva [versión](/docs/workflows#versionen). Mientras haya cambios sin guardar, la barra de título muestra **Descartar**.

**Descartar** desecha todos los cambios sin guardar, incluido el historial de deshacer/rehacer, y vuelve a cargar el último estado guardado. Lo mismo ocurre si sales del editor y eliges **Descartar** en el diálogo: la próxima vez que lo abras aparecerá exactamente el flujo de trabajo guardado.

**Cambiado en otro lugar:** antes de guardar, Nodestro comprueba si el flujo se ha guardado mientras tanto en otro lugar, en otra pestaña o por otra persona. En ese caso pregunta el diálogo **Cambiado en otro lugar**, en lugar de sustituir el otro cambio sin decir nada:

- **Cargar versión guardada:** el editor muestra el estado guardado; tus cambios sin guardar de aquí se pierden.
- **Conservar el mío como copia:** tu estado se convierte en un flujo nuevo «… (mi copia)»; el guardado se queda como está.
- **Guardar el mío de todos modos:** tu estado sustituye al otro cambio.
- **Seguir editando:** no se guarda nada.

Nada se pierde definitivamente: cada guardado se conserva en [Versiones](/docs/workflows#versionen).

## Versiones {#versionen}
<!-- keywords: versión, versiones, historial, restaurar, volver, estado anterior -->

Cada guardado que cambia algo se conserva como **versión** numerada con fecha y hora. **Versiones**, en el menú **Más acciones** de la barra de título, abre el historial:

- **Guardar como versión** guarda los cambios actuales con una descripción opcional («antes de rehacer la investigación»).
- Con el icono del lápiz añades o cambias la descripción de una versión.
- **Diferencias** muestra qué cambiaría respecto al estado del editor: agentes, conexiones, nombre y ajustes.
- **Restaurar** devuelve el flujo de trabajo a esa versión y guarda el resultado como **versión nueva**. Ninguna versión se sobrescribe ni se elimina. Si hay cambios sin guardar, eliges **Guardar primero y restaurar** (los cambios pasan antes a ser una versión propia) o **Restaurar sin guardar**.

Las versiones son independientes de deshacer/rehacer, que solo vale dentro de una sesión en el editor. Las ejecuciones usan siempre el estado del momento de inicio. Si se elimina un flujo de trabajo, también se eliminan sus versiones. Arriba del historial aparece el **resultado de pruebas** de la versión guardada en cada serie de pruebas del flujo (como al [publicar](/docs/api-und-export#veroeffentlichen)).

## Importar y exportar {#import-export}
<!-- keywords: exportar, importar, json, archivo, compartir, copia de seguridad, .nodestro.json, no es un flujo, archivo no válido -->

- **Exportar como archivo** (en el editor, en **Más acciones**) guarda el flujo como `<Nombre>.nodestro.json`: todos los nodos, conexiones, posiciones y ajustes de agentes, además del presupuesto.
- **Importar** (en la página *Flujos de trabajo*) carga un archivo así como **copia nueva** con un ID nuevo. Los flujos existentes nunca se sobrescriben. Si el archivo no tiene nombre, el flujo se llama como el archivo.

Nodestro comprueba el archivo antes de crear nada. Si no es una exportación de un flujo (por ejemplo, otro archivo JSON, un archivo sin pasos o con conexiones rotas), no se importa nada y el mensaje indica el motivo, por ejemplo que el archivo no tiene pasos («nodes»).

**No se incluyen** los archivos de conocimiento, los espacios de memoria ni las herramientas propias; el archivo solo hace referencia a sus ID y nombres. En otro ordenador tienen que existir allí; si no, la comprobación indica, por ejemplo, «Herramientas desconocidas».

Exportar un flujo y exportar una traza son cosas distintas: un flujo describe el proceso; una traza, una ejecución concreta con sus resultados (consulta [Importar trazas](/docs/ausfuehrungen#trace-import)).

## Ejemplos {#beispiele}
<!-- keywords: ejemplo, plantilla, patrón, pipeline, receta, caso de uso -->

**Lineal: investigación → análisis → revisión (ejemplo «Análisis financiero»)**

1. *Research Agent* (Sonnet, esfuerzo bajo) extrae todas las cifras con periodo y unidad.
2. *Analysis Agent* recibe la herramienta `calculator` y calcula con exactitud el crecimiento y los márgenes. Tarea: `Calcula las cifras clave a partir de estos resultados de investigación: {{Research Agent}}`.
3. *Review Agent* revisa el análisis y devuelve un **resultado estructurado** con `summary`, `key_figures`, `issues` y `approved`.

**Ramificar y unir (ejemplo «Artículo de blog»)**

1. Inicio con el tema.
2. *Público* y *Esquema* se ejecutan en paralelo.
3. *Redactor* une ambos (`{{Público}}`, `{{Esquema}}`) y tiene un **control de calidad** con los criterios «sigue el esquema» y «responde a las preguntas del público».

**Clasificar y responder**

1. *Clasificación* (Haiku, salida estructurada con `category`, `urgency` como número entero y `reason`).
2. *Respuesta* (Sonnet) recibe la clasificación como JSON y la solicitud original mediante `{{run.input}}`.

## Limitaciones {#grenzen}
<!-- keywords: límites, limitaciones, bucles, condiciones, if, loop, ramificación -->

- **Bucles solo con límite:** un flujo de trabajo es un grafo dirigido; los pasos solo se repiten mediante [bucles](/docs/verzweigungen#schleifen) de 20 rondas como máximo. Fuera de los bucles, cada nodo se ejecuta como máximo una vez por ejecución. Las condiciones se construyen con [decisiones](/docs/verzweigungen#entscheidung); los nodos de las ramas no elegidas se omiten.
- **Continuar en lugar de repetir:** una ejecución fallida o cancelada se puede [continuar](/docs/verzweigungen#fortsetzen); se crea una ejecución nueva y vinculada.
- **Una ejecución a la vez por flujo en el editor:** mientras haya una ejecución activa, *Iniciar flujo de trabajo* está bloqueado. Para iniciar muchas ejecuciones a la vez, usa una [ejecución por lotes](/docs/automatisierung#stapel).
- **Estado en el momento del inicio:** los cambios durante una ejecución solo surten efecto en la siguiente.
