# Términos

Los términos más importantes de Nodestro, cada uno explicado brevemente con el capítulo que da más detalles. Aquí se distinguen expresamente los términos parecidos.

## Flujo de trabajo {#flujo de trabajo}
<!-- keywords: flujo de trabajo, workflow, nodo, conexión, inicio, resultado -->

Un **flujo de trabajo** es una secuencia de nodos: un inicio, agentes, decisiones, aprobaciones y un resultado. Las conexiones deciden qué paso recibe los resultados de qué otro paso. Más en [Nodos](/docs/workflows#knoten).

## Agente {#agent}
<!-- keywords: agente, ia, modelo, prompt de sistema, tarea, biblioteca -->

Un **agente** es un paso en el que un modelo de IA realiza una tarea: con prompt de sistema, tarea y, opcionalmente, herramientas, conocimiento y memoria. Los agentes de la **biblioteca de agentes** son plantillas; cada flujo de trabajo usa su propia copia. Más en [Agentes](/docs/agenten#grundlagen).

## Herramienta {#tool}
<!-- keywords: herramienta, tool, función, sandbox -->

Una **herramienta** es una función que un agente puede llamar mientras trabaja, como una calculadora o tu propio código Python. El modelo decide cuándo usarla; tus propias herramientas se ejecutan en un sandbox. Más en [Herramientas](/docs/tools#ueberblick).

## Conocimiento {#wissen}
<!-- keywords: conocimiento, documentos, permanente, búsqueda -->

El **conocimiento** son documentos que quedan guardados y se asignan a agentes, por ejemplo un manual o una lista de precios. Están disponibles en cada ejecución de esos agentes hasta que los eliminas. Más en [Conocimiento](/docs/wissen#ueberblick).

## Archivo de entrada {#eingabedatei}
<!-- keywords: archivo de entrada, archivo, subir, ejecución, único, diferencia conocimiento -->

Un **archivo de entrada** se sube al iniciar una ejecución, por ejemplo el contrato que se va a revisar. Pertenece solo a esa ejecución y no pasa al conocimiento. Lo que necesitan varias ejecuciones va al conocimiento. Más en [¿Entrada o conocimiento?](/docs/datei-eingaben#eingabe-oder-wissen).

## Memoria {#memory}
<!-- keywords: memoria, memory, notas, espacio de memoria -->

La **memoria** son notas que un agente escribe y lee por sí mismo. *Por ejecución* dura una ejecución; *permanente* vive en un espacio de memoria y se mantiene entre ejecuciones. A diferencia del conocimiento, la memoria la escribe el propio agente. Más en [Tipos de memoria](/docs/memory#arten).

## Ejecución {#ausfuehrung}
<!-- keywords: ejecución, run, estado, resultado -->

Una **ejecución** es una pasada de un flujo de trabajo con una entrada concreta. Tiene un estado, costes, un resultado y una vista de detalle para cada paso. Más en [Estado](/docs/ausfuehrungen#status).

## Versión {#version}
<!-- keywords: versión, guardar, historial, restaurar -->

Cada guardado que cambia algo crea una **versión** numerada del flujo de trabajo. Puedes ver, comparar y restaurar versiones anteriores. Más en [Versiones](/docs/workflows#versionen).

## Publicación (versión de la API) {#veroeffentlichung}
<!-- keywords: publicación, release, versión de la api, publicar, api -->

**Publicar** congela una versión guardada como API. Cada publicación recibe su propio número; los cambios posteriores en el editor no la modifican. Las herramientas se congelan con ella; la API lee el conocimiento y la memoria permanente en vivo. Más en [Publicar](/docs/api-und-export#veroeffentlichen).

## Serie de pruebas {#testreihe}
<!-- keywords: serie de pruebas, prueba, caso de prueba, regla de comprobación, calidad -->

Una **serie de pruebas** contiene casos de prueba fijos con entradas y reglas de comprobación para un flujo de trabajo. Una ejecución de prueba los ejecuta contra una versión concreta y muestra cuántos casos se superaron. Más en [Series de pruebas](/docs/automatisierung#testreihen).

## Aprobación {#freigabe}
<!-- keywords: aprobación, persona, aprobar, rechazar -->

Una **aprobación** es un paso en el que la ejecución se detiene hasta que una persona aprueba o rechaza el resultado obtenido hasta ese momento. Más en [Aprobación](/docs/verzweigungen#freigabe).
