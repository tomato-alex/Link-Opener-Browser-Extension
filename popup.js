// Function to open links from the uploaded file
document.getElementById("openLinks").addEventListener("click", function () {
    const fileInput = document.getElementById("fileInput").files[0];

    if (!fileInput) {
        alert("Please select a file first.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const fileContent = event.target.result;
        const links = fileContent.match(/https?:\/\/[^\s]+/g); // Extract all URLs

        if (links) {
            links.forEach((link) => {
                chrome.tabs.create({ url: link });
            });
        } else {
            alert("No links found in the file.");
        }
    };

    reader.readAsText(fileInput);
});

// Function to export all open tabs to a text file
document.getElementById("exportTabs").addEventListener("click", function () {
    // Query all open tabs in the current window
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
        const urls = tabs.map((tab) => tab.url).join("\n");

        // Create a Blob with the URLs and prompt the user to download it
        const blob = new Blob([urls], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "open_tabs.txt"; // Filename for the exported tabs
        a.click();

        URL.revokeObjectURL(url); // Clean up after download
    });
});
