// Language configuration file for copy2paste extension
// This file is loaded as a module by i18n.js

const languages = {
  en: {
    title: "copy2paste",
    dragDropText: "Drag and drop your files here",
    supportedFormats:
      "Supported formats: PDF, DOCX, XLSX, PPTX, TXT, CSV, JSON, Numbers, Pages, and various code files",
    chooseFiles: "Choose Files",
    copyAll: "Copy All",
    allTextCopied: "All text copied!",
    noFilesYet: "No files uploaded yet",
    processing: "Processing files...",
    copyright: "© 2025 copy2paste - File Text Extractor | Created with ❤️ by",
    copied: "Copied!",
    light: "Light",
    dark: "Dark",
    system: "System",
    language: "Language",
    // Error messages
    errors: {
      failedToLoad: "Failed to load saved files",
      failedToSave: "Failed to save files",
      failedToCopy: "Failed to copy text to clipboard",
      failedToCopyAll: "Failed to copy all text to clipboard",
      unsupportedFile: "Unsupported file type",
      processingFile: "Error processing file",
      wait: "Please wait for current files to finish processing",
    },
  },
  es: {
    title: "copy2paste",
    dragDropText: "Arrastra y suelta tus archivos aquí",
    supportedFormats:
      "Formatos admitidos: PDF, DOCX, XLSX, PPTX, TXT, CSV, JSON, Numbers, Pages y varios archivos de código",
    chooseFiles: "Elegir archivos",
    copyAll: "Copiar todo",
    allTextCopied: "¡Texto copiado!",
    noFilesYet: "Aún no se han subido archivos",
    processing: "Procesando archivos...",
    copyright:
      "© 2025 copy2paste - Extractor de texto de archivos | Creado con ❤️ por",
    copied: "¡Copiado!",
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
    language: "Idioma",
    // Error messages
    errors: {
      failedToLoad: "Error al cargar archivos guardados",
      failedToSave: "Error al guardar archivos",
      failedToCopy: "Error al copiar texto al portapapeles",
      failedToCopyAll: "Error al copiar todo el texto al portapapeles",
      unsupportedFile: "Tipo de archivo no compatible",
      processingFile: "Error al procesar el archivo",
      wait: "Espere a que los archivos actuales terminen de procesarse",
    },
  },
  fr: {
    title: "copy2paste",
    dragDropText: "Glissez et déposez vos fichiers ici",
    supportedFormats:
      "Formats pris en charge: PDF, DOCX, XLSX, PPTX, TXT, CSV, JSON, Numbers, Pages et divers fichiers de code",
    chooseFiles: "Choisir des fichiers",
    copyAll: "Tout copier",
    allTextCopied: "Tout le texte copié !",
    noFilesYet: "Aucun fichier téléchargé pour l'instant",
    processing: "Traitement des fichiers...",
    copyright:
      "© 2025 copy2paste - Extracteur de texte de fichier | Créé avec ❤️ par",
    copied: "Copié !",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
    language: "Langue",
    // Error messages
    errors: {
      failedToLoad: "Échec du chargement des fichiers enregistrés",
      failedToSave: "Échec de l'enregistrement des fichiers",
      failedToCopy: "Échec de la copie du texte dans le presse-papiers",
      failedToCopyAll:
        "Échec de la copie de tout le texte dans le presse-papiers",
      unsupportedFile: "Type de fichier non pris en charge",
      processingFile: "Erreur lors du traitement du fichier",
      wait: "Veuillez attendre que les fichiers actuels finissent de traiter",
    },
  },
  de: {
    title: "copy2paste",
    dragDropText: "Ziehen Sie Ihre Dateien hierher",
    supportedFormats:
      "Unterstützte Formate: PDF, DOCX, XLSX, PPTX, TXT, CSV, JSON, Numbers, Pages und verschiedene Code-Dateien",
    chooseFiles: "Dateien auswählen",
    copyAll: "Alles kopieren",
    allTextCopied: "Gesamter Text kopiert!",
    noFilesYet: "Noch keine Dateien hochgeladen",
    processing: "Dateien werden verarbeitet...",
    copyright: "© 2025 copy2paste - Datei-Textextraktor | Erstellt mit ❤️ von",
    copied: "Kopiert!",
    light: "Hell",
    dark: "Dunkel",
    system: "System",
    language: "Sprache",
    // Error messages
    errors: {
      failedToLoad: "Fehler beim Laden gespeicherter Dateien",
      failedToSave: "Fehler beim Speichern von Dateien",
      failedToCopy: "Fehler beim Kopieren von Text in die Zwischenablage",
      failedToCopyAll:
        "Fehler beim Kopieren des gesamten Texts in die Zwischenablage",
      unsupportedFile: "Nicht unterstützter Dateityp",
      processingFile: "Fehler bei der Verarbeitung der Datei",
      wait: "Bitte warten Sie, bis die aktuellen Dateien fertig verarbeitet sind",
    },
  },
  zh: {
    title: "copy2paste",
    dragDropText: "将文件拖放到这里",
    supportedFormats:
      "支持的格式：PDF、DOCX、XLSX、PPTX、TXT、CSV、JSON、Numbers、Pages 和各种代码文件",
    chooseFiles: "选择文件",
    copyAll: "复制全部",
    allTextCopied: "所有文本已复制！",
    noFilesYet: "尚未上传文件",
    processing: "正在处理文件...",
    copyright: "© 2025 copy2paste - 文件文本提取器 | 由 ❤️ 创建",
    copied: "已复制！",
    light: "浅色",
    dark: "深色",
    system: "系统",
    language: "语言",
    // Error messages
    errors: {
      failedToLoad: "无法加载保存的文件",
      failedToSave: "无法保存文件",
      failedToCopy: "无法将文本复制到剪贴板",
      failedToCopyAll: "无法将所有文本复制到剪贴板",
      unsupportedFile: "不支持的文件类型",
      processingFile: "处理文件时出错",
      wait: "请等待当前文件处理完成",
    },
  },
};

// Get browser language or default to English
function getDefaultLanguage() {
  const browserLang = navigator.language.split("-")[0];
  return languages[browserLang] ? browserLang : "en";
}

export { languages, getDefaultLanguage };
