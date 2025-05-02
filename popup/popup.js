// Copy Paste File Text Extension - popup.js
// Organized, readable, and well-commented for maintainability

console.log('Copy Paste File Text Extension - popup script loaded');

// -------------------- DOMContentLoaded --------------------
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  
  // --- DOM Elements ---
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const uploadButton = document.getElementById('uploadButton');
  const filesList = document.getElementById('filesList');
  const noFiles = document.getElementById('noFiles');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const copyAllFeedback = document.getElementById('copyAllFeedback');

  // --- State: Map of uploaded files ---
  let uploadedFiles = new Map();

  // --- PDF.js script loader ---
  let pdfJsLoaded = false;
  
  // Load PDF.js library asynchronously
  function loadPdfJs() {
    if (pdfJsLoaded) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      // Use locally bundled PDF.js files instead of CDN
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('lib/pdfjs/pdf.js');
      script.onload = () => {
        console.log('PDF.js library loaded successfully');
        // Set PDF.js to not use workers, which avoids CSP issues
        window.pdfjsLib = window.pdfjsLib || {};
        window.pdfjsLib.GlobalWorkerOptions = window.pdfjsLib.GlobalWorkerOptions || {};
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '';  // Disable worker
        pdfJsLoaded = true;
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load PDF.js:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  // -------------------- Initialization --------------------
  loadFilesFromStorage();
  setupEventListeners();
  loadPdfJs();

  // -------------------- Storage Functions --------------------
  // Load files from sessionStorage
  function loadFilesFromStorage() {
    try {
      const savedFiles = sessionStorage.getItem('uploadedFiles');
      if (savedFiles) {
        uploadedFiles = new Map(JSON.parse(savedFiles));
        console.log('Loaded files from session storage:', Array.from(uploadedFiles.keys()));
        updateFilesList();
      }
    } catch (e) {
      console.error('Failed to load files from session storage:', e);
    }
  }

  // Save files to sessionStorage
  function saveFilesToStorage() {
    try {
      sessionStorage.setItem('uploadedFiles', JSON.stringify(Array.from(uploadedFiles.entries())));
      console.log('Files saved to session storage:', Array.from(uploadedFiles.keys()));
    } catch (e) {
      console.error('Failed to save files to session storage:', e);
    }
  }

  // -------------------- Event Listeners Setup --------------------
  function setupEventListeners() {
    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, highlight, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });
    dropZone.addEventListener('drop', handleDrop, false);

    // File input change event
    fileInput.addEventListener('change', handleFileSelect, false);
    
    // Upload button - simpler now that we're on a full page
    uploadButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Upload button clicked - full page mode');
      
      // Simply click the file input directly - no focus issues on full page
      fileInput.click();
    });

    // Copy All button
    copyAllBtn.addEventListener('click', handleCopyAll, false);
  }

  // -------------------- Drag & Drop Helpers --------------------
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  function highlight(e) { dropZone.classList.add('dragover'); }
  function unhighlight(e) { dropZone.classList.remove('dragover'); }

  // -------------------- File Handling --------------------
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }
  
  function handleFileSelect(e) {
    console.log('File input change event triggered');
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log(`Selected ${files.length} files`);
      
      // Inform background script about completed file upload
      chrome.runtime.sendMessage({
        action: "fileUploaded", 
        fileCount: files.length,
        fileName: files.length === 1 ? files[0].name : "multiple files"
      }, function(response) {
        console.log("Background acknowledged file upload:", response);
      });
      
      // Process the files
      handleFiles(files);
      // Reset file input
      e.target.value = '';
    } else {
      console.log('No files selected or file selection cancelled');
    }
  }
  
  function handleFiles(files) {
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        if (!uploadedFiles.has(file.name)) processFile(file);
      });
      updateFilesList();
      saveFilesToStorage();
    }
  }
  
  // --- Process a file: extract text and update UI ---
  async function processFile(file) {
    console.log(`Processing file: ${file.name}`);
    
    // Determine file type
    const isText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (isPdf || isText || isCsv) {
      // Show loading state
      uploadedFiles.set(file.name, {
        file: file,
        text: 'Extracting text...',
        status: 'loading',
        fileType: getFileTypeLabel(file)
      });
      updateFilesList();
      
      try {
        let extractedText = '';
        
        if (isPdf) {
          extractedText = await extractTextFromPDF(file);
        } else if (isText) {
          extractedText = await extractTextFromTextFile(file);
        } else if (isCsv) {
          extractedText = await extractTextFromCsv(file);
        }
        
        // Update file data with extracted text
        uploadedFiles.set(file.name, {
          file: file,
          text: extractedText,
          status: 'ready',
          fileType: getFileTypeLabel(file)
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        uploadedFiles.set(file.name, {
          file: file,
          text: `Error: ${error.message || 'Could not extract text'}`,
          status: 'error',
          fileType: getFileTypeLabel(file)
        });
      }
      
      // Update UI and save to storage
      updateFilesList();
      saveFilesToStorage();
    } else {
      console.warn(`Unsupported file type: ${file.type}`);
      showError(file.name, 'Unsupported file type', getFileTypeLabel(file));
    }
  }

  // --- Extract text from text files (txt) ---
  function extractTextFromTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function() {
        resolve(reader.result);
      };
      
      reader.onerror = function() {
        reject(new Error('Failed to read text file'));
      };
      
      reader.readAsText(file);
    });
  }

  // --- Extract text from CSV files ---
  function extractTextFromCsv(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function() {
        resolve(reader.result);
      };
      
      reader.onerror = function() {
        reject(new Error('Failed to read CSV file'));
      };
      
      reader.readAsText(file);
    });
  }

  // --- Extract text from PDF files ---
  async function extractTextFromPDF(file) {
    try {
      await loadPdfJs(); // Ensure PDF.js is loaded
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        disableWorker: true, // Force disable worker
        disableAutoFetch: true,
        disableStream: true,
        disableRange: true
      });
      
      const pdf = await loadingTask.promise;
      console.log('PDF document loaded, pages:', pdf.numPages);
      
      let extractedText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Concatenate the text items
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += pageText + '\n\n';
      }
      
      return extractedText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return 'Error: Could not extract text from PDF file. ' + error.message;
    }
  }

  // Read a file as ArrayBuffer (for PDF processing)
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Helper function to get file type label
  function getFileTypeLabel(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return ext.toUpperCase();
  }

  function showError(fileName, message, fileType) {
    uploadedFiles.set(fileName, {
      file: { name: fileName },
      text: '',
      status: 'error',
      error: message,
      fileType: fileType || 'UNKNOWN'
    });
    updateFilesList();
    saveFilesToStorage();
  }

  // -------------------- UI Update Functions --------------------
  function updateFilesList() {
    filesList.innerHTML = '';
    noFiles.style.display = uploadedFiles.size === 0 ? 'block' : 'none';
    filesList.style.display = uploadedFiles.size === 0 ? 'none' : 'block';
    copyAllBtn.style.display = uploadedFiles.size === 0 ? 'none' : 'flex';

    uploadedFiles.forEach((fileData, fileName) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      
      const fileNameContainer = document.createElement('div');
      fileNameContainer.className = 'file-name-container';
      
      const fileNameElement = document.createElement('div');
      fileNameElement.className = 'file-name';
      fileNameElement.textContent = fileName;
      
      const fileTypeElement = document.createElement('span');
      fileTypeElement.className = 'file-type';
      fileTypeElement.textContent = fileData.fileType || '';
      
      fileNameContainer.appendChild(fileNameElement);
      fileNameContainer.appendChild(fileTypeElement);
      
      const fileSizeElement = document.createElement('div');
      fileSizeElement.className = 'file-size';
      fileSizeElement.textContent = formatFileSize(fileData.file.size);

      fileInfo.appendChild(fileNameContainer);
      fileInfo.appendChild(fileSizeElement);

      const fileActions = document.createElement('div');
      fileActions.className = 'file-actions';

      if (fileData.status === 'ready') {
        const copyButton = document.createElement('button');
        copyButton.className = 'action-button copy-button';
        copyButton.innerHTML = '📋';
        copyButton.title = 'Copy text';
        // Feedback span
        const feedback = document.createElement('span');
        feedback.className = 'copy-feedback';
        feedback.textContent = 'Copied!';
        copyButton.appendChild(feedback);
        copyButton.onclick = (e) => {
          copyText(fileName, copyButton);
        };
        fileActions.appendChild(copyButton);
      }

      const deleteButton = document.createElement('button');
      deleteButton.className = 'action-button delete-button';
      deleteButton.innerHTML = '🗑️';
      deleteButton.title = 'Remove file';
      deleteButton.onclick = () => removeFile(fileName);
      fileActions.appendChild(deleteButton);

      fileItem.appendChild(fileInfo);
      fileItem.appendChild(fileActions);

      if (fileData.status === 'loading') {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progress = document.createElement('div');
        progress.className = 'progress';
        progressBar.appendChild(progress);
        fileItem.appendChild(progressBar);
      }

      if (fileData.status === 'error') {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = fileData.error || 'Error processing file';
        fileItem.appendChild(errorMessage);
      }

      filesList.appendChild(fileItem);
    });
  }

  function copyText(fileName, buttonEl) {
    const fileData = uploadedFiles.get(fileName);
    if (fileData && fileData.text) {
      navigator.clipboard.writeText(fileData.text).then(function() {
        buttonEl.classList.add('copied');
        setTimeout(() => {
          buttonEl.classList.remove('copied');
        }, 1200);
      }).catch(function(err) {
        console.error('Failed to copy text: ', err);
      });
    }
  }

  function handleCopyAll(e) {
    e.preventDefault();
    let allText = '';
    let hasReadyFiles = false;

    uploadedFiles.forEach(fileData => {
      if (fileData.status === 'ready') {
        allText += fileData.text + '\n\n';
        hasReadyFiles = true;
      }
    });

    if (!hasReadyFiles) {
      alert('No files ready to copy');
      return;
    }

    navigator.clipboard.writeText(allText.trim())
      .then(() => {
        copyAllBtn.classList.add('copied');
        setTimeout(() => {
          copyAllBtn.classList.remove('copied');
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy all text:', err);
        alert('Failed to copy text to clipboard');
      });
  }

  function removeFile(fileName) {
    uploadedFiles.delete(fileName);
    updateFilesList();
    saveFilesToStorage();
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Log popup dimensions
  console.log('Popup width:', document.body.offsetWidth, 'height:', document.body.offsetHeight);

  // Log all elements in the body
  console.log('All elements in body:', Array.from(document.body.children).map(e => e.tagName));
}); 