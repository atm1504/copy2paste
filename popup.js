document.addEventListener('DOMContentLoaded', function() {
  const dropZone = document.getElementById('dropZone');
  const result = document.getElementById('result');
  const fileInfo = document.getElementById('fileInfo');
  const copyButton = document.getElementById('copyButton');

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

    if (files.length > 0) {
      const file = files[0];
      handleFile(file);
    }
  }

  function handleFile(file) {
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

    if (!supportedTypes.includes(file.type)) {
      fileInfo.textContent = 'Unsupported file type. Please upload a supported file format.';
      result.style.display = 'block';
      copyButton.style.display = 'none';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      fileInfo.textContent = `File: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB`;
      result.style.display = 'block';
      copyButton.style.display = 'block';

      // Store the text in chrome.storage for copying
      chrome.storage.local.set({ 'fileText': text }, function() {
        console.log('Text saved');
      });
    };

    reader.readAsText(file);
  }

  // Handle copy button click
  copyButton.addEventListener('click', function() {
    chrome.storage.local.get(['fileText'], function(result) {
      if (result.fileText) {
        navigator.clipboard.writeText(result.fileText).then(function() {
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy Text';
          }, 2000);
        }).catch(function(err) {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  });
}); 