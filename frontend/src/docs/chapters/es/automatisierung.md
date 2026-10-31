# Automatización

En *Automatización*, en la navegación, los flujos de trabajo se ejecutan sin pulsar *Iniciar*: las **ejecuciones por lotes** procesan muchas entradas a la vez, las **series de pruebas** miden la calidad de un flujo y las **programaciones** inician flujos con regularidad. Cada ejecución individual es una ejecución normal con traza, presupuesto y uso; las aprobaciones esperan a una persona como siempre.

## Ejecuciones por lotes {#stapel}
<!-- keywords: lote, batch, muchas entradas, csv, excel, xlsx, json, tabla, columnas, asignación, exportar -->

Una **ejecución por lotes** ejecuta un flujo de trabajo para cada fila de una tabla, por ejemplo para 200 consultas de clientes.

1. En la página **Ejecuciones por lotes**, elige *Nueva ejecución por lotes* y selecciona el flujo de trabajo.
2. Sube una tabla: CSV (coma o punto y coma), Excel (XLSX) o JSON (una lista de objetos), como máximo 1000 filas y 10 MB.
3. Asigna cada columna a un campo del [formulario de entrada](/docs/verzweigungen#eingabeformular) o a la entrada libre, o ignórala. Nodestro propone asignaciones adecuadas.
4. La vista previa cuenta las filas válidas y no válidas y muestra el coste estimado. Las filas no válidas no se ejecutan.
5. Inicia. La página de detalle muestra el progreso, los costes y cada fila con su estado y un enlace a su ejecución.

Un lote se puede **pausar** (las ejecuciones en curso terminan, no empiezan nuevas), **continuar** y **cancelar**. Un error en una fila no detiene las demás. Si Nodestro se cerró durante un lote, este queda *interrumpido* y se puede continuar. Los resultados se descargan como CSV o JSON.

## Límites, costes y herramientas propias {#grenzen}
<!-- keywords: límites, límite de coste, límite de errores, simultáneas, paralelo, estimación, coste, rate limit, herramientas propias -->

- **Simultáneas:** cuántas ejecuciones corren en paralelo (de 1 a 8). Más es más rápido, pero puede alcanzar los límites de frecuencia de la API.
- **Límite de coste (USD):** el lote se detiene en cuanto se alcanza la suma. Además, el [presupuesto por ejecución](/docs/workflows#budget) se aplica a cada ejecución individual.
- **Errores como máximo:** el lote se detiene tras ese número de ejecuciones fallidas.
- **Coste estimado:** a partir de las últimas ejecuciones correctas del flujo, multiplicado por el número de ejecuciones. Si aún no hay ninguna ejecución correcta, Nodestro solo indica el máximo: presupuesto por número de ejecuciones.
- Las **herramientas propias** que pueden actuar fuera de Nodestro (como enviar mensajes) se llamarían en cada ejecución. Tienes que confirmarlo expresamente antes de iniciar.
- Las ejecuciones que esperan una **aprobación** no ocupan plaza; continúan en cuanto alguien decide.

Los costes de todas las ejecuciones aparecen como siempre en [Uso](/docs/nutzung), cada uno contado una sola vez.

## Series de pruebas {#testreihen}
<!-- keywords: serie de pruebas, benchmark, caso de prueba, regla de comprobación, calidad, regresión, resultado esperado, superado -->

Una **serie de pruebas** pertenece a un flujo de trabajo y contiene **casos de prueba** fijos: una entrada (valores de formulario, texto libre, archivos), **reglas de comprobación** para el resultado y, opcionalmente, criterios para una [evaluación por IA](/docs/automatisierung#ki-bewertung).

- Las reglas de comprobación usan las mismas comparaciones que las [decisiones](/docs/verzweigungen#regeln), por ejemplo `category es igual a complaint` o `total mayor que 100`. Son exactas y no cuestan nada.
- *Ejecutar serie de pruebas* elige la versión del flujo (estado actual o una anterior), los límites como en los lotes y si la IA debe evaluar.
- Un caso está **superado** si su ejecución tuvo éxito, se cumplen todas las reglas de comprobación y, si se evaluó, la IA lo dio por bueno.
- La evaluación muestra la tasa de superación, la evaluación por IA, tokens, costes y duración, además de los detalles de cada caso.

Una serie de pruebas tiene como máximo 200 casos. Los casos no válidos (por ejemplo, un campo obligatorio sin valor) se notifican antes de iniciar y se omiten.

## Evaluación por IA {#ki-bewertung}
<!-- keywords: evaluación por ia, juez, llm as judge, criterios, evaluación, puntuación -->

En los casos con criterios (uno por línea), un modelo de IA aparte evalúa el resultado, opcionalmente frente a un **resultado esperado**. El predeterminado es el modelo de los asistentes de IA; en la serie de pruebas puedes elegir un modelo propio de cualquier proveedor configurado.

El veredicto aparece siempre marcado como **evaluación por IA** y no sustituye a una regla de comprobación. Tiene un coste adicional, que aparece en la evaluación y en [Uso](/docs/nutzung) como *Evaluación por IA de series de pruebas*.

## Comparar ejecuciones de prueba {#testreihen-vergleichen}
<!-- keywords: comparar, comparar versiones, mejor, peor, regresión, antes después -->

Elige dos ejecuciones en la lista de ejecuciones de prueba y pulsa *Comparar*. La tabla muestra la tasa de superación de ambas y, para cada caso, si se superó, marcado como **mejor**, **peor**, **igual** o **cambiado**.

Así compruebas después de cada cambio en agentes, prompts o herramientas si el flujo ha mejorado, y puedes probar una [versión](/docs/workflows#versionen) anterior frente al estado actual.

## Comparar modelos {#modelle-vergleichen}
<!-- keywords: comparar modelos, otro modelo, más barato, más rápido, elección de modelo, variante -->

Si un modelo más barato o más potente basta para un agente, lo compruebas con la misma serie de pruebas. En el diálogo de inicio, activa **Probar otros modelos** y elige otro modelo para algunos agentes. Los casos de prueba y la evaluación por IA no cambian, y el flujo guardado tampoco.

Una ejecución así necesita un **límite de coste** en [Límites](/docs/automatisierung#grenzen), porque las ejecuciones anteriores usaron otros modelos y no dicen nada del coste. En la lista lleva la etiqueta **Comparación de modelos** y nombra los modelos sustituidos. Después compárala con una ejecución de la versión guardada. No cuenta como resultado de prueba de esa versión, porque probó una variante. Si un modelo encaja, ponlo en el propio agente.

## Programaciones {#zeitplaene}
<!-- keywords: programación, schedule, cron, periódico, diario, semanal, mensual, cada hora, zona horaria, perdido -->

Una **programación** inicia un flujo de trabajo una vez o con regularidad, con entradas fijas (valores de formulario, texto, archivos).

- **Ritmo:** una vez, cada pocas horas, a diario, los días de la semana elegidos o cada mes un día concreto (en los meses más cortos, el último día).
- **Zona horaria:** las horas valen en la zona horaria elegida, también con el cambio de hora. Una hora que no existe al adelantar el reloj se ejecuta una hora más tarde; una que se repite al retrasarlo se ejecuta una vez.
- **Próximos inicios:** el diálogo muestra las próximas fechas antes de guardar.
- **Desactivada hasta que la actives:** una programación nueva está desactivada. Al activarla, Nodestro comprueba todo lo que necesita una ejecución: el flujo, las entradas, un [presupuesto por ejecución](/docs/einstellungen#budget) y la confirmación de herramientas propias. Si no supera la comprobación, sigue desactivada y se muestra el motivo.

Las programaciones solo funcionan mientras Nodestro está en marcha. Las horas que pasaron mientras Nodestro estaba cerrado cuentan como **perdidas**: *Omitir* las ignora, *Recuperar una vez* inicia una sola ejecución en el siguiente arranque, sin importar cuántas se perdieran. Las ejecuciones de programaciones llevan el origen *Programación* en [Ejecuciones](/docs/ausfuehrungen#liste).
