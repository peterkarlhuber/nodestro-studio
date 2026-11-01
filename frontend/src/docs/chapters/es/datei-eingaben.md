# Archivos como entrada

Los flujos de trabajo pueden recibir archivos directamente como entrada: contratos, facturas, hojas de cálculo, imágenes o archivos ZIP completos. Los subes al iniciar, sin incorporarlos antes al conocimiento. Nodestro los comprueba y lee localmente y da a los agentes justo lo que necesitan de ellos.

## Resumen {#ueberblick}
<!-- keywords: archivo, archivos, subir, entrada, documento, adjunto, inicio -->

- En el formulario de entrada del nodo **Inicio** añades campos de tipo **Archivo**. Al iniciar, arrastras archivos al campo o los eliges.
- También sin formulario puedes subir archivos o elegirlos del conocimiento en *Archivos* del diálogo de inicio.
- Los archivos subidos pertenecen a la **ejecución**, no al conocimiento. Aparecen en la vista de detalle de la ejecución en *Archivos recibidos*.
- Lo que deba estar disponible para todos los agentes de forma permanente lo incorporas [al conocimiento](/docs/wissen#sammlungen) de forma explícita.

## Campos de archivo {#datei-felder}
<!-- keywords: campo de archivo, formulario, arrastrar y soltar, carpeta, elegir -->

Un campo de archivo acepta archivos arrastrándolos o con **Elegir archivos**. Cada archivo se sube y se comprueba al momento. La lista muestra nombre, formato, tamaño, estado y, si se rechaza, el motivo. Antes de iniciar puedes quitar archivos y ver con el icono del ojo lo que leyó Nodestro.

La ejecución solo empieza cuando todos los archivos están subidos. Los archivos rechazados nunca forman parte de la ejecución.

En la tarea de un agente, `{{form.<nombre>}}` representa los nombres de los archivos del campo. El agente recibe además los contenidos, como se describe en [Entrega a los agentes](/docs/datei-eingaben#uebergabe). Más sobre formularios: [Formularios de entrada](/docs/verzweigungen#eingabeformular).

## Ajustes del campo {#feld-einstellungen}
<!-- keywords: ajustes, tipos permitidos, varios archivos, máximo, tamaño, mb, límite -->

En el inspector del nodo Inicio, cada campo de archivo tiene la sección *Opciones de archivo*. Cerrada, resume la elección actual en una línea, por ejemplo «todos los formatos · hasta 20 MB · varios archivos · Automática». Abierta, muestra estos ajustes:

| Ajuste | Significado |
|---|---|
| Tipos de archivo permitidos | grupos (texto, datos, documentos, imágenes, archivos ZIP) o formatos individuales; sin selección se aceptan todos |
| Varios archivos | desactivado: exactamente un archivo; activado: varios archivos |
| Número máximo de archivos | límite opcional con varios archivos |
| MB máximos por archivo | 20 MB por defecto, como máximo 50 MB |
| Entrega a los agentes | *Automática*, *Siempre el contenido* o *Resumen, contenido a petición* |

## Campos obligatorios y opcionales {#optionale-felder}
<!-- keywords: obligatorio, opcional, vacío, falta, no indicado, está vacío -->

Todo campo, no solo los de archivo, es **obligatorio** u **opcional**. Un campo obligatorio debe rellenarse antes de iniciar. Un campo opcional vacío queda vacío:

- En la tarea de un agente aparece como «(not provided)», para que el agente sepa que no se indicó nada.
- Los nodos de decisión ven un valor vacío y pueden comprobarlo con *está vacío*.
- Los campos de archivo vacíos no crean referencias a archivos. Esto vale también para subflujos, API publicadas y proyectos exportados.

## Formatos compatibles {#formate}
<!-- keywords: formatos, txt, markdown, csv, json, xlsx, excel, pdf, docx, word, png, jpg, webp, imagen, zip -->

| Grupo | Formatos | Qué lee Nodestro |
|---|---|---|
| Texto | TXT, Markdown, código fuente | el texto |
| Datos | CSV, JSON, Excel (XLSX) | tablas con columnas; Excel con todas las hojas |
| Documentos | PDF, Word (DOCX) | texto con títulos y tablas; páginas en los PDF |
| Imágenes | PNG, JPG, WebP | la imagen; texto reconocido si el OCR está activado |
| Archivos comprimidos | ZIP | la estructura de carpetas y cada archivo contenido por separado |

Nodestro comprueba el **contenido real**, no solo la extensión: un archivo renombrado, un archivo dañado o un JSON no válido se rechaza con un motivo comprensible. Los PDF escaneados sin capa de texto se leen con OCR si el reconocimiento de texto está activado. Las fórmulas de Excel nunca se calculan; se lee el valor guardado.

## Varios archivos y carpetas {#mehrere-dateien}
<!-- keywords: varios archivos, carpeta, directorio, colección, rutas relativas -->

Con **Elegir carpeta** o arrastrando una carpeta subes todos sus archivos. Las rutas relativas se conservan en el nombre del archivo (p. ej. `Recibos/2024/Factura.pdf`). Los archivos ocultos del sistema se omiten. Para muchísimos archivos es mejor un archivo ZIP.

## Archivos ZIP {#zip-archive}
<!-- keywords: zip, archivo comprimido, descomprimir, árbol, estructura, carpeta, archivos individuales -->

Un archivo ZIP es una colección estructurada. Nodestro muestra su contenido como un árbol con tamaños y marca lo que se puede leer. Haz clic en un archivo del árbol para ver lo que Nodestro lee de él.

Los agentes reciben primero un **resumen** del archivo y luego leen archivos concretos con la herramienta `input_files` (comandos `list`, `read` y `search`). Así un archivo grande cabe en el contexto. Los archivos comprimidos dentro del archivo se listan, pero no se abren.

## Entrega a los agentes {#uebergabe}
<!-- keywords: entrega, contexto, archivos grandes, tokens, límite de contexto, multimodal, imagen, ocr, resumen -->

Los agentes que reciben entradas del nodo Inicio obtienen los archivos de la ejecución. Nodestro elige la forma de modo que se conserve la estructura y el contexto no se desborde:

- **Texto y tablas** llegan al agente como texto mientras quepan (unos 60.000 caracteres por archivo, 150.000 para todos juntos).
- **PDF** con capa de texto llegan como documento (texto y maquetación), hasta 100 páginas.
- **Imágenes**: el agente las ve si el modelo entiende imágenes. Si no, se indica. Con OCR ves si el agente recibió el texto reconocido o la imagen.
- **Archivos grandes y comprimidos** llegan como resumen. El agente lee las partes necesarias con `input_files`, p. ej. ciertas páginas, una hoja o rangos de filas.

El ajuste *Entrega a los agentes* fuerza el contenido o el resumen. Para los agentes, el contenido subido es siempre **datos, no instrucciones**: Nodestro lo marca así.

## Trazabilidad {#nachvollziehen}
<!-- keywords: trazabilidad, traza, contexto, qué archivos, vista previa, enviado al modelo, transparencia -->

- La **vista previa de la entrada** de un agente muestra antes de iniciar qué archivos recibe y de qué forma.
- En la vista de detalle de una ejecución, la pestaña *Contexto* de cada paso muestra qué archivos llegaron al modelo y cómo (como texto, como documento PDF, como imagen, como texto reconocido o como resumen).
- Las llamadas a `input_files` aparecen con entrada y salida en *Herramientas*.
- *Archivos recibidos* lista todo lo que recibió la ejecución y si ya se incorporó al conocimiento.

## ¿Entrada o conocimiento? {#eingabe-oder-wissen}
<!-- keywords: diferencia, entrada, conocimiento, knowledge, memoria, permanente, puntual -->

| | Archivo como entrada | Conocimiento | Memoria |
|---|---|---|---|
| Para qué | material de esta ejecución | documentos para muchas ejecuciones y agentes | notas que escribe el propio agente |
| Guardado | con la ejecución | en la página *Conocimiento* | en el espacio de memoria |
| Buscable | solo dentro de la ejecución | sí, para los agentes asignados | con la herramienta de memoria |

Los archivos de entrada nunca llegan al conocimiento de forma automática.

## Incorporar al conocimiento {#knowledge-uebernahme}
<!-- keywords: incorporar, conocimiento, colección, confirmar, procedencia, duplicado, resultado -->

Con **Al conocimiento** incorporas de forma explícita:

- archivos subidos de una ejecución; en archivos ZIP, archivos concretos del árbol,
- archivos de resultado (ver [Archivos de resultado](/docs/dateien#ergebnisdateien)),
- el resultado de un paso y las propuestas de agentes.

Antes de guardar, el diálogo muestra qué se guardaría, si el archivo es buscable, si ya existe el mismo contenido (no se guarda dos veces) y contenidos parecidos. Los textos generados se pueden editar antes de guardar y marcar como *extraído de fuentes*, *generado por un agente* o *suposición*. Eliges una colección o creas una nueva.

No se guarda nada antes de tu confirmación, y solo exactamente el contenido comprobado: si cambias algo después, compruebas de nuevo. Cada archivo conserva su procedencia (workflow, paso, agente, ejecución, momento, archivos de origen). Los flujos de trabajo en curso no cambian.

## Propuestas de agentes {#vorschlaege}
<!-- keywords: propuesta, propuestas, el agente propone, propose_knowledge, proponer conocimiento -->

En la sección *Conocimiento* de un agente activa **Puede proponer contenido para el conocimiento**. El agente recibe entonces la herramienta `propose_knowledge` y su resultado se ofrece como propuesta tras la ejecución. Las propuestas aparecen en el paso de la ejecución y solo se guardan cuando las has comprobado y confirmado.

## Subflujos, pruebas y programaciones {#sub-workflows}
<!-- keywords: subworkflow, serie de pruebas, lote, programación, aprobación, continuar, reinicio -->

- **Subworkflows:** un campo de archivo del subflujo recibe con `{{form.<campo>}}` los archivos de un campo o con `{{files}}` todos los archivos de la ejecución. Se pasan los mismos archivos guardados, sin copias.
- **Aprobaciones y continuación:** los archivos siguen guardados mientras una ejecución espera, corre o está en pausa, también tras reiniciar Nodestro.
- **Casos de prueba y programaciones:** los archivos que subas allí se conservan para el caso de prueba o la [programación](/docs/automatisierung#zeitplaene) y los usa cada ejecución. Nunca se reutilizan en silencio archivos de ejecuciones anteriores.

## Archivos a través de la API {#api-uploads}
<!-- keywords: api, multipart, form-data, base64, subida, curl, exportación, fastapi -->

Los flujos de trabajo publicados aceptan archivos de dos formas:

- como JSON con `name`, `media_type` y `content_base64` en el valor del campo de archivo,
- como `multipart/form-data`: una parte por archivo con el nombre del campo de archivo y los demás campos como JSON en la parte `values`.

```bash
curl -X POST http://127.0.0.1:8000/api/published/revisar-contratos/runs \
  -H "Authorization: Bearer $NODESTRO_API_KEY" \
  -F 'values={"cliente": "ACME"}' \
  -F "contrato=@contrato.pdf"
```

Se aplican las mismas comprobaciones y límites que en Nodestro. Un [proyecto FastAPI exportado](/docs/api-und-export#export) procesa los archivos con el mismo motor. Los archivos subidos nunca forman parte de la exportación.

## Almacenamiento y limpieza {#speicherung}
<!-- keywords: almacenamiento, limpieza, borrar, espacio en disco, copia de seguridad, restaurar -->

Los archivos subidos se guardan en la carpeta de datos, en `inputs`, no en la base de datos ni en el flujo de trabajo. El mismo contenido se guarda una sola vez.

- Los archivos de ejecuciones en cola, en curso o en pausa nunca se eliminan.
- Al iniciar, Nodestro limpia los archivos que nada usa desde hace más de un día. En *Ajustes* ves el espacio ocupado y eliminas archivos sin usar o de ejecuciones terminadas a partir de cierta antigüedad.
- Al borrar una ejecución se liberan sus archivos si nada más los usa.
- Las copias de seguridad contienen los archivos de entrada y los restauran.

## Seguridad {#sicherheit}
<!-- keywords: seguridad, bomba zip, ruta, enlace simbólico, ejecutar, macro, confianza -->

- Los archivos comprimidos nunca se ejecutan ni se descomprimen en disco. Nodestro lee entradas concretas en memoria.
- Las rutas inseguras (como `../`), los enlaces, las entradas cifradas y los archivos de programa se omiten y se marcan en el árbol.
- Hay límites contra bombas ZIP: se rechazan archivos con más de 5.000 entradas, más de 512 MB descomprimidos o una compresión sospechosa; las entradas de más de 25 MB se omiten.
- El contenido de los archivos subidos no es de confianza. Los agentes no siguen sus instrucciones como instrucciones del sistema.
