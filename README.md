# Copy Paste File Text Chrome Extension

A Chrome extension that allows you to extract text from various file formats and copy it to your clipboard.

## Project Structure

```
/copy-paste_file_text_ai/
│
├── popup/
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   └── components/
│       ├── (future: fileList.js, fileUploader.js, ...)
│
├── assets/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── manifest.json
└── README.md
```

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the directory containing this extension
4. The extension icon should appear in your Chrome toolbar

## Usage

1. Click the extension icon in your Chrome toolbar
2. Drag and drop files or click "Choose Files" to select files
3. For supported text files (.txt, .csv), the text will be extracted automatically
4. Click the copy icon next to a file to copy its text to your clipboard
5. Click "Copy All" to copy text from all files at once

## Features

- Clean, modern UI
- Drag and drop file upload
- Support for multiple file formats
- Individual and bulk text copying
- Persistent storage between popup sessions
- Modular, maintainable codebase

## Development
- Main popup logic is in `popup/popup.js` (ES module)
- Styles are in `popup/popup.css`
- UI and logic can be further split into `popup/components/` as the project grows 