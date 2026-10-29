# Memoria

Con la memoria, un agente recuerda cosas más allá de una sola tarea: preferencias, decisiones, avances o reglas aprendidas. Este capítulo explica los tipos de memoria, los espacios de memoria y el explorador de memoria.

## Cómo funciona la memoria {#ueberblick}
<!-- keywords: memoria, memory, herramienta de memoria, /memories, notas, recordar -->

Nodestro usa la **herramienta de memoria** de Orkexa: con modelos de Anthropic, la herramienta de memoria propia de Anthropic; con otros proveedores, una herramienta normal con los mismos comandos (el modelo tiene que admitir herramientas). Un agente con memoria recibe un pequeño sistema de archivos en `/memories` en el que crea, lee, modifica, renombra y borra archivos de texto por sí mismo. El modelo decide qué recordar: normalmente consulta su memoria al empezar una tarea y anota lo nuevo después.

La memoria es **texto plano** (casi siempre Markdown). Para documentos originales como los PDF está el [Conocimiento](/docs/wissen).

## Tipos de memoria {#arten}
<!-- keywords: desactivada, por ejecución, permanente, persistent, ephemeral, modo -->

| Tipo | Duración | Compartir | Uso |
|---|---|---|---|
| **Desactivada** | – | – | El agente no recuerda nada más allá de la tarea (predeterminado). |
| **Por ejecución** | una ejecución | no, cada agente tiene la suya | Bloc de notas para tareas largas con muchas rondas de herramientas; después, las notas aparecen en la ejecución. |
| **Permanente** | hasta que la borres | sí, mediante el espacio de memoria | Conocimiento que crece a lo largo de muchas ejecuciones: preferencias de clientes, estado de proyectos, decisiones. |

## Memoria por ejecución {#pro-lauf}
<!-- keywords: por ejecución, ephemeral, bloc de notas, scratchpad, pestaña memoria -->

Con *Por ejecución*, el agente empieza cada ejecución con la memoria vacía. Lo que anota aparece en la ejecución, junto al agente, en la pestaña **Memoria**. Los demás agentes de la misma ejecución no ven esas notas; la información entre agentes fluye por las [conexiones](/docs/workflows#datenfluss).

## Memoria permanente y espacios de memoria {#dauerhaft}
<!-- keywords: permanente, espacio de memoria, space, compartir, común, persistent, namespace -->

Con *Permanente* eliges un **espacio de memoria**. Un espacio es un sistema de archivos `/memories` propio dentro de la base de datos de Nodestro. Se conserva entre ejecuciones y reinicios.

- **Crear un espacio nuevo:** en el inspector, escribe un nombre en *Nuevo espacio de memoria* y haz clic en **Crear**, o usa **Nueva memoria** en la página *Memoria*. Se permiten letras, cifras, espacios, `_`, `.` y `-` (como máximo 64 caracteres).
- **Compartir:** varios agentes con el mismo espacio leen y escriben los mismos archivos, incluso en flujos de trabajo distintos. Así, por ejemplo, un agente puede anotar los deseos de los clientes y otro tenerlos en cuenta.
- Un espacio creado en el inspector aparece en la página *Memoria* en cuanto el agente escribe su primer archivo.

Si dos agentes con el mismo espacio se ejecutan en paralelo, acceden por turnos; cada cambio individual es completo, pero pueden sobrescribirse el contenido. Da a los agentes paralelos archivos o espacios distintos.

## El explorador de memoria {#browser}
<!-- keywords: página de memoria, explorador, editar, crear archivo, vaciar, ver contenido -->

La página **Memoria** muestra todos los espacios con el número y el tamaño de sus archivos. Elige un espacio para ver sus archivos:

- **Ver y editar un archivo:** elige el archivo, cambia el texto y pulsa **Guardar**.
- **Crear un archivo:** escribe una ruta (por ejemplo `clientes/preferencias.md`); se crea dentro de `/memories`.
- **Eliminar un archivo:** símbolo de la papelera junto a la ruta.
- **Vaciar un espacio:** elimina definitivamente todos los archivos del espacio tras confirmarlo.

Así puedes revisar, corregir o rellenar la memoria en cualquier momento. En el inspector, **Ver contenido** lleva directamente al espacio del agente.

## Configurar la memoria con IA {#assistent}
<!-- keywords: asistente de memoria, configurar con ia, propuesta, estructura, archivos iniciales -->

**Configurar con IA** (en el inspector, con *Permanente*) propone una estructura inicial:

1. Describe qué debe recordar el agente, por ejemplo «las preferencias de cada cliente, las decisiones tomadas y los puntos pendientes de cada proyecto».
2. El asistente de memoria (el modelo de asistentes de los ajustes) propone de dos a cinco archivos con contenido, entre ellos un `README.md` que explica la estructura al agente. No inventa datos, sino que deja marcadores.
3. Revisa y edita las propuestas, elige el espacio y haz clic en **Guardar en el espacio**. El agente queda configurado con ese espacio.

No se guarda nada hasta que lo confirmas. La propuesta cuesta una solicitud al modelo de los asistentes.

Los archivos propuestos se redactan en el idioma de la interfaz, salvo que tu descripción pida otro. Los nombres de archivo siguen en inglés.

## Casos de uso {#anwendungsfaelle}
<!-- keywords: casos de uso, ejemplos, clientes, proyecto, aprender, preferencias -->

- **Atención al cliente:** un agente recuerda preferencias y consultas anteriores de cada cliente en `customers/<nombre>.md`.
- **Proyectos en curso:** un agente de proyecto lleva `decisions.md` y `open-items.md` y retoma desde ahí en la siguiente ejecución.
- **Revisión que aprende:** un agente revisor reúne errores recurrentes en `error-catalogue.md` y en adelante los comprueba de forma específica.
- **Investigaciones largas:** con *Por ejecución*, un agente anota resultados intermedios en lugar de perderlos en la conversación.

## Notas y límites {#hinweise}
<!-- keywords: límites, seguridad, secretos, contraseñas, costes, nombre de la herramienta memory -->

- **Nada de secretos:** lo que un agente lee de la memoria pasa a formar parte de la solicitud al proveedor de IA. No guardes contraseñas ni claves.
- **Costes:** los accesos a la memoria son rondas de herramientas. Los archivos grandes cuestan tokens cada vez que se leen; mantén los archivos pequeños y bien estructurados.
- **Rutas:** todas las rutas están dentro de `/memories`. Las rutas fuera de ahí se rechazan.
- **Nombre reservado:** el nombre de herramienta `memory` está ocupado por la herramienta de memoria; una herramienta propia con ese nombre no se puede usar junto con la memoria.
- **Máx. rondas de herramientas:** cada acción de memoria cuenta como llamada a herramienta. Aumenta el límite si un agente lee y escribe mucho.
