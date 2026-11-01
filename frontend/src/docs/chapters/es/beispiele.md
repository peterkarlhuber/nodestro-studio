# Flujos de trabajo de ejemplo

Nodestro incluye 24 flujos de trabajo multiagente listos, uno para cada ámbito de aplicación típico. Cada ejemplo contiene agentes con prompts de sistema, las conexiones, una tarea de prueba preparada con datos inventados y un resultado claramente descrito. Este capítulo explica la galería, cómo copiar y adaptar los ejemplos, y describe cada uno por separado.

## La galería {#galerie}
<!-- keywords: ejemplos, plantillas, galería, biblioteca, destacados, categorías, página de inicio, empieza aquí, nivel, más sencillo -->

La galería está en la página **Flujos de trabajo**, debajo de tus propios flujos de trabajo y claramente separada de ellos. Muestra algunos ejemplos destacados, el más sencillo primero, y las seis categorías. Mientras aún no tengas ningún flujo de trabajo, el ejemplo más sencillo lleva la marca **Empieza aquí**; después, la galería es una sección cerrada que recuerda si la abriste. **Ver los 24 ejemplos** abre la galería completa, también dentro del área de flujos de trabajo.

En la galería completa buscas por nombre, ámbito, descripción, bloque o nivel y filtras por categoría y por **Nivel**. Los ejemplos están ordenados por nivel, los más sencillos primero; el más sencillo lleva **Empieza aquí**. La búsqueda, los filtros y una vista previa abierta forman parte de la dirección, así que *Atrás* te lleva a la misma selección. Cada tarjeta muestra el ámbito, el nombre, la descripción, el número de agentes, el nivel y el patrón. Los ejemplos de ámbitos sensibles llevan la insignia **Requiere revisión experta**. La [búsqueda](/docs/start#suche) también encuentra ejemplos.

## Vista previa y copia {#uebernehmen}
<!-- keywords: vista previa, copiar, copia, plantilla, sin cambios, gratis -->

Al hacer clic en una tarjeta se abre la **vista previa**: el flujo como diagrama, cada agente con su rol, modelo, herramientas y los resultados que recibe, la guía y la tarea de prueba. La vista previa no guarda nada y no llama a ningún modelo.

Arriba del todo, la vista previa muestra **Qué necesitas**: qué proveedor de IA y qué modelos usa la copia y si ese proveedor está configurado (si no, con un enlace a los ajustes), si una ejecución se detiene para una aprobación, qué archivos de conocimiento y de ejemplo incluye y si hace falta una conexión con otro servicio.

**Copiar a mis flujos de trabajo** crea un flujo de trabajo propio y lo abre en el editor. La copia es independiente: puedes cambiarlo todo, y la plantilla nunca cambia. Si copias un ejemplo dos veces, obtienes dos flujos de trabajo separados. La copia empieza con la versión 1 en el [historial de versiones](/docs/workflows#versionen).

Si **Añadir los casos de prueba como serie de pruebas** está marcado (por defecto), la copia recibe además una [serie de pruebas](/docs/automatisierung#testreihen) con los casos de prueba preparados; los archivos de ejemplo necesarios se guardan como archivos de entrada de la copia. Copiar nunca inicia una ejecución, nunca crea una [programación](/docs/automatisierung#zeitplaene) y nunca publica una [API](/docs/api-und-export#veroeffentlichen); eso lo decides tú más adelante.

Los ejemplos nunca se crean automáticamente; solo lo que copias aparece entre tus flujos. Solo hay costes cuando ejecutas una copia. Los modelos que recibe una copia dependen de tu modelo predeterminado: si es un modelo de Anthropic, la copia usa los modelos del ejemplo (Haiku, Sonnet u Opus, según la tarea del agente). Si pertenece a otro [proveedor](/docs/einstellungen#anbieter), todos los agentes de la copia usan tu modelo predeterminado, y los más exigentes tu modelo del asistente si pertenece al mismo proveedor; las herramientas de servidor, que solo funcionan con Anthropic, se omiten entonces. Puedes cambiar los modelos de una copia en cualquier momento. Ningún ejemplo necesita cuentas ni fuentes de datos de pago. Algunos ejemplos tienen una **Conexión opcional** con otro servicio mediante MCP: al copiar eliges un [servicio conectado](/docs/tools#verbundene-dienste) configurado o el **Modo sin conexión (datos de ejemplo)**, que viene preseleccionado.

## Idiomas {#sprachen}
<!-- keywords: idioma, traducción, alemán, inglés, copia, prompts -->

La galería y la vista previa aparecen en el idioma de la interfaz. Los nombres, descripciones, prompts de sistema, tareas y la tarea de prueba de la copia se crean en el idioma que eliges en la vista previa en **Idioma de la copia**; por defecto es el idioma de la interfaz.

Una copia guardada se queda en su idioma, aunque cambies la interfaz más tarde. Los identificadores técnicos, como los nombres de campo de la salida estructurada y los nombres de las herramientas, están en inglés en todos los idiomas.

## Patrones y roles {#muster}
<!-- keywords: secuencial, paralelo, revisión, juez, control de calidad, roles, estructura -->

Los ejemplos usan solo los agentes que la tarea necesita, normalmente tres o cuatro.

- **Secuencial:** los agentes trabajan uno tras otro; cada uno se basa en el resultado del anterior.
- **Paralelo:** varios agentes trabajan a la vez sobre la misma entrada y otro reúne los resultados.
- **Con ramas:** una decisión o una aprobación elige el camino; no todos los agentes se ejecutan siempre (consulta [Ramas y aprobaciones](/docs/verzweigungen)).
- **Revisión:** un agente revisor controla el trabajo de los demás y a menudo entrega una salida estructurada con campos fijos.
- **Control de calidad:** en algunos agentes, un [control de calidad](/docs/agenten#qualitaet) integrado evalúa el resultado según criterios fijos y lo hace revisar si es necesario.

Las tarjetas de la galería muestran además qué elementos usa un ejemplo: decisión, aprobación, formulario de entrada, subflujo, archivos de resultado, archivos como entrada, propuestas de conocimiento o memoria.

Los roles de la vista previa describen lo que hace un agente: investigación, análisis, planificación, revisión o redacción. Los cálculos se hacen con las herramientas integradas, como la calculadora y el cálculo de fechas; no cuestan nada extra.

## Datos de prueba {#testdaten}
<!-- keywords: tarea de prueba, datos de prueba, sintéticos, inventados, datos de ejemplo -->

Cada tarea de prueba empieza con la nota **DATOS DE EJEMPLO SINTÉTICOS**. Las empresas, personas, cifras y reglas son inventadas y solo sirven para probar. Tras copiar, la tarea de prueba es la entrada sugerida del nodo de inicio; sustitúyela allí por tus propios datos.

## Archivos de ejemplo y casos de prueba {#beispieldateien}
<!-- keywords: archivos de ejemplo, casos de prueba, serie de pruebas, archivo, subir, pdf, excel, word, zip -->

Muchos ejemplos tienen un [campo de archivo](/docs/datei-eingaben#datei-felder) opcional, por ejemplo para un registro de paradas en Excel, ofertas en PDF y Word o un contrato como archivo de Word. La vista previa ofrece para descargar pequeños **archivos de ejemplo** inventados que encajan con la tarea de prueba. Puedes ponerlos en el campo de archivo al iniciar la copia y probar así cómo trabaja el ejemplo con archivos. Sin archivo, los agentes trabajan con el texto como hasta ahora.

Cada ejemplo tiene además **casos de prueba**, por ejemplo un caso con texto, otro con un archivo de ejemplo y, en los ejemplos con decisión, un caso para cada camino. Cada caso de prueba contiene comprobaciones sobre campos del resultado. Los casos de prueba copiados aparecen como serie de pruebas de la copia; solo se ejecutan cuando inicias la serie, y entonces cuestan lo mismo que ejecuciones normales.

La ejecución guarda los archivos de resultado, como PDF, Word o Excel, en [Archivos](/docs/dateien). Si un agente propone conclusiones para el conocimiento, solo se guarda lo que adoptes expresamente.

## Ámbitos sensibles {#sensible-bereiche}
<!-- keywords: finanzas, derecho, recursos humanos, administración, revisión, responsabilidad, asesoramiento, precaución -->

Seis ejemplos tratan de finanzas, derecho, recursos humanos o administración: análisis financiero, selección de personal, revisión de contratos, presupuesto doméstico, comparación de inmuebles y solicitud ciudadana. Sus agentes reciben en el prompt de sistema la instrucción adicional de nombrar las incertidumbres y enumerar los puntos que una persona cualificada debe revisar.

Los resultados son ayudas de trabajo, no asesoramiento ni una decisión. Revísalos con criterio profesional antes de usarlos, enviarlos o publicarlos.

## Adaptar los ejemplos {#anpassen}
<!-- keywords: adaptar, cambiar, datos propios, conocimiento, modelo, prompt -->

- **Datos propios:** sustituye la tarea de prueba en el nodo de inicio o introduce tu propia entrada al iniciar.
- **Archivos propios:** pon los documentos para una sola ejecución directamente en el campo de archivo al iniciar; para eso no necesitas una colección de conocimiento.
- **Conocimiento:** sube los documentos que necesitas de forma permanente como [conocimiento](/docs/wissen#modi) y asígnalos al agente adecuado.
- **Prompts y tareas:** las tareas se refieren a sus predecesores con [marcadores](/docs/workflows#platzhalter). Si cambias el nombre de un agente, ajusta los marcadores.
- **Datos actuales:** para información en vivo puedes añadir la [herramienta de servidor](/docs/tools#server-tools) de búsqueda web (solo con modelos de Anthropic); cuesta un extra por búsqueda.

Las secciones siguientes indican adaptaciones concretas para cada ejemplo.

<!-- examples:start -->

## Los 24 ejemplos de un vistazo {#uebersicht}

Cada ejemplo está en la galería y tiene su propia sección más abajo.

| N.º | Ejemplo | Ámbito | Agentes | Patrón |
|---|---|---|---|---|
| 1 | Analizar paradas de máquina | Producción e industria | 3 | con ramas |
| 2 | Investigar una reclamación con 8D | Gestión de la calidad | 5 | con ramas |
| 3 | Comparar ofertas de proveedores | Logística y compras | 3 | paralelo |
| 4 | Estrategia DAFO para una pyme | Empresas y pymes | 4 | paralelo |
| 5 | Análisis financiero | Finanzas e inversiones | 3 | secuencial |
| 6 | Artículo de blog | Marketing y contenidos | 3 | secuencial |
| 7 | Preparar una oferta a medida | Ventas | 3 | secuencial |
| 8 | Responder consultas de clientes | Atención al cliente | 4 | con ramas |
| 9 | Publicar una vacante y preparar entrevistas | Recursos humanos | 5 | con ramas |
| 10 | Convertir una pregunta de investigación en hipótesis | Investigación y desarrollo | 3 | adaptativo (orquestación) |
| 11 | Revisión de código con pruebas | Desarrollo de software | 3 | paralelo |
| 12 | Estructurar un contrato y encontrar puntos de revisión | Derecho y administración | 5 | con ramas |
| 13 | Crear un plan de aprendizaje personal | Educación y formación | 4 | paralelo |
| 14 | Revisar el presupuesto familiar y ahorrar | Particulares – finanzas | 3 | secuencial |
| 15 | Planificar un viaje a medida | Particulares – viajes | 4 | con ramas |
| 16 | Evaluar una idea de negocio | Autónomos y emprendedores | 2 | adaptativo (orquestación) |
| 17 | Desarrollar una estrategia de redes sociales | Influencers y creadores de contenido | 3 | secuencial |
| 18 | Comparar ofertas inmobiliarias | Sector inmobiliario | 3 | paralelo |
| 19 | Analizar retrasos de obra | Construcción | 3 | adaptativo (orquestación) |
| 20 | Desarrollar y calcular una carta | Hostelería | 3 | secuencial |
| 21 | Planificación de cultivos de una explotación | Agricultura | 3 | secuencial |
| 22 | Planificar la fiesta del club | Asociaciones y clubes | 4 | paralelo |
| 23 | Desarrollar una campaña de donaciones | Organizaciones sin ánimo de lucro | 3 | con ramas |
| 24 | Responder una consulta ciudadana | Instituciones públicas | 3 | secuencial |

## 1 · Analizar paradas de máquina {#production-downtime}
<!-- keywords: producción e industria, analista de paradas, analista de causas, planificador de medidas -->

**Ámbito:** Producción e industria · **Agentes:** 3 · **Patrón:** con ramas · **Nivel:** Avanzado · **Elementos:** decisión, formulario de entrada, subflujo, archivos de resultado, archivos como entrada

Las paradas cuestan tiempo de producción, pero en los registros largos los patrones pasan desapercibidos. El flujo convierte un registro de paradas en una lista de medidas justificada y priorizada.

**Cómo colaboran los agentes:** Dos agentes trabajan en paralelo: el analista de paradas calcula totales, porcentajes y una clasificación de Pareto con la calculadora, y el analista de causas desarrolla hipótesis según las 6M. El planificador de medidas reúne ambos resultados, y una revisión de calidad integrada comprueba que cada medida esté justificada. Si el porcentaje de paradas supera el objetivo del 3 %, un nodo de decisión inicia un subflujo de calidad que evalúa los riesgos de las medidas y planifica cómo asegurarlas.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de paradas** | Evalúa el registro de forma cuantitativa y calcula con la calculadora. (salida estructurada; Herramientas: `calculator`) | Registro de paradas |
| **Analista de causas** | Desarrolla hipótesis de causa según las 6M y propone comprobaciones. | Registro de paradas |
| **Planificador de medidas** | Combina análisis e hipótesis en medidas priorizadas. (con control de calidad) | Analista de paradas, Analista de causas |

**Entrada:** Un registro de paradas (fecha, turno, máquina, duración, código de fallo, nota) y el tiempo de producción planificado. Puedes pegar el registro en el texto como tabla o ponerlo en el campo de archivo opcional como CSV o Excel; el archivo de ejemplo «Registro_paradas_L2_semanas14-15.xlsx» contiene las mismas doce entradas inventadas que la tarea de prueba.

**Archivos de ejemplo:** `Registro_paradas_L2_semanas14-15.xlsx`

**Casos de prueba:** Registro en el texto, objetivo incumplido (4,6 %); Quincena tranquila, objetivo cumplido; Registro como archivo de Excel

**Resultado:** Una tabla priorizada con medidas inmediatas, comprobaciones y medidas permanentes, cada una con efecto esperado, esfuerzo, rol responsable e indicador, además del análisis de datos con el porcentaje de paradas y los tres próximos pasos más importantes. La ejecución guarda además todo como Markdown y como archivo de Excel con las tablas.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el analista de paradas comprueba cada cifra con la calculadora. Una revisión de calidad evalúa el plan de medidas según tres criterios (relación con los hallazgos, priorización, responsables e indicadores) y hace que el planificador de medidas lo corrija una vez si no los cumple. Una condición compara el porcentaje de paradas con el objetivo del 3 %: si lo supera, se ejecuta el subflujo de aseguramiento de calidad (evaluación de riesgos con un AMFE simplificado y plan de verificación); si no, se omite. La ejecución muestra qué rama se tomó. Ningún paso espera a una persona: las causas son hipótesis que hay que verificar en planta y las medidas son propuestas para la dirección de producción responsable.

**Por qué esta arquitectura:** La evaluación cuantitativa y la búsqueda de causas miran el mismo registro desde ángulos distintos y no dependen una de otra; por eso se ejecutan en paralelo y solo el planificador de medidas las une. El aseguramiento de calidad solo se ejecuta cuando no se cumple el objetivo, porque solo entonces cabe esperar medidas de mayor alcance cuyos riesgos hay que asegurar; dentro del objetivo solo costaría tiempo y dinero. Es un subflujo para que el mismo módulo pueda reutilizarse y probarse por separado. No hace falta un orquestador, porque cada registro de paradas necesita los mismos pasos.

**Cómo adaptarlo:** Pon una exportación de tu MES o de tu hoja de cálculo en el campo de archivo; también funcionan registros largos, porque los agentes leen los archivos grandes de forma selectiva. Para una evaluación semanal puedes programar la copia. En el prompt de sistema del planificador de medidas puedes añadir vuestra metodología, por ejemplo los pilares TPM o un esquema de valoración fijo.

## 2 · Investigar una reclamación con 8D {#quality-8d}
<!-- keywords: gestión de la calidad, descripción del problema d1–d3, análisis de causas d4, planificación de acciones d5–d7, informe 8d, contención de emergencia -->

**Ámbito:** Gestión de la calidad · **Agentes:** 5 · **Patrón:** con ramas · **Nivel:** Avanzado · **Elementos:** decisión, aprobación, formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento, archivos de conocimiento

Las reclamaciones exigen contención rápida y un análisis de causas riguroso. El método 8D marca los pasos; el flujo los recorre de forma estructurada y los documenta de manera uniforme. Además comprueba si el defecto ya ocurrió antes: una causa que se repite significa que una acción correctiva anterior no funcionó, y eso debe constar en el informe.

**Cómo colaboran los agentes:** Una cadena secuencial: el primer agente describe el problema y las acciones de contención (D1 a D3). El segundo busca casos comparables en los informes 8D anteriores de la empresa y las causas de aparición y de no detección (D4), e indica si una causa se repite o es nueva. El tercero planifica acciones correctivas y preventivas (D5 a D7). El agente de informe lo reúne todo en un informe 8D estructurado. Un nodo de decisión comprueba la gravedad: en casos críticos, un agente adicional planifica la contención de emergencia para las próximas 24 horas. Antes de que el informe llegue al cliente, una persona lo libera.

| Agente | Tarea | Recibe |
|---|---|---|
| **Descripción del problema D1–D3** | Describe el equipo, el problema (es / no es) y las acciones de contención. (salida estructurada) | Reclamación |
| **Análisis de causas D4** | Consulta informes 8D anteriores y busca con 5 porqués las causas de aparición y de no detección. | Descripción del problema D1–D3, Reclamación |
| **Planificación de acciones D5–D7** | Planifica acciones correctivas, su verificación y la prevención. | Análisis de causas D4 |
| **Informe 8D** | Reúne todos los pasos en un informe 8D estructurado. (salida estructurada) | Descripción del problema D1–D3, Análisis de causas D4, Planificación de acciones D5–D7, Contención de emergencia |
| **Contención de emergencia** | Planifica la contención de las próximas 24 horas en casos críticos. | Gravedad |

**Entrada:** La reclamación del cliente con pieza, lote, defecto y tasa de defectos, además de la información interna conocida sobre fabricación, material e inspección. Puedes adjuntar también la carta de reclamación, datos de medición y fotos del defecto como archivos; los archivos de ejemplo contienen una carta de reclamación inventada (PDF) y mediciones (Excel). Los informes 8D anteriores vienen de la colección de conocimiento; se incluye un archivo inventado con cuatro informes cerrados.

**Archivos de ejemplo:** `Reclamacion_G-220_lote_24-117.pdf`, `Mediciones_pestanas.xlsx`

**Casos de prueba:** Reclamación en el texto; Carta de reclamación y mediciones como archivos

**Resultado:** Un informe 8D estructurado con un campo para cada disciplina D1 a D8 y una lista de puntos abiertos que el equipo aún debe aclarar; el análisis de causas nombra los informes anteriores en los que se apoya. Tras la aprobación, la ejecución guarda el informe en PDF y como archivo de Word editable. Así se cierra el ciclo de aprendizaje: el agente de informe propone el informe 8D terminado para el conocimiento, una persona decide si se guarda, y los informes guardados acaban en la misma colección que los informes anteriores, de modo que el análisis de causas los encuentra en casos futuros.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el nodo de decisión añade la contención de emergencia solo cuando la descripción del problema marca el caso como crítico; el análisis de causas decide qué informes anteriores son pertinentes y los cita, de modo que cada referencia se puede comprobar. No hay bucles; cada paso se ejecuta una vez. Una persona decide dos veces: antes de crear archivos, alguien libera el informe 8D (rechazarlo detiene la ejecución sin archivos), y una persona decide si el informe terminado se guarda como conocimiento. Hasta la liberación, el informe sigue siendo un borrador.

**Por qué esta arquitectura:** El 8D fija un orden en el que cada disciplina se apoya en la anterior; por eso encaja mejor una cadena secuencial que un orquestador, y solo la contención de emergencia depende del caso y es una bifurcación. Los informes anteriores son conocimiento consultable en lugar de texto en el prompt: el archivo crece con cada caso guardado, la búsqueda aporta solo los pasajes pertinentes y las citas muestran de dónde viene una causa repetida. Se prescindió a propósito de un bucle de revisión, porque la liberación por una persona al final revisa de todos modos el informe completo.

**Archivos de conocimiento (sintéticos, se crean al copiar):** Informes_8D_anteriores_Plastiform: Archivo inventado con cuatro informes 8D cerrados del proveedor de carcasas de plástico Plastiform S.L.; uno de ellos es un caso comparable.

**Cómo adaptarlo:** Sustituye los datos de prueba por vuestra reclamación y adjunta directamente protocolos de inspección, planos o fotos. Sustituye los informes anteriores inventados de la colección de conocimiento por vuestros propios informes 8D cerrados (Markdown, PDF o Word); títulos claros con pieza, defecto y causa en cada informe hacen la búsqueda más precisa. Si usáis un formulario propio, ajusta los campos del agente de informe en «Formato de salida».

## 3 · Comparar ofertas de proveedores {#supplier-comparison}
<!-- keywords: logística y compras, analista de costes, analista de riesgos, recomendación de compra -->

**Ámbito:** Logística y compras · **Agentes:** 3 · **Patrón:** paralelo · **Nivel:** Avanzado · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada, conexión MCP opcional

El precio unitario más bajo rara vez es la oferta más barata, y las promesas de un proveedor no son su historial. El flujo compara las ofertas por coste total y riesgo de suministro, revisa el historial de los proveedores cuando está disponible y justifica una recomendación para compras.

**Cómo colaboran los agentes:** El analista de costes y el analista de riesgos trabajan en paralelo. Uno calcula con la calculadora el coste total de propiedad de cada oferta y el otro valora plazo, dependencias, capacidad y calidad. Si tu copia está conectada al ERP, el analista de riesgos lee la evaluación de cada proveedor, solo en lectura, con list_suppliers y supplier_scorecard; sin conexión usa una exportación del ERP adjunta o solo las ofertas e indica qué historial falta. La recomendación de compra sopesa ambos y entrega un resultado estructurado.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de costes** | Calcula el coste total de cada oferta con la calculadora. (Herramientas: `calculator`) | Ofertas |
| **Analista de riesgos** | Valora plazos, dependencias, capacidad y riesgos de calidad. | Ofertas |
| **Recomendación de compra** | Sopesa costes y riesgos y recomienda un proveedor. (salida estructurada) | Analista de costes, Analista de riesgos |

**Entrada:** Varias ofertas con precio, flete, plazo de entrega, cantidad mínima, condiciones de pago y datos de calidad, además de vuestros costes internos. Puedes escribir las ofertas en el texto o adjuntarlas como archivos, incluso mezcladas en PDF, Word y Excel; los tres archivos de ejemplo muestran justo eso. Opcionalmente adjuntas una exportación del ERP con la evaluación de proveedores (Excel o CSV); en la exportación de ejemplo falta a propósito el proveedor de la oferta B, que es nuevo y aún no tiene historial.

**Archivos de ejemplo:** `Oferta_A_Ejemplo_Precision.pdf`, `Oferta_B_Example_Components.docx`, `Oferta_C_Muestra_Piezas_Metalicas.xlsx`, `ERP_evaluacion_proveedores.xlsx`

**Casos de prueba:** Tres ofertas en el texto; Tres ofertas en PDF, Word y Excel; Tres ofertas como archivos más exportación del ERP

**Resultado:** Una recomendación estructurada con clasificación, justificaciones, riesgos, puntos de negociación y supuestos utilizados. La valoración de riesgos indica para cada proveedor de dónde procede su historial: del ERP, de la exportación adjunta o solo de la oferta. La ejecución guarda además la recomendación como informe en PDF y como archivo de Excel con una hoja por lista.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: los dos análisis y la ponderación se ejecutan sin pausas; la calculadora hace las cuentas y la ejecución registra cada paso y cada llamada a herramientas. La conexión con el ERP es opcional y solo lee: la copia recibe las herramientas list_suppliers y supplier_scorecard solo si la conectas a un servidor MCP cuyas herramientas un administrador haya aprobado como de solo lectura; si no, funciona en un modo sin conexión claramente señalado y nunca finge tener datos del ERP. Las ejecuciones sin una persona presente (programaciones, series de pruebas, procesamiento por lotes) no pueden usar herramientas MCP salvo que un administrador permita expresamente el MCP desatendido, así que usa una copia conectada de forma interactiva. Ningún paso espera una aprobación: la recomendación es un borrador y la decisión de compra sigue siendo tuya.

**Por qué esta arquitectura:** Coste y riesgo son preguntas independientes, por eso dos especialistas trabajan en paralelo y un tercero sopesa sus resultados; es más rápido y más fácil de comprobar que un único agente para todo. El historial de proveedores llega por una integración porque está en el ERP y cambia continuamente; un archivo de conocimiento quedaría desfasado, y el modo sin conexión con una exportación mantiene el ejemplo utilizable sin conexión. No hay bucle ni paso de aprobación porque el resultado es una recomendación, no una acción.

**Conexión opcional: ERP (evaluación de proveedores)** (Herramientas: `list_suppliers`, `supplier_scorecard`). Acceso de solo lectura mediante MCP a los datos de proveedores de vuestro ERP: list_suppliers enumera los proveedores y supplier_scorecard devuelve la evaluación de un proveedor de los últimos 12 meses (puntualidad, calidad en ppm, reclamaciones, informes 8D abiertos, última auditoría). El analista de riesgos la usa para contrastar las ofertas con el historial registrado.

**Configuración:** Un administrador añade el servidor MCP del ERP de tu empresa en Herramientas → Servicios conectados y aprueba las dos herramientas list_suppliers y supplier_scorecard como de solo lectura. Al copiar el ejemplo eliges ese servidor como conexión; sin conexión, la copia funciona en modo sin conexión. Para probarlo sin ERP, ejecuta `python -m nodestro_examples.demo_mcp --language es` en el ordenador con la aplicación de escritorio de Nodestro, añade http://127.0.0.1:8765/mcp en Herramientas → Servicios conectados con el consentimiento para un servidor de desarrollo local, aprueba sus herramientas como de solo lectura y elígelo al copiar. El servidor de demostración solo lee y sirve los datos sintéticos de la exportación de ejemplo, nunca datos reales de empresa. Las ejecuciones sin una persona presente (programaciones, series de pruebas, procesamiento por lotes) no pueden usar herramientas MCP salvo que un administrador permita expresamente el MCP desatendido.

**Sin conexión:** Modo sin conexión: no hay ningún ERP conectado. El analista de riesgos usa solo una exportación del ERP adjunta o las ofertas e indica el historial de proveedores que falta; no consulta nada.

**Cómo adaptarlo:** Adjunta vuestras ofertas como archivos e indica la necesidad y los costes en el texto. Para usar el historial real de los proveedores, haz configurar la integración con el ERP y elige el servidor al copiar el ejemplo; si no, adjunta una exportación de la evaluación de proveedores. Si tenéis ponderaciones fijas (por ejemplo 50 % coste, 30 % riesgo, 20 % calidad), añádelas en el prompt de sistema de la recomendación de compra. Los contratos marco puedes guardarlos como conocimiento y asignarlos al analista de riesgos.

## 4 · Estrategia DAFO para una pyme {#sme-swot}
<!-- keywords: empresas y pymes, análisis interno, análisis del entorno, desarrollador de estrategia, revisor crítico -->

**Ámbito:** Empresas y pymes · **Agentes:** 4 · **Patrón:** paralelo · **Nivel:** Avanzado · **Elementos:** archivos de resultado

Muchas pequeñas empresas conocen sus problemas, pero no el mejor orden para abordarlos. El flujo crea un análisis DAFO, deriva estrategias y las somete a un revisor crítico.

**Cómo colaboran los agentes:** El análisis interno (fortalezas, debilidades) y el análisis del entorno (oportunidades, amenazas) se ejecutan en paralelo. El desarrollador de estrategia combina ambos en estrategias según la matriz CAME/TOWS y un plan de 90 días. El revisor crítico busca puntos débiles e información que falta; el resultado incluye estrategia y revisión. Al final, el resultado se guarda con la ejecución como archivo Markdown y PDF.

| Agente | Tarea | Recibe |
|---|---|---|
| **Análisis interno** | Extrae fortalezas y debilidades de los datos de la empresa. | Perfil de la empresa |
| **Análisis del entorno** | Deriva oportunidades y amenazas del mercado y del entorno. | Perfil de la empresa |
| **Desarrollador de estrategia** | Desarrolla estrategias según la matriz TOWS y un plan de 90 días. | Análisis interno, Análisis del entorno |
| **Revisor crítico** | Cuestiona la estrategia y descubre puntos débiles. (salida estructurada) | Desarrollador de estrategia, Perfil de la empresa |

**Entrada:** Un breve perfil de la empresa con cifras clave, oferta, fortalezas, problemas, entorno de mercado y objetivos.

**Casos de prueba:** Carpintería con la sucesión sin resolver

**Resultado:** Una matriz DAFO con estrategias derivadas y un plan de 90 días, además de una revisión crítica estructurada con valoración, puntos débiles, información que falta y próximos pasos.

**Qué se decide automáticamente y cuándo interviene una persona:** Todo se ejecuta automáticamente y ningún paso espera a una persona. El revisor crítico recibe la estrategia y el perfil original de la empresa y devuelve un veredicto estructurado con puntos sólidos, puntos débiles, información que falta y próximos pasos; no devuelve la estrategia, de modo que su crítica queda visible en el resultado. El análisis del entorno no investiga en la web: trabaja con el perfil y con conocimiento general del sector y señala lo que hay que comprobar a nivel local. La estrategia y el plan de 90 días son un borrador para tu propia decisión.

**Por qué esta arquitectura:** Las fortalezas y debilidades proceden de la empresa; las oportunidades y amenazas, del mercado. Los dos análisis no dependen uno del otro y por eso se ejecutan en paralelo. La estrategia necesita ambos, así que sigue como paso fijo. El revisor es un agente propio que también ve el perfil original, por lo que contrasta la estrategia con los hechos y no solo con su propio razonamiento. Se renunció a propósito a un bucle de revisión: una estrategia no debe pulirse hasta que el revisor esté de acuerdo, porque las contradicciones abiertas son información valiosa para quien decide.

**Cómo adaptarlo:** Describe tu empresa con el mismo estilo. Cuanto más precisos sean las cifras y los objetivos, más concreta será la estrategia. Puedes subir estudios sectoriales o encuestas a clientes como conocimiento y asignarlos al análisis del entorno.

## 5 · Análisis financiero {#financial-analysis}
<!-- keywords: finanzas e inversiones, agente de investigación, agente de análisis, agente de revisión -->

**Ámbito:** Finanzas e inversiones · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Principiante · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento

Las cifras de los informes anuales se citan rápido, pero rara vez se recalculan y se ponen en contexto. El flujo extrae las cifras, calcula márgenes y crecimiento con exactitud y somete el resultado a una revisión crítica.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** Una cadena secuencial de tres agentes: el agente de investigación ordena las cifras con periodo y unidad, el agente de análisis calcula los indicadores con la calculadora y el agente de revisión comprueba cálculos y lógica y resume el resultado de forma estructurada.

| Agente | Tarea | Recibe |
|---|---|---|
| **Agente de investigación** | Recopila cifras y contexto sobre los datos financieros. | Tarea |
| **Agente de análisis** | Calcula márgenes, crecimiento y ratios de estabilidad con la calculadora. (Herramientas: `calculator`) | Agente de investigación |
| **Agente de revisión** | Revisa el análisis y lo resume de forma estructurada. (salida estructurada) | Agente de análisis, Agente de investigación |

**Entrada:** Cifras financieras de una empresa de al menos dos años, por ejemplo de un informe anual o trimestral, y los efectos extraordinarios conocidos. Puedes pegar las cifras o adjuntarlas como archivo de Excel, CSV o PDF; el archivo de ejemplo contiene los indicadores de la tarea de prueba.

**Archivos de ejemplo:** `Indicadores_Ejemplo_Industrias.xlsx`

**Casos de prueba:** Indicadores en el texto; Indicadores como archivo de Excel

**Resultado:** Una revisión estructurada con resumen, indicadores principales, errores o riesgos encontrados, límites del análisis e indicación de si el análisis se considera correcto, además en PDF y como archivo de Excel. El agente de investigación propone las cifras extraídas para el conocimiento; solo se adopta lo que confirmes. El resultado no es asesoramiento de inversión.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el agente de investigación extrae las cifras, el agente de análisis calcula cada indicador con la calculadora y el agente de revisión comprueba cálculos y lógica frente a las cifras extraídas. Su veredicto sí/no indica si el análisis se considera correcto; ese veredicto no detiene la ejecución ni provoca un nuevo cálculo, de modo que los errores encontrados quedan visibles en el resultado. Sobre el conocimiento decide una persona: las cifras extraídas solo se adoptan si las confirmas. El resultado no es asesoramiento de inversión; antes de tomar decisiones, debería revisarlo alguien responsable de las cifras.

**Por qué esta arquitectura:** Cada paso necesita el resultado del anterior: sin cifras limpias no hay indicadores correctos, y sin indicadores no hay nada que revisar. Por eso una cadena estricta encaja mejor que el trabajo en paralelo o un orquestador. Calcular con la calculadora en lugar de con el modelo de lenguaje y la revisión por un agente propio evitan indicadores que parecen plausibles pero son erróneos. La revisión recibe también las cifras extraídas, así que puede rastrear cada indicador hasta su fuente.

**Cómo adaptarlo:** Adjunta directamente el informe anual o vuestra tabla de indicadores. Otros indicadores, como el apalancamiento o el flujo de caja libre, se añaden en el prompt de sistema del agente de análisis. Para muchas empresas seguidas conviene el procesamiento por lotes con una fila por empresa.

## 6 · Artículo de blog {#blog-article}
<!-- keywords: marketing y contenidos, briefing, redactor, corrección -->

**Ámbito:** Marketing y contenidos · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Principiante · **Elementos:** archivos de resultado

Los buenos artículos nacen de un briefing claro: quién los lee, desde qué enfoque y con qué mensajes clave. El flujo trabaja como una pequeña redacción y revisa el resultado antes de publicarlo.

**Cómo colaboran los agentes:** Un modelo rápido prepara un briefing estructurado con público, enfoque, esquema y mensajes clave. El redactor escribe el artículo a partir de él; una revisión de calidad integrada comprueba que siga el esquema y responda a las preguntas de los lectores y, si no, lo devuelve una vez para revisarlo. Una corrección rápida revisa extensión y legibilidad con la herramienta de estadísticas de texto y marca las afirmaciones sin verificar.

| Agente | Tarea | Recibe |
|---|---|---|
| **Briefing** | Define público, enfoque, esquema y mensajes clave en un briefing estructurado. (salida estructurada) | Tema |
| **Redactor** | Escribe el artículo a partir del briefing. (con control de calidad) | Briefing |
| **Corrección** | Revisa extensión y legibilidad y entrega la versión final. (Herramientas: `text_statistics`) | Redactor |

**Entrada:** Un tema en una frase. Opcionalmente puedes añadir el público, el tono o la extensión deseada en la propia entrada.

**Casos de prueba:** Tema en una frase

**Resultado:** Un artículo terminado en Markdown con títulos, una meta descripción y breves notas de corrección con el número de palabras y avisos sobre afirmaciones que conviene respaldar antes de publicar. La ejecución guarda además el resultado como archivo Markdown y HTML que puedes llevar a tu CMS.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: briefing, artículo y corrección se ejecutan uno tras otro; ningún paso espera a una persona. Una revisión de calidad aparte evalúa el artículo según dos criterios (sigue el esquema, responde a las preguntas de los lectores) y, si uno no se cumple, hace que el redactor lo revise una vez. La corrección no cambia el contenido, sino que marca las afirmaciones que necesitan una fuente. El artículo es un borrador: tú decides si se publica y dónde.

**Por qué esta arquitectura:** Un único briefing estructurado sustituye a dos planificadores en paralelo cuyos resultados el redactor tenía que conciliar: antes, el esquema se creaba sin conocer al público. Ahora público, enfoque, esquema y mensajes clave salen de una misma idea y llegan al redactor como campos bien separados. El redactor tiene una revisión de calidad con revisión automática porque es ahí donde surgen la mayoría de los fallos. Como ejemplo para principiantes, el flujo sigue siendo a propósito una cadena corta sin bifurcaciones, bucles ni aprobaciones, para que cada paso se pueda seguir en la ejecución.

**Cómo adaptarlo:** Cambia el tema en la entrada. Puedes subir vuestra guía de estilo como conocimiento y asignarla al redactor y a la corrección. La extensión deseada se ajusta en el prompt de sistema del redactor; el número de secciones o de mensajes clave, en el prompt de sistema del briefing.

## 7 · Preparar una oferta a medida {#sales-offer}
<!-- keywords: ventas, analista de necesidades, asesor de soluciones, redactor de ofertas -->

**Ámbito:** Ventas · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Avanzado · **Elementos:** aprobación, bucle de revisión, formulario de entrada, archivos de resultado, archivos como entrada

Una buena oferta responde a la necesidad real del cliente, no solo a sus palabras clave. El flujo aclara la necesidad, calcula una solución adecuada y redacta una oferta completa que aprueba una persona.

**Cómo colaboran los agentes:** El analista de necesidades separa los requisitos explícitos de los implícitos y reúne las preguntas abiertas. El asesor de soluciones combina posiciones de la lista de precios y calcula con la calculadora, incluida una variante dentro del presupuesto. El redactor de ofertas escribe la oferta; una revisión de calidad integrada comprueba la integridad y los precios. Un formulario de entrada recoge los datos clave (cliente, plazo, presupuesto, montaje en fin de semana). Después, una persona aprueba el borrador; un rechazo con comentario lo devuelve mediante un bucle al redactor de ofertas, que lo revisa y lo presenta de nuevo.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de necesidades** | Identifica los requisitos explícitos e implícitos. | Solicitud del cliente |
| **Asesor de soluciones** | Combina posiciones adecuadas y calcula con la calculadora. (Herramientas: `calculator`) | Analista de necesidades, Solicitud del cliente |
| **Redactor de ofertas** | Redacta el borrador de oferta para el cliente. (con control de calidad; Herramientas: `calculator`) | Analista de necesidades, Asesor de soluciones |

**Entrada:** La solicitud del cliente y vuestra lista de precios con descuentos y condiciones. El formulario recoge los datos clave; la lista de precios puedes escribirla en el texto o adjuntarla como archivo de Excel, CSV o PDF, como muestra el archivo de ejemplo.

**Archivos de ejemplo:** `Lista_precios_mobiliario_oficina.xlsx`

**Casos de prueba:** Solicitud y lista de precios en el texto; Lista de precios como archivo de Excel

**Resultado:** Un borrador de oferta con carta de presentación, tabla de partidas, totales, variantes, supuestos y preguntas abiertas. Solo tras tu aprobación guarda la ejecución la oferta en PDF y como archivo de Word editable; el envío al cliente lo haces tú.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: análisis de necesidades, cálculo y borrador se ejecutan sin esperas; una revisión de calidad aparte evalúa la oferta según tres criterios (todos los requisitos tratados, precios coherentes con el cálculo, puntos abiertos indicados) y, si hace falta, la hace revisar una vez. Después decide una persona: la aprobación genera los archivos; el rechazo exige un comentario y devuelve la oferta al redactor de ofertas junto con el borrador anterior. El bucle permite como máximo tres rondas de revisión; después, la ejecución termina como fallida. El análisis de necesidades y el cálculo del asesor de soluciones no se repiten; si el comentario cambia cantidades, descuentos o partidas de entrega, el redactor de ofertas vuelve a calcular los totales afectados con la calculadora. El flujo nunca envía nada al cliente.

**Por qué esta arquitectura:** Cada solicitud necesita los mismos pasos en el mismo orden, por eso una cadena fija encaja mejor que un orquestador. Los precios se calculan con la calculadora en un paso propio, de modo que el redactor toma de ahí los precios de lista en lugar de inventarlos. El bucle en la aprobación existe porque los rechazos suelen ser pequeñas correcciones, como una formulación, una nota sobre un descuento o una pregunta abierta que falta; revisar con el comentario es más rápido que empezar de nuevo. A propósito, solo vuelve al redactor de ofertas, que recalcula con la calculadora las cantidades o descuentos modificados pero no añade nuevos precios de lista; así se mantiene la base revisada de la solución.

**Cómo adaptarlo:** Adjunta tu lista de precios actual como archivo; así basta con la solicitud del cliente como texto. Las condiciones de pago y los textos estándar se añaden en el prompt de sistema del redactor de ofertas.

## 8 · Responder consultas de clientes {#customer-service}
<!-- keywords: atención al cliente, clasificador, revisor de políticas, redactor de respuestas, desescalada -->

**Ámbito:** Atención al cliente · **Agentes:** 4 · **Patrón:** con ramas · **Nivel:** Principiante · **Elementos:** decisión, aprobación, bucle de revisión, formulario de entrada, archivos como entrada, conexión MCP opcional

En atención al cliente llegan muchas consultas a la vez y cada una necesita la regla, los datos de pedido y el tono adecuados. El flujo ordena las consultas, comprueba políticas y plazos con los datos del pedido y prepara respuestas para su aprobación.

**Cómo colaboran los agentes:** Un clasificador rápido ordena cada consulta por tema, urgencia y estado de ánimo. El revisor de políticas aplica la política de servicio y recalcula los plazos con la herramienta de fechas; si tu copia está conectada a la tienda, consulta cada pedido en modo de solo lectura con get_order, y si no, usa los datos de pedido de las consultas o una exportación de pedidos adjunta. El redactor de respuestas escribe los borradores; una revisión de calidad comprueba que no se prometa nada que vaya más allá de la política. Un nodo de decisión envía primero los escalados a un agente de desescalada. Cada borrador espera una aprobación; un rechazo con comentario devuelve los borradores mediante un bucle al redactor de respuestas, que los revisa y los presenta de nuevo para su aprobación (como máximo tres rondas).

| Agente | Tarea | Recibe |
|---|---|---|
| **Clasificador** | Ordena cada consulta por tema, urgencia y estado de ánimo. (salida estructurada) | Consultas |
| **Revisor de políticas** | Aplica la política de servicio y comprueba plazos con la herramienta de fechas. (Herramientas: `days_between`) | Clasificador, Consultas |
| **Redactor de respuestas** | Escribe borradores de respuesta amables para su aprobación. (con control de calidad) | Clasificador, Revisor de políticas, Desescalada |
| **Desescalada** | Prepara cómo tratar a clientes molestos y qué necesita aprobación. | ¿Escalado? |

**Entrada:** Varias consultas de clientes con números de pedido, la fecha de hoy y vuestra política de servicio, como extracto en el texto o como archivo (PDF, Word, Markdown); el archivo de ejemplo contiene una política más detallada. Las fechas de pedido y entrega proceden de las consultas, de una exportación de pedidos de vuestra tienda adjunta (JSON, CSV o Excel) o, con conexión, directamente de la tienda; la exportación de ejemplo contiene los tres pedidos de las consultas de ejemplo.

**Archivos de ejemplo:** `Politica_servicio_Cocina_Muestra.pdf`, `Pedidos_tienda_Cocina_Muestra.json`

**Casos de prueba:** Cuatro consultas, una de ellas enfadada; Una pregunta amable sobre un producto; Política como archivo PDF; Solo números de pedido, exportación de pedidos adjunta

**Resultado:** Para cada consulta, una clasificación, la regla aplicable con la comprobación del plazo y un borrador de respuesta que una persona aprueba antes de enviarlo. La revisión de políticas indica de dónde proceden los datos de pedido (tienda, exportación o consulta) y cuáles faltan.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: la clasificación, la decisión de escalado (a desescalada cuando al menos un cliente está molesto o pide más de lo que permite la política), la revisión de políticas y los borradores; la herramienta de fechas calcula los plazos, una revisión de calidad comprueba los borradores con tres criterios (conforme a la política, tono, sin promesas) y cada paso queda registrado. Una persona aprueba cada borrador antes de enviar nada: un rechazo requiere un comentario y devuelve los borradores al redactor de respuestas; si tras un máximo de tres rondas se siguen rechazando, la ejecución termina como fallida. Las respuestas siguen siendo borradores; nada se envía automáticamente. La conexión con la tienda es opcional y solo lee: la copia recibe get_order solo si la conectas a un servidor MCP cuya herramienta un administrador haya aprobado como de solo lectura; si no, funciona en un modo sin conexión claramente señalado. Las ejecuciones sin una persona presente (programaciones, series de pruebas, procesamiento por lotes) no pueden usar herramientas MCP salvo que un administrador permita expresamente el MCP desatendido.

**Por qué esta arquitectura:** Los pasos se apoyan unos en otros (clasificar, comprobar, redactar), así que basta una cadena fija con una rama para los escalados; un orquestador añadiría coste sin beneficio, y para clasificar basta un modelo rápido. Los datos de pedido llegan por una integración porque están en la tienda y cambian cada hora; el modo sin conexión con una exportación mantiene el ejemplo utilizable sin conexión. La aprobación con bucle de revisión se mantiene porque las respuestas van a clientes: la última palabra la tiene una persona.

**Conexión opcional: Tienda online (pedidos)** (Herramientas: `get_order`). Consulta de pedidos de solo lectura en vuestra tienda mediante MCP: get_order devuelve las fechas de pedido y entrega, el estado, los artículos y la última nota del transportista de un pedido. El revisor de políticas la usa para comprobar plazos con datos reales del pedido en lugar de con lo que dicen los clientes.

**Configuración:** Un administrador añade el servidor MCP de vuestra tienda en Herramientas → Servicios conectados y aprueba su herramienta get_order como de solo lectura. Al copiar el ejemplo eliges ese servidor como conexión; sin conexión, la copia funciona en modo sin conexión. Para probarlo sin tienda, ejecuta `python -m nodestro_examples.demo_mcp --language es` en el ordenador con la aplicación de escritorio de Nodestro, añade http://127.0.0.1:8765/mcp en Herramientas → Servicios conectados con el consentimiento para un servidor de desarrollo local, aprueba sus herramientas como de solo lectura y elígelo al copiar. El servidor de demostración solo lee y sirve los pedidos sintéticos de la exportación de ejemplo, nunca datos reales de clientes. Las ejecuciones sin una persona presente (programaciones, series de pruebas, procesamiento por lotes) no pueden usar herramientas MCP salvo que un administrador permita expresamente el MCP desatendido.

**Sin conexión:** Modo sin conexión: no hay ninguna tienda conectada. El revisor de políticas usa solo los datos de pedido de las consultas o de una exportación de pedidos adjunta e indica los que faltan; no consulta nada.

**Cómo adaptarlo:** Adjunta vuestra política completa y las preguntas frecuentes como archivo, o súbelas como conocimiento y asígnalas al revisor de políticas si se aplican de forma permanente. Para comprobar pedidos en directo, haz configurar la integración con la tienda y elige el servidor al copiar el ejemplo. El tono de tu marca (tú o usted, despedida) se define en el prompt de sistema del redactor de respuestas. El procesamiento por lotes atiende muchas consultas a la vez, pero las ejecuciones sin una persona presente no pueden usar la conexión con la tienda, así que adjunta a los lotes una exportación de pedidos.

## 9 · Publicar una vacante y preparar entrevistas {#hr-recruiting}
<!-- keywords: recursos humanos, perfil del puesto, oferta de empleo, guía de entrevista, revisor de equidad, revisión -->

**Ámbito:** Recursos humanos · **Agentes:** 5 · **Patrón:** con ramas · **Nivel:** Avanzado · **Elementos:** decisión, aprobación, archivos de resultado

Una buena contratación empieza con un perfil claro y entrevistas justas y comparables. El flujo convierte unas notas sueltas en un perfil del puesto, una oferta de empleo y una guía de entrevista, lo revisa todo en cuanto a equidad y deja la aprobación en manos de una persona.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** El agente del perfil ordena tareas y requisitos. A partir de ahí se crean en paralelo la oferta de empleo y la guía de entrevista. El revisor de equidad comprueba ambas en busca de formulaciones discriminatorias o no admisibles, por ejemplo sobre la edad o la lengua materna, e indica qué debe revisar una persona. Si hay objeciones, un nodo de decisión envía la documentación a una revisión que aplica sus propuestas; si no, se mantienen las primeras versiones. Por último, la persona responsable de la contratación o RR. HH. revisa la oferta, la guía, la revisión de equidad y, en su caso, la versión revisada, y aprueba la documentación.

| Agente | Tarea | Recibe |
|---|---|---|
| **Perfil del puesto** | Ordena tareas, requisitos imprescindibles y deseables y competencias. | Necesidad de contratación |
| **Oferta de empleo** | Redacta una oferta de empleo atractiva e inclusiva. | Perfil del puesto |
| **Guía de entrevista** | Prepara preguntas de entrevista estructuradas con anclas de valoración. | Perfil del puesto |
| **Revisor de equidad** | Revisa la oferta y la guía en busca de discriminación y preguntas inadmisibles. (salida estructurada) | Oferta de empleo, Guía de entrevista |
| **Revisión** | Aplica a la oferta y a la guía los cambios propuestos por la revisión de equidad. | ¿Hace falta revisar? |

**Entrada:** Notas sobre el puesto: tareas, cualificaciones deseadas, equipo, condiciones y retribución.

**Casos de prueba:** Notas con deseos problemáticos

**Resultado:** Perfil del puesto, oferta de empleo y guía de entrevista con anclas de valoración, una revisión de equidad estructurada y, si hubo objeciones, una versión revisada con la lista de cambios. La ejecución crea el archivo de Word solo después de la aprobación.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el revisor de equidad emite un dictamen estructurado; si la documentación no se puede usar sin cambios, un nodo de decisión la envía a la revisión y, si no, pasa directamente a la aprobación. En la ejecución se ve qué rama se tomó. La decisión final sigue en manos de una persona: la persona responsable de la contratación o RR. HH. revisa toda la documentación en la aprobación; un rechazo exige un comentario y termina la ejecución, y solo una aprobación crea el archivo de Word. El flujo solo elabora documentos: nunca ve, evalúa ni clasifica a candidatos reales.

**Por qué esta arquitectura:** La oferta y la guía dependen solo del perfil, por eso se crean en paralelo y se revisan juntas, lo que mantiene coherentes los requisitos y las formulaciones. La revisión de equidad actúa como filtro automático: la revisión solo cuesta un paso más cuando hay objeciones. A propósito no hay un bucle de revisión y corrección, porque las cuestiones de equidad y legales no deben darse por resueltas solo porque los modelos se pongan de acuerdo; la persona que aprueba ve la revisión, la versión revisada y los puntos abiertos uno junto a otro. El filtrado de candidaturas queda excluido a propósito, porque según el Reglamento de IA de la UE sería IA de alto riesgo.

**Cómo adaptarlo:** Sustituye las notas por tu necesidad de contratación. Puedes guardar vuestro perfil como empleador y vuestros beneficios como conocimiento y asignarlos al agente de la oferta. Los requisitos legales de tu país se añaden en el prompt de sistema del revisor de equidad. No amplíes el flujo para filtrar, evaluar o clasificar candidaturas sin una revisión jurídica: según el Reglamento de IA de la UE, esos sistemas son IA de alto riesgo.

## 10 · Convertir una pregunta de investigación en hipótesis {#research-hypotheses}
<!-- keywords: investigación y desarrollo, analista de la pregunta, coordinación de investigación, planificador del estudio -->

**Ámbito:** Investigación y desarrollo · **Agentes:** 3 · **Patrón:** adaptativo (orquestación) · **Nivel:** Avanzado · **Elementos:** orquestador con equipos, formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento, presupuesto y límites

La buena investigación empieza con una pregunta precisa y comprobable y con los métodos adecuados. Un ensayo de materiales necesita un análisis de potencia, un estudio con entrevistas necesita un plan de muestreo y un consentimiento informado, y muchas preguntas necesitan ambos. El flujo de trabajo analiza la pregunta y deja que una coordinación de investigación incorpore exactamente los equipos de métodos que la pregunta requiere.

**Cómo colaboran los agentes:** El analista de la pregunta la estructura y resume los datos adjuntos, porque los equipos trabajan sin los archivos. La coordinación de investigación, un orquestador, empieza siempre con el equipo de hipótesis y luego decide: los resultados medibles van al equipo de estadística, cuyo diseño de estudio y nivel de significación fija como parámetros; las experiencias y los motivos van al equipo de métodos cualitativos; las personas o los datos personales incorporan al equipo de ética y protección de datos. Si un equipo considera que una hipótesis no es comprobable, la coordinación la devuelve una vez al equipo de hipótesis. El planificador del estudio convierte todo en un plan.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de la pregunta** | Aclara objetivo, variables, condiciones y lagunas de conocimiento. | Pregunta de investigación |
| **Coordinación de investigación** | Decide qué equipos de métodos necesita la pregunta y fija los parámetros del equipo de estadística. (Orquestador) | Analista de la pregunta |
| **Planificador del estudio** | Deriva el plan de estudio del análisis y de los resultados de los equipos de métodos. | Analista de la pregunta, Coordinación de investigación |

**Equipos que el orquestador puede emplear:**

| Equipo | Tarea | Capacidades |
|---|---|---|
| **Equipo de hipótesis** | Convierte una pregunta de investigación analizada en hipótesis comprobables con hipótesis nulas y predicciones medibles; las revisa tras una crítica metodológica. | hypotheses, operationalisation |
| **Equipo de estadística** | Contrasta las hipótesis cuantitativas con los datos, evalúa los datos previos con la calculadora y estima el tamaño de muestra para un diseño, un nivel de significación y una potencia dados. (Parámetros: Diseño del estudio, Nivel de significación α, Potencia objetivo) | statistics, power analysis, quantitative methods |
| **Equipo de métodos cualitativos** | Planifica entrevistas, observaciones o grupos focales para preguntas sobre experiencias, motivos y comportamientos: muestra, guía y análisis. | qualitative methods, interviews, observation |
| **Equipo de ética y protección de datos** | Revisa estudios con personas o datos personales: consentimiento, minimización de datos, anonimización, participación de la representación de los trabajadores y comité de ética. | research ethics, data protection, informed consent |

**Entrada:** Una pregunta de investigación con su objetivo, los datos existentes de ensayos previos y las condiciones como material, tiempo y equipos. Puedes adjuntar datos de medición y documentos como archivos; el archivo de ejemplo contiene las valoraciones del ensayo previo por panel.

**Archivos de ejemplo:** `Ensayo_previo_PL-7.csv`

**Casos de prueba:** Pregunta y ensayo previo en el texto; Datos del ensayo previo en CSV; Estudio con entrevistas sin mediciones

**Resultado:** Un plan de estudio con hipótesis, diseño, tamaño de muestra, método de medición o de entrevista, análisis, criterios de parada y riesgos abiertos, también como archivo de Word. La vista de orquestación de la ejecución muestra qué equipos de métodos participaron, con qué parámetros, y cuáles se dejaron fuera y por qué. El planificador propone el plan para el conocimiento; tú decides si se guarda.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: la coordinación decide qué equipos de métodos trabajan y rellena el formulario del equipo de estadística (diseño, nivel de significación, potencia); cada decisión queda registrada con su motivo. Límites: como máximo 7 decisiones, cada equipo como máximo dos veces, un presupuesto de 4 USD por ejecución. Ningún paso espera a una persona; el plan es un borrador para la persona investigadora responsable.

**Por qué esta arquitectura:** Una cadena fija ejecutaría siempre una crítica estadística, incluso en un estudio con entrevistas donde no hay nada que calcular, y solo incluiría la ética si alguien se acordara. La coordinación elige según la pregunta y pasa al equipo de estadística parámetros estructurados en lugar de texto libre, de modo que el análisis de potencia calcula con un diseño definido. El análisis y el plan final siguen siendo pasos fijos: todo estudio los necesita.

**Cómo adaptarlo:** Sustituye la pregunta y el ensayo previo por los tuyos y adjunta directamente los datos de medición. Añade tus directrices estadísticas al agente del equipo de estadística. Si tu ámbito necesita otro equipo de métodos, por ejemplo un equipo de laboratorio, guárdalo como flujo de trabajo con una descripción clara y añádelo a los equipos de la coordinación.

## 11 · Revisión de código con pruebas {#code-review}
<!-- keywords: desarrollo de software, analista de errores, revisor de seguridad, mejora y pruebas -->

**Ámbito:** Desarrollo de software · **Agentes:** 3 · **Patrón:** paralelo · **Nivel:** Avanzado · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada

Una segunda mirada encuentra errores antes de que lleguen a producción. El flujo revisa el código a la vez en busca de errores lógicos y problemas de seguridad y entrega una versión mejorada con pruebas.

**Cómo colaboran los agentes:** El analista de errores y el revisor de seguridad trabajan en paralelo sobre el mismo código. El agente de mejora reúne los hallazgos y escribe código corregido y pruebas pytest; una revisión de calidad integrada comprueba que cada hallazgo se trate y quede cubierto por pruebas.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de errores** | Busca errores lógicos, casos límite y desviaciones respecto a la descripción. | Código fuente |
| **Revisor de seguridad** | Revisa el código en busca de vulnerabilidades y patrones inseguros. | Código fuente |
| **Mejora y pruebas** | Escribe código corregido y pruebas pytest para todos los hallazgos. (con control de calidad) | Analista de errores, Revisor de seguridad, Código fuente |

**Entrada:** Un fragmento de código con un breve contexto: lenguaje, finalidad y entorno, o un proyecto entero como archivo ZIP o archivos sueltos en el campo de archivo. Los archivos comprimidos solo se leen, nunca se ejecutan. El código se mantiene sin cambios en su lenguaje; las explicaciones aparecen en el idioma de la interfaz. El archivo de ejemplo es un pequeño proyecto Python con errores incorporados.

**Archivos de ejemplo:** `calculadora-descuentos.zip`

**Casos de prueba:** Fragmento de código en el texto; Proyecto como archivo ZIP

**Resultado:** Una lista de hallazgos ordenada por gravedad, el código corregido y pruebas de pytest que cubren cada hallazgo, además como archivo Markdown. Las pruebas no se ejecutan automáticamente; ejecútalas en local.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: una revisión de calidad hecha por un segundo modelo compara la respuesta de Mejora y pruebas con tres criterios (cada hallazgo tratado, una prueba por cada hallazgo corregido, código completo sin marcadores de posición); si un criterio falla, el agente revisa su respuesta una vez, y el resultado de la revisión queda registrado con la ejecución. La revisión juzga el texto, no ejecuta el código. Ningún paso espera a una persona, no hay un presupuesto propio (se aplica el presupuesto predeterminado de tu espacio de trabajo) y los archivos comprimidos subidos solo se leen, nunca se ejecutan. El código corregido y las pruebas son una propuesta: revísalos y ejecuta las pruebas en local antes de adoptar nada.

**Por qué esta arquitectura:** Los errores y los problemas de seguridad son dos miradas independientes sobre el mismo código, por eso el analista de errores y el revisor de seguridad trabajan en paralelo y ninguno espera al otro; el agente de mejora recibe además el código original para poder unir sus hallazgos y eliminar duplicados. La revisión de calidad con una corrección existe porque, al combinar dos revisiones, lo típico es olvidar un hallazgo o una prueba. No se usó a propósito un coordinador, porque cada revisión necesita ambas miradas; tampoco se ejecutan código ni pruebas en el flujo de trabajo, para que nunca corra código ajeno en la plataforma.

**Cómo adaptarlo:** Adjunta tu proyecto como ZIP o pega el código e indica el lenguaje y el framework. Para otros lenguajes, ajusta el framework de pruebas en el agente de mejora, por ejemplo Jest o JUnit. Vuestras guías de estilo de código puedes guardarlas como conocimiento. A través de la API del flujo de trabajo, la revisión también puede lanzarse desde una pipeline de CI.

## 12 · Estructurar un contrato y encontrar puntos de revisión {#contract-review}
<!-- keywords: derecho y administración, estructurador del contrato, explicador de cláusulas, analista de puntos de revisión, resumen del contrato, cláusulas críticas -->

**Ámbito:** Derecho y administración · **Agentes:** 5 · **Patrón:** con ramas · **Nivel:** Avanzado · **Elementos:** decisión, formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento, archivos de conocimiento

Los contratos son largos y las cláusulas importantes se esconden en los detalles. Si una cláusula es aceptable depende además de los criterios propios de la empresa. El flujo ordena un contrato, lo explica en lenguaje sencillo y lo contrasta con el manual de contratación (playbook) del cliente, para que una persona cualificada vea enseguida dónde se aparta. No sustituye el asesoramiento jurídico.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** El estructurador recoge partes, duración, prestaciones y plazos. Sobre esa base trabajan en paralelo el explicador de cláusulas (lenguaje sencillo) y el analista de puntos de revisión; ambos leen el contrato por sí mismos, como texto o como archivo subido. El analista busca cada cláusula en el playbook de la empresa, cita la sección del playbook y clasifica la cláusula como estándar, posición alternativa, desviación o línea roja. Si encuentra una línea roja u otra cláusula crítica, un nodo de decisión añade una revisión en profundidad de esas cláusulas. El agente del informe lo reúne todo en un resumen estructurado con preguntas para el asesoramiento jurídico.

| Agente | Tarea | Recibe |
|---|---|---|
| **Estructurador del contrato** | Recoge partes, objeto, duración, remuneración y plazos. | Texto del contrato |
| **Explicador de cláusulas** | Explica cada cláusula en lenguaje sencillo. | Estructurador del contrato, Texto del contrato |
| **Analista de puntos de revisión** | Contrasta cada cláusula con el playbook del cliente y encuentra cláusulas inusuales, desequilibradas o ausentes. (salida estructurada) | Estructurador del contrato, Texto del contrato |
| **Resumen del contrato** | Reúne explicaciones y puntos de revisión en un resumen estructurado. (salida estructurada) | Explicador de cláusulas, Analista de puntos de revisión, Cláusulas críticas |
| **Cláusulas críticas** | Examina a fondo las cláusulas críticas y prepara preguntas para negociar. | ¿Cláusulas críticas? |

**Entrada:** El contrato como archivo (PDF, Word, Markdown o texto) en el campo «Contrato como archivo» o como texto, a ser posible con números de cláusula. El archivo lo subes directamente al iniciar; el contrato no va a la colección de conocimiento. El playbook viene de la colección de conocimiento; se incluye el playbook inventado de Comercial Muestra KG. El archivo de ejemplo contiene el contrato inventado de la tarea de prueba.

**Archivos de ejemplo:** `Contrato_servicios_software_ejemplo.docx`

**Casos de prueba:** Contrato en el texto, con cláusulas críticas; Contrato como archivo de Word, sin texto; Contrato de mantenimiento equilibrado

**Resultado:** Un resumen estructurado con síntesis, datos clave, cláusulas explicadas, puntos de revisión y preguntas para una abogada o un abogado, además en PDF y como archivo de Word editable. Cada punto de revisión nombra la sección del playbook con la que se comparó, y los temas sobre los que el playbook no dice nada se marcan como tales. El estructurador propone los datos clave del contrato para el conocimiento, por ejemplo para un registro de contratos; solo se guarda lo que confirmes. El resultado es una ayuda de trabajo y no un asesoramiento jurídico.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el analista de puntos de revisión clasifica cada cláusula según el playbook y cuenta las críticas; toda línea roja cuenta como crítica. Si el número es mayor que cero, el nodo de decisión añade la revisión en profundidad de las cláusulas críticas; si no, se omite. Ningún paso espera a una persona y el flujo no envía nada. El resumen y sus preguntas son la base para la revisión por una abogada o un abogado; lo que se negocia lo deciden las personas implicadas.

**Por qué esta arquitectura:** Explicar y revisar no dependen entre sí y por eso se ejecutan en paralelo sobre la estructura. El playbook es conocimiento consultable en lugar de texto en el prompt: el departamento jurídico lo mantiene en un solo lugar, la búsqueda aporta solo la sección pertinente y la cita hace trazable cada clasificación. La revisión en profundidad es una bifurcación porque solo compensa su coste cuando se cruza una línea roja. No se usó un orquestador porque todo contrato necesita los mismos pasos.

**Archivos de conocimiento (sintéticos, se crean al copiar):** Playbook_contratos_Comercial_Muestra: Manual de contratación inventado de Comercial Muestra KG para contratos de software y nube: posición estándar, alternativa y línea roja por tema.

**Cómo adaptarlo:** Sube tu contrato como archivo al iniciar o pégalo. Sustituye el playbook inventado de la colección de conocimiento por el vuestro, a ser posible con la misma estructura por tema: posición estándar, posición alternativa aceptable y línea roja. Los temas que os importen, como seguros o derechos de auditoría, basta con añadirlos al playbook; el analista los encuentra con la búsqueda.

## 13 · Crear un plan de aprendizaje personal {#learning-plan}
<!-- keywords: educación y formación, evaluación del nivel, planificador de aprendizaje, tutor, autor de pruebas -->

**Ámbito:** Educación y formación · **Agentes:** 4 · **Patrón:** paralelo · **Nivel:** Principiante · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada, memoria

Se aprende mejor con un plan que parte del nivel propio. El flujo crea un plan de aprendizaje personal, explica los primeros contenidos y comprueba la comprensión con un cuestionario.

**Cómo colaboran los agentes:** La evaluación del nivel determina el punto de partida y las lagunas, y el planificador elabora con ello un plan semanal. Sobre esa base trabajan en paralelo el tutor (contenidos de la semana elegida, apoyados en tu material del curso si quieres) y el autor de pruebas (prueba de conocimientos con soluciones). El resultado contiene las tres partes. La evaluación del nivel y el planificador comparten una memoria: primero leen el progreso de las semanas anteriores y al final lo actualizan, de modo que cada semana se apoya en la anterior.

| Agente | Tarea | Recibe |
|---|---|---|
| **Evaluación del nivel** | Determina el punto de partida, el objetivo y las lagunas. | Objetivo de aprendizaje |
| **Planificador de aprendizaje** | Crea un plan semanal con objetivos y ejercicios. | Evaluación del nivel |
| **Tutor** | Explica los contenidos de la primera semana con ejemplos y ejercicios. | Planificador de aprendizaje, Objetivo de aprendizaje |
| **Autor de pruebas** | Crea una prueba de conocimientos con soluciones para la primera semana. | Planificador de aprendizaje |

**Entrada:** Quién aprende, el objetivo, el tiempo disponible, los conocimientos previos y el estilo de aprendizaje preferido. En el formulario eliges la semana que se elabora y puedes adjuntar material propio; el archivo de ejemplo es una guía breve sobre tablas dinámicas. A partir de la segunda semana, añade una nota breve sobre cómo fue la última semana (resultado de la prueba, qué costó); el nivel, los objetivos, los temas completados y las dificultades de semanas anteriores se recuerdan.

**Archivos de ejemplo:** `Guia_rapida_tablas_dinamicas.docx`

**Casos de prueba:** Semana 1 sin material; Semana 2 con material del curso

**Resultado:** Un plan de aprendizaje de cuatro semanas con objetivos por semana, explicaciones claras con ejercicios para la semana elegida y una prueba con soluciones y explicaciones, además en PDF para imprimir.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: al inicio de cada ejecución, la evaluación del nivel y el planificador leen la memoria «learning-progress» y la actualizan al final. Contiene el nivel, los objetivos, los temas completados, las dificultades y el plan resumido, pero ningún dato personal sensible. La memoria pertenece a tu copia y se conserva entre ejecuciones; en el editor del flujo puedes ver y borrar sus entradas en la memoria de cualquiera de los dos agentes, por ejemplo para corregir una entrada errónea o empezar de nuevo con otra persona. En la primera semana la memoria está vacía y el flujo trabaja solo con tu descripción. Ningún paso espera a una persona: el plan, las explicaciones y la prueba son propuestas que adaptas a tu propio ritmo.

**Por qué esta arquitectura:** El aprendizaje se extiende durante semanas, pero cada ejecución empieza de cero. Sin memoria tendrías que describir tu progreso cada semana y el plan se reharía desde el principio en lugar de apoyarse en la semana anterior. La memoria guarda justo este estado cambiante; el material del curso que no cambia va, en cambio, al conocimiento. Solo la evaluación y el planificador recuerdan, porque deciden qué viene después; el tutor y el autor de pruebas trabajan en paralelo sobre la semana elegida del plan y no necesitan historial propio.

**Cómo adaptarlo:** Describe tu propio objetivo; funciona para casi cualquier tema. Para las semanas siguientes, vuelve a iniciar el flujo de trabajo y cambia la semana en el formulario. El material que uses de forma permanente puedes subirlo como conocimiento y asignarlo al tutor.

## 14 · Revisar el presupuesto familiar y ahorrar {#household-budget}
<!-- keywords: particulares – finanzas, analista de presupuesto, asesor de ahorro, comprobación de realidad -->

**Ámbito:** Particulares – finanzas · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Principiante · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada

A final de mes suele quedar menos de lo esperado. El flujo recalcula un presupuesto familiar, encuentra potencial de ahorro y comprueba si las propuestas son realistas en el día a día.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** El analista de presupuesto calcula totales, excedente y porcentajes por categoría con la calculadora. El asesor de ahorro estima ahorros concretos, también recalculados. La comprobación de realidad recibe ambos resultados, revisa la viabilidad y entrega un resultado estructurado.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de presupuesto** | Calcula ingresos, gastos, excedente y porcentajes con la calculadora. (Herramientas: `calculator`) | Presupuesto familiar |
| **Asesor de ahorro** | Encuentra posibilidades de ahorro concretas y estima su efecto. (Herramientas: `calculator`) | Analista de presupuesto, Presupuesto familiar |
| **Comprobación de realidad** | Comprueba la viabilidad de las propuestas y las resume. (salida estructurada) | Analista de presupuesto, Asesor de ahorro |

**Entrada:** Ingresos, gastos fijos y variables de un hogar y un objetivo de ahorro. En lugar de teclearlo todo, puedes adjuntar movimientos bancarios o un libro de cuentas como archivo CSV o Excel; el archivo de ejemplo contiene un mes inventado.

**Archivos de ejemplo:** `Movimientos_bancarios_marzo_2026.csv`

**Casos de prueba:** Presupuesto en el texto; Movimientos bancarios en CSV

**Resultado:** Una revisión estructurada del presupuesto con el excedente mensual actual, el potencial de ahorro, medidas, primeros pasos rápidos y avisos, además como archivo de Excel. No sustituye el asesoramiento financiero ni el de deudas.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el analista de presupuesto y el asesor de ahorro calculan cada total con la calculadora, y la comprobación de realidad devuelve campos fijos (excedente mensual, potencial de ahorro, medidas, primeros pasos, avisos) que pasan al archivo de Excel. El ejemplo está marcado como sensible: cada agente tiene la instrucción de nombrar los puntos que debería revisar una persona cualificada y de no sonar más seguro de lo que permiten los datos. No hay paso de aprobación ni revisión automática; no hay un presupuesto propio (se aplica el presupuesto predeterminado de tu espacio de trabajo). No se transfiere, cancela ni reserva nada: el resultado es una ayuda para tus propias decisiones, no asesoramiento financiero ni de deudas.

**Por qué esta arquitectura:** Cada paso se apoya en el anterior: el ahorro solo se puede estimar cuando se conoce el presupuesto, y solo se puede comprobar cuando existen ambos, así que basta una cadena fija. La calculadora hace que las cifras se calculen en lugar de adivinarse, y los campos estructurados permiten comparar excedente y potencial entre ejecuciones. En lugar de un bucle hay una comprobación de realidad propia y ligera, porque su tarea es descartar ideas poco realistas, no pulir el texto. No se usaron a propósito una conexión bancaria ni una memoria, para que los datos personales de la cuenta solo se entreguen como archivo para esta ejecución y no se guarden entre ejecuciones.

**Cómo adaptarlo:** Adjunta tus propios movimientos bancarios o introduce tus cifras; añade prioridades personales, como «el coche se queda», en el texto. Los extractos bancarios contienen datos personales: se quedan contigo y solo se pasan al modelo para esta ejecución.

## 15 · Planificar un viaje a medida {#travel-plan}
<!-- keywords: particulares – viajes, planificador de rutas, planificador de presupuesto, organizador del viaje, documentos de viaje -->

**Ámbito:** Particulares – viajes · **Agentes:** 4 · **Patrón:** con ramas · **Nivel:** Principiante · **Elementos:** decisión, formulario de entrada, archivos de resultado

Un buen viaje se adapta a los intereses, el presupuesto y las limitaciones de todos los viajeros. El flujo planifica una ruta, recalcula el presupuesto y crea una lista para la organización.

**Cómo colaboran los agentes:** El planificador de rutas diseña un plan diario según intereses y condiciones. El planificador de presupuesto calcula noches y costes con la calculadora y la herramienta de fechas. El organizador reúne todo en un plan de viaje con lista de comprobación; una revisión de calidad comprueba presupuesto y limitaciones. Un formulario de entrada recoge destino, fechas, viajeros y presupuesto. Para viajes al extranjero, un nodo de decisión añade una lista de documentos y requisitos de entrada.

| Agente | Tarea | Recibe |
|---|---|---|
| **Planificador de rutas** | Diseña un plan diario según intereses y limitaciones. | Deseos de viaje |
| **Planificador de presupuesto** | Calcula noches y costes con la calculadora y la herramienta de fechas. (Herramientas: `calculator`, `days_between`) | Planificador de rutas |
| **Organizador del viaje** | Reúne ruta y presupuesto en un plan de viaje con lista de comprobación. (con control de calidad) | Planificador de rutas, Planificador de presupuesto, Documentos de viaje |
| **Documentos de viaje** | Enumera documentos, seguro y requisitos de entrada para viajes al extranjero. | ¿Extranjero? |

**Entrada:** Quién viaja, destino y fechas, presupuesto, intereses y limitaciones.

**Casos de prueba:** Viaje familiar a Lisboa (extranjero); Fin de semana en el propio país

**Resultado:** Un plan de viaje con programa diario, tabla de presupuesto y lista de comprobación, además en PDF para llevar. Los precios y horarios son estimaciones basadas en conocimientos generales y deben comprobarse antes de reservar, porque el flujo de trabajo no usa datos en tiempo real.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el nodo de decisión lee el campo del formulario «Viaje al extranjero» y solo ejecuta el agente Documentos de viaje cuando está marcado; el planificador de presupuesto cuenta las noches con la herramienta de fechas y suma los costes con la calculadora. Una revisión de calidad hecha por un segundo modelo compara el plan del organizador del viaje con tres criterios (dentro del presupuesto, todas las limitaciones respetadas, datos sin verificar marcados); si uno falla, el plan se revisa una vez y el resultado queda registrado con la ejecución. Ningún paso espera a una persona y no hay un presupuesto propio (se aplica el presupuesto predeterminado de tu espacio de trabajo). No se reserva nada: precios, horarios y requisitos de entrada son estimaciones que compruebas antes de reservar.

**Por qué esta arquitectura:** Ruta, presupuesto y organización se apoyan unos en otros, por eso forman una cadena; solo la lista de documentos depende de una pregunta de sí o no, que un nodo de decisión resuelve a partir del formulario, así un fin de semana en el propio país no paga una lista de pasaportes. Las noches y los totales salen de herramientas, porque los errores de fechas y de sumas son la debilidad típica de los modelos de lenguaje. A propósito no se incluyó una búsqueda web en tiempo real: sus resultados cambian de un día para otro, las ejecuciones no serían reproducibles, el ejemplo dependería de una herramienta de servidor de pago y no podría compartirse tal cual; en su lugar, cada precio está marcado como estimación y puedes añadir tú la búsqueda web.

**Cómo adaptarlo:** Introduce tus deseos de viaje. Si quieres precios y horarios actuales, puedes añadir al planificador de rutas la herramienta de servidor «búsqueda web»; cada búsqueda tiene un coste adicional.

## 16 · Evaluar una idea de negocio {#business-idea}
<!-- keywords: autónomos y emprendedores, mentora de emprendimiento, jurado inversor -->

**Ámbito:** Autónomos y emprendedores · **Agentes:** 2 · **Patrón:** adaptativo (orquestación) · **Nivel:** Avanzado · **Elementos:** orquestador con equipos, archivos de resultado, presupuesto y límites

Antes de emprender, conviene mirar con serenidad el mercado, las cifras y los riesgos. Pero no todas las ideas necesitan a los mismos expertos: un servicio de reparación de bicicletas no necesita a una especialista en licencias, una empresa de bebidas sí. El flujo de trabajo deja que una mentora de emprendimiento reúna los equipos de expertos adecuados y que un jurado de inversores llegue a un veredicto fundamentado.

**Cómo colaboran los agentes:** La mentora de emprendimiento es un orquestador: lee la idea y decide cuáles de los cinco equipos de expertos involucra. Mercado, rentabilidad y riesgos trabajan en paralelo en cada idea; regulación y operaciones solo se suman cuando la idea lo requiere. Si los resultados se contradicen, la mentora hace a un equipo una pregunta de seguimiento concreta. Después, el jurado de inversores pondera todos los informes y emite un veredicto estructurado con una puntuación.

| Agente | Tarea | Recibe |
|---|---|---|
| **Mentora de emprendimiento** | Decide qué equipos de expertos necesita la idea, los hace trabajar en paralelo y plantea preguntas de seguimiento. (Orquestador) | Idea de negocio |
| **Jurado inversor** | Sopesa mercado, cifras y riesgos y emite un veredicto. (salida estructurada) | Idea de negocio, Mentora de emprendimiento |

**Equipos que el orquestador puede emplear:**

| Equipo | Tarea | Capacidades |
|---|---|---|
| **Equipo de mercado** | Estima públicos objetivo, demanda, disposición a pagar y competencia de una idea de negocio. | market analysis, target groups, competition |
| **Equipo de rentabilidad** | Calcula margen de contribución, punto de equilibrio, recuperación y escenarios de una idea de negocio con la calculadora. | profitability, break-even, financial planning |
| **Equipo de riesgos** | Busca los puntos débiles de una idea de negocio y formas económicas de comprobarlos antes de emprender. | risk analysis, validation experiments |
| **Equipo de regulación** | Identifica permisos, registros, etiquetado, higiene, seguros y obligaciones de protección de datos que afectan a una idea de negocio. | regulation, permits, licences, data protection |
| **Equipo de operaciones** | Comprueba si una idea de negocio puede ejecutarse como se describe: procesos, capacidad, equipamiento, proveedores y logística. | operations, technology, logistics, suppliers |

**Entrada:** Una descripción de la idea con oferta, públicos objetivo, precios, costes, capacidad y competidores conocidos.

**Casos de prueba:** Servicio móvil de reparación de bicicletas; Fábrica de kombucha (alimento regulado)

**Resultado:** Un veredicto estructurado (seguir adelante, adaptar o descartar) con puntuación, fortalezas, riesgos, supuestos que comprobar y próximos pasos concretos, también como informe PDF. En la ejecución, la vista de orquestación muestra qué equipos eligió la mentora, por qué, con qué encargo y qué entregó cada equipo.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: la mentora decide qué equipos trabajan, en qué orden y con qué encargo; cada decisión queda registrada con su motivo. Hay límites: como máximo 6 decisiones, cada equipo como máximo dos veces, como máximo 3 equipos a la vez y un presupuesto de 3 USD por ejecución. Ningún paso espera a una persona; el veredicto es la base de tu propia decisión.

**Por qué esta arquitectura:** Un flujo de trabajo fijo ejecutaría siempre a los cinco equipos y pagaría un análisis de licencias que un servicio de bicicletas no necesita, o los dejaría fuera cuando importan. La mentora toma justamente esa decisión, de forma trazable y dentro de unos límites. El jurado sigue siendo un paso fijo, porque un veredicto estructurado y comparable no debe depender de cómo la mentora repartió el trabajo.

**Cómo adaptarlo:** Describe tu idea con tus propias cifras. Para añadir otro experto, por ejemplo para cuestiones fiscales, guarda un flujo de trabajo con una descripción clara y capacidades y añádelo a los equipos de la mentora; ella decidirá sola cuándo hace falta. Tus propios datos de mercado puedes subirlos como conocimiento y asignarlos al analista de mercado del equipo de mercado.

## 17 · Desarrollar una estrategia de redes sociales {#creator-strategy}
<!-- keywords: influencers y creadores de contenido, agente de estrategia, desarrollador de ideas, planificador editorial -->

**Ámbito:** Influencers y creadores de contenido · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Principiante · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada, memoria

Publicar con regularidad requiere una línea clara y un plan que encaje con el tiempo disponible. El flujo deriva una estrategia a partir de las métricas, reúne ideas adecuadas y planifica la publicación.

**Cómo colaboran los agentes:** Una cadena de tres agentes: el agente de estrategia define posicionamiento, pilares de contenido y objetivos y analiza para ello las estadísticas adjuntas, el desarrollador de ideas formula ideas concretas de publicación con gancho y el planificador editorial las reparte en cuatro semanas. El desarrollador de ideas recuerda sus propuestas en una memoria para que las ejecuciones posteriores no repitan ideas. Un control de calidad comprueba si la frecuencia y la mezcla son realistas.

| Agente | Tarea | Recibe |
|---|---|---|
| **Agente de estrategia** | Define posicionamiento, pilares de contenido y objetivos medibles. | Perfil del creador |
| **Desarrollador de ideas** | Desarrolla ideas concretas de publicaciones con gancho y formato. | Agente de estrategia |
| **Planificador editorial** | Reparte las ideas en un plan realista de cuatro semanas. (con control de calidad) | Agente de estrategia, Desarrollador de ideas |

**Entrada:** Perfil con plataformas, cifras, publicaciones de éxito, público, objetivos, tiempo disponible y fecha de inicio. Puedes adjuntar además estadísticas como capturas o como exportación CSV/Excel; el archivo de ejemplo es una exportación así.

**Archivos de ejemplo:** `Estadisticas_publicaciones_marzo.csv`

**Casos de prueba:** Perfil en el texto; Perfil con exportación de estadísticas

**Resultado:** Un plan editorial de cuatro semanas con fecha, plataforma, formato, idea, gancho y llamada a la acción, precedido de un breve resumen de la estrategia, además como archivo de Excel para seguir planificando.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el desarrollador de ideas lee la memoria «creator-ideas» antes de empezar y, al final de cada ejecución, guarda él mismo allí los títulos provisionales de sus nuevas ideas, sin paso de confirmación; puedes ver o vaciar la memoria en Memoria. Una revisión de calidad hecha por un segundo modelo compara el calendario del planificador editorial con tres criterios (frecuencia acorde al tiempo disponible, pilares equilibrados, objetivos respaldados); si uno falla, el calendario se revisa una vez y el resultado queda registrado con la ejecución. Ningún paso espera a una persona y no hay un presupuesto propio (se aplica el presupuesto predeterminado de tu espacio de trabajo). No se publica nada: el plan es un borrador que ajustas y publicas tú.

**Por qué esta arquitectura:** Estrategia, ideas y calendario se apoyan estrictamente unos en otros, por eso basta una cadena de tres agentes; el planificador editorial recibe además la estrategia directamente para medir la mezcla con los pilares. Solo el desarrollador de ideas tiene memoria, porque las ideas repetidas son el verdadero problema de las ejecuciones mensuales, mientras que la estrategia debe surgir cada vez de las cifras actuales. No se usaron a propósito una búsqueda web de tendencias en tiempo real ni una conexión con las plataformas: los resultados de tendencias cambian a diario y harían que las ejecuciones no fueran reproducibles ni trasladables, y un borrador de plan no debe publicarse automáticamente; la estrategia se basa en cambio en tus propias estadísticas.

**Cómo adaptarlo:** Introduce tu perfil y tus cifras o adjunta capturas de tus estadísticas. Tu estilo de marca y los temas tabú se añaden en el prompt de sistema del desarrollador de ideas. La memoria «creator-ideas» está en Memoria; vacíala si quieres empezar de nuevo. Para un plan mensual puedes programar la copia.

## 18 · Comparar ofertas inmobiliarias {#real-estate}
<!-- keywords: sector inmobiliario, calculador de rentabilidad, analista del inmueble y la ubicación, valoración de oportunidades y riesgos -->

**Ámbito:** Sector inmobiliario · **Agentes:** 3 · **Patrón:** paralelo · **Nivel:** Avanzado · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada

En inmuebles deciden a la vez las cifras y la ubicación. El flujo recalcula rentabilidad y flujo de caja, analiza el inmueble y su entorno y contrapone oportunidades y riesgos.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** El calculador de rentabilidad obtiene la rentabilidad bruta y neta y el flujo de caja mensual con la calculadora, mientras el analista del inmueble y la ubicación valora en paralelo estado, reservas y entorno. La valoración reúne ambos en una comparación estructurada.

| Agente | Tarea | Recibe |
|---|---|---|
| **Calculador de rentabilidad** | Calcula rentabilidad, financiación y flujo de caja con la calculadora. (Herramientas: `calculator`) | Ofertas |
| **Analista del inmueble y la ubicación** | Valora estado, reservas, facilidad de alquiler y ubicación. | Ofertas |
| **Valoración de oportunidades y riesgos** | Contrapone cifras y valoración del inmueble y compara de forma estructurada. (salida estructurada) | Calculador de rentabilidad, Analista del inmueble y la ubicación |

**Entrada:** Al menos dos ofertas con precio, superficie, alquiler, cuota de comunidad, fondo de reserva y ubicación, además de tus supuestos de financiación. Las fichas, actas y planos se adjuntan en PDF, Word o imagen; los archivos de ejemplo contienen una ficha con extracto del acta y un plano de la oferta 2.

**Archivos de ejemplo:** `Ficha_oferta_2_edificio_antiguo.pdf`, `Plano_oferta_2.png`

**Casos de prueba:** Dos ofertas en el texto; Con ficha y plano

**Resultado:** Una comparación estructurada con indicadores, oferta preferida, oportunidades, riesgos y puntos que comprobar antes de decidir, además en PDF. No sustituye el asesoramiento financiero, fiscal o jurídico ni una visita.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: los dos análisis se ejecutan en paralelo en cada ejecución, y el calculador de rentabilidad obtiene cada indicador con la calculadora, de modo que cada cálculo se puede seguir en la ejecución. Ningún paso espera a una persona y ningún control de calidad revisa el resultado; puedes adjuntar como máximo 8 archivos. Como las decisiones inmobiliarias son delicadas, todos los agentes tienen la instrucción de señalar los puntos que debe comprobar una persona cualificada y de no transmitir más certeza de la que permiten los datos. No hay un presupuesto propio, así que se aplica el presupuesto predeterminado de tu espacio de trabajo; la comparación es una ayuda para tu propia decisión, no una recomendación de compra.

**Por qué esta arquitectura:** Rentabilidad y ubicación son preguntas independientes, por eso se analizan en paralelo y solo la valoración las sopesa entre sí; la estructura fija (comparación, oferta preferida, riesgos, comprobaciones) hace que las ofertas sean comparables de una ejecución a otra. Un orquestador no aportaría nada, porque cada comparación necesita los dos análisis. A propósito no hay búsqueda web en vivo de precios de oferta o niveles de alquiler: los resultados cambiarían en cada ejecución y no serían trazables, mientras que tus anuncios, actas y un índice de alquileres guardado mantienen la base fija y comprobable.

**Cómo adaptarlo:** Introduce tus ofertas y datos de financiación y adjunta directamente fichas, actas de la junta de propietarios o planos. Un índice de alquileres que necesites a menudo puedes guardarlo como conocimiento y asignarlo al analista del inmueble y la ubicación.

## 19 · Analizar retrasos de obra {#construction-delay}
<!-- keywords: construcción, analista de plazos, coordinación de obra, informe al promotor -->

**Ámbito:** Construcción · **Agentes:** 3 · **Patrón:** adaptativo (orquestación) · **Nivel:** Avanzado · **Elementos:** orquestador con equipos, aprobación, formulario de entrada, archivos de resultado, archivos como entrada, contrato de salida, presupuesto y límites

Los retrasos en obra tienen causas distintas, y cada causa necesita otro conocimiento: las heladas deben documentarse, un proveedor que se retrasa requiere un aviso de impedimento a la parte correcta, un cambio de proyecto ordenado por la propiedad puede justificar una ampliación de plazo y la falta de personal requiere un plan de aceleración. El flujo de trabajo calcula las desviaciones y deja que una coordinación de obra incorpore exactamente los equipos especializados que la situación necesita.

**Cómo colaboran los agentes:** El analista de plazos calcula con la herramienta de fechas el retraso de cada hito y enumera las causas supuestas. La coordinación de obra, un orquestador, forma primero un equipo de como máximo tres a partir de los cuatro equipos especializados y después reparte encargos: el equipo de obra para clima, terreno y cambios de proyecto, el equipo de suministro para proveedores y subcontratistas, el equipo de reclamaciones para avisos de impedimento y ampliaciones de plazo, el equipo de recuperación para medidas de aceleración con su coste. Los equipos independientes trabajan en paralelo. El equipo de reclamaciones se detiene para una persona: su borrador de aviso solo se usa después de que la jefatura de obra responsable lo haya visado. El agente de informes redacta el informe de situación y, antes de que llegue a la propiedad, una persona lo aprueba.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de plazos** | Calcula los retrasos y el camino crítico con las herramientas de fechas y de cálculo. (salida estructurada; Herramientas: `days_between`, `calculator`) | Estado del proyecto |
| **Coordinación de obra** | Forma los equipos especializados que el retraso necesita y reparte sus encargos. (Orquestador) | Analista de plazos |
| **Informe al promotor** | Resume de forma objetiva para la propiedad el plazo, las causas, las reclamaciones y las medidas. | Analista de plazos, Coordinación de obra |

**Equipos que el orquestador puede emplear:**

| Equipo | Tarea | Capacidades |
|---|---|---|
| **Equipo de obra y proyecto** | Examina las causas técnicas de los retrasos de obra: clima, terreno, cambios de proyecto y secuencia de trabajos; atribuye días de retraso con pruebas. | technical causes, design changes, ground conditions, weather |
| **Equipo de cadena de suministro** | Examina los retrasos causados por proveedores, entregas de material y la dotación de subcontratistas; atribuye días de retraso con pruebas. | supply chain, subcontractors, material delivery |
| **Equipo de reclamaciones** | Redacta avisos de impedimento y valora reclamaciones de ampliación de plazo para retrasos fuera del ámbito del contratista; una jefatura de obra visa el borrador. (se detiene para una aprobación) | contract, claims, notice of obstruction |
| **Equipo de recuperación** | Desarrolla medidas de aceleración para una obra retrasada con días recuperados, sobrecoste y una nueva previsión de terminación. | recovery planning, acceleration, cost estimate |

**Entrada:** Un resumen del calendario con hitos previstos y reales, observaciones sobre las causas, fecha del informe y condiciones contractuales, como texto o como archivos: calendario en Excel, diario de obra en PDF, fotos como imágenes. Los archivos de ejemplo contienen un calendario y un extracto del diario de obra.

**Archivos de ejemplo:** `Planificacion_guarderia_Mirasol.xlsx`, `Libro_de_obra_extracto_abril_mayo.pdf`

**Casos de prueba:** Resumen de plazos en el texto; Planificación y libro de obra como archivos

**Resultado:** Un informe de situación objetivo con estado del plazo, causas y ámbitos de responsabilidad, avisos y reclamaciones de ampliación, medidas de recuperación con coste, decisiones necesarias y riesgos; tras la aprobación, en PDF y en un archivo de Word editable. La vista de orquestación muestra qué equipos formó la coordinación, qué entregó cada uno como datos estructurados y por qué. Las cuestiones sobre penalizaciones contractuales y ampliaciones de plazo quedan sujetas a revisión técnica y jurídica.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: la coordinación elige como máximo tres equipos, hace trabajar como máximo dos a la vez y da a cada equipo como máximo dos encargos; cada decisión de composición y de encargo queda registrada con su motivo. Una persona decide dos veces: la jefatura de obra visa el borrador del aviso de impedimento dentro del equipo de reclamaciones (rechazarlo detiene la ejecución), y una persona aprueba el informe de situación antes de que se creen archivos. Límites: como máximo 8 decisiones de la coordinación, 50 pasos, 40 minutos y 4 USD por ejecución.

**Por qué esta arquitectura:** Una cadena fija trataba igual todos los retrasos: un analista de causas, un planificador de medidas, tanto si el problema era una helada como un aviso que faltaba. Con la coordinación, un retraso puramente climático no cuesta una revisión de reclamaciones, mientras que un cambio de proyecto ordenado por la propiedad incorpora el equipo de reclamaciones con su visado. Los equipos devuelven resultados estructurados (días, responsabilidad, pruebas), de modo que el informe puede sumarlos en lugar de reformular texto. El cálculo del plazo, el informe y la aprobación final siguen siendo pasos fijos porque todo informe los necesita.

**Cómo adaptarlo:** Exporta tu calendario desde tu software de proyectos como Excel y adjunta el diario de obra y las fotos. Adapta el equipo de reclamaciones a tu tipo de contrato (por ejemplo FIDIC o tus propias condiciones) e introduce las tarifas de coste de tu empresa en el equipo de recuperación. Si necesitas otra especialidad, como instalaciones, guárdala como flujo de trabajo con una descripción clara y añádela a los equipos de la coordinación.

## 20 · Desarrollar y calcular una carta {#restaurant-menu}
<!-- keywords: hostelería, creador del concepto, escandallo, redactor de la carta -->

**Ámbito:** Hostelería · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Principiante · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada

Una carta tiene que gustar a los clientes y ser rentable. El flujo desarrolla platos para un público, calcula el coste de materia prima y los precios y redacta textos apetecibles para la carta.

**Cómo colaboran los agentes:** Una cadena de tres agentes: el creador del concepto compone platos con recetas, el escandallo calcula el coste de materia prima y los precios de venta con la calculadora y el redactor de la carta escribe la carta. Un control de calidad comprueba público, precios y la nota sobre alérgenos. El resultado contiene el escandallo y la carta.

| Agente | Tarea | Recibe |
|---|---|---|
| **Creador del concepto** | Compone platos adecuados con recetas y cantidades. | Concepto |
| **Escandallo** | Calcula coste de materia prima y precios de venta con la calculadora. (Herramientas: `calculator`) | Creador del concepto, Concepto |
| **Redactor de la carta** | Escribe la carta de mediodía con descripciones apetecibles. (con control de calidad) | Escandallo, Creador del concepto |

**Entrada:** Tipo de local, público, número y tipo de platos, coste objetivo de materia prima, rango de precios y precios de compra. Los precios de compra puedes pegarlos o adjuntarlos como archivo CSV o Excel, como muestra el archivo de ejemplo.

**Archivos de ejemplo:** `Precios_compra_Molino_de_Ejemplo.csv`

**Casos de prueba:** Carta de mediodía con precios en el texto; Precios de compra en CSV

**Resultado:** Una tabla de escandallo con coste de materia prima y precio por plato y una carta de mediodía terminada con descripciones breves, además como archivo de Word para maquetar y como archivo de Excel con las tablas del escandallo. Los alérgenos y aditivos deben comprobarse y señalarse según las recetas reales.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: los tres pasos se ejecutan siempre en el mismo orden; el escandallo calcula con la calculadora y recibe tus precios de compra directamente de la entrada, como máximo un archivo CSV o Excel de hasta 5 MB. Un control de calidad mide la carta con tres criterios (público, precios acordes con el escandallo, nota sobre alérgenos); si falla uno, el redactor de la carta la revisa una vez, y el resultado del control queda registrado en la ejecución con su motivo (si sigue sin superarlo, el flujo continúa y el control cuenta como no superado). Ningún paso espera a una persona y no hay un presupuesto propio, así que se aplica el presupuesto predeterminado de tu espacio de trabajo. Carta y escandallo son borradores: revisas precios, raciones y la declaración de alérgenos antes de imprimir.

**Por qué esta arquitectura:** Cada paso se apoya en el anterior: sin platos no hay escandallo y sin precios no hay carta, por eso encaja una cadena fija; el escandallo recibe además la lista de precios directamente, para no depender de que el creador del concepto repita cifras. El control de calidad está en la carta porque ahí los precios pueden alejarse del escandallo. A propósito no se usa un orquestador, porque los pasos son siempre los mismos, ni una búsqueda web en vivo de precios mayoristas, que variarían en cada ejecución y no coincidirían con tu proveedor; tu propia lista de precios hace que el escandallo sea reproducible.

**Cómo adaptarlo:** Adjunta tu lista actual de precios de compra y describe tu público. Vuestras recetas estándar puedes subirlas como conocimiento y asignarlas al escandallo; las normas de la casa, como el tamaño de las raciones, se añaden en el creador del concepto. Para el cambio cada dos semanas puedes programar la copia.

## 21 · Planificación de cultivos de una explotación {#farm-planning}
<!-- keywords: agricultura, planificador de rotación, cálculo de márgenes, revisión de plausibilidad -->

**Ámbito:** Agricultura · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Avanzado · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada

La planificación de cultivos debe tener en cuenta a la vez rotación, suelos, contratos y rentabilidad. El flujo propone una rotación, calcula márgenes brutos y revisa el plan frente a vuestras propias reglas.

**Cómo colaboran los agentes:** Una cadena de tres agentes: el planificador de rotación asigna un cultivo a cada parcela, el cálculo de márgenes obtiene el margen de cada parcela y el total con la calculadora y la revisión de plausibilidad comprueba reglas y riesgos y entrega un resultado estructurado.

| Agente | Tarea | Recibe |
|---|---|---|
| **Planificador de rotación** | Asigna un cultivo a cada parcela según reglas y suelo. | Datos de la explotación |
| **Cálculo de márgenes** | Calcula márgenes brutos por parcela y totales con la calculadora. (Herramientas: `calculator`) | Planificador de rotación, Datos de la explotación |
| **Revisión de plausibilidad** | Revisa el plan frente a reglas y riesgos y lo resume. (salida estructurada) | Planificador de rotación, Cálculo de márgenes |

**Entrada:** Parcelas con superficie, suelo y cultivo anterior, vuestras reglas de planificación y supuestos de ingresos y costes por hectárea. Las parcelas y los supuestos puedes adjuntarlos como archivo de Excel o CSV; el archivo de ejemplo contiene las dos tablas de la tarea de prueba.

**Archivos de ejemplo:** `Registro_parcelas_Finca_Ejemplo.xlsx`

**Casos de prueba:** Explotación en el texto; Registro de parcelas como archivo de Excel

**Resultado:** Un plan de cultivos por parcela con margen bruto, una comprobación de reglas, riesgos y preguntas abiertas, además como archivo de Excel. Los requisitos legales, por ejemplo sobre fertilización o condiciones de ayudas, deben comprobarse según la normativa local vigente.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: los tres pasos se ejecutan siempre en el mismo orden; el cálculo de márgenes obtiene cada parcela y el total con la calculadora, de modo que las cifras se pueden seguir en la ejecución. No hay revisión automática: la revisión de plausibilidad no cambia el plan, sino que enumera comprobaciones de reglas, riesgos y preguntas abiertas en un resultado estructurado con el margen total como número. Ningún paso espera a una persona; puedes adjuntar hasta 3 archivos de 10 MB cada uno, y no hay un presupuesto propio, así que se aplica el presupuesto predeterminado de tu espacio de trabajo. El plan es un borrador que compruebas con las normas locales vigentes antes de pedir semilla o solicitar ayudas.

**Por qué esta arquitectura:** Primero va la elección de cultivos, los márgenes dependen de ella y la revisión necesita ambos, por eso encaja una cadena fija; la revisión de plausibilidad recibe además la rotación directamente para contrastarla con tus reglas. A propósito se eligió un paso de revisión propio que nombra abiertamente los incumplimientos en lugar de un bucle de calidad que reescribiría el plan sin decirlo, porque las desviaciones en la rotación son decisiones que tomas tú. Ni búsqueda web en vivo de precios o requisitos ni orquestador: los precios y normas que se encuentran en línea cambian a diario y varían por región, tus propios supuestos hacen el cálculo reproducible y los pasos son los mismos para cada explotación.

**Cómo adaptarlo:** Adjunta tu registro de parcelas y tus datos de cálculo en Excel e introduce tus reglas de planificación. Los análisis de suelo que necesitas cada año puedes subirlos como conocimiento y asignarlos al planificador de rotación.

## 22 · Planificar la fiesta del club {#club-event}
<!-- keywords: asociaciones y clubes, planificador del programa, planificador del presupuesto, planificador de comunicación, propuesta para la junta -->

**Ámbito:** Asociaciones y clubes · **Agentes:** 4 · **Patrón:** paralelo · **Nivel:** Principiante · **Elementos:** archivos de resultado

Las fiestas de los clubes las organizan voluntarios en su tiempo libre. El flujo crea calendario, tareas, presupuesto y comunicación y lo reúne todo en una propuesta para la reunión de la junta.

**Cómo colaboran los agentes:** El planificador del programa y el planificador del presupuesto trabajan en paralelo; uno cuenta hacia atrás desde la fiesta con la herramienta de fechas y el otro calcula el presupuesto con la calculadora. El planificador de comunicación prepara invitaciones y publicaciones acordes con el calendario. La propuesta para la junta lo reúne todo; una revisión de calidad comprueba que esté completa y que haya responsables.

| Agente | Tarea | Recibe |
|---|---|---|
| **Planificador del programa** | Planifica calendario, tareas y turnos hacia atrás desde el día de la fiesta. (Herramientas: `days_between`) | Datos básicos |
| **Planificador del presupuesto** | Calcula ingresos, gastos y margen con la calculadora. (Herramientas: `calculator`) | Datos básicos |
| **Planificador de comunicación** | Prepara invitaciones, publicaciones y una nota de prensa. | Planificador del programa |
| **Propuesta para la junta** | Resume planificación, presupuesto y comunicación para la junta directiva. (con control de calidad) | Planificador del programa, Planificador del presupuesto, Planificador de comunicación |

**Entrada:** Ocasión, fecha, lugar, número de asistentes, deseos de programa, voluntarios, presupuesto y costes conocidos.

**Casos de prueba:** Fiesta de verano por el aniversario del club

**Resultado:** Una propuesta para la junta con calendario hasta la fiesta, tareas y responsables, plan de turnos, presupuesto con superávit o déficit, plan de comunicación y propuestas de acuerdo, además como archivo de Word para enviar a la junta.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: programa y presupuesto se elaboran en paralelo; el planificador del programa cuenta hacia atrás desde la fecha de la fiesta con la herramienta de fechas y el planificador del presupuesto calcula con la calculadora. Un control de calidad mide la propuesta para la junta por su integridad, los responsables y la coherencia con el presupuesto; si falla un criterio, la propuesta se revisa una vez, y el resultado del control queda registrado en la ejecución con su motivo (si sigue sin superarlo, el flujo continúa y el control cuenta como no superado). Ningún paso espera a una persona y no se envía nada; no hay un presupuesto propio, así que se aplica el presupuesto predeterminado de tu espacio de trabajo. La propuesta es un borrador sobre cuyas propuestas de acuerdo decide la junta.

**Por qué esta arquitectura:** Programa y presupuesto no dependen el uno del otro y se elaboran en paralelo, mientras que el planificador de comunicación necesita el calendario y por eso va después; la propuesta para la junta lo reúne todo. A propósito no hay un paso de aprobación en el flujo, porque la aprobación real es la propia reunión de la junta, ni integración con correo o calendario, porque los voluntarios envían las invitaciones ellos mismos cuando la junta ha decidido. Un orquestador no aportaría nada, ya que cada fiesta necesita las mismas cuatro partes.

**Cómo adaptarlo:** Introduce los datos de tu fiesta. Los permisos y requisitos varían según el municipio; añade los que conozcas a la entrada. Los logotipos y plantillas de carteles pueden guardarse como conocimiento.

## 23 · Desarrollar una campaña de donaciones {#nonprofit-campaign}
<!-- keywords: organizaciones sin ánimo de lucro, desarrollador de la campaña, analista de impacto, revisor de credibilidad -->

**Ámbito:** Organizaciones sin ánimo de lucro · **Agentes:** 3 · **Patrón:** con ramas · **Nivel:** Avanzado · **Elementos:** decisión, bucle de revisión, archivos de resultado, propuestas de conocimiento

Las campañas de donaciones necesitan una historia que conmueva, pero también afirmaciones honestas sobre el impacto. El flujo desarrolla una campaña, valora el posible impacto y comprueba si las promesas son creíbles y éticamente defendibles.

**Cómo colaboran los agentes:** El desarrollador de la campaña y el analista de impacto trabajan en paralelo: uno diseña mensaje, públicos y acciones, y el otro elabora un modelo de impacto con indicadores y calcula el coste por niño con la calculadora. El revisor de credibilidad comprueba ambos. Si considera que la campaña no es creíble, una condición la devuelve al desarrollador de la campaña junto con las observaciones de la revisión; la campaña revisada se comprueba de nuevo, como máximo dos veces. El resultado incluye las tres partes.

| Agente | Tarea | Recibe |
|---|---|---|
| **Desarrollador de la campaña** | Diseña mensaje, públicos, canales y calendario de la campaña. | Descripción del proyecto |
| **Analista de impacto** | Elabora un modelo de impacto con indicadores y el coste por niño. (Herramientas: `calculator`) | Descripción del proyecto |
| **Revisor de credibilidad** | Revisa las afirmaciones en cuanto a exageración, ética y respaldo. (salida estructurada) | Desarrollador de la campaña, Analista de impacto |

**Entrada:** Organización, proyecto, resultados hasta ahora, objetivo, necesidad de financiación, periodo de la campaña y canales disponibles.

**Casos de prueba:** Padrinos de lectura en primaria

**Resultado:** Un concepto de campaña con calendario y borradores de textos, un modelo de impacto con indicadores y una revisión estructurada de afirmaciones exageradas, avisos éticos y un plan para medir el impacto, además como archivo de Word. El analista de impacto propone su modelo de impacto para el conocimiento, por ejemplo para futuras solicitudes de financiación; solo se guarda lo que confirmes.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el veredicto sí/no del revisor de credibilidad sobre la credibilidad decide si la campaña vuelve para revisarse; la ejecución muestra qué rama se tomó. El desarrollador de la campaña revisa como máximo dos veces, cada vez con las observaciones de la revisión y su borrador anterior. Si después la campaña sigue sin considerarse creíble, la ejecución continúa igualmente hasta el resultado, y las observaciones de la revisión muestran qué queda pendiente. Ningún paso espera a una persona: los textos y las cifras son borradores que tu organización revisa antes de publicar, sobre todo las afirmaciones sobre el impacto y las fotos de niños. Los modelos de impacto propuestos solo se guardan como conocimiento si los confirmas.

**Por qué esta arquitectura:** Los problemas de credibilidad los corrige mejor quien escribió el texto; por eso la revisión vuelve al desarrollador de la campaña en lugar de limitarse a enumerar problemas. El bucle se limita a dos rondas: una campaña que sigue exagerando después necesita mejores pruebas de la organización, no más reformulaciones. El modelo de impacto queda fuera del bucle porque se basa en los datos del proyecto, no en los textos de la campaña. No hay paso de aprobación, porque la campaña sigue siendo un borrador y se publica de todos modos fuera del flujo.

**Cómo adaptarlo:** Describe tu proyecto y tus resultados con la mayor honestidad posible. Sube memorias anuales o evaluaciones como conocimiento y asígnalas al analista de impacto.

## 24 · Responder una consulta ciudadana {#citizen-inquiry}
<!-- keywords: instituciones públicas, análisis de asuntos, preparación de información, borrador de respuesta -->

**Ámbito:** Instituciones públicas · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Principiante · **Elementos:** aprobación, bucle de revisión, formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento, archivos de conocimiento

Las consultas ciudadanas suelen contener varios asuntos y deben responderse de forma correcta, comprensible y sin compromisos precipitados. El flujo descompone la consulta, encuentra las normas pertinentes del municipio, prepara una respuesta y deja la decisión de enviarla en manos del personal tramitador.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** Una cadena de tres agentes y una aprobación: el análisis de asuntos separa los asuntos y asigna competencias. La preparación de información busca en las normas guardadas del municipio y en los documentos de la consulta, cita los pasajes que usa e indica cuándo ninguna norma cubre un asunto. El borrador de respuesta redacta una contestación cercana; una revisión de calidad comprueba que solo se citen normas documentadas y que no haya compromisos vinculantes. Después, el personal tramitador revisa la respuesta; un rechazo con comentario la devuelve al borrador de respuesta para revisarla.

| Agente | Tarea | Recibe |
|---|---|---|
| **Análisis de asuntos** | Separa los asuntos y asigna competencias y urgencia. | Consulta ciudadana |
| **Preparación de información** | Busca en las normas del municipio y cita los pasajes pertinentes para cada asunto. | Análisis de asuntos, Consulta ciudadana |
| **Borrador de respuesta** | Redacta una respuesta objetiva y cercana para su aprobación. (con control de calidad) | Análisis de asuntos, Preparación de información |

**Entrada:** La consulta de la ciudadana o el ciudadano, opcionalmente con información interna sobre el caso, como texto o como archivos. También puedes adjuntar fotos de la consulta. Las normas del municipio vienen de la colección de conocimiento; se incluye un conjunto inventado de normas de Villamuestra. El archivo de ejemplo es una hoja informativa inventada del ayuntamiento.

**Archivos de ejemplo:** `Hoja_informativa_construcciones_y_alumbrado.pdf`

**Casos de prueba:** Caseta de jardín y farola; Normas como hoja informativa

**Resultado:** Un borrador de respuesta en lenguaje sencillo con competencias, próximos pasos e indicaciones para la tramitación; tras la aprobación, además como archivo de Word para vuestro membrete. El archivo de Word está saneado: los datos personales, como nombres, direcciones, teléfonos y correos electrónicos, y las credenciales se sustituyen por marcadores, así que los datos del destinatario los insertas tú desde el expediente. La preparación de información propone las normas encontradas, con su referencia, para el conocimiento; solo se guarda lo que confirmes.

**Qué se decide automáticamente y cuándo interviene una persona:** Automático: el análisis de asuntos, la búsqueda de normas con citas y la revisión de calidad del borrador (solo normas documentadas, lenguaje sencillo, ningún compromiso vinculante). Una persona decide: el personal tramitador revisa cada respuesta antes de enviarla. Un rechazo exige un comentario y devuelve el borrador con esa indicación al borrador de respuesta; tras 2 revisiones como máximo, un nuevo rechazo hace que la ejecución falle sin archivo. El flujo no envía nada por sí mismo; también la respuesta aprobada es un borrador que el personal tramitador envía por los canales habituales.

**Por qué esta arquitectura:** Toda consulta necesita los mismos pasos, así que basta una cadena fija y un orquestador solo añadiría coste. Las normas son conocimiento consultable en lugar de texto pegado en cada consulta: la preparación de información encuentra los pasajes pertinentes, los cita y advierte cuando nada encaja. La aprobación con bucle de revisión existe porque una respuesta a la ciudadanía tiene efectos fuera de la administración y quien tramita conoce mejor el caso. Se prescindió a propósito de una conexión con el sistema de correo, para que el envío siga siendo una decisión humana.

**Archivos de conocimiento (sintéticos, se crean al copiar):** Normas_municipio_Villamuestra: Normas inventadas del municipio de Villamuestra sobre construcciones auxiliares, el plan parcial n.º 17, alumbrado público, enseres voluminosos, árboles y la tramitación de consultas.

**Cómo adaptarlo:** Sustituye las normas inventadas de la colección de conocimiento por vuestras ordenanzas, hojas informativas y listas de competencias; títulos y números claros hacen precisas las citas. El membrete y la despedida se añaden en el prompt de sistema del borrador de respuesta. Para muchas consultas a la vez, usa el procesamiento por lotes.

<!-- examples:end -->
