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

  // -------------------- Initialization --------------------
  loadFilesFromStorage();
  setupEventListeners();

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
  function processFile(file) {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      uploadedFiles.set(file.name, {
        file: file,
        text: '',
        status: 'error',
        error: 'File too large (max 2MB allowed).'
      });
      updateFilesList();
      saveFilesToStorage();
      return;
    }

    try {
      const supportedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      // Only extract text for .txt and .csv
      const textTypes = ['text/plain', 'text/csv'];
      const ext = file.name.split('.').pop().toLowerCase();
      const isText = textTypes.includes(file.type) || ['txt', 'csv'].includes(ext);
      
      if (!supportedTypes.includes(file.type) && !['txt', 'csv'].includes(ext)) {
        showError(file.name, 'Unsupported file type');
        return;
      }

      if (!isText) {
        uploadedFiles.set(file.name, {
          file: file,
          text: '',
          status: 'error',
          error: 'Text extraction for this file type is not yet supported.'
        });
        updateFilesList();
        return;
      }

      const reader = new FileReader();
      
      reader.onload = function(e) {
        const text = e.target.result;
        uploadedFiles.set(file.name, {
          file: file,
          text: text,
          status: 'ready'
        });
        updateFilesList();
        saveFilesToStorage();
      };

      reader.onerror = function() {
        showError(file.name, 'Error reading file');
        saveFilesToStorage();
      };

      uploadedFiles.set(file.name, {
        file: file,
        text: '',
        status: 'loading'
      });
      updateFilesList();
      saveFilesToStorage();
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing file:', error);
      showError(file.name, 'Error processing file');
    }
  }

  function showError(fileName, message) {
    uploadedFiles.set(fileName, {
      file: { name: fileName },
      text: '',
      status: 'error',
      error: message
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
      
      const fileNameElement = document.createElement('div');
      fileNameElement.className = 'file-name';
      fileNameElement.textContent = fileName;
      
      const fileSizeElement = document.createElement('div');
      fileSizeElement.className = 'file-size';
      fileSizeElement.textContent = formatFileSize(fileData.file.size);

      fileInfo.appendChild(fileNameElement);
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