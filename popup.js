document.addEventListener('DOMContentLoaded', function() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const uploadButton = document.getElementById('uploadButton');
  const filesList = document.getElementById('filesList');
  const noFiles = document.getElementById('noFiles');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const copyAllFeedback = document.getElementById('copyAllFeedback');

  // Store uploaded files
  let uploadedFiles = new Map();

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop zone when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  // Handle dropped files
  dropZone.addEventListener('drop', handleDrop, false);

  // Handle file input change
  fileInput.addEventListener('change', handleFileSelect, false);

  // Handle upload button click (ONLY the button, not the whole drop zone)
  uploadButton.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Copy All button logic
  copyAllBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (uploadedFiles.size === 0) return;
    let allText = '';
    uploadedFiles.forEach((fileData, fileName) => {
      if (fileData.status === 'ready' && fileData.text) {
        allText += `----- ${fileName} -----\n`;
        allText += fileData.text + '\n\n';
      }
    });
    if (allText.trim() === '') return;
    navigator.clipboard.writeText(allText).then(function() {
      copyAllBtn.classList.add('copied');
      setTimeout(() => {
        copyAllBtn.classList.remove('copied');
      }, 1800);
    });
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight(e) {
    dropZone.classList.add('dragover');
  }

  function unhighlight(e) {
    dropZone.classList.remove('dragover');
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
    // Reset file input
    e.target.value = '';
  }

  function handleFiles(files) {
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        if (!uploadedFiles.has(file.name)) {
          processFile(file);
        }
      });
      updateFilesList();
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
      };
      reader.onerror = function() {
        showError(file.name, 'Error reading file');
      };
      uploadedFiles.set(file.name, {
        file: file,
        text: '',
        status: 'loading'
      });
      updateFilesList();
      reader.readAsText(file);
    } catch (err) {
      uploadedFiles.set(file.name, {
        file: file,
        text: '',
        status: 'error',
        error: 'Unexpected error while reading file.'
      });
      updateFilesList();
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
  }

  function updateFilesList() {
    filesList.innerHTML = '';
    noFiles.style.display = uploadedFiles.size === 0 ? 'block' : 'none';
    filesList.style.display = uploadedFiles.size === 0 ? 'none' : 'block';

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
        copyButton.onclick = (e) => {
          copyText(fileName, copyButton);
        };
        // Feedback span
        const feedback = document.createElement('span');
        feedback.className = 'copy-feedback';
        feedback.textContent = 'Copied!';
        copyButton.appendChild(feedback);
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
        progress.style.width = '100%';
        progressBar.appendChild(progress);
        fileItem.appendChild(progressBar);
      } else if (fileData.status === 'error') {
        const errorMessage = document.createElement('div');
        errorMessage.style.color = '#d93025';
        errorMessage.style.fontSize = '12px';
        errorMessage.style.marginTop = '4px';
        errorMessage.textContent = fileData.error;
        fileItem.appendChild(errorMessage);
      }

      filesList.appendChild(fileItem);
    });
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  function removeFile(fileName) {
    uploadedFiles.delete(fileName);
    updateFilesList();
  }
}); 