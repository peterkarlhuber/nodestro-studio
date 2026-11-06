# Ajustes y funcionamiento

Este capítulo describe todos los ajustes, la instalación y el inicio de Nodestro y los atajos de teclado.

## Orientarse en los ajustes {#ueberblick}
<!-- keywords: ajustes, engranaje, abrir ajustes, buscar ajustes, encontrar un ajuste, ancho, más ancho, cambiar tamaño, navegación, avanzado, ctrl+coma -->

- **Abrir:** el engranaje arriba a la derecha de cada página, o *Ctrl+,* (*⌘,* en Mac). Los ajustes recuerdan de dónde vienes: **Volver** encima de la navegación (o de nuevo *Ctrl+,*) te lleva allí. Una página con cambios sin guardar, como el editor de flujos de trabajo, pregunta antes.
- **Búsqueda:** *Buscar un ajuste …* encima de la navegación busca en los nombres, explicaciones y textos de ayuda de cada ajuste, en el idioma de la interfaz. Las flechas eligen un resultado e **Intro** salta a él: las partes cerradas se abren, el ajuste se resalta y su campo recibe el foco.
- **Navegación:** la lista de la derecha muestra las secciones por temas y marca la que estás leyendo. En una ventana estrecha es una barra encima del contenido con la búsqueda e *Ir a la sección*.
- **Ancho:** arrastra el borde entre el contenido y la navegación para hacer los ajustes más anchos o más estrechos. Con el teclado, pon el foco en el borde (Tab) y usa las flechas (con Mayús en pasos más grandes), Inicio y Fin. Un doble clic en el borde o **Ancho estándar** en la navegación restablece el valor predeterminado. El ancho se guarda en este navegador.
- **Básico y avanzado:** los ajustes relacionados están juntos bajo un título. Las partes marcadas como *Avanzado* (por ejemplo, lo que pueden hacer los modelos de un endpoint compatible con OpenAI) permanecen cerradas hasta que las necesites; su etiqueta indica cuántos valores difieren del estándar.
- **Guardar:** la mayoría de los ajustes se aplican al instante. *Modelos y presupuesto* tiene su propio botón **Guardar**; si sales de la página con cambios sin guardar ahí, Nodestro pregunta antes.

## Modelos locales {#lokale-modelle}
<!-- keywords: modelo local, ollama, sin conexión, sin clave de api, qwen, descarga, recomendación, hardware, gpu, memoria, servidor de modelos, mistral, europeo, esfuerzo de razonamiento -->

→ [Abrir en Nodestro](/settings#settings-local-models)

Nodestro puede ejecutar agentes, asistentes y la búsqueda de conocimiento con **modelos locales** mediante Ollama, sin clave de API: las instrucciones y los documentos se quedan en este ordenador. Una instalación nueva usa modelos locales por defecto (agentes `ollama:qwen3.5:4b`, asistente `ollama:qwen3.5:9b`); una instalación actualizada conserva los modelos que tenía.

*Ajustes → Modelos locales* muestra:

- **Estado:** si el servidor de modelos está en marcha y quién lo proporciona. En el escritorio, Nodestro inicia su propio servidor (un proceso aparte en este ordenador, con su propia carpeta de modelos); en Nodestro Local Docker es un contenedor aparte; en un servidor lo proporciona el operador. Un Ollama que ya tengas en marcha solo se usa si guardas su dirección en el proveedor Ollama.
- **Entorno:** si falta, **Descargar e instalar** obtiene una vez la versión fijada y comprueba su SHA-256. Sin internet, instálalo desde su archivo de versión (ver [Importación sin conexión](/docs/einstellungen#offline-import)).
- **Recomendado para este ordenador:** un modelo por tarea (clasificar, redactar, agentes con herramientas, análisis, asistente, búsqueda semántica) según lo que necesita la tarea, la memoria de este ordenador y los modelos instalados. Un modelo instalado que sea suficiente va primero; *Adecuado* y *Limitado* significan que un modelo más grande lo haría mejor; el motivo aparece bajo el modelo. Las sugerencias nunca cambian un agente: su modelo lo eliges en el editor.
- **Modelos:** los modelos sugeridos con tamaño de descarga, memoria necesaria y licencia; **Comprobado** significa que la compilación instalada es la que Nodestro verificó.

**Preferir modelos europeos:** Qwen sigue siendo el estándar. Con el interruptor activado, las recomendaciones proponen, si son igual de adecuados, modelos del editor europeo Mistral AI (`ministral-3:3b`, `ministral-3:8b`, `ministral-3:14b` y, para programación, `devstral-small-2:24b`), aunque todavía haya que descargarlos; un modelo instalado sigue siendo la primera alternativa. Nunca se propone un modelo más débil y el interruptor nunca usa un servicio en la nube: todos estos modelos se ejecutan en este ordenador. Un modelo que tú mismo asignes a un agente siempre tiene prioridad, y el modo sin conexión estricto sigue rechazando las descargas. Para la búsqueda semántica, el interruptor propone el modelo europeo `mdenseon:307m` (LightOn) mientras no haya ningún modelo de embeddings instalado. No procede de la biblioteca de Ollama: **Descargar** obtiene los archivos originales fijados (1,2 GB), comprueba su SHA-256, construye el modelo y solo lo conserva si reproduce exactamente los vectores de referencia. Un índice existente mantiene su modelo; cambiarlo implica reconstruir el índice.

**Esfuerzo de razonamiento:** los modelos locales que pueden «pensar» lo hacen sin límite a partir del esfuerzo *Medio*, y ese razonamiento cuenta para la longitud máxima de salida. En un ordenador sin tarjeta gráfica, un modelo pequeño puede tardar muchos minutos en ello. Para pasos rápidos (clasificar, extraer, respuestas estructuradas cortas) elige *Bajo*: el modelo responde entonces sin pensar. El servidor de modelos que inicia Nodestro da a cada modelo 32.768 tokens de contexto para prompt, razonamiento y respuesta juntos. Inicia un Ollama propio con `OLLAMA_CONTEXT_LENGTH=32768`; su valor predeterminado de 4.096 tokens es demasiado pequeño para agentes.

Costes: los modelos locales **no tienen facturación de API externa**. Nodestro no registra los costes de funcionamiento locales (hardware, energía), por eso las ejecuciones muestran «local, sin facturación de API» en lugar de un total de 0, y las ejecuciones mixtas añaden el número de solicitudes locales al coste.

## Este ordenador, ventana de contexto y velocidad {#lokale-hardware}
<!-- keywords: hardware, gpu, solo cpu, memoria, ventana de contexto, ollama_context_length, velocidad, tokens por segundo, medir, modo de ahorro de cpu, razonamiento reducido -->

*Ajustes → Modelos locales → Este ordenador* muestra lo que Nodestro detectó: sistema, núcleos de CPU, memoria, la tarjeta gráfica y su memoria, si el servidor de modelos está en marcha (y en la GPU o la CPU) y su **ventana de contexto**: fijada por Nodestro para el servidor que inicia, indicada por un servidor en marcha o aún desconocida para tu propio Ollama. La columna **En este ordenador** de la lista de modelos indica si un modelo se ejecuta en la GPU, en la CPU (más lento), si es demasiado lento sin GPU o demasiado grande para esta memoria.

Aparecen avisos encima de la lista cuando corresponden: una ventana de contexto demasiado pequeña (para tu propio Ollama: define `OLLAMA_CONTEXT_LENGTH=32768` en su ordenador y reinícialo), sin tarjeta gráfica (cuenta con respuestas lentas; funcionan mejor los modelos pequeños y el esfuerzo *Bajo* para pasos sencillos), poca memoria, un modelo que no cabe o un modelo medido como lento. La comprobación del flujo de trabajo también avisa cuando la ventana de contexto es inferior a 16.384 tokens o el límite de respuesta de un agente no cabe en ella.

**Velocidad:** Nodestro no estima velocidades. **Medir velocidad** en un modelo de lenguaje instalado ejecuta una generación corta en este ordenador y muestra los tokens por segundo medidos, cuándo se midió y si el modelo se ejecutó en la GPU o la CPU.

**Modo de ahorro de CPU para modelos que razonan** (activado por defecto): en un ordenador sin tarjeta gráfica, los agentes con esfuerzo *Medio* en modelos locales que razonan responden sin la larga fase de razonamiento. El esfuerzo *Alto* y una opción de razonamiento fijada explícitamente nunca se reducen. Cada paso respondido así lleva la insignia «Razonamiento reducido: modo de ahorro de CPU» en la ejecución y en la prueba del agente. Desactiva el modo para que los agentes razonen siempre como está configurado.

## Importación sin conexión y carpeta de modelos {#offline-import}
<!-- keywords: sin conexión, air gap, usb, gguf, paquete sin conexión, sha-256, ssd externo, carpeta de modelos, copiar -->

Para ordenadores sin internet, *Ajustes → Modelos locales → Importación sin conexión* importa desde una ruta del ordenador donde funciona Nodestro (en Local Docker: dentro de su carpeta de importación):

- **Paquete sin conexión:** una carpeta creada en un ordenador con internet (`orkexa-local export`). Cada archivo se comprueba con su SHA-256 antes de usarlo.
- **Archivo GGUF:** un archivo de modelo; dale el nombre que usan los agentes (por ejemplo `mi-modelo:q4`) y, para modelos que leen imágenes, el proyector de visión (`mmproj`).

**Carpeta de modelos:** los modelos ocupan mucho. Elige otra carpeta, por ejemplo en un SSD externo: **Copiarlos allí y comprobarlos** copia cada modelo, lo comprueba y solo entonces cambia (la carpeta anterior se conserva); **Usar la carpeta tal como está** cambia a una carpeta que ya contiene modelos de Ollama.

## Crear un modelo a partir de archivos locales {#modell-bauen}
<!-- keywords: crear, mdenseon, safetensors, plantilla, gguf, air gap, suma de comprobación, vectores de referencia, embedding, reconstruir índice -->

Algunos modelos no están en la biblioteca de Ollama y se crean a partir de sus archivos originales: por ahora el modelo de embeddings europeo `mdenseon:307m` (LightOn, Apache-2.0). Con internet, **Descargar** en la lista de modelos obtiene los archivos y crea el modelo. Sin internet (o en el modo sin conexión estricto), usa *Ajustes → Modelos locales → Crear a partir de archivos locales*: copia los dos archivos desde un ordenador con internet, indica sus rutas en el ordenador donde funciona Nodestro (en Local Docker: dentro de su carpeta de importación) y elige **Crear y comprobar**. No se descarga nada.

- **Archivo de pesos:** `model.safetensors` de `lightonai/mDenseOn`, revisión `a5fdb000f7a21da96c3bddde3a782ef777316df3`, 1,227,771,776 bytes, SHA-256 `a336c49fc679aeb23969114b12fb7317804da3cc7d8bc214818009dea39d545c`.
- **Archivo de plantilla:** `mmBERT-Base-307M-F16.gguf` de `mykor/mmBERT-base-GGUF`, revisión `66e31bd2787f6b5fe9b762a664f4899af38b0605`; SHA-256 de sus primeros 6,036,928 bytes `a224ccdee4310594e73c9907934a1520405bfc4467a3577d3dcf418e7c017901`. Basta el archivo completo o solo estos primeros bytes (su cabecera).

Nodestro comprueba ambos archivos con estas sumas, escribe el archivo del modelo, crea el modelo en el servidor de modelos y calcula textos de referencia: el modelo solo se conserva si cada vector coincide con la referencia. La lista muestra el paso en curso; **Cancelar** detiene la creación. Si falla, el mensaje indica el motivo: un archivo que no coincide con la suma (archivo equivocado, revisión equivocada o copia incompleta), un archivo que falta, un archivo que no corresponde al modelo o vectores de referencia que no coinciden (el modelo se elimina). **Reintentar** la inicia de nuevo con las mismas rutas.

Después, el modelo aparece como modelo de embeddings. Un índice semántico existente se queda con su modelo: elige el nuevo modelo en [Búsqueda de conocimiento](/docs/wissen#suchverfahren) y reconstruye el índice; la búsqueda usa el índice anterior hasta que el nuevo esté completo.

## Modo sin conexión estricto {#offline}
<!-- keywords: sin conexión estricto, air gap, sin nube, comprobación previa, descargas rechazadas -->

Con el **Modo sin conexión estricto** activado, la comprobación previa a cada ejecución rechaza los modelos en la nube (también como modelo de reserva, evaluador u orquestador), un servidor de modelos que no esté en este ordenador, las herramientas de servidor como la búsqueda web y los servicios MCP remotos; también se rechazan las descargas. Los modelos locales, las herramientas locales y los servidores MCP locales siguen funcionando. El modo no cambia ningún flujo de trabajo: solo rechaza lo que saldría del ordenador.

## Proveedores de IA {#anbieter}
<!-- keywords: clave de api, proveedor, anthropic, openai, gemini, ollama, vllm, compatible con openai, url base, variable de entorno, .env, capacidades -->

→ [Abrir en Nodestro](/settings#settings-providers)

Nodestro ejecuta los agentes con la biblioteca Orkexa y trabaja con varios **proveedores de IA** a la vez: **Anthropic**, **OpenAI**, **Google Gemini** y tus propios servidores mediante un **endpoint compatible con OpenAI**, **Ollama** o **vLLM**. Cada agente usa el proveedor de su modelo. Si ese proveedor no está configurado, la ejecución no empieza; Nodestro nunca cambia en silencio a otro proveedor. Si falta el proveedor del modelo predeterminado, arriba a la derecha aparece «Configurar proveedor de IA», o «El modelo predeterminado necesita …» si ya hay otro proveedor configurado.

En *Ajustes → Proveedores de IA* cada proveedor tiene su propia sección:

- **Anthropic, OpenAI, Google Gemini:** introduce la clave de API y pulsa **Guardar**. La clave se guarda en la base de datos local, no se vuelve a mostrar y solo se envía a este proveedor. **Quitar** la elimina.
- **Endpoint compatible con OpenAI, Ollama, vLLM:** introduce la **URL base** del servidor (por ejemplo `http://localhost:11434/v1` para Ollama) y pulsa **Guardar endpoint**; la clave de API es opcional. El proveedor solo cuenta como configurado cuando hay una URL base guardada.
- **Amazon Bedrock (AWS):** sin clave de API; eliges una región de AWS y cómo inicia sesión Nodestro en AWS; consulta [Amazon Bedrock (AWS)](/docs/einstellungen#bedrock).
- **Lo que pueden hacer los modelos:** para tus propios servidores indicas si sus modelos admiten herramientas, salida estructurada, imágenes, documentos PDF, esfuerzo de razonamiento y otras capacidades. Nodestro no supone nada: una opción que un modelo no puede hacer, o cuyo soporte se desconoce, la comprobación la notifica como error en lugar de omitirla.
- **Probar conexión** solo pide al proveedor su lista de modelos; no cuesta nada.
- **Primer proveedor:** si guardas una clave mientras el proveedor del modelo predeterminado aún no está configurado, los agentes nuevos usan a partir de ahora un modelo de este proveedor; un mensaje indica cuál. Solo cambian los ajustes: los flujos existentes conservan sus modelos.

También puedes definir las claves como **variables de entorno**, antes de arrancar o en un archivo **`.env`** en la carpeta donde inicias `nodestro`. Las variables de entorno tienen **prioridad** sobre las claves guardadas:

| Proveedor | Variable de entorno |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` o `GOOGLE_API_KEY` |
| Compatible con OpenAI, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (opcional) |

Una clave de versiones anteriores (entonces solo para Anthropic) pasa automáticamente a ser la clave de Anthropic en estos ajustes en el primer arranque.

## Amazon Bedrock (AWS) {#bedrock}
<!-- keywords: amazon bedrock, bedrock, aws, región, iam, rol, perfil, sso, perfil de inferencia, arn, ue, residencia de datos, solo ue, converse, aws_region, sts -->

**Amazon Bedrock** ejecuta Claude, Amazon Nova y otros modelos a través de tu propia **cuenta de AWS**, en la **región de AWS** que elijas; los costes aparecen en tu factura de AWS. Bedrock **no tiene campo de clave de API**: Nodestro inicia sesión con credenciales de AWS y nunca guarda claves de acceso de AWS. Un rol de IAM o un perfil de AWS no es una clave; solo le dice a AWS quién pregunta.

**Inicio de sesión en el escritorio.** En *Ajustes → Proveedores de IA → Amazon Bedrock (AWS)* elige:

- **Credenciales predeterminadas de AWS (entorno, SSO, rol de instancia):** lo que las herramientas de AWS encuentran en este equipo, por ejemplo tras `aws sso login`, en variables de entorno `AWS_*` o en un rol de instancia.
- **Perfil de AWS:** un perfil con nombre de `~/.aws/config`; solo escribes su **nombre**, las credenciales se quedan en tu configuración de AWS.

En Nodestro Local (un contenedor) solo se ofrecen las credenciales predeterminadas.

**Inicio de sesión en un servidor.** Las credenciales de AWS propias del servidor nunca se usan para un espacio de trabajo. Bedrock está desactivado hasta que el operador asigna al espacio de trabajo su propio **rol de AWS**; la tarjeta muestra entonces *Rol asignado por el operador*, y no puedes ver ni cambiar el rol. Sin rol indica *no disponible en este servidor*: pregunta a tu operador. El operador también puede limitar las regiones y exigir la residencia de datos solo en la UE para todos los espacios de trabajo (consulta [Nodestro en un servidor](/docs/einstellungen#server)).

**Región.** Escribe la región a la que van las solicitudes y que AWS factura, por ejemplo `eu-central-1` (Fráncfort). El campo sugiere regiones habituales y rechaza nombres que no son regiones de AWS. El modelo debe estar habilitado para tu cuenta en esa región.

**Modelo.** En el agente elige el proveedor *Amazon Bedrock (AWS)*. La lista muestra modelos **sugeridos** (perfiles de inferencia de la UE de Claude y Amazon Nova); una sugerencia no significa que el modelo esté habilitado para tu cuenta. Puedes escribir cualquier **ID de modelo** (`anthropic.claude-sonnet-4-5-20250929-v1:0`), **ID de perfil de inferencia** (`eu.anthropic.claude-sonnet-5-5`) o **ARN** (por ejemplo, de un perfil de inferencia de aplicación); se guarda como `bedrock:<id>` y se pasa tal como lo escribes, con los dos puntos incluidos (consulta [Modelo](/docs/agenten#modell)).

**Residencia de datos solo en la UE.** Con el interruptor activado, Nodestro comprueba antes de la primera solicitud que la región y todas las regiones a las que el modelo o el perfil de inferencia pueden enrutar son regiones de la UE (Fráncfort, Estocolmo, Milán, España, Irlanda, París); si no, no envía nada. Los perfiles de inferencia globales (`global.…`) se rechazan siempre; Londres y Zúrich están en Europa, pero no en la UE. La comprobación abarca la configuración con la que Nodestro envía las solicitudes. **No garantiza** que AWS procese todo en la UE: el registro de invocaciones de modelos, la detección de abusos con su retención y los demás ajustes de tu cuenta de AWS quedan fuera de Nodestro. Para imponerlo en toda la cuenta, usa IAM y políticas de control de servicios. Si tu operador exige «solo en la UE», el interruptor queda activado.

**Comprobar conexión.** El botón inicia sesión en AWS (`sts:GetCallerIdentity`) y hace una lectura gratuita en Bedrock (una lista de modelos). **No se invoca ningún modelo, así que no cuesta nada.** Después la insignia muestra *Conexión comprobada* o *Comprobación fallida* con el motivo; antes, *Sin configurar* o *Configurado*.

**Permisos mínimos de IAM** del rol o usuario:

- `bedrock:InvokeModel` y `bedrock:InvokeModelWithResponseStream` sobre el modelo o el perfil de inferencia (la API Converse usa estos); con un perfil de inferencia, también sobre el modelo base en cada región de destino;
- `bedrock:GetInferenceProfile` sobre el perfil (comprobación «solo en la UE») y `bedrock:GetGuardrail` si usas una barrera de protección (guardrail);
- `sts:GetCallerIdentity` y `bedrock:ListFoundationModels` para *Comprobar conexión*.

**Precios.** Bedrock se factura **por región**, nunca con los precios de Anthropic, tampoco para Claude. Un precio solo vale para las regiones que indica; una región no indicada tiene un coste **desconocido**, nunca 0, y el modo de precios estricto rechaza entonces la solicitud. Introduce tus propios precios con sus regiones en [Precios de modelos](/docs/nutzung#preise). Tu factura de AWS puede incluir más de lo que cuenta Nodestro (por ejemplo, el registro de invocaciones, las barreras de protección u otros servicios de AWS).

**Qué ofrece Bedrock.** Herramientas, streaming, imágenes y documentos PDF, salida estructurada y esfuerzo de razonamiento dependen del modelo; las opciones que un modelo no admite, o cuya compatibilidad se desconoce (un ARN escrito, un perfil de inferencia de aplicación), Nodestro las muestra desactivadas con el motivo. **No disponible en Bedrock**, tampoco para Claude: herramientas de servidor como la búsqueda web, modos de pensamiento, los ajustes de caché de prompts de Anthropic, modelos de respaldo, lotes y citas.

**Herramientas y credenciales de AWS.** En el escritorio, Nodestro mantiene las credenciales de AWS fuera del alcance de las herramientas (variables de entorno y consultas del SDK de AWS). Aun así, el código de herramientas en el sandbox simple de subprocesos se ejecuta con tu usuario y podría leer directamente los archivos de `~/.aws`. Si hay credenciales reales de AWS en el equipo, ejecuta tus herramientas propias y las generadas por IA en el sandbox integrado o en contenedores (consulta [Sandbox](/docs/einstellungen#sandbox)).

**Solución de problemas según el mensaje:**

| Mensaje | Qué hacer |
|---|---|
| No se encontraron credenciales de AWS | Inicia sesión (`aws sso login`), revisa el perfil o el entorno y luego *Comprobar conexión*. |
| AWS no aceptó las credenciales | Son incorrectas o han caducado: vuelve a iniciar sesión. |
| AWS denegó el acceso | Concede los permisos de arriba y habilita el modelo en la consola de AWS. |
| El perfil de AWS … no existe | Compara el nombre del perfil con `~/.aws/config`. |
| No es un nombre de región de AWS / no válida | Usa un nombre como `eu-central-1`. |
| No se conoce en esta región | Usa un ID de modelo o un perfil de inferencia que se ofrezca en esta región. |
| No se pudo acceder | Revisa la red, el proxy y la región. |
| Podría incumplir la residencia de datos solo en la UE | Usa una región de la UE y un perfil `eu.` o un modelo de esa región. |
| No disponible en este servidor | Pide a tu operador que asigne un rol de AWS al espacio de trabajo. |

## Modelo de los asistentes y modelo predeterminado {#modelle}
<!-- keywords: modelo predeterminado, modelo de asistentes, default model, agentes nuevos -->

- **Modelo predeterminado para agentes nuevos:** los agentes nuevos y vacíos empiezan con este proveedor y modelo (desde la paleta, en flujos nuevos y como plantilla vacía). En los borradores con IA sirve de sustituto si el arquitecto propone un modelo no permitido. Los agentes existentes no cambian.
- **Modelo de los asistentes:** este modelo diseña agentes a partir de tu descripción, escribe herramientas como agente de código, propone estructuras de memoria y responde tus preguntas como [Nodestro Assistant](/docs/assistent). Un modelo potente (predeterminado: Claude Opus 5.5 de Anthropic) da mejores propuestas. Los borradores con IA solo proponen modelos de proveedores configurados.

Ambos campos constan de **proveedor** y **modelo**. Elige el modelo de la lista o escribe cualquier id de modelo del proveedor, por ejemplo `gpt-5.5` en OpenAI o `llama3.1:8b` en Ollama. Se guarda como `proveedor:modelo` (por ejemplo `openai:gpt-5.5`); los valores antiguos sin proveedor, como `claude-sonnet-5-5`, cuentan como modelos de Anthropic.

Si el modelo predeterminado pertenece a un proveedor que no está configurado mientras otro sí lo está, un aviso sobre la elección de modelo indica que los agentes nuevos y las copias de ejemplos no pueden ejecutarse con él y ofrece el modelo correspondiente del proveedor configurado (*Usar …*). Los flujos existentes conservan sus modelos en cualquier caso.

Guarda los cambios con **Guardar** en la sección *Modelos y presupuesto*.

## Presupuesto predeterminado {#budget}
<!-- keywords: presupuesto predeterminado, presupuesto, budget, límite -->

El **presupuesto predeterminado por ejecución** (al principio 2 USD) se aplica a todos los flujos sin presupuesto propio. Vacío significa sin límite. Cómo funciona el presupuesto se explica en [Presupuesto por ejecución](/docs/workflows#budget).

Los administradores fijan además el **Presupuesto máximo por ejecución** (vacío: sin tope): ninguna ejecución puede empezar con más ni elevarse por encima. El **Plazo de las decisiones de presupuesto** (de 1 a 720 horas, al principio 24) indica cuánto espera una ejecución pausada una [decisión de presupuesto](/docs/workflows#budget-freigabe) antes de fallar. Quién puede decidir se explica en [Quién puede decidir](/docs/workflows#budget-rechte).

## Sandbox {#sandbox}
<!-- keywords: elegir sandbox, automático, docker, proceso de python, docker disponible, sandbox integrado, sandbox de linux, macos, windows, bloqueado, experimental -->

→ [Abrir en Nodestro](/settings#settings-sandbox)

Aquí eliges dónde se ejecutan las herramientas. El cambio se aplica de inmediato.

| Modo | Tus herramientas | Herramientas creadas por IA y de origen desconocido |
|---|---|---|
| **Automático** (predeterminado, recomendado) | Proceso de Python | solo Docker, una vez que supera las comprobaciones de Nodestro; si no, **bloqueadas** |
| **Sandbox de Linux** (opcional, solo Linux) | Proceso de Python | solo el sandbox de Linux integrado; si no, **bloqueadas**; sin paquetes de Python de terceros, así que las herramientas que los necesitan quedan **bloqueadas**; Docker no se usa |
| **Proceso de Python** (solo para uso de confianza) | Proceso de Python | siempre **bloqueadas**; no se usa ni Docker ni el sandbox de Linux integrado |
| **Docker** | Docker | Docker; si Docker no está en ejecución, no se ejecuta ninguna herramienta |

Nodestro nunca recurre a un proceso sin protección para el código creado por IA, y *Automático* tampoco recurre nunca al sandbox de Linux integrado: solo se usa si eliges **Sandbox de Linux**. Si nunca elegiste un modo, Nodestro usa *Automático*; un modo que elegiste en una versión anterior se mantiene. Si elegiste **Proceso de Python** en una versión anterior, las herramientas creadas por IA ahora están bloqueadas: ese modo ya no las ejecuta en un sandbox integrado. Elige **Automático** e inicia Docker o, en Linux, **Sandbox de Linux**.

Debajo de la selección, Nodestro muestra:

- el **equipo que ejecuta Nodestro** con su sistema operativo. Es el equipo del entorno de Nodestro, no el dispositivo de tu navegador: si abres Nodestro en un servidor desde un Mac, cuenta el sistema del servidor;
- dónde se ejecutan **ahora** las herramientas creadas por IA y las tuyas, o que están **bloqueadas** y por qué;
- cada **sandbox en este equipo** con su estado: *Aprobado* (puede ejecutar código creado por IA), *Experimental, no se usa*, *No disponible*, *Sin aislamiento* (el proceso de Python) o *No se usa aquí*.

El sandbox de Linux integrado está aprobado en Ubuntu 24.04 y Debian 13 (Intel o AMD de 64 bits) una vez que su autocomprobación se ha superado; en ARM64 no está disponible. Nodestro no tiene un sandbox nativo en macOS ni en Windows: el antiguo sandbox experimental de macOS se eliminó, y su fila lo indica. Por eso, en ambos sistemas las herramientas creadas por IA necesitan Docker o un motor compatible. Los detalles están en [El sandbox](/docs/tools#sandbox) y [Confianza y aislamiento](/docs/tools#vertrauen).

En un servidor y en Nodestro Local Docker, todas las herramientas se ejecutan en un contenedor; allí el ajuste no se puede cambiar.

## Instalar Docker {#sandbox-docker}
<!-- keywords: instalar docker, docker desktop, docker engine, macos, windows, linux, wsl, iniciar docker, docker no se ejecuta, colima, orbstack, podman, rootless, grupo docker, comprobar motor -->

Con *Automático*, las herramientas creadas por IA requieren Docker o un motor de contenedores compatible en cualquier sistema; en Linux, el modo **Sandbox de Linux** es la única alternativa, sin paquetes de terceros. Nodestro se inicia sin Docker; solo las herramientas creadas por IA siguen bloqueadas hasta que se ejecute un motor adecuado. Nodestro encuentra por sí mismo un motor en ejecución y crea la imagen del contenedor en el primer uso.

- **macOS:** instala [Docker Desktop para Mac](https://docs.docker.com/desktop/setup/install/mac-install/) (Apple silicon o Intel), ábrelo una vez y espera hasta que indique que está en ejecución. [Colima](https://github.com/abiosoft/colima), [OrbStack](https://orbstack.dev/) y [Podman](https://podman.io/) también se aceptan si superan las comprobaciones de Nodestro.
- **Windows:** instala [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/) con el backend WSL 2, reinicia si se te pide e inicia Docker Desktop. Debe ejecutar contenedores de Linux. Podman también se acepta si supera las comprobaciones de Nodestro.
- **Linux:** instala [Docker Engine](https://docs.docker.com/engine/install/) para tu distribución. Recomendamos [Docker sin privilegios de root (rootless)](https://docs.docker.com/engine/security/rootless/) con delegación de cgroup v2, para que los límites se cumplan. Añadir tu usuario al grupo `docker` también funciona, pero los miembros del grupo docker tienen en la práctica privilegios de root en este equipo. Podman también se acepta.

**Nodestro comprueba el motor por sí mismo.** Antes de que un motor ejecute código creado por IA, Nodestro comprueba sus límites y su filtro de llamadas al sistema (seccomp) e inicia un pequeño contenedor de prueba. Dentro, el código debe ejecutarse como usuario sin privilegios ni permisos especiales, sin red, en un sistema de archivos de solo lectura, con límites aplicados de memoria, procesos, CPU y archivos abiertos, y sin secretos en el entorno. Nodestro rechaza un motor que no supera una comprobación, se llame como se llame, y *Ajustes → Sandbox* muestra qué comprobación falló. Las comprobaciones nunca se relajan. Nodestro comprueba en segundo plano, así que la página nunca espera a Docker; mientras la comprobación está en curso, la fila de Docker indica *Comprobando* y se actualiza sola. Después de iniciar o cambiar el motor, haz clic en **Comprobar de nuevo**. Los administradores también pueden hacer clic en **Ejecutar autoprueba** para iniciar el contenedor de prueba de inmediato (**Preparar el sandbox** mientras falte la imagen del sandbox). Solo los administradores inician una comprobación nueva, y como mucho cada 10 segundos: si no, la página indica que no se comprobó nada nuevo (y cuándo volver a intentarlo) y sigue mostrando el último resultado. Los demás usuarios ven el estado y cada comprobación sin detalles técnicos.

**¿Qué motor?** En Linux, Docker Engine es la opción más directa, idealmente sin root con delegación de cgroup v2; Podman con root también funciona. Podman sin root puede no superar las comprobaciones, porque es posible que no aplique todos los límites de archivos del sandbox. En macOS y Windows, usa Docker Desktop o una de las alternativas anteriores. Elijas el motor que elijas, su nombre no decide: Nodestro confía en sus propias comprobaciones en tu equipo.

Después abre *Ajustes → Sandbox*: con **Automático**, Nodestro usa Docker en cuanto está en ejecución; se muestra *Docker disponible* y las herramientas creadas por IA dejan de estar bloqueadas. Si Docker se detiene, vuelven a quedar bloqueadas hasta que se ejecute de nuevo; Nodestro no cambia al proceso de Python.

## Idioma {#sprache}
<!-- keywords: idioma, language, español, inglés, alemán, francés, portugués, italiano, idioma del navegador, traducción, localización -->

Nodestro está disponible en **alemán, inglés, español, francés, portugués (Brasil) e italiano**. En **Idioma de la interfaz** eliges uno de ellos o **Automático (idioma del navegador)**.

- **Primer inicio:** Nodestro usa el idioma de tu navegador. Si no está disponible, aparece en inglés.
- **Elección propia:** un idioma elegido siempre tiene prioridad y queda guardado, también después de reiniciar. Nodestro lo recuerda en el navegador y en los ajustes; otro navegador lo adopta mientras no tenga una elección propia.
- **Efecto inmediato:** el cambio no necesita reinicio y no inicia ningún flujo de trabajo ni llamada a la IA.

El idioma solo afecta a la **interfaz**: menús, avisos, mensajes de error, esta documentación y los formatos de números y fechas. Los costes se muestran siempre en dólares estadounidenses, con el formato del idioma elegido. En los mensajes de error del servidor puedes ver el texto original en **Detalles técnicos**.

**Tu contenido no cambia.** Los agentes, prompts, flujos de trabajo, herramientas, conocimiento, memoria y resultados nunca se traducen automáticamente. Un agente existente sigue respondiendo en el idioma de su prompt, sea cual sea el idioma de la interfaz.

**Asistentes de IA:** los diseños nuevos (agentes, estructuras de memoria) se redactan en el idioma de la interfaz, salvo que tu descripción pida otro idioma. El código, los identificadores y las claves JSON siempre siguen en inglés.

## Apariencia {#darstellung}
<!-- keywords: tema, oscuro, claro, modo oscuro, modo claro, esquema de colores, diseño, midnight citron -->

Arriba a la derecha cambias entre **Oscuro** y **Claro**. La elección se guarda en el navegador. Ambas variantes siguen el sistema de diseño *Midnight Citron*. En pantallas estrechas, la barra lateral se oculta: el botón de menú arriba a la izquierda (**Mostrar todas las páginas**) la abre como panel y **Esc** la vuelve a cerrar.

## Copia de seguridad y restauración {#backup}
<!-- keywords: copia de seguridad, backup, restaurar, exportar, zip, mudanza, respaldo -->

→ [Abrir en Nodestro](/settings#settings-backup)

**Descargar copia de seguridad** guarda todos los datos en un archivo ZIP: flujos de trabajo con versiones, plantillas de agentes, herramientas propias, archivos de conocimiento, memoria, ejecuciones, datos de uso, favoritos, etiquetas y ajustes. La base de datos se guarda como una instantánea coherente, incluso mientras una ejecución está trabajando.

Las **claves de API** de los proveedores de IA nunca se escriben en la copia, ni tampoco las URL base que contienen credenciales. Al restaurar se conservan las claves de este equipo.

**Restaurar desde archivo** primero comprueba el archivo por completo: formato, la suma de comprobación de cada archivo, la base de datos y cada flujo de trabajo y ejecución guardados. Solo entonces Nodestro muestra qué contiene la copia, comparado con el estado actual. Los datos solo se sustituyen tras una confirmación expresa y solo si no hay ninguna ejecución activa. Antes, Nodestro guarda automáticamente una copia del estado actual (`before-restore-….zip` en la carpeta `backups` del directorio de datos); aparece entre las copias de este equipo y se puede restaurar igual. Si algo falla, los datos anteriores no cambian.

## Diagnóstico del sistema {#diagnose}
<!-- keywords: diagnóstico, comprobar, buscar errores, conexión, docker, sandbox, versión, problema -->

→ [Abrir en Nodestro](/settings#settings-diagnostics)

**Iniciar diagnóstico** comprueba si Nodestro funciona por completo en este equipo y muestra para cada punto **Correcto**, **Advertencia** o **Error**, con una explicación y una propuesta de solución:

- versiones de Nodestro, Orkexa, Python, SQLite y del sistema operativo
- base de datos (legible, escribible, intacta, búsqueda de texto completo)
- directorios de datos, herramientas y copias escribibles, espacio libre en disco
- proveedores de IA: cuáles están configurados y si entre ellos están los del modelo predeterminado y del asistente (sin mostrar claves)
- Docker y el sandbox de herramientas con una pequeña herramienta de prueba
- soporte de PDF y la interfaz compilada

El diagnóstico es gratuito y no envía nada a internet. **Probar conexión** pide además la lista de modelos al proveedor del modelo predeterminado; en la sección de cada proveedor en [Proveedores de IA](/docs/einstellungen#anbieter) lo pruebas por separado. No usa tokens y no cuesta nada. Las claves de API y otras credenciales nunca se muestran.

## Instalación e inicio {#installation}
<!-- keywords: instalación, inicio, línea de comandos, cli, puerto, host, data-dir, no-browser, reload, python, node -->

Requisitos: Python 3.11 o posterior y Node.js 20 o posterior (solo para compilar la interfaz); Docker es opcional.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -e .
nodestro
```

Nodestro se inicia en `http://localhost:8000` y abre el navegador. Opciones del comando `nodestro`:

| Opción | Variable de entorno | Significado |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Dirección (por defecto `127.0.0.1`). Solo se aceptan direcciones de este equipo (`127.0.0.1`, `::1`, `localhost`), porque Nodestro aún no tiene inicio de sesión |
| `--port` | `NODESTRO_PORT` | Puerto (por defecto `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Directorio de datos (por defecto `~/.nodestro`) |
| `--profile` | `NODESTRO_PROFILE` | Perfil de funcionamiento (por defecto `desktop`). Un servidor Nodestro no se inicia con este comando: funciona como la distribución de servidor de Nodestro, independiente, que instala el operador de tu organización |
| – | `NODESTRO_ALLOWED_HOSTS` | Otros nombres de este equipo a los que responde Nodestro (separados por comas, p. ej. `studio.localhost`). Se rechazan otros nombres de host, los cambios desde páginas web ajenas y las solicitudes reenviadas por un proxy, para que ninguna página del navegador pueda manejar Nodestro |
| `--no-browser` | – | No abrir el navegador automáticamente |
| `--reload` | – | Reiniciar al cambiar el código (desarrollo) |

Se detiene con **Ctrl+C**. Las ejecuciones en curso se cancelan.

> **Seguridad:** Nodestro aún no tiene gestión de usuarios, por eso solo responde a este equipo. `--host 0.0.0.0`, otras direcciones de red o nombres de red en `NODESTRO_ALLOWED_HOSTS` detienen el inicio, y Nodestro no puede ponerse detrás de un proxy inverso. Para que otros dispositivos usen un flujo de trabajo, publícalo como API: las API publicadas usan claves de API y tienen su propio acceso de red (ver *API y exportación*).

## Nodestro en un servidor {#server}
<!-- keywords: servidor, iniciar sesión, inicio de sesión, cerrar sesión, rol, roles, permiso, permisos, espacio de trabajo, tenant, solo lectura, miembros, nodestro-server, set-role, remove-member, revoke-sessions, sesión caducada -->

Nodestro Studio también puede ejecutarse en un **servidor Nodestro** de tu organización. En ese caso inicias sesión con el servicio de inicio de sesión de tu organización, y tus datos se guardan en ese servidor en lugar de en tu ordenador. Nodestro iniciado con el comando `nodestro` no tiene inicio de sesión ni roles; allí no se aplica nada de esta sección.

**Iniciar y cerrar sesión.** Al abrir Nodestro, el servidor te lleva al inicio de sesión y luego de vuelta. Arriba a la derecha aparecen tu nombre y tu rol. Un clic abre tu cuenta: nombre, rol, **espacio de trabajo**, tus permisos y **Cerrar sesión**. Cuando tu sesión termina, la siguiente acción te lleva de nuevo al inicio de sesión y luego a la misma página. Si un inicio de sesión falla (por ejemplo, porque tardó demasiado), un aviso arriba de la página explica qué pasó, con **Volver a iniciar sesión**.

**Espacios de trabajo.** Los flujos de trabajo, las ejecuciones, el conocimiento y los ajustes pertenecen a un espacio de trabajo. Si eres miembro de varios, cambia en tu cuenta con **Cambiar de espacio de trabajo**; Nodestro carga entonces la página de inicio del otro espacio. Los ajustes se aplican a tu espacio de trabajo actual en este servidor.

**Roles y permisos.** Cada rol trae permisos fijos:

| Rol | Permisos |
|---|---|
| **Propietario** | Leer, Editar, Ejecutar, Administrar |
| **Administrador** | Leer, Editar, Ejecutar, Administrar |
| **Editor** | Leer, Editar, Ejecutar |
| **Operador** | Leer, Ejecutar |
| **Observador** | Leer |

- **Leer:** verlo todo, también las ejecuciones y la documentación.
- **Editar:** crear y cambiar flujos de trabajo, plantillas de agentes, conocimiento y memoria.
- **Ejecutar:** iniciar flujos, cancelar y continuar ejecuciones, decidir aprobaciones.
- **Administrar:** ajustes, proveedores de IA, servicios conectados, reglas para llamadas a herramientas, publicar API y claves de API.
- **Gestionar la instalación** no corresponde a ningún rol: la copia de seguridad, el diagnóstico del sistema y el acceso de red de las API publicadas no aparecen en un servidor; de eso se ocupa el operador.

**Nodestro muestra de antemano lo que tu rol no puede hacer.** Esos controles están ocultos o bloqueados, con el motivo al lado, por ejemplo *Tu rol (Observador) no puede hacer esto: necesita el permiso «Editar». Pide ayuda a un administrador de tu servidor Nodestro.* Como **Observador** u **Operador** ves arriba de cada página un aviso de que puedes verlo todo, pero no cambiar nada (y, como observador, tampoco ejecutar nada). Aun así, el servidor comprueba cada solicitud por su cuenta.

**Los miembros y los roles** los gestiona el operador del servidor con comandos de la línea de comandos `nodestro-server`; Nodestro Studio no tiene ninguna página para ello:

- `nodestro-server members TENANT` lista los miembros de un espacio de trabajo con sus roles.
- `nodestro-server set-role TENANT USER ROLE` añade a una persona o cambia su rol (`owner`, `admin`, `editor`, `operator`, `viewer`).
- `nodestro-server remove-member TENANT USER` quita a una persona del espacio de trabajo y cierra sus sesiones allí.
- `nodestro-server revoke-sessions USER` cierra todas las sesiones de una persona (las membresías se mantienen).

`USER` es un id de usuario (`u_…`), una dirección de correo verificada o el identificador en el servicio de inicio de sesión. El servidor solo conoce a una persona cuando ha iniciado sesión una vez; un espacio de trabajo siempre conserva al menos un propietario. Los detalles están en el runbook del repositorio nodestro-server (`docs/RUNBOOK.md`, sección *Members*). Si el inicio de sesión indica que tu cuenta aún no tiene acceso, pide a un administrador que te añada.

**Datos.** Abajo en la barra lateral aparece **El servidor de tu organización** en lugar de *Local y privado*: tus datos se quedan en ese servidor y solo van a los proveedores de IA que permite tu operador. De las copias de seguridad y la instalación se ocupa el operador. Frases como «solo se ejecuta en tu ordenador» valen solo para la aplicación de escritorio y el comando `nodestro`.

## Atajos de teclado {#tastenkuerzel}
<!-- keywords: atajos de teclado, shortcuts, teclado, keyboard, accesibilidad -->

<!-- widget: shortcuts -->

Además, en todas partes: **Tab** pasa al siguiente control y muestra su explicación, **Esc** cierra diálogos y explicaciones, **Intro** o la **barra espaciadora** activan los botones.
