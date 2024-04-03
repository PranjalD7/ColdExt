function dataURLtoBlob(dataURL) {
  var byteString = atob(dataURL.split(",")[1]);
  var mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
chrome.runtime.onStartup.addListener( () => {
  console.log(`onStartup()`);
});

chrome.runtime.onMessage.addListener(function (message) {
  if (message.action === "processPDF") {
    var blob = dataURLtoBlob(message.pdfDataUrl); // Convert Data URL to a Blob
    var formData = new FormData();
    formData.append("pdf", blob, "uploaded-file.pdf");
    formData.append("jobDescription", message.jobDescription);

    fetch("http://localhost:8080/generate-email", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      // ...
      .then((data) => {
        console.log("Server response received"); // You are seeing this in the console
        let subject = encodeURIComponent("Job Application");
        let body = encodeURIComponent(data.email);
        let emailLink = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
        console.log("Email link constructed: ", emailLink); // Check if email link is constructed

        chrome.tabs.create({ url: emailLink }, function (tab) {
          // The new tab with the email link is now opened
          console.log(`New tab launched with id: ${tab.id}`);
        });

      
      })
      .catch((error) => {
        console.error("Error in fetch or subsequent processing:", error);
      });
  }
});
async function createOffscreen() {
  await chrome.offscreen
    .createDocument({
      url: chrome.runtime.getURL("offscreen.html"),
      reasons: ["BLOBS"],
      justification: "Keep the service worker running",
    })
    .catch(console.error);
}
chrome.runtime.onStartup.addListener(() => {
  createOffscreen();
});

chrome.runtime.onInstalled.addListener(() => {
  createOffscreen();
});

// Keep the service worker running by handling the offscreen postMessage event
self.onmessage = (event) => {
  if (event.data === "keepAlive") {
    // No-op to keep alive, or handle as needed.
  }
};