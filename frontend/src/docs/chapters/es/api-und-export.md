# API y exportación

Un flujo de trabajo terminado puede usarse como API web: directamente desde Nodestro en este ordenador, o como proyecto FastAPI independiente que puedes ejecutar en cualquier sitio. Ambos usan la misma lógica de flujo que Nodestro. No se regenera nada y ninguna IA reescribe el flujo.

## Resumen {#ueberblick}
<!-- keywords: api, rest, http, endpoint, publicar, desplegar, despliegue, fastapi, exportar, interfaz, integración -->

Abre un flujo de trabajo en el editor y haz clic en **API & Export**. El diálogo tiene seis áreas:

| Área | Para qué |
|---|---|
| **Resumen** | Estado, direcciones, publicación, versiones y las últimas ejecuciones de la API |
| **Claves y acceso** | Claves de API y el acceso opcional desde la red |
| **Probar** | Comprobar una solicitud o iniciar una ejecución de prueba real |
| **Documentación** | Endpoints, ejemplos de curl y Python, descripción OpenAPI |
| **Límites** | Nombre en la URL, descripción y límites |
| **Exportación** | El proyecto FastAPI independiente como ZIP |

Hay dos caminos:

1. **Servir directamente:** Nodestro responde solicitudes en `/api/published/<nombre>/…`. Por defecto, solo desde este ordenador.
2. **Exportar:** Nodestro genera un proyecto con runtime, versión del flujo, pruebas, ejemplos y README. Lo ejecutas sin Nodestro, por ejemplo en un servidor o en Docker.

Ambos se ejecutan paso a paso como en Nodestro: los mismos agentes, herramientas, ramas, aprobaciones y formularios.

## Publicar {#veroeffentlichen}
<!-- keywords: publicar, publicación, versión, congelar, comprobación, guardar, nota -->

**Publicar** congela la última versión guardada del flujo de trabajo, junto con:

- los agentes con modelo, instrucciones y ajustes,
- el código de las herramientas en su versión aprobada (consulta [Aprobación de herramientas](/docs/tools#freigabe)),
- los subflujos en su versión actual (consulta [Subflujos](/docs/verzweigungen#unterworkflow)),
- el formulario de entrada, a partir del cual Nodestro genera el esquema de la solicitud.

Antes, Nodestro comprueba el flujo. Los errores impiden publicar; el diálogo muestra las advertencias (por ejemplo, un límite de coste ausente o pasos de aprobación). Los cambios sin guardar no se publican: guarda primero. Debajo aparece el **resultado de pruebas** de la versión en cada [serie de pruebas](/docs/automatisierung#testreihen) del flujo: *sin probar*, *n de m superados* o *desactualizado* si la última prueba fue de otra versión o la serie cambió desde entonces. El resultado es solo informativo; no impide publicar.

Cada publicación recibe un número consecutivo y una nota opcional. Los cambios posteriores en el editor nunca modifican una versión publicada. Llegan a la API solo cuando vuelves a publicar.

## Versiones y reversión {#versionen}
<!-- keywords: versión, versiones, rollback, revertir, volver atrás, activa, versión activa, inmutable, release -->

La lista de **versiones** muestra cada versión publicada con fecha, nota y resultado de la comprobación. Una de ellas está **activa**: las solicitudes a `/runs` la usan.

- **Activar** cambia la versión activa al instante, sin volver a publicar. Así vuelves a una versión anterior.
- Las ejecuciones conservan su versión hasta el final, también al reanudarse tras un error.
- Los clientes pueden llamar a una versión concreta: `POST /api/published/<nombre>/versions/<número>/runs`.

Las versiones publicadas no se pueden editar. Así los resultados son trazables: cada ejecución de la API indica con qué versión se ejecutó.

## Desactivar y eliminar {#abschalten}
<!-- keywords: desactivar, apagar, pausar, 503, eliminar, borrar, quitar -->

**Desactivar** rechaza nuevas ejecuciones con el estado `503` y el código `publication.disabled`. Las ejecuciones en curso continúan; al desactivar puedes cancelarlas también. El estado y los resultados de las ejecuciones existentes siguen disponibles. **Activar** vuelve a poner la API a disposición.

**Eliminar API** quita todas las versiones, y las claves pierden el acceso a ellas. Solo es posible cuando no queda ninguna ejecución de esta API en curso. Las ejecuciones en sí siguen en Ejecuciones. Si se elimina el flujo de trabajo, su API desaparece también.

## Endpoints {#endpunkte}
<!-- keywords: endpoints, url, dirección, runs, estado, resultado, eventos, cancelar, approve, resume, versiones, openapi -->

El nombre en la URL (p. ej. `revisar-facturas`) lo defines al publicar y lo cambias en **Límites**. Todas las rutas empiezan por `/api/published/<nombre>`:

| Método y ruta | Efecto | Permiso |
|---|---|---|
| `GET /` | Qué espera y devuelve la API, y qué versiones hay | `read` |
| `POST /runs` | Inicia una ejecución con la versión activa | `run` |
| `POST /versions/<número>/runs` | Inicia una ejecución con una versión concreta | `run` |
| `GET /runs` | Las últimas ejecuciones de esta API | `read` |
| `GET /runs/<id>` | Estado, pasos, coste y aprobaciones de una ejecución | `read` |
| `GET /runs/<id>/result` | El resultado de una ejecución terminada | `read` |
| `GET /runs/<id>/events` | El progreso como Server-Sent Events | `read` |
| `POST /runs/<id>/cancel` | Cancela una ejecución | `run` |
| `GET /runs/<id>/approvals` | Aprobaciones pendientes con lo que hay que revisar | `read` |
| `POST /runs/<id>/approve` | Decide una aprobación | `approve` |
| `POST /runs/<id>/resume` | Reanuda una ejecución fallida | `run` |
| `GET /runs/<id>/files` | Archivos de resultado de una ejecución | `read` |
| `GET /usage` | Ejecuciones, tokens y coste de esta API | `read` |
| `GET /openapi.json` | Descripción OpenAPI solo de esta API | – |

Los esquemas completos están en **Documentación**, donde **Descargar la descripción OpenAPI** te da también el archivo OpenAPI.

## Solicitudes y respuestas {#aufrufen}
<!-- keywords: solicitud, request, cuerpo, body, json, input, values, formulario, esquema, archivos, base64, respuesta, 202, run_id, idempotency -->

El cuerpo de la solicitud es JSON. Si el flujo tiene un formulario de entrada, los campos van en `values`, con tipos, campos obligatorios y opciones como en el formulario. Si no, hay un campo de texto `input`. Los archivos llegan como lista `files` con `name`, `media_type` y `content_base64`. También acepta archivos como `multipart/form-data`, ver [Archivos a través de la API](/docs/datei-eingaben#api-uploads).

```bash
curl -X POST http://127.0.0.1:8000/api/published/revisar-facturas/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"values": {"importe": 120, "proveedor": "ACME"}}'
```

Nodestro responde de inmediato con `202` y un `run_id` junto con enlaces al estado, al resultado y a los eventos. La ejecución trabaja en segundo plano. Consulta el estado hasta que sea `succeeded`, `failed` o `cancelled` y luego obtén el resultado. Otros estados: `queued`, `running` y `awaiting_approval`.

Si una solicitud no encaja con el esquema, la API responde `422` y nombra cada campo incorrecto. Con la cabecera `Idempotency-Key`, una solicitud repetida (por ejemplo tras un error de red) no inicia una segunda ejecución, sino que devuelve la primera.

## Espera síncrona y eventos {#synchron}
<!-- keywords: síncrono, sync, esperar, wait, bloqueante, sse, server-sent events, stream, en vivo, reconexión, last-event-id -->

Por defecto, toda API es asíncrona. En **Límites** puedes activar **Permitir esperar el resultado**. Entonces `POST /runs?wait=30` espera el resultado hasta el tiempo configurado. Si la ejecución no ha terminado para entonces, llega el `202` habitual. No es posible en flujos con pasos de aprobación, porque una persona tiene que decidir.

`GET /runs/<id>/events` entrega el progreso como Server-Sent Events: los pasos empiezan y terminan, se genera texto, las aprobaciones esperan, la ejecución termina. Los prompts y los datos de las herramientas se quedan en Nodestro. Si se corta la conexión, el cliente se reconecta con la cabecera `Last-Event-ID` y recibe solo los eventos que se perdió.

## Aprobaciones a través de la API {#freigaben}
<!-- keywords: aprobación, aprobar, rechazar, approve, reject, espera, awaiting_approval, humano, human in the loop -->

Cuando una ejecución llega a un paso de aprobación, pasa a `awaiting_approval`. Puedes decidir en dos lugares, y cuenta la primera decisión:

- en Nodestro, en la página Aprobaciones (consulta [La página Aprobaciones](/docs/verzweigungen#freigaben-seite)), con la indicación «desde la API publicada»,
- mediante `POST /runs/<id>/approve` con `{"decision": "approved"}` o `"rejected"` y un comentario opcional. Hace falta una clave con el permiso `approve`.

Las aprobaciones pendientes sobreviven a un reinicio de Nodestro. Una ejecución fallida puede reanudarse con `POST /runs/<id>/resume`. Los pasos correctos se reutilizan. Los pasos que llamaron a herramientas solo se repiten con `confirm_side_effects: true`.

## Claves de API {#schluessel}
<!-- keywords: clave, clave de api, api key, token, bearer, authorization, x-api-key, permisos, scopes, run, read, approve, revocar, rotar, hash -->

Cada solicitud necesita una clave, ya sea como `Authorization: Bearer <clave>` o en la cabecera `X-API-Key`. Las claves se crean en **Claves y acceso**:

- **Nombre:** quién usa la clave, p. ej. el nombre de la aplicación.
- **Permisos:** `run` inicia, cancela y reanuda, `read` lee estado, resultados y eventos, `approve` decide aprobaciones.
- **Válida para:** las API que la clave puede llamar. Nunca llega a otros flujos ni a la interfaz de Nodestro.

La clave se muestra **una sola vez**. Nodestro guarda solo un hash y después reconoce la clave por su inicio (`ndk_…`). **Revocar ahora** bloquea una clave. **Sustituir por una clave nueva** crea una clave nueva con los mismos ajustes y revoca la anterior. Las claves nunca aparecen en registros, trazas, copias de seguridad ni exportaciones. Tras muchas claves erróneas en poco tiempo, la API responde `429` durante un rato.

## Acceso desde la red {#netzwerk}
<!-- keywords: red, lan, puerto, 8100, 0.0.0.0, otros dispositivos, tls, https, certificado, cortafuegos, compartir -->

Por defecto, las API publicadas solo responden a este ordenador. Los demás dispositivos reciben `403` con el código `lan.not_enabled`. Para permitir dispositivos de tu red:

1. Abre **Claves y acceso → Ajustes de red** y activa el acceso de red. Nodestro abre un **puerto propio** (por defecto `8100`).
2. Activa **Accesible en la red** en cada API. Solo esas API son accesibles por el puerto.

Este puerto solo sirve las API publicadas, nunca la interfaz de Nodestro, sus ajustes ni otros flujos. Si el puerto está ocupado, el diálogo lo indica y Nodestro sigue funcionando con normalidad. Tras restaurar una copia de seguridad, el acceso de red vuelve a estar desactivado.

## Seguridad {#sicherheit}
<!-- keywords: seguridad, tls, https, cifrado, internet, proxy inverso, reverse proxy, certificado, copia de seguridad, secretos -->

- Sin TLS, las solicitudes, las claves y los resultados viajan por la red **sin cifrar**. Usa el acceso de red solo en redes de confianza, o indica un certificado y su clave (rutas de archivo en este ordenador).
- No pongas Nodestro directamente en Internet. Para eso está la exportación, detrás de un proxy inverso con TLS.
- Cada ejecución cuesta dinero en el proveedor del modelo. Entrega claves con el permiso `run` solo si confías en los límites de la API.
- Las copias de seguridad no contienen claves de API (consulta [Copia de seguridad y restauración](/docs/einstellungen#backup)). Al restaurar, se conservan las claves de este ordenador.

## Límites {#grenzen}
<!-- keywords: límites, limits, rate limit, 429, simultáneas, presupuesto, presupuesto diario, coste, subida, tamaño de archivo -->

En **Límites** decides cuánto puede usarse una API:

| Límite | Valor por defecto |
|---|---|
| Ejecuciones simultáneas | 2 |
| Ejecuciones esperando aprobación | 20 |
| Nuevas ejecuciones por minuto y clave | 10 |
| Solicitudes por minuto y clave | 120 |
| Presupuesto diario (coste de las últimas 24 horas) | 5 USD |
| Límite de coste por ejecución | El presupuesto del flujo |
| Tamaño de un archivo subido | 10 MB |

Si se supera un límite, la API responde `429` con un código como `limit.concurrent` o `limit.daily_budget`, y en los límites de frecuencia con la cabecera `Retry-After`. El límite de coste por ejecución complementa el [presupuesto del flujo](/docs/workflows#budget).

## Mensajes de error {#fehler}
<!-- keywords: error, errores, código, estado, 401, 403, 404, 409, 422, 429, 503, legible por máquina -->

Cada error tiene la misma forma para que los programas puedan evaluarlo:

```json
{"error": {"status": 422, "code": "request.invalid", "message": "…", "params": {"errors": […]}}}
```

| Estado | Significado |
|---|---|
| `401` | Falta la clave o no es válida (`auth.missing`, `auth.invalid`) |
| `403` | Falta el permiso (`auth.scope`) o el acceso de red está desactivado |
| `404` | La API, la versión, la ejecución o el archivo no existe |
| `409` | No encaja con el estado, p. ej. resultado de una ejecución en curso (`run.not_finished`) |
| `422` | La solicitud no encaja con el esquema (`request.invalid`) |
| `429` | Se alcanzó un límite (`limit.*`) |
| `503` | API desactivada (`publication.disabled`) o el proveedor de un modelo no está configurado (`model.unavailable`) |

## Probar en Nodestro {#testen}
<!-- keywords: probar, prueba, comprobar, validar, dry run, ejecución de prueba, ejemplo -->

En **Probar** hay una solicitud de ejemplo que puedes adaptar:

- **Comprobar solicitud** valida el cuerpo exactamente como la API, muestra la entrada que recibiría el flujo y no inicia nada. No cuesta nada.
- **Iniciar ejecución de prueba** inicia una ejecución real de la versión publicada por el mismo camino que la API. Se factura como cualquier ejecución y aparece en Ejecuciones como ejecución de prueba desde Nodestro.

Para pruebas de regresión de una versión nueva, usa las [series de pruebas](/docs/automatisierung#testreihen): se ejecutan con la versión guardada antes de publicar.

## Supervisión {#ueberwachung}
<!-- keywords: supervisión, monitorización, monitoring, ejecuciones, origen, uso, coste, estadísticas, ejecuciones de api -->

Las ejecuciones de la API aparecen en Ejecuciones con el desencadenante **API**. La vista de detalle indica la versión y la clave que inició la ejecución. En la página Uso, las ejecuciones de API publicadas tienen su propia línea (consulta [La página Uso](/docs/nutzung#statistik)). El resumen del diálogo muestra las últimas ejecuciones de esta API, y `GET /usage` ofrece las mismas cifras a los programas.

## Exportación como proyecto FastAPI {#export}
<!-- keywords: exportación, exportar, zip, fastapi, proyecto, independiente, docker, uvicorn, readme, pruebas, pyproject, lock, despliegue, servidor -->

En **Exportación**, **Generar ZIP** crea un proyecto independiente a partir de una versión publicada. Contiene:

| Parte | Contenido |
|---|---|
| `app/` | Aplicación FastAPI con los mismos endpoints, configuración y gestión de claves |
| `nodestro_runtime/`, `nodestro_api/` | El runtime de Nodestro (nodestro-runtime y la capa HTTP de nodestro-api), copiado sin cambios; versiones y sumas de verificación en `RUNTIME.json` |
| `workflow/` | La versión congelada con agentes, herramientas y subflujos |
| `pyproject.toml`, `requirements.lock` | Dependencias con versiones exactas |
| `tests/`, `examples/` | Pruebas sin llamadas al modelo, una solicitud de ejemplo y un cliente Python |
| `README.md`, `Dockerfile`, `.env.example` | Instalación, configuración y operación |

Si las herramientas necesitan bibliotecas de Python, la exportación toma exactamente las versiones aprobadas (consulta [Aprobación de bibliotecas](/docs/python-bibliotheken#freigabe)). Antes de generar, el diálogo muestra cada archivo y cada aviso. La exportación nunca contiene claves de API, ajustes ni otros flujos. La misma versión con las mismas opciones da el mismo archivo ZIP, byte a byte.

En el proyecto exportado, `python -m app.keys new` crea claves para tus clientes. El acceso a los proveedores de IA se define con variables de entorno, como `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` o `GEMINI_API_KEY`; el README y `.env.example` nombran exactamente las variables que necesita la versión del flujo. Las URL base de servidores propios también se exportan, salvo que contengan credenciales; entonces las defines tú (por ejemplo `OLLAMA_BASE_URL`).

## La biblioteca Orkexa {#orkexa}
<!-- keywords: orkexa, biblioteca, repositorio, licencia, mit, vendor, incluir, git, acceso -->

Nodestro ejecuta los agentes con la biblioteca **Orkexa**, que habla con todos los proveedores admitidos. No está en PyPI y se encuentra en un repositorio que por ahora es privado. Por eso la exportación ofrece dos caminos:

- **Referencia Git** (predeterminada): `pyproject.toml` apunta al commit exacto. Quien instale el proyecto necesita acceso de lectura al repositorio.
- **Incluir el código fuente:** el código va a `vendor/orkexa/` y el proyecto se instala sin acceso al repositorio. La biblioteca tiene licencia MIT. Confirma que puedes cederla antes de dar este proyecto a otras personas.

Sin uno de los dos el proyecto no se puede instalar. El README indica el camino elegido.

## Conocimiento y memoria en la exportación {#daten}
<!-- keywords: conocimiento, knowledge, memoria, memory, datos, privacidad, confidencial, incluir, excluir -->

Los archivos de conocimiento y la memoria persistente pueden contener información confidencial. Por eso entran **en el proyecto solo si los seleccionas uno a uno**:

- **Conocimiento** (consulta [Conocimiento](/docs/wissen#ueberblick)): los archivos seleccionados se copian con su contenido. Los no seleccionados faltan, y los agentes no encuentran nada allí.
- **Memoria** (consulta [Memoria persistente](/docs/memory#dauerhaft)): el contenido actual de un espacio de memoria seleccionado se convierte en el contenido inicial del proyecto. Después, ambos evolucionan por separado.

La comprobación antes de exportar indica qué agentes usan datos que se dejaron fuera. Al servir directamente, las ejecuciones de la API usan el conocimiento y la memoria de Nodestro como cualquier otra ejecución.

## Guía de integración con IA {#ki-anleitung}
<!-- keywords: ia, guía, documentación, descripción, coste, opcional, revisar, aceptar, descartar -->

Por defecto, la exportación se crea sin IA y sin coste: el README y los ejemplos salen de plantillas. Opcionalmente, el modelo asistente redacta a partir de la documentación generada una guía en prosa para los usuarios de tu API (`docs/AI_GUIDE.md`). Al modelo solo le llega la documentación de la API, sin claves ni datos. Es una llamada de pago al modelo y aparece en la página Uso como «Guía con IA para una API».

La guía entra en la exportación solo después de tu revisión: léela y haz clic en **Aceptar** o **Descartar**. No cambia nada en el código ni en los endpoints.
