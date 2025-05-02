// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: 'popup/popup.html'
  });
});

// Listen for messages from the app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);
  
  if (request.action === "fileUploadRequest") {
    console.log("File upload requested by app");
    // Acknowledge the request
    sendResponse({ status: "upload_requested" });
    return true;
  }
  
  if (request.action === "fileUploaded") {
    console.log("File upload completed:", request.fileName);
    // Store temporary data about uploaded files
    sendResponse({ status: "upload_acknowledged" });
    return true;
  }
});

console.log("Background script initialized"); 