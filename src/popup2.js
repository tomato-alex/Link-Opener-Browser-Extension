// popup.js

/**
 * Dark Mode Toggler
 * Handles the logic for enabling and disabling dark mode.
 */
class DarkModeToggle {
    constructor() {
        this.darkModeToggle = document.getElementById("darkModeToggle");
        this.body = document.body;
        this.init();
    }

    init() {
        this.loadDarkModeState();
        this.addEventListeners();
    }

    loadDarkModeState() {
        if (localStorage.getItem("darkMode") === "enabled") {
            this.body.classList.add("dark-mode");
            this.darkModeToggle.checked = true;
        }
    }

    addEventListeners() {
        this.darkModeToggle.addEventListener("change", () => {
            if (this.darkModeToggle.checked) {
                this.body.classList.add("dark-mode");
                localStorage.setItem("darkMode", "enabled");
            } else {
                this.body.classList.remove("dark-mode");
                localStorage.setItem("darkMode", "disabled");
            }
        });
    }
}

/**
 * File Handler
 * Manages file input, parsing, and opening links based on file type.
 */
class FileHandler {
    constructor() {
        this.fileInput = document.getElementById("fileInput");
        this.openLinksButton = document.getElementById("openLinks");
        this.fileNameDisplay = document.getElementById("fileName");
        this.addEventListeners();
    }

    addEventListeners() {
        this.openLinksButton.addEventListener("click", () =>
            this.handleOpenLinks()
        );
        this.fileInput.addEventListener("change", () =>
            this.updateFileInputDisplay()
        );
    }

    async handleOpenLinks() {
        const file = this.fileInput.files[0];

        if (!file) {
            alert("Please select a file first.");
            return;
        }

        const fileExtension = file.name.split(".").pop().toLowerCase();

        try {
            switch (fileExtension) {
                case "txt":
                    await this.openTxtFile(file);
                    break;
                case "csv":
                    await this.openCsvFile(file);
                    break;
                case "json":
                    await this.openJsonFile(file);
                    break;
                default:
                    alert(
                        "Unsupported file type. Please upload a .txt, .csv, or .json file."
                    );
            }
        } catch (error) {
            console.error("Error processing file:", error);
            alert("An error occurred while processing the file.");
        }
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    async openTxtFile(file) {
        const fileContent = await this.readFileContent(file);
        const links = fileContent.match(/https?:\/\/[^\s]+/g);

        if (links) {
            for (const link of links) {
                await chrome.tabs.create({ url: link });
            }
        } else {
            alert("No links found in the file.");
        }
    }

    async openCsvFile(file) {
        const fileContent = await this.readFileContent(file);
        const rows = fileContent.split("\n").filter((row) => row.trim() !== ""); // Filter empty rows
        if (rows.length === 0) {
            alert("CSV file is empty or contains no data.");
            return;
        }
        const headers = rows[0].split(",").map((header) => header.trim());

        const data = rows.slice(1).map((row) => {
            const values = row.split(",").map((value) => value.trim());
            let rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = values[index] || "";
            });
            return rowData;
        });

        // Example: process CSV data (you might want to open URLs from a specific column)
        // For demonstration, let's assume one of the headers is 'url' or 'link'
        const urlColumn = headers.find(
            (header) =>
                header.toLowerCase() === "url" ||
                header.toLowerCase() === "link"
        );
        if (urlColumn) {
            for (const row of data) {
                if (row[urlColumn] && row[urlColumn].startsWith("http")) {
                    await chrome.tabs.create({ url: row[urlColumn] });
                }
            }
        } else {
            alert(
                "No 'url' or 'link' column found in the CSV file. Please adjust the CSV format or the script."
            );
        }
    }

    async openJsonFile(file) {
        const fileContent = await this.readFileContent(file);
        const jsonData = JSON.parse(fileContent);

        if (!Array.isArray(jsonData)) {
            alert("JSON file must contain an array of objects.");
            return;
        }

        for (const item of jsonData) {
            if (item.url) {
                await chrome.tabs.create({ url: item.url });
            } else if (item.tabs && Array.isArray(item.tabs)) {
                const tabIds = [];
                for (const tabData of item.tabs) {
                    const newTab = await chrome.tabs.create({
                        url: tabData.url,
                    });
                    tabIds.push(newTab.id);
                }
                if (tabIds.length > 0) {
                    await chrome.tabs.group(
                        { tabIds: tabIds },
                        async (groupId) => {
                            await chrome.tabGroups.update(groupId, {
                                title: item.title,
                                color: item.color,
                            });
                        }
                    );
                }
            } else {
                console.warn("Skipping item: Invalid format", item);
            }
        }
    }

    updateFileInputDisplay() {
        const file = this.fileInput.files[0];
        if (file) {
            this.fileNameDisplay.textContent = `Loaded file: ${file.name}`;
            this.openLinksButton.classList.remove("disabled");
            this.openLinksButton.disabled = false;
        } else {
            this.fileNameDisplay.textContent = "";
            this.openLinksButton.classList.add("disabled");
            this.openLinksButton.disabled = true;
        }
    }
}

/**
 * Tab Exporter
 * Handles the logic for exporting open tabs to different file formats.
 */
class TabExporter {
    constructor() {
        this.exportTxtButton = document.getElementById("exportTabsTxt");
        this.exportCsvButton = document.getElementById("exportTabsCsv");
        this.exportJsonButton = document.getElementById("exportTabsJson");
        this.addEventListeners();
    }

    addEventListeners() {
        this.exportTxtButton.addEventListener("click", () =>
            this.exportTabs("txt")
        );
        this.exportCsvButton.addEventListener("click", () =>
            this.exportTabs("csv")
        );
        this.exportJsonButton.addEventListener("click", () =>
            this.exportTabs("json")
        );
    }

    async getTabsInCurrentWindow() {
        return new Promise((resolve) => {
            chrome.tabs.query({ currentWindow: true }, resolve);
        });
    }

    async getGroupInfo(groupId) {
        return new Promise((resolve) => {
            chrome.tabGroups.get(groupId, (group) => {
                resolve({ title: group.title, color: group.color });
            });
        });
    }

    async exportTxt(tabs) {
        return {
            content: tabs.map((tab) => tab.url).join("\n"),
            fileType: "txt",
        };
    }

    async exportCsv(tabs) {
        let csvRows = ["Tab URL,Group"];
        for (const tab of tabs) {
            let groupName = "";
            if (tab.groupId !== -1) {
                const group = await this.getGroupInfo(tab.groupId);
                groupName = group.title;
            }
            csvRows.push(`${tab.url},"${groupName.replace(/"/g, '""')}"`); // Handle commas in group names
        }
        return {
            content: csvRows.join("\n"),
            fileType: "csv",
        };
    }

    async exportJson(tabs) {
        let tabDetails = [];
        for (const tab of tabs) {
            let tabRecord = {
                id: tab.id,
                url: tab.url,
                title: tab.title,
                active: tab.active,
                pinned: tab.pinned,
            };

            if (tab.groupId !== -1) {
                const group = await this.getGroupInfo(tab.groupId);
                let groupEntry = tabDetails.find(
                    (g) => g.id === tab.groupId && g.tabs !== undefined // Ensure it's a group entry
                );

                if (!groupEntry) {
                    groupEntry = {
                        id: tab.groupId,
                        title: group.title,
                        color: group.color,
                        tabs: [],
                    };
                    tabDetails.push(groupEntry);
                }
                groupEntry.tabs.push(tabRecord);
            } else {
                // For non-grouped tabs, add them directly if they aren't part of a group
                // To avoid duplicates if the logic for finding groupEntry changes, explicitly check
                const isAlreadyInGroup = tabDetails.some(
                    (item) =>
                        item.tabs && item.tabs.some((t) => t.id === tab.id)
                );
                if (!isAlreadyInGroup) {
                    tabDetails.push(tabRecord);
                }
            }
        }
        // Filter out any empty group objects that might have been created without tabs
        tabDetails = tabDetails.filter(
            (item) => item.tabs === undefined || item.tabs.length > 0
        );
        return {
            content: JSON.stringify(tabDetails, null, 2),
            fileType: "json",
        };
    }

    async exportTabs(format) {
        const tabs = await this.getTabsInCurrentWindow();
        let output = {
            content: "",
            fileType: format,
        };

        switch (format) {
            case "txt":
                output = await this.exportTxt(tabs);
                break;
            case "csv":
                output = await this.exportCsv(tabs);
                break;
            case "json":
                output = await this.exportJson(tabs);
                break;
        }

        this.downloadFile(output.content, output.fileType);
    }

    downloadFile(content, fileType) {
        let blobType = "";
        let extension = "";

        switch (fileType) {
            case "txt":
                blobType = "text/plain";
                extension = "txt";
                break;
            case "csv":
                blobType = "text/csv";
                extension = "csv";
                break;
            case "json":
                blobType = "application/json";
                extension = "json";
                break;
            default:
                blobType = "text/plain";
                extension = "txt";
        }

        const blob = new Blob([content], { type: blobType });
        const fileName = `open_tabs_${new Date()
            .toISOString()
            .replace(/:/g, "-")}.${extension}`; // Sanitize filename for colons

        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a); // Append to body to ensure it's clickable in all browsers
        a.click();
        document.body.removeChild(a); // Clean up
        URL.revokeObjectURL(url);
    }
}

// Initialize classes on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("initializing all");
    new DarkModeToggle();
    new FileHandler();
    new TabExporter();
});
