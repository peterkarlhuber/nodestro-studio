# Conocimiento

En *Conocimiento* guardas archivos que los agentes usan como material de referencia: manuales, informes, contratos, tablas o imágenes. Este capítulo explica los formatos, las tres formas de uso y cómo funciona la búsqueda.

## Resumen {#ueberblick}
<!-- keywords: conocimiento, base de conocimiento, archivos, conocimiento de fondo, rag, documentos -->

El conocimiento funciona en tres pasos:

1. **Subir** en la página *Conocimiento*. Los textos y los PDF se indexan automáticamente para la búsqueda de texto completo.
2. **Asignar** en el inspector de un agente (sección *Conocimiento*). Un agente solo ve los archivos que tiene asignados.
3. **Elegir el modo:** *En el contexto*, *Bajo demanda* o *Búsqueda*.

Un archivo se puede asignar a tantos agentes como quieras.

## Subir archivos {#hochladen}
<!-- keywords: subir, upload, arrastrar y soltar, arrastrar, descripción -->

Haz clic en **Subir archivos** o arrastra archivos a la zona de carga; se pueden subir varios a la vez. Cada archivo muestra el tamaño, el tipo, el número de fragmentos indexados y la antigüedad. El nombre del archivo abre el original en una pestaña nueva.

Si vuelves a subir **exactamente el mismo archivo**, no se crea un duplicado: el identificador se obtiene del contenido, y el nombre y la descripción se actualizan.

También puedes subir archivos directamente en la sección *Conocimiento* de un agente; llegan aquí, sin colección, y quedan asignados a ese agente al instante ([Agentes](/docs/agenten#wissen)).

## Formatos y límites {#formate}
<!-- keywords: formatos, pdf, imagen, png, jpg, jpeg, gif, webp, txt, markdown, csv, json, yaml, html, xml, tamaño, límite, mb -->

| Tipo | Formatos | Tamaño | Se puede buscar |
|---|---|---|---|
| Documentos | PDF | hasta 20 MB | sí, página a página (PDF con capa de texto o tras el OCR) |
| Office | Word (DOCX), Excel (XLSX), convertidos a Markdown | hasta 20 MB | sí |
| Textos | TXT, Markdown, CSV, JSON, YAML, HTML, XML | hasta 20 MB | sí |
| Imágenes | PNG, JPEG, GIF, WebP | hasta 5 MB | no |

Los textos deben estar codificados en UTF-8. Word y Excel se convierten al subirlos; las fórmulas se muestran, nunca se calculan (consulta [Word y Excel](/docs/dateien#dokumentformate)). Los **PDF escaneados** sin capa de texto se guardan y se pueden leer en el contexto o cuando se necesiten, pero solo se pueden buscar tras un [reconocimiento de texto (OCR)](/docs/dateien#ocr).

## Indexación {#indexierung}
<!-- keywords: índice, indexación, fragmentos, chunks, fts5, texto completo -->

Al subir, Nodestro divide el texto en **fragmentos** de unos 1.500 caracteres con 200 caracteres de solapamiento, en los límites de párrafo. Los PDF se indexan página por página; los resultados llevan entonces títulos como «Informe, p. 3». El número de fragmentos aparece junto a cada archivo.

El índice es una búsqueda de texto completo de SQLite (FTS5 con ranking BM25) dentro de la propia base de datos de Nodestro. No hace falta ningún servicio externo ni modelo de embeddings, y la indexación no cuesta nada.

## Los tres modos {#modi}
<!-- keywords: en el contexto, bajo demanda, búsqueda, on demand, context, search, herramienta files, herramienta search, modo -->

| Modo | Qué recibe el agente | Adecuado para | Costes |
|---|---|---|---|
| **En el contexto** | Todos los archivos asignados completos al principio del prompt. | Pocos documentos cortos que siempre se necesitan (guía de estilo, lista de precios). También imágenes. | Cada solicitud contiene todos los archivos; la caché abarata las repeticiones. |
| **Bajo demanda** | Un catálogo (nombre, tipo, tamaño, descripción) y la herramienta `files`, con la que carga archivos concretos completos. | Colecciones medianas en las que cada tarea solo necesita algunos archivos. También imágenes y PDF escaneados. | Solo cuestan tokens los archivos cargados. |
| **Búsqueda** | La herramienta `search`, que devuelve los fragmentos más adecuados con su fuente (RAG). | Documentos y colecciones grandes de los que se necesitan datos concretos. | Solo cuestan tokens los fragmentos encontrados. |

**Recomendaciones:**

- En el modo *Bajo demanda*, el agente decide qué archivo carga según la **descripción**. Cuida que las descripciones sean claras.
- En el modo *Búsqueda*, el agente puede buscar varias veces con términos distintos. Indícale en el prompt de sistema que respalde sus afirmaciones con las fuentes.
- Las imágenes y los PDF sin texto son invisibles en el modo *Búsqueda*.

## Citas {#zitate}
<!-- keywords: citas, citations, fuentes, pasajes, respaldar -->

**Activar citas** se aplica al modo *En el contexto*: la respuesta remite entonces a los pasajes exactos de los documentos. En el modo *Búsqueda*, los resultados siempre incluyen las fuentes.

Las citas **no se pueden combinar con un formato de salida estructurado**; la comprobación lo indica como error.

## Adjuntar archivos al iniciar {#start-dateien}
<!-- keywords: adjuntar archivos, diálogo de inicio, una vez, por ejecución, adjunto -->

En el diálogo de inicio puedes elegir en **Adjuntar archivos** archivos de conocimiento para **esta ejecución concreta**. Se colocan directamente en el contexto de los primeros agentes, es decir, los conectados al inicio o sin predecesores. Los agentes posteriores no los reciben, solo los resultados de sus predecesores.

Así puedes iniciar un flujo de trabajo, por ejemplo, cada vez con un contrato distinto sin reconfigurar los agentes. El archivo tiene que estar subido antes en *Conocimiento*.

## Probar la búsqueda {#suche}
<!-- keywords: probar búsqueda, término de búsqueda, puntuación, score, resultados, bm25, acentos -->

A la derecha de la página *Conocimiento* pruebas la búsqueda en **todos** los archivos indexados, igual que la usa un agente en el modo *Búsqueda* (el agente solo busca en sus archivos asignados). Cada resultado muestra el título, un extracto y la **puntuación** (relevancia; cuanto más alta, mejor).

Características de la búsqueda:

- Los acentos se normalizan: «cancion» encuentra «canción».
- Las palabras también coinciden como inicio de palabra: «garantía» encuentra «garantías».
- Es una búsqueda por palabras clave, no por significado: no encuentra sinónimos. Formula los términos tal como aparecen en el documento.

El campo de filtro de la izquierda solo busca en nombres de archivo y descripciones.

## Colecciones y procedencia {#sammlungen}
<!-- keywords: colección, colecciones, ordenar, procedencia, incorporado, buscable -->

Las colecciones agrupan archivos de conocimiento, p. ej. «Contratos» o «Datos de producto». Al subir, elige una colección en *Subir a la colección*; puedes cambiarla en cada archivo más tarde. Los chips sobre la lista filtran por colección. Los agentes siguen recibiendo exactamente los archivos asignados.

El contenido de ejecuciones (archivos subidos, archivos de resultado, resultados y propuestas de agentes) solo llega al conocimiento tras tu confirmación, ver [Incorporar al conocimiento](/docs/datei-eingaben#knowledge-uebernahme). Esos archivos muestran en *Procedencia* de qué workflow, paso y ejecución proceden y si el contenido fue extraído, generado o es una suposición.

## Gestionar archivos {#verwalten}
<!-- keywords: editar descripción, eliminar, gestionar, quitar -->

- **Descripción:** escríbela junto al archivo; se guarda al salir del campo. Las buenas descripciones indican contenido, periodo y finalidad, por ejemplo «Informe anual 2025 con balance e informe de riesgos».
- **Eliminar:** símbolo de la papelera. Se eliminan el archivo y su índice. Los agentes que lo tenían asignado siguen funcionando y simplemente dejan de recibirlo. **Se usa en**, debajo del nombre del archivo, nombra los flujos de trabajo, agentes de la biblioteca y API publicadas que usan el archivo. Si está en uso, el diálogo de eliminación enumera esos lugares antes de eliminarlo.

## Consejos y errores frecuentes {#tipps}
<!-- keywords: consejos, errores, el agente no encuentra nada, demasiado caro, contexto demasiado grande -->

- **El agente no encuentra nada:** comprueba en *Probar la búsqueda* si el archivo está indexado y si se encuentra el término. Si el archivo es un PDF escaneado, usa *Bajo demanda*.
- **Las ejecuciones salen caras:** muchos archivos grandes *En el contexto* llenan cada solicitud. Cambia a *Bajo demanda* o *Búsqueda*.
- **Ventana de contexto superada:** demasiados archivos, o demasiado grandes, en el contexto provocan un error de la API. Reparte el conocimiento o usa la búsqueda.
- **Respuesta sin fuentes:** pide expresamente en el prompt de sistema que las afirmaciones se respalden con sus fuentes.
