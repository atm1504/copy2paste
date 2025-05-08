// Copy Paste File Text Extension - popup.js
// Organized, readable, and well-commented for maintainability

console.log("Copy Paste File Text Extension - popup script loaded");
import * as pdfjsLib from "../lib/pdfjs/pdf.mjs";
import i18n from "./i18n.js";

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
  const clearAllBtn = document.getElementById("clearAllBtn");
  const clearAllFeedback = document.getElementById("clearAllFeedback");
  const errorMessage = document.getElementById("errorMessage");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const themeSwitch = document.querySelector(".theme-switch");
  const themeOptions = document.querySelectorAll(".theme-option");
  const themeSlider = document.querySelector(".theme-slider");
  const languageSelect = document.getElementById("languageSelect");

  // Text elements that need translation
  const appTitle = document.getElementById("appTitle");
  const dragDropText = document.getElementById("dragDropText");
  const supportedFormats = document.getElementById("supportedFormats");
  const processingText = document.getElementById("processingText");
  const copyAllText = document.getElementById("copyAllText");
  const clearAllText = document.getElementById("clearAllText");
  const copyrightText = document.getElementById("copyrightText");

  // --- State: Map of uploaded files ---
  let uploadedFiles = new Map();
  let isProcessing = false;

  // -------------------- Initialization --------------------
  loadFilesFromStorage();
  setupEventListeners();
  initializeTheme();
  initializeLanguage();

  // -------------------- Language Functions --------------------
  function initializeLanguage() {
    console.log("[POPUP] Initializing language...");
    // Initialize i18n module
    const currentLang = i18n.initialize();
    console.log("[POPUP] i18n module initialized with language:", currentLang);

    // Ensure the dropdown value matches the current language
    setTimeout(() => {
      const currentLanguage = i18n.getCurrentLanguage();
      console.log(
        "[POPUP] Ensuring dropdown is set to current language:",
        currentLanguage
      );
      if (languageSelect.value !== currentLanguage) {
        console.log("[POPUP] Fixing dropdown value mismatch");
        languageSelect.value = currentLanguage;
      }
    }, 100);

    // Register language change observer to update UI
    console.log("[POPUP] Registering language change observer");
    i18n.registerObserver((langCode) => {
      console.log("[POPUP] Language change detected in observer:", langCode);
      updateI18nElements();
    });
  }

  // -------------------- Theme Functions --------------------
  function initializeTheme() {
    // Check for saved theme
    const savedTheme = localStorage.getItem("theme") || "system";
    document.body.setAttribute("data-theme", savedTheme);

    // Update active buttons
    const themeButtons = document.querySelectorAll(".theme-btn");
    themeButtons.forEach((btn) => {
      if (btn.getAttribute("data-theme") === savedTheme) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Check for system dark mode if using system theme
    if (savedTheme === "system") {
      checkSystemDarkMode();
    }
  }

  function checkSystemDarkMode() {
    // Check if system is in dark mode
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  function switchTheme(themeValue) {
    // Save theme preference
    localStorage.setItem("theme", themeValue);

    // Apply theme
    document.body.setAttribute("data-theme", themeValue);

    // Update active buttons
    const themeButtons = document.querySelectorAll(".theme-btn");
    themeButtons.forEach((btn) => {
      if (btn.getAttribute("data-theme") === themeValue) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Check for system dark mode if system theme is selected
    if (themeValue === "system") {
      checkSystemDarkMode();
    } else {
      // Remove dark-mode class if not using system theme
      document.body.classList.remove("dark-mode");
    }

    // Add pulse animation to body
    document.body.classList.add("theme-pulse");
    setTimeout(() => {
      document.body.classList.remove("theme-pulse");
    }, 500);
  }

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
      showError("failedToLoad");
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
      showError("failedToSave");
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

    // Clear All button
    clearAllBtn.addEventListener("click", handleClearAll, false);

    // Theme switcher
    const themeButtons = document.querySelectorAll(".theme-btn");
    themeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const themeValue = btn.getAttribute("data-theme");
        switchTheme(themeValue);
      });
    });

    // Listen for system theme changes
    if (window.matchMedia) {
      const colorSchemeQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );
      colorSchemeQuery.addEventListener("change", function () {
        // Only update if the current theme is "system"
        if (document.body.getAttribute("data-theme") === "system") {
          checkSystemDarkMode();
        }
      });
    }

    // Language selector
    languageSelect.addEventListener("change", function (e) {
      i18n.setLanguage(e.target.value);
    });
  }

  // -------------------- UI Helpers --------------------
  function showError(messageName, fileName = "") {
    const message = i18n.translate(`errors.${messageName}`, [fileName]);

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
      showError("wait");
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
        showError("processingFile");
      } finally {
        hideLoading();
      }
    }
  }

  function isValidFileType(file) {
    const validExtensions = [
      ".txt",
      ".pdf",
      ".docx",
      ".doc",
      ".xlsx",
      ".xls",
      ".csv",
      ".json",
      ".js",
      ".html",
      ".css",
      ".xml",
      ".md",
      ".pptx",
      ".ppt",
      ".java",
      ".py",
      ".c",
      ".cpp",
      ".php",
      ".swift",
      ".kt",
      ".ts",
      ".jsx",
      ".tsx",
      ".rb",
      ".go",
      ".rs",
      ".sh",
      ".bat",
      ".sql",
      ".numbers",
      ".pages",
    ];

    // Check by extension first
    const fileName = file.name.toLowerCase();
    const fileExtension = "." + fileName.split(".").pop();

    if (validExtensions.includes(fileExtension)) {
      return true;
    }

    // Check by MIME type
    const validMimeTypes = [
      "text/",
      "application/json",
      "application/javascript",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    for (const mimePrefix of validMimeTypes) {
      if (file.type.startsWith(mimePrefix)) {
        return true;
      }
    }

    // Show unsupported file type error
    showError("unsupportedFile");
    console.warn(`Unsupported file type: ${file.type}`);
    return false;
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
      showError("processingFile");
      return null;
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
    const hasFiles = uploadedFiles.size > 0;
    filesList.style.display = hasFiles ? "block" : "none";
    noFiles.style.display = hasFiles ? "none" : "block";
    copyAllBtn.style.display = hasFiles ? "flex" : "none";
    clearAllBtn.style.display = hasFiles ? "flex" : "none";

    if (!hasFiles) {
      return;
    }

    filesList.innerHTML = "";

    uploadedFiles.forEach((fileData, fileName) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";

      // File info section
      const fileInfo = document.createElement("div");
      fileInfo.className = "file-info";

      // File name container with type label
      const fileNameContainer = document.createElement("div");
      fileNameContainer.className = "file-name-container";

      const name = document.createElement("div");
      name.className = "file-name";
      name.textContent = fileName;
      fileNameContainer.appendChild(name);

      // Add file type label
      const typeLabel = document.createElement("div");
      typeLabel.className = "file-type";
      typeLabel.textContent =
        fileData.fileType || getFileTypeLabel(fileData.file);
      fileNameContainer.appendChild(typeLabel);

      fileInfo.appendChild(fileNameContainer);

      // Add file size
      const size = document.createElement("div");
      size.className = "file-size";
      size.textContent = formatFileSize(fileData.file.size);
      fileInfo.appendChild(size);

      fileItem.appendChild(fileInfo);

      // File actions
      const fileActions = document.createElement("div");
      fileActions.className = "file-actions";

      // Copy button
      const copyButton = document.createElement("button");
      copyButton.className = "action-button copy-button";
      copyButton.innerHTML = '<span style="font-size: 18px;">📄</span>';

      // Create copy feedback with translated text
      const feedback = document.createElement("span");
      feedback.className = "copy-feedback";
      feedback.textContent = i18n.translate("copySuccess");
      copyButton.appendChild(feedback);

      copyButton.onclick = (e) => {
        copyText(fileName, copyButton);
      };
      fileActions.appendChild(copyButton);

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.className = "action-button delete-button";
      deleteButton.innerHTML = '<span style="font-size: 18px;">🗑️</span>';
      deleteButton.onclick = () => {
        removeFile(fileName);
      };
      fileActions.appendChild(deleteButton);

      fileItem.appendChild(fileActions);
      filesList.appendChild(fileItem);
    });
  }

  function copyText(fileName, buttonEl) {
    const fileData = uploadedFiles.get(fileName);
    if (fileData && fileData.text) {
      navigator.clipboard
        .writeText(fileData.text)
        .then(() => {
          buttonEl.classList.add("copied");
          const feedback = buttonEl.querySelector(".copy-feedback");
          feedback.textContent = i18n.translate("copySuccess");

          // Make feedback fully visible with explicit properties
          feedback.style.opacity = "1";
          feedback.style.visibility = "visible";

          // Position the tooltip properly in relation to the file item
          const fileItem = buttonEl.closest(".file-item");
          if (fileItem) {
            // Ensure the file item has proper positioning
            fileItem.style.position = "relative";
          }

          setTimeout(() => {
            buttonEl.classList.remove("copied");

            // After the class is removed, explicitly fade out
            setTimeout(() => {
              feedback.style.opacity = "0";
              feedback.style.visibility = "hidden";
            }, 100);
          }, 2000);
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
          showError("failedToCopy");
        });
    }
  }

  function handleCopyAll(e) {
    e.preventDefault();

    if (uploadedFiles.size === 0) {
      return;
    }

    // Collect all text from uploaded files
    let allText = "";
    uploadedFiles.forEach((fileData, fileName) => {
      allText += `File: ${fileName}\n${fileData.text}\n\n`;
    });

    // Copy to clipboard
    navigator.clipboard
      .writeText(allText)
      .then(function () {
        copyAllBtn.classList.add("copied");
        copyAllFeedback.textContent = i18n.translate("allTextCopied");

        // Make sure the feedback is visible and with maximum opacity
        copyAllFeedback.style.opacity = "1";
        copyAllFeedback.style.visibility = "visible";
        copyAllFeedback.style.display = "block";

        setTimeout(() => {
          copyAllBtn.classList.remove("copied");
          copyAllFeedback.style.opacity = "0";

          // After opacity transition, hide the element completely
          setTimeout(() => {
            copyAllFeedback.style.visibility = "hidden";
          }, 300);
        }, 2000);
      })
      .catch(function (err) {
        console.error("Failed to copy all text: ", err);
        showError("failedToCopyAll");
      });
  }

  function handleClearAll(e) {
    e.preventDefault();

    if (uploadedFiles.size === 0) {
      return;
    }

    // Clear all files from uploadedFiles map
    uploadedFiles.clear();
    updateFilesList();
    saveFilesToStorage();

    // Clear clipboard by writing an empty string
    navigator.clipboard
      .writeText("")
      .then(function () {
        console.log("Clipboard cleared successfully");
      })
      .catch(function (err) {
        console.error("Failed to clear clipboard: ", err);
      });

    // Show feedback
    clearAllBtn.classList.add("cleared");
    clearAllFeedback.textContent = i18n.translate("allFilesCleared");

    // Make sure the feedback is visible and with maximum opacity
    clearAllFeedback.style.opacity = "1";
    clearAllFeedback.style.visibility = "visible";
    clearAllFeedback.style.display = "block";

    setTimeout(() => {
      clearAllBtn.classList.remove("cleared");
      clearAllFeedback.style.opacity = "0";

      // After opacity transition, hide the element completely
      setTimeout(() => {
        clearAllFeedback.style.visibility = "hidden";
      }, 300);
    }, 2000);
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

  // i18n helper functions
  function getMessage(messageName, substitutions = []) {
    console.log(`[POPUP] Getting message for key: "${messageName}"`);
    const message = i18n.translate(messageName, substitutions);
    console.log(`[POPUP] Translated message: "${message}"`);
    return message;
  }

  function updateI18nElements() {
    console.log("[POPUP] Updating all i18n elements in the UI");
    const elements = document.querySelectorAll("[data-i18n]");
    console.log(
      `[POPUP] Found ${elements.length} elements with data-i18n attributes`
    );

    elements.forEach((element) => {
      const messageName = element.getAttribute("data-i18n");
      console.log(`[POPUP] Translating element with key: "${messageName}"`);
      const message = i18n.translate(messageName);
      console.log(
        `[POPUP] Got translation: "${message}" for element:`,
        element.tagName
      );

      if (message) {
        const oldText =
          element.tagName === "INPUT" && element.type === "placeholder"
            ? element.placeholder
            : element.textContent;

        if (element.tagName === "INPUT" && element.type === "placeholder") {
          element.placeholder = message;
        } else {
          element.textContent = message;
        }

        console.log(
          `[POPUP] Element text updated from "${oldText}" to "${message}"`
        );
      } else {
        console.log(`[POPUP] No translation found for key: "${messageName}"`);
      }
    });

    console.log("[POPUP] Finished updating i18n elements");
  }

  // Update UI with localized strings when popup opens
  updateI18nElements();
});
