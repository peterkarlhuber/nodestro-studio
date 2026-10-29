# Archivos y documentos

Si lo deseas, Nodestro guarda los resultados como archivos (Markdown, JSON, CSV, HTML, PDF, Word o Excel) y, además de PDF y textos, también lee archivos de Word y Excel. Los PDF escaneados se pueden hacer legibles opcionalmente con reconocimiento de texto local (OCR). Todo se ejecuta en tu equipo, sin cuentas adicionales.

## Archivos de resultado {#ergebnisdateien}
<!-- keywords: archivo de resultado, archivo, exportar, informe, markdown, json, csv, html, pdf, descargar, depurar -->

En el inspector del nodo **Resultado**, *Archivos de resultado* define en qué formatos se guarda el resultado al final de cada ejecución. Sin ninguna entrada no se escribe ningún archivo.

| Formato | Contenido |
|---|---|
| Markdown (.md) | el resultado como texto; los resultados estructurados como secciones |
| JSON (.json) | el resultado como datos |
| CSV (.csv) | una tabla; necesita una lista de registros o un objeto de valores simples |
| HTML (.html) | una página independiente con títulos, listas y tablas |
| PDF (.pdf) | el mismo contenido en páginas A4 |
| Word (.docx) | un documento con títulos, párrafos, listas, tablas y resaltados |
| Excel (.xlsx) | tablas con columnas de números, fechas y sí/no; varias tablas como hojas separadas |

Se pueden usar varios formatos por ejecución. Todos los archivos se crean localmente y sin solicitud de IA; están disponibles igual a través de la API publicada y en el proyecto exportado.

- **Nombre del archivo:** vacío significa el nombre del flujo de trabajo.
- **Depurar:** sustituye credenciales y datos personales por marcadores, como la [exportación depurada de trazas](/docs/ausfuehrungen#trace-export).
- En la vista de detalle de una ejecución, el área **Archivos de resultado** lista todos los archivos para verlos, descargarlos y eliminarlos. Con *Crear archivo* también creas un archivo después, a partir del resultado completo o del resultado de un solo paso.
- Los archivos pertenecen a la ejecución: forman parte de las copias de seguridad y se eliminan con la ejecución. Un archivo ocupa como máximo 10 MB.
- El HTML se muestra en la vista previa sin scripts. El PDF usa las fuentes estándar; los caracteres fuera del juego de caracteres de Europa occidental aparecen como «?».

Si un archivo no se puede escribir (por ejemplo, un CSV a partir de texto corrido), la ejecución muestra el archivo con el motivo; el resultado en sí se conserva.

## Word y Excel {#dokumentformate}
<!-- keywords: word, docx, excel, xlsx, hoja, fórmula, convertir, formatos de documento, office -->

Puedes subir **Word (DOCX)** y **Excel (XLSX)** a [Conocimiento](/docs/wissen#formate) como cualquier otro archivo. Nodestro los convierte a Markdown al subirlos y guarda y busca ese texto; el archivo lleva la nota «convertido de DOCX/XLSX».

- **Word:** párrafos, títulos, listas y tablas en el orden del documento.
- **Excel:** una sección por hoja con una tabla de las celdas usadas. **Las fórmulas nunca se calculan:** la celda muestra el valor que Excel guardó y, a su lado, la fórmula como texto.
- Las tablas muy grandes se acortan (como máximo 5000 filas y 200 columnas por hoja); el archivo muestra entonces «acortado».

Para las [ejecuciones por lotes](/docs/automatisierung#stapel), Nodestro lee las tablas de Excel directamente como filas.

## Reconocimiento de texto (OCR) {#ocr}
<!-- keywords: ocr, reconocimiento de texto, escaneo, escaneado, tesseract, pdf de imagen, capa de texto, dudoso -->

Los PDF escaneados sin capa de texto no se pueden buscar al principio. El **reconocimiento de texto local** los hace legibles:

1. Instala **Tesseract** y **pdftoppm** (Poppler) en tu equipo, por ejemplo con el gestor de paquetes de tu sistema.
2. En [Ajustes](/docs/einstellungen), en *Reconocimiento de texto (OCR)*, activa *Usar OCR para escaneos*. El ajuste indica si se encontró Tesseract.
3. Los escaneos nuevos se reconocen al subirlos; para los existentes, haz clic en *Reconocer texto (OCR)* en Conocimiento.

El reconocimiento se ejecuta por completo en local; no se envía ningún dato. Las palabras dudosas se marcan en el texto como `[?palabra]` y se cuentan, para que los agentes y tú sepáis que el texto puede contener errores. Comprueba las cifras importantes en el original.
