document.addEventListener("DOMContentLoaded", function () {
  var dragDropArea = document.getElementById("dragDropArea");
  var jobDescriptionField = document.getElementById("jobDescription");


  // Styling changes when dragging files over the drop area
  dragDropArea.addEventListener("dragover", function (event) {
    event.stopPropagation();
    event.preventDefault();
    dragDropArea.classList.add("hover");
    event.dataTransfer.dropEffect = "copy";
  });

  dragDropArea.addEventListener("dragleave", function (event) {
    dragDropArea.classList.remove("hover");
  });

  // Handling file drop
  dragDropArea.addEventListener("drop", function (event) {
    event.stopPropagation();
    event.preventDefault();
    dragDropArea.classList.remove("hover");

    var files = event.dataTransfer.files;
    if (files.length) {
      var file = files[0];
      processFile(file);
    }
  });

  // Click on the dragDropArea to upload files
  dragDropArea.addEventListener("click", function () {
    var hiddenInput = document.createElement("input");
    hiddenInput.type = "file";
    hiddenInput.accept = "application/pdf";
    hiddenInput.style.display = "none";
    hiddenInput.addEventListener("change", function () {
      var file = hiddenInput.files[0];
      processFile(file);
    });
    document.body.appendChild(hiddenInput);
    hiddenInput.click();
  });

  function processFile(file) {
    if (file && file.type === "application/pdf") {
      dragDropArea.style.backgroundColor = '#ccffcc'; 
      var reader = new FileReader();

      reader.onload = function (e) {
        window.selectedPDF = e.target.result; // Save it to a global variable (or better, to your application's state)
        chrome.runtime.sendMessage({
          action: "processPDF",
          pdfDataUrl: window.selectedPDF,
          jobDescription: jobDescriptionField.value,
        });
      };

      reader.onerror = function (e) {
        console.error("Error reading PDF: ", e);
      };

      reader.readAsDataURL(file); // Convert the file to a Data URL.
    } else {
      console.log("The dropped file is not a PDF.");
    }
  }

  


});