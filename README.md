# copy2paste

A browser extension that allows you to extract text from various file formats and copy it to your clipboard with ease.

![copy2paste logo](assets/logo.png)

## Features

- **Multi-format Support**: Extract text from PDF, DOCX, XLSX, PPTX, TXT, CSV, JSON, and more
- **Clean, Modern UI**: Intuitive drag-and-drop interface
- **Copy with Context**: File names are included with content when copying
- **Bulk Operations**: Copy text from all files at once
- **File Previews**: See the extracted text before copying
- **Session Storage**: Files are retained while the browser is open
- **Internationalization**: Support for multiple languages

## Supported File Types

- Documents: PDF, DOCX, PPTX
- Data: CSV, XLSX, JSON
- Text: TXT and other plain text formats
- Apple formats: Numbers, Pages
- Code files: Various programming language files

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the directory containing this extension
4. The extension icon should appear in your browser toolbar

## Usage

1. Click the extension icon in your browser toolbar
2. Drag and drop files or click "Choose Files" to select files
3. The text will be extracted automatically from supported file formats
4. Click the copy icon next to a file to copy its text to your clipboard
5. Click "Copy All" to copy text from all files at once

## Project Structure

```
/copy2paste/
│
├── popup/
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   ├── i18n.js
│   └── languages.js
│
├── lib/
│   ├── pdfjs/
│   │   ├── pdf.mjs
│   │   └── pdf.worker.mjs
│   ├── jszip/
│   │   └── jszip.min.js
│   ├── mammoth/
│   │   └── mammoth.browser.min.js
│   └── xlsx/
│       └── xlsx.full.min.js
│
├── assets/
│   ├── logo.png
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── manifest.json
├── background.js
└── README.md
```

## Development

- Main popup logic is in `popup/popup.js` (ES module)
- PDF processing uses PDF.js library
- Document formats (DOCX, XLSX, PPTX) use respective libraries
- Styles are in `popup/popup.css`
- Internationalization support through `i18n.js` and `languages.js`
- Background service worker in `background.js`

## Future Enhancements

- Support for more file formats
- File type detection improvements
- Text extraction quality improvements
- UI/UX enhancements
- Additional language support

## Credits

Created with ❤️ by [atm1504](https://github.com/atm1504)
