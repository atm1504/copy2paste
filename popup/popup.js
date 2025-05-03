// Copy Paste File Text Extension - popup.js
// Organized, readable, and well-commented for maintainability

console.log("Copy Paste File Text Extension - popup script loaded");
import * as pdfjsLib from "../lib/pdfjs/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(
  "lib/pdfjs/pdf.worker.mjs"
);

console.log(
  "PDF.js (ESM) loaded, worker at",
  pdfjsLib.GlobalWorkerOptions.workerSrc
);

// -------------------- DOMContentLoaded --------------------
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded");

  // --- DOM Elements ---
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadButton = document.getElementById("uploadButton");
  const filesList = document.getElementById("filesList");
  const noFiles = document.getElementById("noFiles");
  const copyAllBtn = document.getElementById("copyAllBtn");
  const copyAllFeedback = document.getElementById("copyAllFeedback");
  const errorMessage = document.getElementById("errorMessage");
  const loadingIndicator = document.getElementById("loadingIndicator");

  // --- State: Map of uploaded files ---
  let uploadedFiles = new Map();
  let isProcessing = false;

  // -------------------- Initialization --------------------
  loadFilesFromStorage();
  setupEventListeners();

  // -------------------- Storage Functions --------------------
  function loadFilesFromStorage() {
    try {
      const savedFiles = sessionStorage.getItem("uploadedFiles");
      if (savedFiles) {
        uploadedFiles = new Map(JSON.parse(savedFiles));
        console.log(
          "Loaded files from session storage:",
          Array.from(uploadedFiles.keys())
        );
        updateFilesList();
      }
    } catch (e) {
      console.error("Failed to load files from session storage:", e);
      showError("Failed to load saved files");
    }
  }

  function saveFilesToStorage() {
    try {
      sessionStorage.setItem(
        "uploadedFiles",
        JSON.stringify(Array.from(uploadedFiles.entries()))
      );
      console.log(
        "Files saved to session storage:",
        Array.from(uploadedFiles.keys())
      );
    } catch (e) {
      console.error("Failed to save files to session storage:", e);
      showError("Failed to save files");
    }
  }

  // -------------------- Event Listeners Setup --------------------
  function setupEventListeners() {
    // Drag & Drop
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });
    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, highlight, false);
    });
    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });
    dropZone.addEventListener("drop", handleDrop, false);

    // File input change event
    fileInput.addEventListener("change", handleFileSelect, false);

    // Upload button
    uploadButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    });

    // Copy All button
    copyAllBtn.addEventListener("click", handleCopyAll, false);
  }

  // -------------------- UI Helpers --------------------
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    setTimeout(() => {
      errorMessage.style.display = "none";
    }, 5000);
  }

  function showLoading() {
    loadingIndicator.style.display = "block";
    isProcessing = true;
  }

  function hideLoading() {
    loadingIndicator.style.display = "none";
    isProcessing = false;
  }

  // -------------------- Drag & Drop Helpers --------------------
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight(e) {
    if (!isProcessing) {
      dropZone.classList.add("dragover");
    }
  }

  function unhighlight(e) {
    dropZone.classList.remove("dragover");
  }

  // -------------------- File Handling --------------------
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
      e.target.value = "";
    }
  }

  async function handleFiles(files) {
    if (isProcessing) {
      showError("Please wait for current files to finish processing");
      return;
    }

    if (files.length > 0) {
      showLoading();
      try {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter((file) => {
          const isValid = isValidFileType(file);
          if (!isValid) {
            showError(`Unsupported file type: ${file.name}`);
          }
          return isValid;
        });

        if (validFiles.length > 0) {
          for (const file of validFiles) {
            if (!uploadedFiles.has(file.name)) {
              await processFile(file);
            }
          }
          updateFilesList();
          saveFilesToStorage();
        }
      } catch (error) {
        console.error("Error processing files:", error);
        showError("Error processing files. Please try again.");
      } finally {
        hideLoading();
      }
    }
  }

  function isValidFileType(file) {
    // 1) Anything that really *is* text
    if (file.type.startsWith("text/")) return true;

    // 2) Common "application/…" catch-alls
    const extraMIMEs = [
      "application/json",
      "application/javascript",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/pdf",
    ];
    if (extraMIMEs.includes(file.type)) return true;

    // 3) Fallback by extension for everything else
    const ext = file.name.toLowerCase().split(".").pop();
    const allowedExts = [
      // Office & PDF
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "numbers",
      "pages",
      "pdf",
      // Code/config
      "js",
      "mjs",
      "cjs",
      "ts",
      "tsx",
      "jsx",
      "json",
      "py",
      "java",
      "rb",
      "go",
      "cpp",
      "c",
      "cs",
      "php",
      "html",
      "htm",
      "css",
      "scss",
      "less",
      "xml",
      "yaml",
      "yml",
      "md",
      "sh",
      "bash",
      "rs",
      "swift",
      "kt",
    ];
    return allowedExts.includes(ext);
  }

  /**
   * Process a single File object: extract text (PDF, DOCX, XLSX, PPTX, Numbers, Pages)
   * or treat as plain text.
   * Stores result in uploadedFiles map under file.name.
   */
  async function processFile(file) {
    console.log(`Processing file: ${file.name}`);

    // Show "loading" state in your UI
    uploadedFiles.set(file.name, {
      file,
      text: "Extracting text…",
      status: "loading",
      fileType: getFileTypeLabel(file),
    });
    updateFilesList();

    try {
      const name = file.name.toLowerCase();
      let extractedText;

      if (name.endsWith(".pdf")) {
        // PDF via PDF.js
        extractedText = await extractTextFromPDF(file);
      } else if (name.endsWith(".docx")) {
        // Word documents via Mammoth
        extractedText = await extractFromDocx(file);
      } else if (name.endsWith(".xlsx")) {
        // Spreadsheets via SheetJS
        extractedText = await extractFromXlsx(file);
      } else if (name.endsWith(".pptx")) {
        // PowerPoint via JSZip + XML scan
        extractedText = await extractFromPptx(file);
      } else if (name.endsWith(".numbers")) {
        // Apple Numbers via JSZip + XML scan
        extractedText = await extractFromNumbers(file);
      } else if (name.endsWith(".pages")) {
        // Apple Pages via JSZip + XML scan
        extractedText = await extractFromPages(file);
      } else {
        // All other files: plain text (code, JSON, CSV, TXT, etc.)
        extractedText = await extractTextFromTextFile(file);
      }

      // Update map to "ready" state with the extracted text
      uploadedFiles.set(file.name, {
        file,
        text: extractedText,
        status: "ready",
        fileType: getFileTypeLabel(file),
      });
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      uploadedFiles.set(file.name, {
        file,
        text: `Error: ${error.message || "Could not extract text"}`,
        status: "error",
        fileType: getFileTypeLabel(file),
      });
      showError(`Failed to process ${file.name}`);
    }

    // Refresh the UI and persist
    updateFilesList();
    saveFilesToStorage();
  }

  // popup.js (at top of file)

  // helper: extract text from .docx via Mammoth
  async function extractFromDocx(file) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const { value: text } = await mammoth.extractRawText({ arrayBuffer });
    return text;
  }

  // helper: extract CSV‐style text from .xlsx via SheetJS
  async function extractFromXlsx(file) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    let allText = "";
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      // CSV gives a good line‐by‐line fallback
      allText += XLSX.utils.sheet_to_csv(sheet) + "\n\n";
    }
    return allText.trim();
  }

  // helper: extract slide text from .pptx, .numbers, .pages via JSZip + simple XML scan
  async function extractFromZipXml(file, xmlFolder, xmlPattern) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const zip = await JSZip.loadAsync(arrayBuffer);
    let fullText = "";
    for (const path of Object.keys(zip.files)) {
      if (path.startsWith(xmlFolder) && xmlPattern.test(path)) {
        const xml = await zip.files[path].async("text");
        // grab all text in <a:t>…</a:t> or plain text nodes:
        const matches = [...xml.matchAll(/<[^>]*>([^<]+)<\/[^>]*>/g)];
        fullText += matches.map((m) => m[1]).join(" ") + "\n\n";
      }
    }
    return fullText.trim();
  }

  async function extractFromPptx(file) {
    // pptx slides live under ppt/slides/slideX.xml
    return extractFromZipXml(
      file,
      "ppt/slides/",
      /^ppt\/slides\/slide\d+\.xml$/
    );
  }

  async function extractFromNumbers(file) {
    // .numbers sheets under index/Worksheets/sheetX.xml
    return extractFromZipXml(file, "Index/Worksheet/", /\.xml$/i);
  }

  async function extractFromPages(file) {
    // .pages content is in index.xml
    return extractFromZipXml(file, "", /^index\.xml$/i);
  }

  // --- Extract text from text files (txt) ---
  function extractTextFromTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function () {
        resolve(reader.result);
      };

      reader.onerror = function () {
        reject(new Error("Failed to read text file"));
      };

      reader.readAsText(file);
    });
  }

  // --- Extract text from CSV files ---
  function extractTextFromCsv(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function () {
        resolve(reader.result);
      };

      reader.onerror = function () {
        reject(new Error("Failed to read CSV file"));
      };

      reader.readAsText(file);
    });
  }

  // --- Extract text from PDF files ---
  async function extractTextFromPDF(file) {
    try {
      // PDF.js is already imported as pdfjsLib at the top of the file
      console.log("Starting PDF extraction for:", file.name);

      // Read the file as ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file);

      // Load the PDF document
      const pdfDoc = await pdfjsLib.getDocument({
        data: arrayBuffer,
        disableAutoFetch: true,
        disableStream: true,
        disableRange: true,
      }).promise;

      console.log("PDF document loaded successfully, pages:", pdfDoc.numPages);

      let extractedText = "";
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        extractedText += pageText + "\n\n";
      }
      console.log("PDF text extraction complete");
      return extractedText.trim();
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(`PDF extraction failed: ${error.message}`);
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
    const ext = file.name.split(".").pop().toLowerCase();
    return ext.toUpperCase();
  }

  // -------------------- UI Update Functions --------------------
  function updateFilesList() {
    filesList.innerHTML = "";
    noFiles.style.display = uploadedFiles.size === 0 ? "block" : "none";
    filesList.style.display = uploadedFiles.size === 0 ? "none" : "block";
    copyAllBtn.style.display = uploadedFiles.size === 0 ? "none" : "flex";

    uploadedFiles.forEach((fileData, fileName) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";

      const fileInfo = document.createElement("div");
      fileInfo.className = "file-info";

      const fileNameContainer = document.createElement("div");
      fileNameContainer.className = "file-name-container";

      const fileNameElement = document.createElement("div");
      fileNameElement.className = "file-name";
      fileNameElement.textContent = fileName;

      const fileTypeElement = document.createElement("span");
      fileTypeElement.className = "file-type";
      fileTypeElement.textContent = fileData.fileType || "";

      fileNameContainer.appendChild(fileNameElement);
      fileNameContainer.appendChild(fileTypeElement);

      const fileSizeElement = document.createElement("div");
      fileSizeElement.className = "file-size";
      fileSizeElement.textContent = formatFileSize(fileData.file.size);

      fileInfo.appendChild(fileNameContainer);
      fileInfo.appendChild(fileSizeElement);

      const fileActions = document.createElement("div");
      fileActions.className = "file-actions";

      if (fileData.status === "ready") {
        const copyButton = document.createElement("button");
        copyButton.className = "action-button copy-button";
        copyButton.innerHTML = "📋";
        copyButton.title = "Copy text";
        // Feedback span
        const feedback = document.createElement("span");
        feedback.className = "copy-feedback";
        feedback.textContent = "Copied!";
        copyButton.appendChild(feedback);
        copyButton.onclick = (e) => {
          copyText(fileName, copyButton);
        };
        fileActions.appendChild(copyButton);
      }

      const deleteButton = document.createElement("button");
      deleteButton.className = "action-button delete-button";
      deleteButton.innerHTML = "🗑️";
      deleteButton.title = "Remove file";
      deleteButton.onclick = () => removeFile(fileName);
      fileActions.appendChild(deleteButton);

      fileItem.appendChild(fileInfo);
      fileItem.appendChild(fileActions);

      if (fileData.status === "loading") {
        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";
        const progress = document.createElement("div");
        progress.className = "progress";
        progressBar.appendChild(progress);
        fileItem.appendChild(progressBar);
      }

      if (fileData.status === "error") {
        const errorMessage = document.createElement("div");
        errorMessage.className = "error-message";
        errorMessage.textContent = fileData.error || "Error processing file";
        fileItem.appendChild(errorMessage);
      }

      filesList.appendChild(fileItem);
    });
  }

  function copyText(fileName, buttonEl) {
    const fileData = uploadedFiles.get(fileName);
    if (fileData && fileData.text) {
      const textToCopy = `File: ${fileName}\n${fileData.text}`;
      navigator.clipboard
        .writeText(textToCopy)
        .then(function () {
          buttonEl.classList.add("copied");
          setTimeout(() => {
            buttonEl.classList.remove("copied");
          }, 1200);
        })
        .catch(function (err) {
          console.error("Failed to copy text: ", err);
        });
    }
  }

  function handleCopyAll(e) {
    e.preventDefault();
    let allText = "";
    let hasReadyFiles = false;

    uploadedFiles.forEach((fileData, fileName) => {
      if (fileData.status === "ready") {
        allText += `File: ${fileName}\n${fileData.text}\n\n`;
        hasReadyFiles = true;
      }
    });

    if (!hasReadyFiles) {
      alert("No files ready to copy");
      return;
    }

    navigator.clipboard
      .writeText(allText.trim())
      .then(() => {
        copyAllBtn.classList.add("copied");
        setTimeout(() => {
          copyAllBtn.classList.remove("copied");
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy all text:", err);
        alert("Failed to copy text to clipboard");
      });
  }

  function removeFile(fileName) {
    uploadedFiles.delete(fileName);
    updateFilesList();
    saveFilesToStorage();
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Log popup dimensions
  console.log(
    "Popup width:",
    document.body.offsetWidth,
    "height:",
    document.body.offsetHeight
  );

  // Log all elements in the body
  console.log(
    "All elements in body:",
    Array.from(document.body.children).map((e) => e.tagName)
  );
});
