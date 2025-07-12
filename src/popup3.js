// popup.js (formerly popup2.js)

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// DarkModeToggle remains as is if you want dark mode in the popup too.
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
 * Simplified File Handler for popup
 * Now only triggers opening the options page for import.
 * Export logic remains.
 */
class PopupHandler {
    constructor() {
        this.fileInput = document.getElementById("fileInput");
        this.openLinksButton = document.getElementById("openLinks"); // This button will now be disabled/hidden
        this.fileNameDisplay = document.getElementById("fileName");

        // We only want to open the options page when the file input is clicked
        // The actual file selection and processing will happen on the options page
        this.fileInput.addEventListener("click", () => {
            browserAPI.runtime.openOptionsPage();
        });

        // Disable or hide the openLinks button in the popup, as import is handled in options
        if (this.openLinksButton) {
            this.openLinksButton.style.display = "none"; // Hide it
            // Or just ensure it's always disabled:
            // this.openLinksButton.disabled = true;
            // this.openLinksButton.classList.add("disabled");
        }
        if (this.fileNameDisplay) {
            this.fileNameDisplay.style.display = "none"; // Hide file name display
        }
    }
}

/**
 * Tab Exporter (remains in popup)
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
            browserAPI.tabs.query({ currentWindow: true }, resolve);
        });
    }

    async getGroupInfo(groupId) {
        return new Promise((resolve) => {
            browserAPI.tabGroups.get(groupId, (group) => {
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
        // Group tabs by groupId
        const groupedTabs = tabs.reduce((acc, tab) => {
            const groupId = tab.groupId === -1 ? "ungrouped" : tab.groupId;
            if (!acc[groupId]) {
                acc[groupId] = [];
            }
            acc[groupId].push(tab);
            return acc;
        }, {});

        for (const groupId in groupedTabs) {
            if (groupId === "ungrouped") {
                groupedTabs[groupId].forEach((tab) => {
                    tabDetails.push({
                        id: tab.id,
                        url: tab.url,
                        title: tab.title,
                        active: tab.active,
                        pinned: tab.pinned,
                    });
                });
            } else {
                const firstTabInGroup = groupedTabs[groupId][0];
                const group = await this.getGroupInfo(parseInt(groupId));
                tabDetails.push({
                    id: parseInt(groupId),
                    title: group.title,
                    color: group.color,
                    tabs: groupedTabs[groupId].map((tab) => ({
                        id: tab.id,
                        url: tab.url,
                        title: tab.title,
                        active: tab.active,
                        pinned: tab.pinned,
                    })),
                });
            }
        }

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
            .replace(/[:.]/g, "-")}.${extension}`; // Sanitize filename for colons and periods

        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize classes on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("initializing popup");
    new DarkModeToggle();
    new PopupHandler(); // Simplified handler for the popup
    new TabExporter();
});
