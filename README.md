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

## Use Cases

### AI and Prompt Engineering

- **Enhanced AI Prompting**: Combine content from multiple reference documents, code files, and data sheets into a single comprehensive prompt for AI tools like ChatGPT or Claude
- **Context Building**: Upload multiple related documents to provide broader context without manual copy-pasting from each file
- **Technical Documentation**: Extract and combine information from specifications, user manuals, and diagrams for technical documentation tasks

### Programming and Development

- **Code Review**: Upload multiple code files to copy their content for sharing in code review platforms
- **Debugging Support**: Extract logs from multiple log files simultaneously to share with teammates or support forums
- **API Documentation**: Combine API specs, examples, and sample responses from different files for comprehensive documentation
- **Migration Projects**: Extract code from legacy files across different formats to assist in modernization efforts

### Research and Academic Work

- **Literature Review**: Extract key passages from multiple research papers (PDFs) to compile into notes
- **Data Analysis**: Extract data from multiple sources (CSV, Excel, JSON) to prepare for analysis
- **Citation Management**: Pull bibliographic information from multiple documents for reference management
- **Collaborative Research**: Easily share content from multiple sources with research colleagues

### Business and Professional

- **Report Compilation**: Extract data and content from various quarterly reports, presentations, and spreadsheets
- **Knowledge Base Creation**: Consolidate information from various files into knowledge base articles
- **Legal Document Review**: Extract and compare text from multiple contracts or legal documents
- **Training Material Development**: Combine content from various technical documents, manuals, and guides for training purposes

### Creative and Content Creation

- **Content Research**: Gather information from multiple sources for article or blog post writing
- **Script Development**: Combine character descriptions, plot outlines, and dialogue from separate files
- **Translation Workflow**: Extract content from various file formats for translation services
- **Content Migration**: Pull content from legacy formats when migrating to new CMS or documentation systems

### Productivity Hacks

- **Meeting Preparation**: Extract agenda items, notes, and data from various documents before meetings
- **Project Management**: Consolidate information from task lists, specifications, and project plans
- **Email Communication**: Extract relevant information from multiple documents to include in detailed emails
- **Note Consolidation**: Combine notes from various formats into a single comprehensive document

This extension is particularly valuable when you need to work with content from multiple files simultaneously without the tedious process of opening each file, selecting content, and copying it manually.

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
- Uses session storage for temporary file data
- Minimal permissions required for operation

## Permissions

The extension uses minimal permissions to ensure user privacy and security:

- `activeTab`: Required to interact with the current tab when copying text
- No additional permissions are required as the extension uses web APIs for storage and file handling

## Future Enhancements

- Support for more file formats
- File type detection improvements
- Text extraction quality improvements
- UI/UX enhancements
- Additional language support

## Credits

Created with ❤️ by [atm1504](https://github.com/atm1504)
