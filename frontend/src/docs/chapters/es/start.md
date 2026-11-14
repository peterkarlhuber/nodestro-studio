# Introducción

Nodestro es un estudio visual para flujos de trabajo multiagente. Conectas agentes de IA en un lienzo para formar una cadena, la inicias y sigues cada paso. Este capítulo explica los conceptos básicos y te guía por tu primer flujo de trabajo.

## ¿Qué es Nodestro? {#ueberblick}
<!-- keywords: resumen, idea, n8n, orkexa, biblioteca, proveedor, anthropic, claude, openai, gemini -->

Nodestro (de *Node* y *Maestro*) hace utilizable la biblioteca de Python **Orkexa** mediante una interfaz gráfica. Cada **nodo** del lienzo es un agente: un modelo de IA de Anthropic, OpenAI, Google Gemini o de un servidor propio, con su propio rol, sus propias herramientas y su propio conocimiento. Mediante **conexiones** los agentes se pasan sus resultados.

Usos típicos:

- **Investigación e informe:** un agente reúne datos, un segundo revisa los cálculos y un tercero redacta el informe.
- **Perspectivas paralelas:** varios agentes trabajan a la vez sobre la misma entrada (por ejemplo, público objetivo y estructura) y un último agente lo une todo.
- **Evaluación estructurada:** un agente devuelve un objeto JSON validado con campos fijos que otros programas pueden procesar.
- **Textos con control de calidad:** un juez revisa el resultado según unos criterios y hace que el agente lo mejore.

Nodestro se ejecuta localmente en tu equipo. Los flujos, ejecuciones, conocimiento y memoria se guardan en una base de datos SQLite. Los datos solo salen de tu equipo para solicitudes a los proveedores de IA que hayas configurado.

## Conceptos básicos {#begriffe}
<!-- keywords: glosario, conceptos, nodo, ejecución, trace, traza, token -->

| Concepto | Significado |
|---|---|
| **Flujo de trabajo** | Un proceso guardado formado por nodos y conexiones. |
| **Nodo** | Un bloque del lienzo: *Inicio*, *Agente*, *Resultado*, *Decisión*, *Aprobación*, *Subflujo* u *Orquestador*. Una conexión de una decisión o aprobación de vuelta a un paso anterior crea un bucle. |
| **Agente** | Un modelo de IA con prompt de sistema, tarea y, opcionalmente, herramientas, conocimiento, memoria y formato de salida. |
| **Conexión** | Pasa el resultado de un nodo al nodo siguiente. |
| **Ejecución** | Una única ejecución de un flujo de trabajo con una entrada concreta. |
| **Traza (trace)** | El registro completo de una ejecución: entradas, resultados, llamadas a herramientas, errores, tiempos, tokens y costes. |
| **Herramienta** | Una función que un agente puede llamar por sí mismo, como una calculadora o la búsqueda web. |
| **Conocimiento** | Archivos subidos (PDF, imágenes, textos) que los agentes usan como material de referencia. |
| **Memoria** | Notas que un agente escribe por sí mismo y vuelve a leer en tareas posteriores. |
| **Token** | La unidad de facturación de los modelos: aproximadamente un fragmento de palabra. 1.000 tokens equivalen a unas 600 palabras en español. |
| **Presupuesto** | Un límite de coste por ejecución. Si no alcanza en una ejecución que iniciaste tú, la ejecución se pausa y espera una decisión de presupuesto; las ejecuciones desatendidas (programaciones, ejecuciones por lotes, series de pruebas) fallan en su lugar. |

## Primeros pasos {#erste-schritte}
<!-- keywords: guía, tutorial, inicio rápido, primer flujo, quickstart -->

Así creas tu primer flujo de trabajo en pocos minutos:

1. **Configura un proveedor de IA.** Abre *Ajustes → Proveedores de IA* e introduce la clave de API de un proveedor, por ejemplo Anthropic (o define antes de arrancar una variable de entorno como `ANTHROPIC_API_KEY`). Si usas otro proveedor, cambia allí también el modelo predeterminado. Sin un proveedor configurado puedes editarlo todo, pero no ejecutar nada; la página *Flujos de trabajo* lo indica arriba del todo y lleva a los ajustes. Copiar un ejemplo funciona también sin él.
2. **Crea un flujo de trabajo.** En *Flujos de trabajo*, haz clic en **Nuevo flujo de trabajo**, escribe un nombre y confirma con **Crear y abrir**. El editor se abre con tres nodos ya conectados: *Inicio*, *Nuevo agente* y *Resultado*.
3. **Configura el agente.** Haz clic en el agente. A la derecha aparece el inspector. Ponle un nombre al agente y escribe un prompt de sistema, por ejemplo: «Eres un corrector experimentado. Mejora la ortografía y el estilo sin cambiar el contenido.»
4. **Inicia.** Haz clic en **Iniciar flujo de trabajo**, escribe un texto y confirma con **Iniciar**. Nodestro guarda el flujo automáticamente. Si el botón está bloqueado, el motivo aparece justo al lado, con un enlace a la solución.
5. **Observa.** En el *Resumen de la ejecución*, debajo del lienzo, ves en directo lo que escribe el agente, qué herramientas llama, cuántos tokens consume y cuánto cuesta.
6. **Revisa.** Con **Detalles** llegas a la ejecución completa con su cronología.

> **Consejo:** Debajo de tus flujos de trabajo encontrarás la galería con [flujos de trabajo de ejemplo](/docs/beispiele) para tareas típicas, por ejemplo **Análisis financiero** y **Artículo de blog**. La vista previa es gratuita; los ejemplos copiados son copias propias que puedes cambiar libremente.

## La interfaz {#oberflaeche}
<!-- keywords: navegación, barra lateral, menú, tema, oscuro, claro, diseño -->

La **barra lateral** de la izquierda sigue tu forma de trabajar: crear, ejecutar y revisar, y después automatizar.

- **Crear:** *Flujos de trabajo* (tus procesos), *Biblioteca de agentes* (plantillas reutilizables), *Herramientas*, *Conocimiento* y *Memoria*.
- **Ejecutar y revisar:** *Ejecuciones* (todas las ejecuciones en detalle), *Aprobaciones* (decisiones que esperan las ejecuciones) y *Uso* (tokens y costes a lo largo del tiempo).
- **Automatizar y probar:** *Series de pruebas*, *Ejecuciones por lotes* y *Programaciones*.
- **Ayuda:** esta *Documentación* y la página de *Bienvenida*.

El engranaje de arriba a la derecha abre los *Ajustes* desde cualquier página (también *Ctrl+,*); los ajustes ofrecen luego volver a donde estabas. Abajo se indica dónde se ejecuta Nodestro: si ejecutas Nodestro en tu equipo con el comando `nodestro`, pone **Local y privado**; en un servidor, **El servidor de tu organización** (consulta [Nodestro en un servidor](/docs/einstellungen#server)). Arriba a la derecha eliges el esquema de color: *Sistema* (sigue a tu sistema operativo, el predeterminado), *Oscuro* o *Claro*; la elección se guarda en el navegador. Si el proveedor del modelo predeterminado no está configurado, ahí aparece un aviso (*Configurar proveedor de IA* o, si ya hay otro proveedor configurado, *El modelo predeterminado necesita …*) que lleva directamente a los ajustes. En un servidor, arriba a la derecha aparece además tu cuenta.

**Ayuda justo donde la necesitas:** junto a muchos controles hay un pequeño símbolo **?**. Pasa el ratón por encima, enfócalo con la tecla Tab o tócalo en dispositivos táctiles: aparece una breve explicación, a menudo con un enlace a la sección correspondiente de esta documentación. El símbolo del libro junto a los títulos de página abre el capítulo correspondiente. Con **Esc** cierras la explicación.

Los estados se muestran siempre como texto y símbolo, nunca solo con color. Todos los controles también son accesibles con el teclado.

## Búsqueda {#suche}
<!-- keywords: búsqueda, buscar, encontrar, ctrl+k, cmd+k, búsqueda rápida -->

El campo de búsqueda de la barra de título (o **Ctrl+K**, en Mac **⌘K**) busca en páginas y secciones de los ajustes, flujos de trabajo, ejecuciones, agentes de los flujos de trabajo, la biblioteca de agentes, flujos de ejemplo, herramientas, conocimiento y esta documentación. Los resultados se agrupan por tipo; los favoritos aparecen con estrella. Las ejecuciones se encuentran entre las más recientes por nombre del flujo, entrada, estado o ID. Con el campo vacío, te ofrece tus últimas ejecuciones y los flujos de trabajo modificados recientemente.

Con las flechas eliges un resultado; **Intro** lo abre donde corresponde: un agente en el editor de su flujo de trabajo, una plantilla en la biblioteca de agentes, una herramienta en la biblioteca de herramientas, un archivo de conocimiento en la lista y una sección en la documentación. Las mayúsculas, minúsculas y tildes no importan.

## ¿Dónde están mis datos? {#daten}
<!-- keywords: privacidad, ubicación, base de datos, sqlite, copia de seguridad, nodestro_data_dir, ~/.nodestro -->

Todos los datos se guardan en una base de datos SQLite en el directorio de datos, por defecto `~/.nodestro` (se puede cambiar con `--data-dir` o la variable de entorno `NODESTRO_DATA_DIR`). Contiene:

- `nodestro.db` con flujos de trabajo, plantillas de agentes, ejecuciones, ajustes, archivos de conocimiento, índice de búsqueda y espacios de memoria,
- la carpeta `tools` con las herramientas propias y las creadas por la IA.

Para hacer una **copia de seguridad**, copia el directorio de datos con Nodestro detenido. Al proveedor de un agente solo se envía lo que el agente necesita para su solicitud: prompt de sistema, tarea, conocimiento asignado, contenido de memoria que lee y resultados de herramientas. Las claves de API nunca se muestran en la interfaz. Si trabajas con Nodestro en un servidor, los datos se guardan allí (consulta [Nodestro en un servidor](/docs/einstellungen#server)).

## La aplicación de escritorio {#desktop}
<!-- keywords: escritorio, aplicación, aplicación de escritorio, descarga, instalación, ventana -->

En esta versión no existe una aplicación de escritorio de Nodestro, y no se puede descargar ninguna. Para usar Nodestro en tu equipo, inícialo con el comando `nodestro`: se ejecuta localmente y se abre en el navegador (consulta [Instalación e inicio](/docs/einstellungen#installation)).
