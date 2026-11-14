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
