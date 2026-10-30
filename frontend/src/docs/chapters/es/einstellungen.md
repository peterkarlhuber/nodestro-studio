# Ajustes y funcionamiento

Este capítulo describe todos los ajustes, la instalación y el inicio de Nodestro y los atajos de teclado.

## Proveedores de IA {#anbieter}
<!-- keywords: clave de api, proveedor, anthropic, openai, gemini, ollama, vllm, compatible con openai, url base, variable de entorno, .env, capacidades -->

Nodestro ejecuta los agentes con la biblioteca Orkexa y trabaja con varios **proveedores de IA** a la vez: **Anthropic**, **OpenAI**, **Google Gemini** y tus propios servidores mediante un **endpoint compatible con OpenAI**, **Ollama** o **vLLM**. Cada agente usa el proveedor de su modelo. Si ese proveedor no está configurado, la ejecución no empieza; Nodestro nunca cambia en silencio a otro proveedor. Si falta el proveedor del modelo predeterminado, arriba a la derecha aparece «Configurar proveedor de IA».

En *Ajustes → Proveedores de IA* cada proveedor tiene su propia sección:

- **Anthropic, OpenAI, Google Gemini:** introduce la clave de API y pulsa **Guardar**. La clave se guarda en la base de datos local, no se vuelve a mostrar y solo se envía a este proveedor. **Quitar** la elimina.
- **Endpoint compatible con OpenAI, Ollama, vLLM:** introduce la **URL base** del servidor (por ejemplo `http://localhost:11434/v1` para Ollama) y pulsa **Guardar endpoint**; la clave de API es opcional. El proveedor solo cuenta como configurado cuando hay una URL base guardada.
- **Lo que pueden hacer los modelos:** para tus propios servidores indicas si sus modelos admiten herramientas, salida estructurada, imágenes, documentos PDF, esfuerzo de razonamiento y otras capacidades. Nodestro no supone nada: una opción que un modelo no puede hacer, o cuyo soporte se desconoce, la comprobación la notifica como error en lugar de omitirla.
- **Probar conexión** solo pide al proveedor su lista de modelos; no cuesta nada.

También puedes definir las claves como **variables de entorno**, antes de arrancar o en un archivo **`.env`** en la carpeta donde inicias `nodestro`. Las variables de entorno tienen **prioridad** sobre las claves guardadas:

| Proveedor | Variable de entorno |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` o `GOOGLE_API_KEY` |
| Compatible con OpenAI, Ollama, vLLM | `COMPATIBLE_API_KEY`, `OLLAMA_API_KEY`, `VLLM_API_KEY` (opcional) |

Una clave de versiones anteriores (entonces solo para Anthropic) pasa automáticamente a ser la clave de Anthropic en estos ajustes en el primer arranque.

## Modelo de los asistentes y modelo predeterminado {#modelle}
<!-- keywords: modelo predeterminado, modelo de asistentes, default model, agentes nuevos -->

- **Modelo predeterminado para agentes nuevos:** los agentes nuevos y vacíos empiezan con este proveedor y modelo (desde la paleta, con *Añadir agente*, en flujos nuevos y como plantilla vacía). En los borradores con IA sirve de sustituto si el arquitecto propone un modelo no permitido. Los agentes existentes no cambian.
- **Modelo de los asistentes:** este modelo diseña agentes a partir de tu descripción, escribe herramientas como agente de código, propone estructuras de memoria y responde tus preguntas como [Nodestro Assistant](/docs/assistent). Un modelo potente (predeterminado: Claude Opus 5.5 de Anthropic) da mejores propuestas. Los borradores con IA solo proponen modelos de proveedores configurados.

Ambos campos constan de **proveedor** y **modelo**. Elige el modelo de la lista o escribe cualquier id de modelo del proveedor, por ejemplo `gpt-5.5` en OpenAI o `llama3.1:8b` en Ollama. Se guarda como `proveedor:modelo` (por ejemplo `openai:gpt-5.5`); los valores antiguos sin proveedor, como `claude-sonnet-5-5`, cuentan como modelos de Anthropic.

Guarda los cambios con **Guardar** en la sección *Modelos y presupuesto*.

## Presupuesto predeterminado {#budget}
<!-- keywords: presupuesto predeterminado, presupuesto, budget, límite -->

El **presupuesto predeterminado por ejecución** (al principio 2 USD) se aplica a todos los flujos sin presupuesto propio. Vacío significa sin límite. Cómo funciona el presupuesto se explica en [Presupuesto por ejecución](/docs/workflows#budget).

## Sandbox {#sandbox}
<!-- keywords: elegir sandbox, docker, proceso de python, docker disponible -->

Aquí eliges dónde se ejecutan las herramientas propias y las creadas por IA: **Proceso de Python** o **Docker**. El cambio se aplica de inmediato. Un aviso indica si se ha encontrado Docker; si eliges Docker y no está accesible, las pruebas y las llamadas a herramientas fallan. Los detalles están en [El sandbox](/docs/tools#sandbox).

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

Arriba a la derecha cambias entre **Oscuro** y **Claro**. La elección se guarda en el navegador. Ambas variantes siguen el sistema de diseño *Midnight Citron*. En pantallas estrechas, la barra lateral se convierte en una barra de iconos.

## Copia de seguridad y restauración {#backup}
<!-- keywords: copia de seguridad, backup, restaurar, exportar, zip, mudanza, respaldo -->

**Descargar copia de seguridad** guarda todos los datos en un archivo ZIP: flujos de trabajo con versiones, plantillas de agentes, herramientas propias, archivos de conocimiento, memoria, ejecuciones, datos de uso, favoritos, etiquetas y ajustes. La base de datos se guarda como una instantánea coherente, incluso mientras una ejecución está trabajando.

Las **claves de API** de los proveedores de IA nunca se escriben en la copia, ni tampoco las URL base que contienen credenciales. Al restaurar se conservan las claves de este equipo.

**Restaurar desde archivo** primero comprueba el archivo por completo: formato, la suma de comprobación de cada archivo, la base de datos y cada flujo de trabajo y ejecución guardados. Solo entonces Nodestro muestra qué contiene la copia, comparado con el estado actual. Los datos solo se sustituyen tras una confirmación expresa y solo si no hay ninguna ejecución activa. Antes, Nodestro guarda automáticamente una copia del estado actual (`before-restore-….zip` en la carpeta `backups` del directorio de datos); aparece entre las copias de este equipo y se puede restaurar igual. Si algo falla, los datos anteriores no cambian.

## Diagnóstico del sistema {#diagnose}
<!-- keywords: diagnóstico, comprobar, buscar errores, conexión, docker, sandbox, versión, problema -->

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

Requisitos: Python 3.10 o posterior y Node.js 20 o posterior (solo para compilar la interfaz); Docker es opcional.

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -e .
nodestro
```

Nodestro se inicia en `http://localhost:8000` y abre el navegador. Opciones del comando `nodestro`:

| Opción | Variable de entorno | Significado |
|---|---|---|
| `--host` | `NODESTRO_HOST` | Dirección (por defecto `127.0.0.1`, solo este ordenador) |
| `--port` | `NODESTRO_PORT` | Puerto (por defecto `8000`) |
| `--data-dir` | `NODESTRO_DATA_DIR` | Directorio de datos (por defecto `~/.nodestro`) |
| – | `NODESTRO_ALLOWED_HOSTS` | Otros nombres de host a los que responde Nodestro, p. ej. detrás de un proxy inverso (separados por comas). Se rechazan otros nombres de host y los cambios desde páginas web ajenas, para que ninguna página del navegador pueda manejar Nodestro. Con `--host 0.0.0.0` Nodestro responde además en cualquier dirección IP y con el nombre de este equipo |
| `--no-browser` | – | No abrir el navegador automáticamente |
| `--reload` | – | Reiniciar al cambiar el código (desarrollo) |

Se detiene con **Ctrl+C**. Las ejecuciones en curso se cancelan.

> **Seguridad:** Nodestro no tiene gestión de usuarios. No lo hagas accesible con `--host 0.0.0.0` en redes ajenas, porque quien llegue a la interfaz puede iniciar ejecuciones con tus claves de API.

## Atajos de teclado {#tastenkuerzel}
<!-- keywords: atajos de teclado, shortcuts, teclado, keyboard, accesibilidad -->

<!-- widget: shortcuts -->

Además, en todas partes: **Tab** pasa al siguiente control y muestra su explicación, **Esc** cierra diálogos y explicaciones, **Intro** o la **barra espaciadora** activan los botones.
