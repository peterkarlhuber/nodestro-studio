# Bibliotecas de Python

Las herramientas propias y las creadas con IA pueden usar bibliotecas de terceros como `numpy`, `pandas`, `scipy` o `requests`. Este capítulo explica cómo las detecta Nodestro, por qué apruebas cada biblioteca de forma explícita y cómo funcionan los entornos de Python separados.

## Visión general {#ueberblick}
<!-- keywords: bibliotecas, paquetes, pypi, numpy, pandas, terceros, dependencias, uv -->

La biblioteca estándar de Python basta para muchas herramientas. Si necesitas más:

1. **Detectar:** Nodestro lee las importaciones del código de la herramienta y deduce los paquetes necesarios. No se descarga nada.
2. **Aprobar:** Antes de instalar nada ves cada paquete con su versión y lo apruebas. Sin aprobación no se instala nada.
3. **Instalar:** Nodestro instala exactamente las versiones aprobadas con la herramienta de paquetes **uv** en un entorno propio dentro de la carpeta de datos.
4. **Ejecutar:** La herramienta se ejecuta en el sandbox con el Python de ese entorno.

El Python con el que se ejecuta Nodestro no cambia nunca. Los flujos de trabajo cuyas herramientas solo usan la biblioteca estándar no necesitan nada de esto y funcionan como antes.

> **Importante:** Aprobar una biblioteca no aprueba el código de una herramienta. El código y las pruebas los revisas y apruebas como siempre (consulta [Aprobación](/docs/tools#freigabe)).

## Cómo se detectan las bibliotecas {#erkennung}
<!-- keywords: import, from import, detección, nombre de módulo, nombre de paquete, pil, pillow, script, pep 723, dependencies, ambiguo -->

Nodestro evalúa `import x` y `from x import y`:

- La **biblioteca estándar** (`math`, `json`, `datetime` …) y el módulo `tool` de las pruebas no necesitan nada.
- Los **módulos conocidos** se asignan al paquete correcto aunque los nombres difieran: `PIL` → `Pillow`, `sklearn` → `scikit-learn`, `yaml` → `PyYAML`, `bs4` → `beautifulsoup4`, `cv2` → `opencv-python-headless`.
- Los **módulos desconocidos** nunca se adivinan. Nodestro los indica y pide una declaración explícita.
- Las **importaciones dinámicas** como `importlib.import_module(name)` no se pueden resolver y se indican.
- Las importaciones dentro de `try: … except ImportError:` se consideran opcionales.

Los paquetes y rangos de versiones se declaran de forma explícita en una cabecera al principio del código (formato “inline script metadata”):

```python
# /// script
# dependencies = ["numpy>=1.26", "python-dateutil"]
# ///
import numpy as np
from dateutil import parser
```

Solo se permiten el nombre del paquete y la especificación de versión, sin enlaces ni rutas locales.

## Aprobación {#freigabe}
<!-- keywords: aprobación, aprobar, autorizar, versión, indirecto, transitivo, resumen, instalar -->

Con **Revisar y aprobar** Nodestro resuelve las versiones (solo descarga información de paquetes) y muestra un resumen:

| Columna | Significado |
|---|---|
| **Paquete** y **Versión** | La versión exacta que se instalaría |
| **Tipo** | *directo* (lo importa una herramienta), *indirecto* (lo necesita otro paquete) o *ejecución* (Nodestro siempre lo incluye) |
| **Requerido por** | Las herramientas o paquetes que lo necesitan |
| **Estado** | *Nuevo*, *Aprobado*, *Cambio antigua → nueva* o *Se elimina* |

Revisa la lista y haz clic en **Aprobar e instalar**. Las bibliotecas de terceros pueden acceder a archivos y a la red: aprueba solo paquetes que conozcas.

Nodestro guarda cada aprobación con paquete, versión y fecha. Mientras nada cambie, Nodestro no vuelve a preguntar. Se necesita una nueva aprobación cuando:

- una herramienta necesita un **paquete nuevo**,
- cambia un **requisito** (p. ej. un nuevo rango de versiones) y por ello se necesita otra versión,
- ha cambiado la **versión de Python**,
- las aprobaciones provienen de **otro ordenador** o de una **importación**.

Nodestro nunca actualiza en silencio: al resolver de nuevo se prefieren las versiones ya aprobadas, y cualquier otra versión aparece como *Cambio*.

## Bibliotecas en el flujo de trabajo {#workflow}
<!-- keywords: flujo de trabajo, entorno, inspector, estado, iniciar, ejecución, entorno propio, instalar -->

Cada flujo de trabajo con bibliotecas recibe un **entorno propio** con sus propias aprobaciones. En el inspector del flujo de trabajo (sin nodo seleccionado), la sección **Bibliotecas de Python** muestra:

- el **estado**: *Requiere aprobación*, *Instalación pendiente*, *Instalando*, *Aprobadas e instaladas* o *La instalación falló*,
- cada paquete necesario con la versión instalada y las herramientas que lo usan,
- las acciones **Revisar y aprobar**, **Instalar** y **Ver versiones**,
- el **historial de cambios** con aprobaciones, instalaciones e importaciones.

La [comprobación](/docs/workflows#pruefung) indica las aprobaciones que faltan como errores. Un flujo de trabajo solo se inicia cuando todas las bibliotecas están aprobadas. Si un entorno aprobado aún no está instalado (p. ej. tras eliminarlo), Nodestro lo instala al iniciar a partir de las versiones aprobadas.

El entorno solo se crea cuando se necesita. Los paquetes descargados están en una caché compartida y todos los entornos los reutilizan, de modo que un segundo entorno con los mismos paquetes se instala rápido.

## Bibliotecas en herramientas {#tools}
<!-- keywords: herramienta, herramienta propia, herramienta ia, coding agent, entorno de prueba, pruebas, probar, sin bibliotecas -->

Para las **pruebas** de una herramienta con bibliotecas, Nodestro crea un **entorno de prueba** propio:

- **Escribir tú mismo:** *Comprobar y probar* indica qué bibliotecas necesita la herramienta. Las pruebas solo se ejecutan cuando las has aprobado en la sección **Bibliotecas de Python de la herramienta**. Después compruebas de nuevo y guardas.
- **Crear con IA:** Si el Coding Agent propone bibliotecas, el encargo espera con el estado *Esperando bibliotecas*. Ves el resumen y eliges **Aprobar bibliotecas** (instalar y luego probar) o **Reescribir sin bibliotecas**. El código lo apruebas después por separado, como siempre.
- **Probar** en la biblioteca también usa el entorno de prueba de la herramienta.

La aprobación para las pruebas no se aplica automáticamente a los flujos de trabajo. Si un flujo de trabajo usa la herramienta, apruebas allí las bibliotecas; el resumen muestra dónde ya están aprobadas.

Las herramientas con bibliotecas se ejecutan con límites más amplios (60 segundos, 2 GB de memoria), porque cargar paquetes como `pandas` lleva tiempo.

## Arquitecto de flujos con IA {#architekt}
<!-- keywords: arquitecto, borrador, borrador de herramienta, bibliotecas, no instalado -->

El [Arquitecto de flujos con IA](/docs/ki-architekt#tools-freigeben) puede proponer borradores de herramientas con bibliotecas. Reúne los paquetes necesarios y los muestra en la revisión del borrador, **pero no instala nada**. Al probar un borrador de herramienta apruebas las bibliotecas para el entorno de prueba; tras aplicar el borrador las apruebas en el flujo de trabajo.

## Versiones y reproducibilidad {#versionen}
<!-- keywords: versión, lock, reproducible, fijada, actualizar, upgrade, conflicto -->

Tras la aprobación, Nodestro guarda una **definición completa** de todos los paquetes con su versión exacta, incluidos los indirectos. A partir de ella, un entorno se puede restaurar siempre de forma idéntica. La instalación se realiza en una carpeta aparte y solo sustituye al entorno anterior cuando todo está instalado y todas las importaciones funcionan. Si falla, el entorno anterior no cambia.

Si dos herramientas de un flujo de trabajo necesitan versiones incompatibles, Nodestro indica un **conflicto** y nombra los paquetes implicados en los detalles técnicos. Ajusta entonces las especificaciones de versión en la cabecera `# /// script`.

## Exportar, importar y copia de seguridad {#export}
<!-- keywords: exportar, importar, copia de seguridad, backup, otro ordenador, portable, definición -->

- **Exportar** un flujo de trabajo incluye la definición de las bibliotecas (paquetes y versiones), pero ningún archivo instalado.
- **Importar** adopta la definición. Los paquetes deben **aprobarse de nuevo** en este ordenador; el resumen muestra las versiones incluidas.
- **Duplicar** también adopta las versiones, pero requiere una aprobación propia.
- Una **copia de seguridad** contiene definiciones y aprobaciones. En el mismo ordenador las aprobaciones siguen siendo válidas tras restaurar; en otro hay que concederlas de nuevo. Los entornos se reinstalan cuando hace falta.

## Mantenimiento y limpieza {#wartung}
<!-- keywords: mantenimiento, limpiar, ordenar, almacenamiento, caché, huérfano, eliminar, ajustes -->

En los [ajustes](/docs/einstellungen), la sección **Entornos de Python** muestra las versiones de uv y Python, el tamaño de la caché y cada entorno con propietario, número de paquetes, tamaño y fecha de instalación.

- **Eliminar entorno** borra los archivos instalados. Las aprobaciones se mantienen; el entorno se reinstala la próxima vez que se necesite.
- Los entornos **huérfanos** pertenecen a un flujo de trabajo o herramienta eliminados.
- **Limpiar huérfanos** elimina todos los entornos huérfanos junto con su definición y ordena la caché.

Nodestro nunca elimina un entorno sin una acción tuya.

## Resolver problemas {#probleme}
<!-- keywords: error, conflicto, no encontrado, red, falta uv, docker, instalación fallida, registro -->

| Mensaje | Solución |
|---|---|
| **No se conoce ningún paquete para el módulo** | Declara el paquete en la cabecera `# /// script`. |
| **Una importación por nombre no se puede resolver** | Importa el módulo directamente con `import`. |
| **El paquete no existe** | Revisa cómo se escribe el nombre del paquete. |
| **Ninguna versión compatible** / **Conflicto** | Amplía la especificación de versión o iguálala entre las herramientas. |
| **Índice de paquetes inaccesible** | Comprueba la conexión a internet; los entornos instalados también funcionan sin conexión. |
| **No se encontró uv** | Reinstala Nodestro; uv se instala con él. |
| **Solo en el sandbox de procesos** | Las herramientas con bibliotecas no se ejecutan en el sandbox Docker. Cambia el [sandbox](/docs/einstellungen#sandbox) a *Proceso de Python*. |

Si una instalación falla, el **registro de la instalación** muestra la salida de uv. Con **Instalar de nuevo** inicias otro intento.
