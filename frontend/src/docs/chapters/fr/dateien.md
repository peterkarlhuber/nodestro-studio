# Fichiers et documents

Sur demande, Nodestro enregistre les résultats sous forme de fichiers (Markdown, JSON, CSV, HTML, PDF, Word ou Excel) et, en plus des PDF et des textes, il lit aussi les fichiers Word et Excel. Les PDF scannés peuvent en option être rendus lisibles par une reconnaissance de texte locale (OCR). Tout tourne sur votre ordinateur, sans compte supplémentaire.

## Fichiers de résultat {#ergebnisdateien}
<!-- keywords: fichier de résultat, fichier, export, rapport, markdown, json, csv, html, pdf, télécharger, nettoyer -->

Dans l’inspecteur du nœud **Résultat**, *Fichiers de résultat* définit les formats dans lesquels le résultat est enregistré à la fin de chaque exécution. Sans entrée, aucun fichier n’est écrit.

| Format | Contenu |
|---|---|
| Markdown (.md) | le résultat sous forme de texte ; les résultats structurés en sections |
| JSON (.json) | le résultat sous forme de données |
| CSV (.csv) | un tableau ; nécessite une liste d’enregistrements ou un objet de valeurs simples |
| HTML (.html) | une page autonome avec titres, listes et tableaux |
| PDF (.pdf) | le même contenu sur des pages A4 |
| Word (.docx) | un document avec titres, paragraphes, listes, tableaux et mises en valeur |
| Excel (.xlsx) | des tableaux avec colonnes de nombres, de dates et oui/non ; plusieurs tableaux en feuilles séparées |

Plusieurs formats par exécution sont possibles. Tous les fichiers sont créés localement, sans requête d’IA ; ils sont disponibles de la même façon via l’API publiée et dans le projet exporté.

- **Nom du fichier :** vide signifie le nom du workflow.
- **Nettoyer :** remplace identifiants et données personnelles par des espaces réservés, comme l’[export de trace nettoyé](/docs/ausfuehrungen#trace-export).
- Dans la vue détaillée d’une exécution, la zone **Fichiers de résultat** liste tous les fichiers à afficher, télécharger et supprimer. *Créer un fichier* crée aussi après coup un fichier à partir du résultat global ou du résultat d’une seule étape.
- Les fichiers appartiennent à l’exécution : ils font partie des sauvegardes et sont supprimés avec l’exécution. Un fichier fait au plus 10 Mo.
- Le HTML est affiché dans l’aperçu sans scripts. Le PDF utilise les polices standard ; les caractères hors du jeu de caractères d’Europe occidentale apparaissent sous la forme « ? ».

Si un fichier ne peut pas être écrit (par exemple un CSV à partir d’un texte suivi), l’exécution affiche le fichier avec la raison ; le résultat lui-même est conservé.

## Word et Excel {#dokumentformate}
<!-- keywords: word, docx, excel, xlsx, feuille, formule, convertir, formats de document, office -->

Vous pouvez téléverser **Word (DOCX)** et **Excel (XLSX)** dans les [Connaissances](/docs/wissen#formate) comme d’autres fichiers. Nodestro les convertit en Markdown au téléversement, puis enregistre et recherche ce texte ; le fichier porte la mention « converti depuis DOCX/XLSX ».

- **Word :** paragraphes, titres, listes et tableaux dans l’ordre du document.
- **Excel :** une section par feuille avec un tableau des cellules utilisées. **Les formules ne sont jamais calculées :** la cellule affiche la valeur enregistrée par Excel et, à côté, la formule sous forme de texte.
- Les très grands tableaux sont raccourcis (au plus 5 000 lignes et 200 colonnes par feuille) ; le fichier indique alors « raccourci ».

Pour les [exécutions par lots](/docs/automatisierung#stapel), Nodestro lit directement les tableaux Excel comme des lignes.

## Reconnaissance de texte (OCR) {#ocr}
<!-- keywords: ocr, reconnaissance de texte, scan, scanné, tesseract, pdf image, couche texte, incertain -->

Les PDF scannés sans couche texte ne sont d’abord pas consultables par recherche. La **reconnaissance de texte locale** les rend lisibles :

1. Installez **Tesseract** avec les données de langue de vos documents (allemand, anglais, espagnol, français, italien ou portugais) ainsi que **pdftoppm** et **pdfinfo** (tous deux issus de Poppler) sur votre ordinateur, par exemple avec le gestionnaire de paquets de votre système.
2. Dans les [Réglages](/docs/einstellungen), sous *Reconnaissance de texte (OCR)*, activez *Utiliser l’OCR pour les scans*. Le réglage indique si Tesseract a été trouvé.
3. Les nouveaux scans sont reconnus au téléversement ; pour les fichiers existants, cliquez sur *Reconnaître le texte (OCR)* dans les Connaissances.

La reconnaissance s’exécute entièrement en local ; aucune donnée n’est envoyée. Les mots incertains sont marqués dans le texte sous la forme `[?mot]` et comptés, afin que les agents et vous sachiez que le texte peut contenir des erreurs. Vérifiez les chiffres importants dans l’original.
