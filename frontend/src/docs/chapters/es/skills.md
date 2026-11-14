# Skills

Las skills son instrucciones en el formato abierto Agent Skills que un agente carga cuando su tarea las necesita. Este capítulo explica qué contiene una skill, cómo importas y editas skills y qué hace Nodestro para que sean seguras.

## Qué es una skill {#ueberblick}
<!-- keywords: skill, agent skills, SKILL.md, instrucciones, cabecera, front matter, referencias -->

Una skill es una carpeta con un archivo `SKILL.md` y, opcionalmente, más archivos en `scripts/`, `references/` y `assets/`. `SKILL.md` empieza con una cabecera (nombre, descripción y campos opcionales como licencia o compatibilidad), seguida de las instrucciones en Markdown. La descripción le dice al modelo cuándo es útil la skill.

Todas las skills del espacio de trabajo están en la página [Skills](/skills). Cada tarjeta muestra el estado, la versión, el origen (propia, importada o incluida) y si la skill contiene scripts. Asignas una skill a un agente en una versión fija, como se describe en la [biblioteca de agentes](/docs/agenten#bibliothek); una versión más nueva nunca se usa automáticamente.

## Importar una skill {#import}
<!-- keywords: importar, zip, SKILL.md, informe de validación, prueba, nueva versión -->

Elige **Importar skill** y luego un archivo ZIP con una carpeta de skill o un único archivo `SKILL.md`. Nodestro comprueba primero el archivo y todavía no guarda nada. El informe de validación enumera los **errores**, que impiden la importación, y las **advertencias**, que solo informan, por ejemplo sobre un nombre que no sigue la especificación o sobre scripts. Debajo ves el nombre, la descripción, las instrucciones y los archivos que guardaría la importación.

Si ya existe una skill con el mismo nombre, la importación guarda el archivo como la siguiente versión de esa skill en lugar de crear otra.

## Versiones, edición y estado {#versionen}
<!-- keywords: versión, editar, copiar, renombrar, exportar, activar, desactivar, archivar, eliminar -->

Cada cambio se guarda como una nueva versión; guardar sin cambios mantiene la versión. En los detalles de una skill puedes editar el texto de `SKILL.md` (los demás archivos no cambian), ver versiones anteriores, saber qué agentes usan la skill y descargar cualquier versión como archivo ZIP.

El nombre de una skill no se puede cambiar editándola: copia la skill con un nombre nuevo. Una skill **desactivada** sigue asignada, pero los agentes que la usan no se ejecutan hasta que la vuelvas a activar. Una skill que los agentes todavía usan no se puede eliminar; **archívala**. Archivar y eliminar están reservados a los administradores.

## Seguridad {#sicherheit}
<!-- keywords: seguridad, no fiable, scripts, allowed-tools, credenciales, inyección de prompt -->

Una skill importada procede de una fuente desconocida. Nodestro entrega sus instrucciones al modelo como contenido no fiable, y los scripts de una skill **nunca se ejecutan**. Una skill nunca concede herramientas: el campo `allowed-tools` se muestra, pero se ignora, y las herramientas vienen únicamente de los ajustes del agente. Revisa el contenido de una skill importada antes de usarla con herramientas que escriben o cambian datos. Si un archivo parece contener credenciales, el informe de validación te avisa; quítalas antes de compartir o exportar la skill.

## Grupos de skills {#gruppen}
<!-- keywords: grupo, grupo de skills, añadir grupo, miembros, departamento -->

Un grupo reúne skills que suelen usarse juntas, por ejemplo todas las skills de un departamento. En la página [Skills](/skills), cambia a **Grupos** para crear, editar y eliminar grupos y elegir sus skills.

En los ajustes de un agente, **Añadir grupo** añade cada skill activa del grupo que el agente todavía no tiene: cada una en su versión actual y cargada cuando hace falta. Se omiten las skills desactivadas o archivadas y las que el agente ya tiene. El grupo es solo una etiqueta: cada skill sigue asignada por separado, y un cambio posterior en el grupo no cambia el agente.

## Muchas skills: preselección {#vorauswahl}
<!-- keywords: preselección, muchas skills, límite, 100, más adecuadas, puntuación, BM25 -->

Un agente puede tener hasta 100 skills. Mientras como máximo 20 de ellas se carguen cuando hace falta, cada paso le ofrece todas al agente. Con más de 20, cada paso ofrece solo las 8 skills que mejor encajan con la tarea, además de cada skill marcada como **Siempre** y cada skill que haya recomendado un orquestador. Nodestro compara la tarea con el nombre y la descripción de cada skill, así que una descripción clara ayuda.

En los detalles de una ejecución, **Selección de skills** muestra para cada paso qué skills se ofrecieron y si hubo una preselección. En una preselección, también muestra la puntuación de cada skill.

## Recomendaciones del orquestador {#empfehlungen}
<!-- keywords: orquestador, recomendación, skills recomendadas, equipo, ejecución de equipo -->

Un orquestador puede recomendar skills cuando inicia un equipo. A los agentes del equipo se les ofrecen entonces siempre esas skills, si las tienen. Una recomendación nunca asigna una skill: una skill recomendada que un agente no tiene aparece como no asignada en la selección de skills. Los detalles de una ejecución de equipo muestran arriba las skills recomendadas.

## Uso {#nutzung}
<!-- keywords: uso, estadísticas, cargada, ofrecida, tasa de éxito, comprobaciones, último uso -->

En la página [Skills](/skills), **Uso** muestra para los últimos 7, 30 o 90 días cuántas veces se ofreció y se cargó cada skill, en cuántas ejecuciones, cuántas de esas ejecuciones terminaron bien, cuántas comprobaciones de calidad se superaron y cuándo se usó la skill por última vez. Las cifras son un indicio, no una prueba: una skill cargada en una ejecución correcta no causó necesariamente el éxito.

## Convertir scripts en herramientas {#skripte}
<!-- keywords: script, herramienta, agente de programación, sandbox, Docker, aprobar, revisar, origen -->

Los scripts de una skill nunca se ejecutan. Para usar uno de todos modos, elige **Usar como herramienta …** junto al archivo en `scripts/`. El agente de programación escribe entonces una herramienta con pruebas a partir del script. Las pruebas se ejecutan solo en el sandbox aislado de Docker; sin él, no se inicia nada. Después, una persona revisa el código y las pruebas en la página [Herramientas](/tools) y aprueba la herramienta. Hasta entonces, ningún agente puede usarla. La herramienta muestra de qué script de skill procede.
