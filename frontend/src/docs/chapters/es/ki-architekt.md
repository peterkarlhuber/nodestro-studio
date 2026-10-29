# Arquitecto de flujos con IA

El arquitecto de flujos diseña un flujo multiagente completo a partir de una descripción en lenguaje natural, o revisa uno existente. Planifica los agentes, escribe sus prompts, elige modelos, herramientas, conocimiento y memoria, lo conecta todo y comprueba el resultado. Solo propone: nada se guarda, se sobrescribe ni se ejecuta sin tu decisión.

## Resumen {#ueberblick}
<!-- keywords: arquitecto, ia, borrador, generar, automático, crear flujo, asistente -->

Encuentras el arquitecto en dos lugares:

- **Crear con IA** en el diálogo de un flujo nuevo en la página *Flujos de trabajo*.
- **Arquitecto IA** en la barra del editor, con los modos **Diseñar un flujo nuevo** y **Revisar este flujo**.

Ambos usan la misma lógica. El arquitecto trabaja en ocho pasos: analizar requisitos, planificar la arquitectura, revisar recursos, configurar agentes, redactar herramientas, crear conexiones, validar el flujo y presentar el borrador. Para validar usa la misma [comprobación antes de iniciar](/docs/workflows#pruefung) que el editor.

Construye lo más simple posible: solo los agentes que la tarea necesita, y pasos en paralelo solo donde son realmente independientes. Cuando la tarea lo requiere, también planifica [decisiones, aprobaciones](/docs/verzweigungen), un formulario de entrada y archivos de resultado; no hay bucles. Si prefieres partir de una plantilla lista, mira los [ejemplos](/docs/beispiele).

El camino manual no cambia: puedes seguir creando y editando cualquier flujo sin IA.

## Crear un flujo nuevo {#neu-erstellen}
<!-- keywords: nuevo, crear, descripción, proyecto, crear con ia -->

Describe lo que quieres: el objetivo, las entradas, los resultados esperados y las restricciones importantes. Los detalles que falten los completa el arquitecto con suposiciones que te muestra después. **Diseñar flujo** lo inicia.

Al final ves el borrador para revisarlo. **Crear flujo** lo guarda como flujo nuevo con la versión 1 en el [historial de versiones](/docs/workflows#versionen) y lo abre en el editor. Antes puedes cambiar el nombre. El flujo nuevo es igual que uno [creado a mano](/docs/workflows#anlegen) y nunca se ejecuta automáticamente.

## Revisar un flujo existente {#ueberarbeiten}
<!-- keywords: revisar, cambiar, ampliar, añadir agente, revisión, diff, deshacer -->

En el editor eliges **Revisar este flujo** y describes el cambio, por ejemplo: «Añade antes del resultado un agente que revise de forma crítica los análisis anteriores». El arquitecto tiene en cuenta los agentes, ajustes y conexiones del flujo, incluidos los cambios sin guardar del editor.

Solo cambia lo que pide la descripción. Los agentes que no menciona se conservan sin cambios, con sus prompts, herramientas y posiciones. La propuesta es un borrador aparte; la vista **Cambios** muestra los agentes añadidos, modificados y eliminados con los campos cambiados, y las conexiones nuevas y eliminadas.

**Aplicar cambios** aplica el borrador en el editor como un único paso que **Deshacer** revierte por completo. No se guarda nada hasta que [guardas](/docs/workflows#speichern); la nueva versión del [historial de versiones](/docs/workflows#versionen) recibe entonces automáticamente una nota sobre la revisión con IA.

Si tienes cambios sin guardar, la revisión ofrece **Guardar antes el estado actual como versión**. Si el flujo se modificó en el editor mientras el arquitecto trabajaba, la revisión te avisa antes de aplicar.

## Seguir el progreso {#fortschritt}
<!-- keywords: progreso, en vivo, actividad, registro, pasos, vista previa, grafo, marcas -->

Mientras el arquitecto trabaja, ves tres cosas:

- **Pasos:** cuáles de los ocho pasos están hechos y cuál está en curso.
- **Actividad:** un registro de lo que realmente ocurrió, por ejemplo qué roles se planificaron, qué herramientas existentes se encontraron o qué conexiones se corrigieron.
- **Vista previa del flujo:** el flujo crece en vivo. Las marcas indican qué agentes son nuevos, modificados, sin cambios, eliminados o aún en configuración.

Todo lo que se muestra se basa en eventos reales del servidor. No hay porcentajes estimados ni estados intermedios inventados, y no se muestra el razonamiento interno del modelo.

## Preguntas y suposiciones {#rueckfragen}
<!-- keywords: pregunta, suposición, ambiguo, idioma, poco claro -->

El arquitecto solo pregunta cuando sin la respuesta no es posible un flujo razonable. Entonces respondes con **Responder y continuar** o le dejas decidir con **Continuar con suposiciones**. En todos los demás casos hace suposiciones y las enumera en la revisión.

Escribe prompts, nombres y descripciones en el idioma de la interfaz (ver [Idioma](/docs/einstellungen#sprache)), salvo que tu descripción pida expresamente otro. Los identificadores técnicos, los nombres de campo de la salida estructurada, los nombres de herramientas y el código se quedan en inglés. Al revisar nunca traduce el contenido existente.

## Revisar el borrador {#pruefen}
<!-- keywords: revisión, comprobación, validación, borrador, aceptar, descartar, garantía -->

La revisión muestra:

- **Resumen:** los requisitos analizados, las suposiciones, el coste y el resultado de la validación con todos los avisos.
- **Cambios** (solo al revisar): qué cambia respecto al flujo del editor.
- **Agentes:** rol, modelo, prompt de sistema, tarea, herramientas, conocimiento, memoria y salida estructurada de cada agente.
- **Flujo de datos:** qué resultados recibe cada agente; las tareas se refieren a ellos con [marcadores](/docs/workflows#platzhalter).
- **Herramientas:** nuevos borradores de herramientas con código y pruebas.

Los problemas que se pueden resolver sin IA, como conexiones que faltan o marcadores incorrectos, los corrige el propio arquitecto. Lo que aún bloquea después lo hace corregir por la IA, pero solo un número limitado de veces. Los problemas restantes aparecen en la revisión.

Una [comprobación](/docs/workflows#pruefung) superada significa que el flujo puede ejecutarse técnicamente. No garantiza resultados correctos: lee los prompts y prueba el flujo con entradas reales. **Descartar borrador** elimina el borrador junto con sus borradores de herramientas; **Cambiar descripción** inicia un borrador nuevo.

## Aprobar herramientas nuevas {#tools-freigeben}
<!-- keywords: herramienta, borrador, aprobación, código, sandbox, probar, registrar, seguridad -->

El arquitecto prefiere las herramientas existentes. Solo si ninguna sirve y **Escribir como borrador las herramientas que falten** está activado, escribe una herramienta Python nueva con pruebas. El código solo se comprueba de forma estática y nunca se ejecuta, ni siquiera en el [sandbox](/docs/tools#sandbox).

Un borrador de herramienta no está registrado. Ves el código y las pruebas en la revisión y en *Herramientas*, en los borradores de herramientas. **Probar en sandbox** ejecuta las pruebas; **Aprobar y registrar** vuelve a probar y añade la herramienta a la biblioteca solo si las pruebas pasan, igual que la [aprobación](/docs/tools#freigabe) normal. **Rechazar** elimina el borrador.

Mientras una herramienta no esté aprobada, la comprobación marca el flujo como bloqueado y no se puede iniciar. Las reglas de seguridad existentes para código propio siguen igual. Las asignaciones de conocimiento y memoria también son solo propuestas que cambias en el editor.

## Costes y límites {#kosten}
<!-- keywords: coste, límite, presupuesto, correcciones, uso, precio, usd -->

Cada borrador llama varias veces a la IA: para el análisis, el plan, cada agente, los borradores de herramientas y las correcciones. El coste hasta el momento lo ves en vivo en el progreso y en la revisión. Cada llamada aparece exactamente una vez en el [resumen de uso](/docs/nutzung#statistik) bajo *Arquitecto de flujos*, desglosada por paso.

En *Ajustes*, junto a los [modelos](/docs/einstellungen#modelle), fijas el **límite de coste** por borrador (vacío significa sin límite) y cuántas **correcciones con IA** se permiten (0 a 5). Al alcanzar el límite, el arquitecto se detiene. Nunca inicia una ejecución de flujo ni llama a servicios externos de pago.

## Cancelar {#abbrechen}
<!-- keywords: cancelar, detener, cerrar, descartar, seguro -->

**Cancelar generación** detiene el arquitecto en cualquier momento. No se guarda nada ni se modifica ningún flujo; el coste generado hasta entonces sigue en el resumen de uso. Si cierras el diálogo durante la revisión, Nodestro pregunta antes de descartar el borrador.

## Límites {#grenzen}
<!-- keywords: límites, restricciones, máximo, agentes, bucles -->

- Un borrador tiene como máximo diez agentes; los ciclos en el flujo se eliminan.
- Se aplican las mismas [restricciones](/docs/workflows#grenzen) que a cualquier flujo: sin bucles. El arquitecto no planifica subflujos; añádelos tú si los necesitas.
- El arquitecto solo conoce lo que hay en tu descripción, el flujo y la biblioteca. La corrección del contenido debes comprobarla tú.
