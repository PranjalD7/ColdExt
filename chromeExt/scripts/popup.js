document.addEventListener("DOMContentLoaded", function () {
  var pdfUploader = document.getElementById("pdfUploader");
  var jobDescriptionField = document.getElementById("jobDescription");
  var resultContainer = document.getElementById("resultContainer");
  var submitButton = document.getElementById("submit");

  submitButton.addEventListener("click", function (event) {
    event.preventDefault();
    var file = pdfUploader.files[0];
    var jobDescription = jobDescriptionField.value;

    if (file && file.type === "application/pdf") {
      var reader = new FileReader();

      reader.onload = function (e) {
        var pdfDataUrl = e.target.result;
        chrome.runtime.sendMessage({
          action: "processPDF",
          pdfDataUrl: pdfDataUrl,
          jobDescription: jobDescription,
        });
      };

      reader.onerror = function (e) {
        console.error("Error reading PDF: ", e);
      };

      reader.readAsDataURL(file); // Convert the file to a Data URL.
    } else {
      console.log("Please upload a PDF file.");
    }
  });

  chrome.runtime.onMessage.addListener(function (message) {
    console.log("popup listener working");
    if (
      message.action === "processComplete" &&
      message.tabId === chrome.tabs.TAB_ID_NONE
    ) {
      console.log("done hai");
      resultContainer.innerHTML = "";
      const link = document.createElement("a");
      link.href = message.emailLink;
      link.textContent = "Open Email Draft";
      link.target = "_blank";
      resultContainer.appendChild(link);
    }
  });
});
