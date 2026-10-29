# Workflows de ejemplo

Nodestro incluye 24 workflows multiagente listos, uno para cada ámbito de aplicación típico. Cada ejemplo contiene agentes con prompts de sistema, las conexiones, una tarea de prueba preparada con datos inventados y un resultado claramente descrito. Este capítulo explica la galería, cómo copiar y adaptar los ejemplos, y describe cada uno por separado.

## La galería {#galerie}
<!-- keywords: ejemplos, plantillas, galería, biblioteca, destacados, categorías, página de inicio -->

La galería está en la página **Workflows**, debajo de tus propios workflows y claramente separada de ellos. Muestra algunos ejemplos destacados y las seis categorías. **Ver los 24 ejemplos** abre la galería completa, también dentro del área de workflows.

En la galería completa buscas por nombre, ámbito y descripción y filtras por categoría. Cada tarjeta muestra el ámbito, el nombre, la descripción, el número de agentes, el nivel y el patrón. Los ejemplos de ámbitos sensibles llevan la insignia **Requiere revisión experta**. La [búsqueda](/docs/start#suche) también encuentra ejemplos.

## Vista previa y copia {#uebernehmen}
<!-- keywords: vista previa, copiar, copia, plantilla, sin cambios, gratis -->

Al hacer clic en una tarjeta se abre la **vista previa**: el flujo como diagrama, cada agente con su rol, modelo, herramientas y los resultados que recibe, la guía y la tarea de prueba. La vista previa no guarda nada y no llama a ningún modelo.

**Copiar a mis workflows** crea un workflow propio y lo abre en el editor. La copia es independiente: puedes cambiarlo todo, y la plantilla nunca cambia. Si copias un ejemplo dos veces, obtienes dos workflows separados. La copia empieza con la versión 1 en el [historial de versiones](/docs/workflows#versionen).

Si **Añadir los casos de prueba como serie de pruebas** está marcado (por defecto), la copia recibe además una [serie de pruebas](/docs/automatisierung#testreihen) con los casos de prueba preparados; los archivos de ejemplo necesarios se guardan como archivos de entrada de la copia. Copiar nunca inicia una ejecución, nunca crea una [programación](/docs/automatisierung#zeitplaene) y nunca publica una [API](/docs/api-und-export#veroeffentlichen); eso lo decides tú más adelante.

Los ejemplos nunca se crean automáticamente; solo lo que copias aparece entre tus flujos. Solo hay costes cuando ejecutas una copia. Los ejemplos usan modelos de Anthropic; basta con ese [proveedor configurado](/docs/einstellungen#anbieter), y puedes cambiar los modelos de una copia a otro proveedor en cualquier momento. Ningún ejemplo necesita otros servicios, cuentas ni fuentes de datos de pago.

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
- **Datos actuales:** para información en vivo puedes añadir la [herramienta de servidor](/docs/tools#server-tools) de búsqueda web; cuesta un extra por búsqueda.

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
| 6 | Artículo de blog | Marketing y contenidos | 4 | paralelo |
| 7 | Preparar una oferta a medida | Ventas | 3 | secuencial |
| 8 | Responder consultas de clientes | Atención al cliente | 5 | con ramas |
| 9 | Publicar una vacante y preparar entrevistas | Recursos humanos | 5 | con ramas |
| 10 | Convertir una pregunta de investigación en hipótesis | Investigación y desarrollo | 4 | secuencial |
| 11 | Revisión de código con pruebas | Desarrollo de software | 3 | paralelo |
| 12 | Estructurar un contrato y encontrar puntos de revisión | Derecho y administración | 5 | con ramas |
| 13 | Crear un plan de aprendizaje personal | Educación y formación | 4 | paralelo |
| 14 | Revisar el presupuesto familiar y ahorrar | Particulares – finanzas | 3 | secuencial |
| 15 | Planificar un viaje a medida | Particulares – viajes | 4 | con ramas |
| 16 | Evaluar una idea de negocio | Autónomos y emprendedores | 4 | paralelo |
| 17 | Desarrollar una estrategia de redes sociales | Influencers y creadores de contenido | 3 | secuencial |
| 18 | Comparar ofertas inmobiliarias | Sector inmobiliario | 3 | paralelo |
| 19 | Analizar retrasos de obra | Construcción | 4 | paralelo |
| 20 | Desarrollar y calcular una carta | Hostelería | 3 | secuencial |
| 21 | Planificación de cultivos de una explotación | Agricultura | 3 | secuencial |
| 22 | Planificar la fiesta del club | Asociaciones y clubes | 4 | paralelo |
| 23 | Desarrollar una campaña de donaciones | Organizaciones sin ánimo de lucro | 3 | paralelo |
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

**Cómo adaptarlo:** Pon una exportación de tu MES o de tu hoja de cálculo en el campo de archivo; también funcionan registros largos, porque los agentes leen los archivos grandes de forma selectiva. Para una evaluación semanal puedes programar la copia. En el prompt de sistema del planificador de medidas puedes añadir vuestra metodología, por ejemplo los pilares TPM o un esquema de valoración fijo.

## 2 · Investigar una reclamación con 8D {#quality-8d}
<!-- keywords: gestión de la calidad, descripción del problema d1–d3, análisis de causas d4, planificación de acciones d5–d7, informe 8d, contención de emergencia -->

**Ámbito:** Gestión de la calidad · **Agentes:** 5 · **Patrón:** con ramas · **Nivel:** Avanzado · **Elementos:** decisión, aprobación, formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento

Las reclamaciones exigen contención rápida y un análisis de causas riguroso. El método 8D marca los pasos; el flujo los recorre de forma estructurada y los documenta de manera uniforme.

**Cómo colaboran los agentes:** Una cadena secuencial: el primer agente describe el problema y las acciones de contención (D1 a D3), el segundo busca las causas de aparición y de no detección (D4) y el tercero planifica acciones correctivas y preventivas (D5 a D7). El agente de informe lo reúne todo en un informe 8D estructurado. Un nodo de decisión comprueba la gravedad: en casos críticos, un agente adicional planifica la contención de emergencia para las próximas 24 horas. Antes de que el informe llegue al cliente, una persona lo libera.

| Agente | Tarea | Recibe |
|---|---|---|
| **Descripción del problema D1–D3** | Describe el equipo, el problema (es / no es) y las acciones de contención. (salida estructurada) | Reclamación |
| **Análisis de causas D4** | Busca las causas de aparición y de no detección con los 5 porqués. | Descripción del problema D1–D3, Reclamación |
| **Planificación de acciones D5–D7** | Planifica acciones correctivas, su verificación y la prevención. | Análisis de causas D4 |
| **Informe 8D** | Reúne todos los pasos en un informe 8D estructurado. (salida estructurada) | Descripción del problema D1–D3, Análisis de causas D4, Planificación de acciones D5–D7, Contención de emergencia |
| **Contención de emergencia** | Planifica la contención de las próximas 24 horas en casos críticos. | Gravedad |

**Entrada:** La reclamación del cliente con pieza, lote, defecto y tasa de defectos, además de la información interna conocida sobre fabricación, material e inspección. Puedes adjuntar también la carta de reclamación, datos de medición y fotos del defecto como archivos; los archivos de ejemplo contienen una carta de reclamación inventada (PDF) y mediciones (Excel).

**Archivos de ejemplo:** `Reclamacion_G-220_lote_24-117.pdf`, `Mediciones_pestanas.xlsx`

**Casos de prueba:** Reclamación en el texto; Carta de reclamación y mediciones como archivos

**Resultado:** Un informe 8D estructurado con un campo para cada disciplina D1 a D8 y una lista de puntos abiertos que el equipo aún debe aclarar. Tras la aprobación, la ejecución guarda el informe en PDF y como archivo de Word editable. El agente del informe propone además conclusiones para el conocimiento; solo se guarda lo que adoptes expresamente.

**Cómo adaptarlo:** Sustituye los datos de prueba por vuestra reclamación y adjunta directamente protocolos de inspección, planos o fotos. Si usáis un formulario propio, ajusta los campos del agente del informe en «Formato de salida». Las conclusiones adoptadas de reclamaciones anteriores puedes asignarlas como conocimiento al análisis de causas.

## 3 · Comparar ofertas de proveedores {#supplier-comparison}
<!-- keywords: logística y compras, analista de costes, analista de riesgos, recomendación de compra -->

**Ámbito:** Logística y compras · **Agentes:** 3 · **Patrón:** paralelo · **Nivel:** Avanzado · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada

El precio unitario más bajo rara vez es la oferta más barata. El flujo compara las ofertas por coste total y riesgo de suministro y justifica una recomendación para compras.

**Cómo colaboran los agentes:** El analista de costes y el analista de riesgos trabajan en paralelo. Uno calcula con la calculadora el coste total de propiedad de cada oferta y el otro valora plazo, dependencias y calidad. La recomendación de compra sopesa ambos y entrega un resultado estructurado.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de costes** | Calcula el coste total de cada oferta con la calculadora. (Herramientas: `calculator`) | Ofertas |
| **Analista de riesgos** | Valora plazos, dependencias, capacidad y riesgos de calidad. | Ofertas |
| **Recomendación de compra** | Sopesa costes y riesgos y recomienda un proveedor. (salida estructurada) | Analista de costes, Analista de riesgos |

**Entrada:** Varias ofertas con precio, flete, plazo de entrega, cantidad mínima, condiciones de pago y datos de calidad, además de vuestros costes internos. Puedes escribir las ofertas en el texto o adjuntarlas como archivos, incluso mezcladas en PDF, Word y Excel; los tres archivos de ejemplo muestran justo eso.

**Archivos de ejemplo:** `Oferta_A_Ejemplo_Precision.pdf`, `Oferta_B_Example_Components.docx`, `Oferta_C_Muestra_Piezas_Metalicas.xlsx`

**Casos de prueba:** Tres ofertas en el texto; Tres ofertas en PDF, Word y Excel

**Resultado:** Una recomendación estructurada con clasificación, justificaciones, riesgos, puntos de negociación y supuestos utilizados. La ejecución la guarda además como informe en PDF y como archivo de Excel con una hoja por lista.

**Cómo adaptarlo:** Adjunta vuestras ofertas como archivos e indica la necesidad y los costes en el texto. Si tenéis ponderaciones fijas (por ejemplo 50 % coste, 30 % riesgo, 20 % calidad), añádelas en el prompt de sistema de la recomendación de compra. Los contratos marco o las evaluaciones de proveedores puedes guardarlos como conocimiento y asignarlos al analista de riesgos.

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
| **Revisor crítico** | Cuestiona la estrategia y descubre puntos débiles. (salida estructurada) | Desarrollador de estrategia |

**Entrada:** Un breve perfil de la empresa con cifras clave, oferta, fortalezas, problemas, entorno de mercado y objetivos.

**Casos de prueba:** Carpintería con la sucesión sin resolver

**Resultado:** Una matriz DAFO con estrategias derivadas y un plan de 90 días, además de una revisión crítica estructurada con valoración, puntos débiles, información que falta y próximos pasos.

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
| **Agente de revisión** | Revisa el análisis y lo resume de forma estructurada. (salida estructurada) | Agente de análisis |

**Entrada:** Cifras financieras de una empresa de al menos dos años, por ejemplo de un informe anual o trimestral, y los efectos extraordinarios conocidos. Puedes pegar las cifras o adjuntarlas como archivo de Excel, CSV o PDF; el archivo de ejemplo contiene los indicadores de la tarea de prueba.

**Archivos de ejemplo:** `Indicadores_Ejemplo_Industrias.xlsx`

**Casos de prueba:** Indicadores en el texto; Indicadores como archivo de Excel

**Resultado:** Una revisión estructurada con resumen, indicadores principales, errores o riesgos encontrados, límites del análisis e indicación de si el análisis se considera correcto, además en PDF y como archivo de Excel. El agente de investigación propone las cifras extraídas para el conocimiento; solo se adopta lo que confirmes. El resultado no es asesoramiento de inversión.

**Cómo adaptarlo:** Adjunta directamente el informe anual o vuestra tabla de indicadores. Otros indicadores, como el apalancamiento o el flujo de caja libre, se añaden en el prompt de sistema del agente de análisis. Para muchas empresas seguidas conviene el procesamiento por lotes con una fila por empresa.

## 6 · Artículo de blog {#blog-article}
<!-- keywords: marketing y contenidos, público, esquema, redactor, corrección -->

**Ámbito:** Marketing y contenidos · **Agentes:** 4 · **Patrón:** paralelo · **Nivel:** Principiante · **Elementos:** archivos de resultado

Los buenos artículos nacen de un público claro y de un esquema bien pensado. El flujo reparte el trabajo como en una redacción y revisa el resultado antes de publicarlo.

**Cómo colaboran los agentes:** El público y el esquema se crean en paralelo con un modelo rápido. El redactor escribe el artículo a partir de ellos; una revisión de calidad integrada comprueba que siga el esquema y responda a las preguntas de los lectores. La corrección revisa extensión y legibilidad con la herramienta de estadísticas de texto y marca las afirmaciones sin verificar.

| Agente | Tarea | Recibe |
|---|---|---|
| **Público** | Describe a los lectores, sus preguntas y lo que ya saben. | Tema |
| **Esquema** | Redacta el título y el esquema. | Tema |
| **Redactor** | Escribe el artículo a partir del esquema y del público. (con control de calidad) | Público, Esquema |
| **Corrección** | Revisa extensión y legibilidad y entrega la versión final. (Herramientas: `text_statistics`) | Redactor |

**Entrada:** Un tema en una frase. Opcionalmente puedes añadir el público, el tono o la extensión deseada en la propia entrada.

**Casos de prueba:** Tema en una frase

**Resultado:** Un artículo terminado en Markdown con títulos, una meta descripción y breves notas de corrección con el número de palabras y avisos sobre afirmaciones que conviene respaldar antes de publicar. La ejecución guarda además el resultado como archivo Markdown y HTML que puedes llevar a tu CMS.

**Cómo adaptarlo:** Cambia el tema en la entrada. Puedes subir vuestra guía de estilo como conocimiento y asignarla al redactor y a la corrección. La extensión deseada se ajusta en el prompt de sistema del redactor.

## 7 · Preparar una oferta a medida {#sales-offer}
<!-- keywords: ventas, analista de necesidades, asesor de soluciones, redactor de ofertas -->

**Ámbito:** Ventas · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Avanzado · **Elementos:** aprobación, formulario de entrada, archivos de resultado, archivos como entrada

Una buena oferta responde a la necesidad real del cliente, no solo a sus palabras clave. El flujo aclara la necesidad, calcula una solución adecuada y redacta una oferta completa.

**Cómo colaboran los agentes:** El analista de necesidades separa los requisitos explícitos de los implícitos y reúne las preguntas abiertas. El asesor de soluciones combina posiciones de la lista de precios y calcula con la calculadora, incluida una variante dentro del presupuesto. El redactor de ofertas escribe la oferta; una revisión de calidad integrada comprueba la integridad y los precios. Un formulario de entrada recoge los datos clave (cliente, plazo, presupuesto, montaje en fin de semana); antes del envío, una persona aprueba la oferta.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de necesidades** | Identifica los requisitos explícitos e implícitos. | Solicitud del cliente |
| **Asesor de soluciones** | Combina posiciones adecuadas y calcula con la calculadora. (Herramientas: `calculator`) | Analista de necesidades, Solicitud del cliente |
| **Redactor de ofertas** | Redacta el borrador de oferta para el cliente. (con control de calidad) | Analista de necesidades, Asesor de soluciones |

**Entrada:** La solicitud del cliente y vuestra lista de precios con descuentos y condiciones. El formulario recoge los datos clave; la lista de precios puedes escribirla en el texto o adjuntarla como archivo de Excel, CSV o PDF, como muestra el archivo de ejemplo.

**Archivos de ejemplo:** `Lista_precios_mobiliario_oficina.xlsx`

**Casos de prueba:** Solicitud y lista de precios en el texto; Lista de precios como archivo de Excel

**Resultado:** Un borrador de oferta con carta de presentación, tabla de partidas, totales, variantes, supuestos y preguntas abiertas. Solo tras tu aprobación guarda la ejecución la oferta en PDF y como archivo de Word editable.

**Cómo adaptarlo:** Adjunta tu lista de precios actual como archivo; así basta con la solicitud del cliente como texto. Las condiciones de pago y los textos estándar se añaden en el prompt de sistema del redactor de ofertas.

## 8 · Responder consultas de clientes {#customer-service}
<!-- keywords: atención al cliente, clasificador, revisor de políticas, redactor de respuestas, desescalada, revisión -->

**Ámbito:** Atención al cliente · **Agentes:** 5 · **Patrón:** con ramas · **Nivel:** Principiante · **Elementos:** decisión, aprobación, formulario de entrada, archivos como entrada

En atención al cliente llegan muchas consultas a la vez y cada una necesita la regla y el tono adecuados. El flujo ordena las consultas, comprueba políticas y plazos y prepara respuestas para su aprobación.

**Cómo colaboran los agentes:** Un clasificador rápido ordena cada consulta por tema, urgencia y estado de ánimo. El revisor de políticas aplica la política de servicio y recalcula los plazos con la herramienta de fechas. El redactor de respuestas escribe los borradores; una revisión de calidad comprueba que no se prometa nada que vaya más allá de la política. Un nodo de decisión envía primero los escalados a un agente de desescalada. Cada borrador espera una aprobación; un rechazo con comentarios da lugar a una versión revisada.

| Agente | Tarea | Recibe |
|---|---|---|
| **Clasificador** | Ordena cada consulta por tema, urgencia y estado de ánimo. (salida estructurada) | Consultas |
| **Revisor de políticas** | Aplica la política de servicio y comprueba plazos con la herramienta de fechas. (Herramientas: `days_between`) | Clasificador, Consultas |
| **Redactor de respuestas** | Escribe borradores de respuesta amables para su aprobación. (con control de calidad) | Clasificador, Revisor de políticas, Desescalada |
| **Desescalada** | Prepara cómo tratar a clientes molestos y qué necesita aprobación. | ¿Escalado? |
| **Revisión** | Revisa los borradores según los comentarios de la aprobación. | Aprobar respuestas |

**Entrada:** Varias consultas de clientes con datos de pedido y entrega, la fecha de hoy y vuestra política de servicio, como extracto en el texto o como archivo (PDF, Word, Markdown); el archivo de ejemplo contiene una política más detallada.

**Archivos de ejemplo:** `Politica_servicio_Cocina_Muestra.pdf`

**Casos de prueba:** Cuatro consultas, una de ellas enfadada; Una pregunta amable sobre un producto; Política como archivo PDF

**Resultado:** Para cada consulta, una clasificación, la regla aplicable con la comprobación del plazo y un borrador de respuesta que una persona aprueba antes de enviarlo.

**Cómo adaptarlo:** Adjunta vuestra política completa y las preguntas frecuentes como archivo, o súbelas como conocimiento y asígnalas al revisor de políticas si se aplican de forma permanente. El tono de tu marca (tú o usted, despedida) se define en el prompt de sistema del redactor de respuestas. Para muchas consultas a la vez, usa el procesamiento por lotes.

## 9 · Publicar una vacante y preparar entrevistas {#hr-recruiting}
<!-- keywords: recursos humanos, perfil del puesto, oferta de empleo, guía de entrevista, revisor de equidad, revisión -->

**Ámbito:** Recursos humanos · **Agentes:** 5 · **Patrón:** con ramas · **Nivel:** Avanzado · **Elementos:** decisión, archivos de resultado

Una buena contratación empieza con un perfil claro y entrevistas justas y comparables. El flujo convierte unas notas sueltas en un perfil del puesto, una oferta de empleo y una guía de entrevista y lo revisa todo en cuanto a equidad.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** El agente del perfil ordena tareas y requisitos. A partir de ahí se crean en paralelo la oferta de empleo y la guía de entrevista. El revisor de equidad comprueba ambas en busca de formulaciones discriminatorias o no admisibles, por ejemplo sobre la edad o la lengua materna, e indica qué debe revisar una persona. Si hay objeciones, un nodo de decisión envía la documentación a una revisión que aplica sus propuestas; si no, se mantienen las primeras versiones.

| Agente | Tarea | Recibe |
|---|---|---|
| **Perfil del puesto** | Ordena tareas, requisitos imprescindibles y deseables y competencias. | Necesidad de contratación |
| **Oferta de empleo** | Redacta una oferta de empleo atractiva e inclusiva. | Perfil del puesto |
| **Guía de entrevista** | Prepara preguntas de entrevista estructuradas con anclas de valoración. | Perfil del puesto |
| **Revisor de equidad** | Revisa la oferta y la guía en busca de discriminación y preguntas inadmisibles. (salida estructurada) | Oferta de empleo, Guía de entrevista |
| **Revisión** | Aplica a la oferta y a la guía los cambios propuestos por la revisión de equidad. | ¿Hace falta revisar? |

**Entrada:** Notas sobre el puesto: tareas, cualificaciones deseadas, equipo, condiciones y retribución.

**Casos de prueba:** Notas con deseos problemáticos

**Resultado:** Perfil del puesto, oferta de empleo y guía de entrevista con anclas de valoración, una revisión de equidad estructurada y, si hubo objeciones, una versión revisada con la lista de cambios, además como archivo de Word. La documentación debe ser aprobada por RR. HH. o por una persona experta antes de publicarse.

**Cómo adaptarlo:** Sustituye las notas por tu necesidad de contratación. Puedes guardar vuestro perfil como empleador y vuestros beneficios como conocimiento y asignarlos al agente de la oferta. Los requisitos legales de tu país se añaden en el prompt de sistema del revisor de equidad.

## 10 · Convertir una pregunta de investigación en hipótesis {#research-hypotheses}
<!-- keywords: investigación y desarrollo, analista de la pregunta, desarrollador de hipótesis, crítico metodológico, planificador de experimentos -->

**Ámbito:** Investigación y desarrollo · **Agentes:** 4 · **Patrón:** secuencial · **Nivel:** Avanzado · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento

La buena investigación empieza con una pregunta precisa y comprobable. El flujo descompone una pregunta de investigación, formula hipótesis, las somete a una crítica metodológica y deriva un plan experimental realista.

**Cómo colaboran los agentes:** Una cadena secuencial con retroceso: el analista aclara variables y supuestos, el agente de hipótesis formula hipótesis comprobables con hipótesis nulas y el crítico metodológico las contrasta con los datos del ensayo previo usando la calculadora y señala variables de confusión. El planificador de experimentos usa juntas las hipótesis y la crítica.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de la pregunta** | Aclara objetivo, variables, condiciones y lagunas de conocimiento. | Pregunta de investigación |
| **Desarrollador de hipótesis** | Formula hipótesis comprobables con predicciones e hipótesis nulas. | Analista de la pregunta |
| **Crítico metodológico** | Comprueba la contrastabilidad de las hipótesis, las variables de confusión y los datos. (Herramientas: `calculator`) | Desarrollador de hipótesis, Pregunta de investigación |
| **Planificador de experimentos** | Deriva un plan experimental de las hipótesis y la crítica. | Desarrollador de hipótesis, Crítico metodológico |

**Entrada:** Una pregunta de investigación con su objetivo, datos de ensayos previos y condiciones como material, tiempo y equipos. Puedes adjuntar datos de medición y documentos como archivos; el archivo de ejemplo contiene los valores del ensayo previo por chapa.

**Archivos de ejemplo:** `Ensayo_previo_PL-7.csv`

**Casos de prueba:** Pregunta y ensayo previo en el texto; Datos del ensayo previo en CSV

**Resultado:** Un plan experimental con hipótesis, factores y niveles, tamaño de muestra, método de medición, análisis y criterios de interrupción, además de los riesgos abiertos, también como archivo de Word. El planificador de experimentos propone el plan para el conocimiento; tú decides si se guarda.

**Cómo adaptarlo:** Sustituye la pregunta y el ensayo previo por los tuyos y adjunta los datos de medición directamente. La literatura que necesitas una y otra vez puedes subirla como conocimiento en modo «Búsqueda» y asignarla al analista de la pregunta para que trabaje con citas. Vuestras directrices estadísticas se añaden en el crítico metodológico.

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

**Cómo adaptarlo:** Adjunta tu proyecto como ZIP o pega el código e indica el lenguaje y el framework. Para otros lenguajes, ajusta el framework de pruebas en el agente de mejora, por ejemplo Jest o JUnit. Vuestras guías de estilo de código puedes guardarlas como conocimiento. A través de la API del flujo de trabajo, la revisión también puede lanzarse desde una pipeline de CI.

## 12 · Estructurar un contrato y encontrar puntos de revisión {#contract-review}
<!-- keywords: derecho y administración, estructurador del contrato, explicador de cláusulas, analista de puntos de revisión, resumen del contrato, cláusulas críticas -->

**Ámbito:** Derecho y administración · **Agentes:** 5 · **Patrón:** con ramas · **Nivel:** Avanzado · **Elementos:** decisión, formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento

Los contratos son largos y las cláusulas importantes se esconden en los detalles. El flujo ordena un contrato, lo explica en lenguaje sencillo y reúne los puntos que debería revisar una persona cualificada. No sustituye el asesoramiento jurídico.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** El estructurador recoge partes, duración, prestaciones y plazos. Sobre esa base trabajan en paralelo el explicador de cláusulas (lenguaje sencillo) y el analista de puntos de revisión (regulaciones inusuales o unilaterales); ambos leen el contrato por sí mismos, como texto o como archivo subido. Si el analista encuentra cláusulas críticas, un nodo de decisión añade una revisión en profundidad de esas cláusulas. El agente del informe lo reúne todo en un resumen estructurado con preguntas para el asesoramiento jurídico.

| Agente | Tarea | Recibe |
|---|---|---|
| **Estructurador del contrato** | Recoge partes, objeto, duración, remuneración y plazos. | Texto del contrato |
| **Explicador de cláusulas** | Explica cada cláusula en lenguaje sencillo. | Estructurador del contrato, Texto del contrato |
| **Analista de puntos de revisión** | Encuentra cláusulas inusuales, desequilibradas o ausentes. (salida estructurada) | Estructurador del contrato, Texto del contrato |
| **Resumen del contrato** | Reúne explicaciones y puntos de revisión en un resumen estructurado. (salida estructurada) | Explicador de cláusulas, Analista de puntos de revisión, Cláusulas críticas |
| **Cláusulas críticas** | Examina a fondo las cláusulas críticas y prepara preguntas para negociar. | ¿Cláusulas críticas? |

**Entrada:** El contrato como archivo (PDF, Word, Markdown o texto) en el campo «Contrato como archivo» o como texto, a ser posible con números de cláusula. El archivo lo subes directamente al iniciar; no necesitas una colección de conocimiento. El archivo de ejemplo contiene el contrato inventado de la tarea de prueba.

**Archivos de ejemplo:** `Contrato_servicios_software_ejemplo.docx`

**Casos de prueba:** Contrato en el texto, con cláusulas críticas; Contrato como archivo de Word, sin texto; Contrato de mantenimiento equilibrado

**Resultado:** Un resumen estructurado con síntesis, datos clave, cláusulas explicadas, puntos de revisión y preguntas para una abogada o un abogado, además en PDF y como archivo de Word editable. El estructurador propone los datos clave del contrato para el conocimiento, por ejemplo para un registro de contratos; solo se guarda lo que confirmes.

**Cómo adaptarlo:** Sube tu contrato como archivo al iniciar o pégalo. Tus propios criterios, por ejemplo requisitos mínimos de responsabilidad o protección de datos, se añaden en el prompt de sistema del analista de puntos de revisión. Los contratos modelo con los que comparar puedes guardarlos como conocimiento y asignarlos a ese analista.

## 13 · Crear un plan de aprendizaje personal {#learning-plan}
<!-- keywords: educación y formación, evaluación del nivel, planificador de aprendizaje, tutor, autor de pruebas -->

**Ámbito:** Educación y formación · **Agentes:** 4 · **Patrón:** paralelo · **Nivel:** Principiante · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada

Se aprende mejor con un plan que parte del nivel propio. El flujo crea un plan de aprendizaje personal, explica los primeros contenidos y comprueba la comprensión con un cuestionario.

**Cómo colaboran los agentes:** La evaluación del nivel determina el punto de partida y las lagunas, y el planificador elabora con ello un plan semanal. Sobre esa base trabajan en paralelo el tutor (contenidos de la semana elegida, apoyados en tu material del curso si quieres) y el autor de pruebas (prueba de conocimientos con soluciones). El resultado contiene las tres partes.

| Agente | Tarea | Recibe |
|---|---|---|
| **Evaluación del nivel** | Determina el punto de partida, el objetivo y las lagunas. | Objetivo de aprendizaje |
| **Planificador de aprendizaje** | Crea un plan semanal con objetivos y ejercicios. | Evaluación del nivel |
| **Tutor** | Explica los contenidos de la primera semana con ejemplos y ejercicios. | Planificador de aprendizaje, Objetivo de aprendizaje |
| **Autor de pruebas** | Crea una prueba de conocimientos con soluciones para la primera semana. | Planificador de aprendizaje |

**Entrada:** Quién aprende, el objetivo, el tiempo disponible, los conocimientos previos y el estilo de aprendizaje preferido. En el formulario eliges la semana que se elabora y puedes adjuntar material propio; el archivo de ejemplo es una guía breve sobre tablas dinámicas.

**Archivos de ejemplo:** `Guia_rapida_tablas_dinamicas.docx`

**Casos de prueba:** Semana 1 sin material; Semana 2 con material del curso

**Resultado:** Un plan de aprendizaje de cuatro semanas con objetivos por semana, explicaciones claras con ejercicios para la semana elegida y una prueba con soluciones y explicaciones, además en PDF para imprimir.

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
| **Asesor de ahorro** | Encuentra posibilidades de ahorro concretas y estima su efecto. (Herramientas: `calculator`) | Analista de presupuesto |
| **Comprobación de realidad** | Comprueba la viabilidad de las propuestas y las resume. (salida estructurada) | Analista de presupuesto, Asesor de ahorro |

**Entrada:** Ingresos, gastos fijos y variables de un hogar y un objetivo de ahorro. En lugar de teclearlo todo, puedes adjuntar movimientos bancarios o un libro de cuentas como archivo CSV o Excel; el archivo de ejemplo contiene un mes inventado.

**Archivos de ejemplo:** `Movimientos_bancarios_marzo_2026.csv`

**Casos de prueba:** Presupuesto en el texto; Movimientos bancarios en CSV

**Resultado:** Una revisión estructurada del presupuesto con el excedente mensual actual, el potencial de ahorro, medidas, primeros pasos rápidos y avisos, además como archivo de Excel. No sustituye el asesoramiento financiero ni el de deudas.

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

**Cómo adaptarlo:** Introduce tus deseos de viaje. Si quieres precios y horarios actuales, puedes añadir al planificador de rutas la herramienta de servidor «búsqueda web»; cada búsqueda tiene un coste adicional.

## 16 · Evaluar una idea de negocio {#business-idea}
<!-- keywords: autónomos y emprendedores, analista de mercado, calculador de rentabilidad, analista de riesgos, jurado inversor -->

**Ámbito:** Autónomos y emprendedores · **Agentes:** 4 · **Patrón:** paralelo · **Nivel:** Avanzado · **Elementos:** archivos de resultado

Antes de emprender conviene mirar con objetividad el mercado, las cifras y los riesgos. El flujo hace que tres especialistas examinen la idea a la vez y que un jurado emita un veredicto razonado.

**Cómo colaboran los agentes:** Tres agentes trabajan en paralelo: el analista de mercado estima públicos y competencia, el calculador de rentabilidad calcula el punto de equilibrio y escenarios con la calculadora y el analista de riesgos busca puntos débiles. El jurado inversor lo sopesa todo y entrega un veredicto estructurado con puntuación.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de mercado** | Estima públicos objetivo, demanda y competencia. | Idea de negocio |
| **Calculador de rentabilidad** | Calcula margen de contribución, punto de equilibrio y escenarios con la calculadora. (Herramientas: `calculator`) | Idea de negocio |
| **Analista de riesgos** | Busca puntos débiles y riesgos de la idea. | Idea de negocio |
| **Jurado inversor** | Sopesa mercado, cifras y riesgos y emite un veredicto. (salida estructurada) | Analista de mercado, Calculador de rentabilidad, Analista de riesgos |

**Entrada:** Una descripción de la idea con oferta, públicos objetivo, precios, costes, capacidad y competidores conocidos.

**Casos de prueba:** Servicio móvil de reparación de bicicletas

**Resultado:** Un veredicto estructurado (seguir adelante, adaptar o descartar) con puntuación, fortalezas, riesgos, supuestos que comprobar y próximos pasos concretos para validar la idea, además como informe en PDF.

**Cómo adaptarlo:** Describe tu idea con tus cifras. Cuanto más honestos sean los supuestos, más útil será el veredicto. Sube tus propios datos de mercado o resultados de encuestas como conocimiento y asígnalos al analista de mercado.

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

**Cómo adaptarlo:** Introduce tus ofertas y datos de financiación y adjunta directamente fichas, actas de la junta de propietarios o planos. Un índice de alquileres que necesites a menudo puedes guardarlo como conocimiento y asignarlo al analista del inmueble y la ubicación.

## 19 · Analizar retrasos de obra {#construction-delay}
<!-- keywords: construcción, analista de plazos, analista de causas, planificador de contramedidas, informe al promotor -->

**Ámbito:** Construcción · **Agentes:** 4 · **Patrón:** paralelo · **Nivel:** Avanzado · **Elementos:** aprobación, formulario de entrada, archivos de resultado, archivos como entrada

Los retrasos en obra se acumulan y los promotores necesitan rápido una imagen clara. El flujo calcula las desviaciones, clasifica las causas, desarrolla contramedidas y redacta un informe de situación.

**Cómo colaboran los agentes:** El analista de plazos y el analista de causas trabajan en paralelo. Uno calcula retrasos y holguras con las herramientas de fechas y calculadora; el otro ordena las causas por ámbito de responsabilidad y necesidad de documentación; ambos analizan también las planificaciones, libros de obra y fotos adjuntos. El planificador de contramedidas desarrolla opciones de aceleración y el agente del informe lo resume todo para el promotor. Antes de que el informe salga del equipo del proyecto, una persona lo aprueba.

| Agente | Tarea | Recibe |
|---|---|---|
| **Analista de plazos** | Calcula retrasos, holguras y consecuencias con la herramienta de fechas y la calculadora. (Herramientas: `days_between`, `calculator`) | Estado del proyecto |
| **Analista de causas** | Clasifica las causas por ámbito de responsabilidad y necesidad de documentación. | Estado del proyecto |
| **Planificador de contramedidas** | Desarrolla medidas de aceleración con coste y efecto. | Analista de plazos, Analista de causas |
| **Informe al promotor** | Resume de forma objetiva plazos, causas y medidas. | Analista de plazos, Planificador de contramedidas |

**Entrada:** Un resumen de plazos con hitos previstos y reales, observaciones sobre las causas, fecha del informe y condiciones contractuales, como texto o como archivos: planificación en Excel, libro de obra en PDF, fotos como imagen. Los archivos de ejemplo contienen una planificación y un extracto del libro de obra.

**Archivos de ejemplo:** `Planificacion_guarderia_Mirasol.xlsx`, `Libro_de_obra_extracto_abril_mayo.pdf`

**Casos de prueba:** Resumen de plazos en el texto; Planificación y libro de obra como archivos

**Resultado:** Un informe de estado objetivo con situación de plazos, causas, contramedidas, decisiones necesarias y riesgos. Tras la aprobación, la ejecución lo guarda en PDF y como archivo de Word editable. Las cuestiones sobre penalizaciones y ampliación de plazo quedan sujetas a revisión técnica y jurídica.

**Cómo adaptarlo:** Exporta tu planificación desde el software de proyectos en Excel y adjunta el libro de obra y las fotos. Para un informe periódico puedes programar la copia; la aprobación te esperará entonces.

## 20 · Desarrollar y calcular una carta {#restaurant-menu}
<!-- keywords: hostelería, creador del concepto, escandallo, redactor de la carta -->

**Ámbito:** Hostelería · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Principiante · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada

Una carta tiene que gustar a los clientes y ser rentable. El flujo desarrolla platos para un público, calcula el coste de materia prima y los precios y redacta textos apetecibles para la carta.

**Cómo colaboran los agentes:** Una cadena de tres agentes: el creador del concepto compone platos con recetas, el escandallo calcula el coste de materia prima y los precios de venta con la calculadora y el redactor de la carta escribe la carta. Un control de calidad comprueba público, precios y la nota sobre alérgenos. El resultado contiene el escandallo y la carta.

| Agente | Tarea | Recibe |
|---|---|---|
| **Creador del concepto** | Compone platos adecuados con recetas y cantidades. | Concepto |
| **Escandallo** | Calcula coste de materia prima y precios de venta con la calculadora. (Herramientas: `calculator`) | Creador del concepto, Concepto |
| **Redactor de la carta** | Escribe la carta de mediodía con descripciones apetecibles. (con control de calidad) | Escandallo |

**Entrada:** Tipo de local, público, número y tipo de platos, coste objetivo de materia prima, rango de precios y precios de compra. Los precios de compra puedes pegarlos o adjuntarlos como archivo CSV o Excel, como muestra el archivo de ejemplo.

**Archivos de ejemplo:** `Precios_compra_Molino_de_Ejemplo.csv`

**Casos de prueba:** Carta de mediodía con precios en el texto; Precios de compra en CSV

**Resultado:** Una tabla de escandallo con coste de materia prima y precio por plato y una carta de mediodía terminada con descripciones breves, además como archivo de Word para maquetar y como archivo de Excel con las tablas del escandallo. Los alérgenos y aditivos deben comprobarse y señalarse según las recetas reales.

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

**Cómo adaptarlo:** Introduce los datos de tu fiesta. Los permisos y requisitos varían según el municipio; añade los que conozcas a la entrada. Los logotipos y plantillas de carteles pueden guardarse como conocimiento.

## 23 · Desarrollar una campaña de donaciones {#nonprofit-campaign}
<!-- keywords: organizaciones sin ánimo de lucro, desarrollador de la campaña, analista de impacto, revisor de credibilidad -->

**Ámbito:** Organizaciones sin ánimo de lucro · **Agentes:** 3 · **Patrón:** paralelo · **Nivel:** Avanzado · **Elementos:** archivos de resultado, propuestas de conocimiento

Las campañas de donaciones necesitan una historia que conmueva, pero también afirmaciones honestas sobre el impacto. El flujo desarrolla una campaña, valora el posible impacto y comprueba si las promesas son creíbles y éticamente defendibles.

**Cómo colaboran los agentes:** El desarrollador de la campaña y el analista de impacto trabajan en paralelo: uno diseña mensaje, públicos y acciones, y el otro elabora un modelo de impacto con indicadores y calcula el coste por niño con la calculadora. El revisor de credibilidad comprueba ambos; el resultado incluye las tres partes.

| Agente | Tarea | Recibe |
|---|---|---|
| **Desarrollador de la campaña** | Diseña mensaje, públicos, canales y calendario de la campaña. | Descripción del proyecto |
| **Analista de impacto** | Elabora un modelo de impacto con indicadores y el coste por niño. (Herramientas: `calculator`) | Descripción del proyecto |
| **Revisor de credibilidad** | Revisa las afirmaciones en cuanto a exageración, ética y respaldo. (salida estructurada) | Desarrollador de la campaña, Analista de impacto |

**Entrada:** Organización, proyecto, resultados hasta ahora, objetivo, necesidad de financiación, periodo de la campaña y canales disponibles.

**Casos de prueba:** Padrinos de lectura en primaria

**Resultado:** Un concepto de campaña con calendario y borradores de textos, un modelo de impacto con indicadores y una revisión estructurada de afirmaciones exageradas, avisos éticos y un plan para medir el impacto, además como archivo de Word. El analista de impacto propone su modelo de impacto para el conocimiento, por ejemplo para futuras solicitudes de financiación; solo se guarda lo que confirmes.

**Cómo adaptarlo:** Describe tu proyecto y tus resultados con la mayor honestidad posible. Sube memorias anuales o evaluaciones como conocimiento y asígnalas al analista de impacto.

## 24 · Responder una consulta ciudadana {#citizen-inquiry}
<!-- keywords: instituciones públicas, análisis de asuntos, preparación de información, borrador de respuesta -->

**Ámbito:** Instituciones públicas · **Agentes:** 3 · **Patrón:** secuencial · **Nivel:** Principiante · **Elementos:** formulario de entrada, archivos de resultado, archivos como entrada, propuestas de conocimiento

Las consultas ciudadanas suelen contener varios asuntos y deben responderse de forma correcta, comprensible y sin compromisos precipitados. El flujo descompone la consulta, busca las normas pertinentes en la información facilitada y prepara una respuesta.

> Requiere revisión experta: los resultados son ayudas de trabajo y una persona cualificada debe revisarlos.

**Cómo colaboran los agentes:** Una cadena de tres agentes: el análisis de asuntos separa los asuntos y asigna competencias, la preparación de información busca las normas pertinentes únicamente en el extracto facilitado y el borrador de respuesta redacta una contestación cercana. Una revisión de calidad comprueba que solo se citen normas documentadas y que no haya compromisos vinculantes.

| Agente | Tarea | Recibe |
|---|---|---|
| **Análisis de asuntos** | Separa los asuntos y asigna competencias y urgencia. | Consulta ciudadana |
| **Preparación de información** | Busca las normas pertinentes solo en la información facilitada. | Análisis de asuntos, Consulta ciudadana |
| **Borrador de respuesta** | Redacta una respuesta objetiva y cercana para su aprobación. (con control de calidad) | Análisis de asuntos, Preparación de información |

**Entrada:** La consulta de la ciudadana o el ciudadano y la información interna, normas y competencias pertinentes, como extracto en el texto o como archivos. También puedes adjuntar fotos de la consulta. El archivo de ejemplo es una hoja informativa inventada del ayuntamiento.

**Archivos de ejemplo:** `Hoja_informativa_construcciones_y_alumbrado.pdf`

**Casos de prueba:** Caseta de jardín y farola; Normas como hoja informativa

**Resultado:** Un borrador de respuesta en lenguaje sencillo con competencias, próximos pasos e indicaciones para la tramitación, además como archivo de Word para vuestro membrete. La preparación de información propone las normas encontradas, con su referencia, para el conocimiento, de modo que consultas posteriores puedan usarlas; solo se guarda lo que confirmes. El borrador debe revisarse y aprobarse técnicamente antes de enviarlo.

**Cómo adaptarlo:** Adjunta vuestras ordenanzas y hojas informativas o súbelas de forma permanente como conocimiento (modo «Búsqueda» con citas) y asígnalas a la preparación de información. El membrete y la despedida se añaden en el prompt de sistema del borrador de respuesta. Para muchas consultas a la vez, usa el procesamiento por lotes.

<!-- examples:end -->
