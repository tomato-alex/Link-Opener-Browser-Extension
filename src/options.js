// options.js

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

/**
 * Dark Mode Toggler (copied from popup.js for consistency on options page)
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
 * Options Page Handler
 * Manages file input, parsing, visualization, and opening links.
 */
class OptionsPageHandler {
    constructor() {
        this.fileInput = document.getElementById("fileInput");
        this.openLinksButton = document.getElementById("openLinks");
        this.fileNameDisplay = document.getElementById("fileName");
        this.visualizationContainer = document.getElementById(
            "visualizationContainer"
        );
        this.visualizationMessage = document.getElementById(
            "visualizationMessage"
        );

        this.loadedFileContent = null; // Store parsed links/data for visualization/opening
        this.fileType = null;

        this.addEventListeners();
        this.updateButtonsState(); // Initial state
    }

    addEventListeners() {
        this.fileInput.addEventListener("change", () =>
            this.handleFileSelect()
        );
        this.openLinksButton.addEventListener("click", () =>
            this.handleOpenLinks()
        );
        // Delegate event listener for collapsible groups and remove buttons
        this.visualizationContainer.addEventListener("click", (event) => {
            // Handle group header clicks for collapsing
            if (
                event.target.closest(".group-header-title") ||
                event.target.closest(".toggle-icon")
            ) {
                console.log("container listener");

                const groupHeader =
                    event.target.closest(".group-header-title") ||
                    event.target.closest(".toggle-icon");
                const groupDiv = groupHeader.closest(".tab-group");
                groupDiv.classList.toggle("collapsed");
            }
            // Handle remove button clicks
            if (event.target.classList.contains("remove-button")) {
                const button = event.target;
                const type = button.dataset.type; // 'tab' or 'group'
                const index = parseInt(button.dataset.index);
                const groupIndex = parseInt(button.dataset.groupIndex);

                if (type === "tab") {
                    this.removeTab(groupIndex, index);
                } else if (type === "group") {
                    this.removeGroup(groupIndex);
                }
            }
        });
    }

    updateButtonsState() {
        const hasFile = this.fileInput.files.length > 0;
        // Open Links button is enabled only if there's content to open
        this.openLinksButton.disabled = !(
            this.loadedFileContent &&
            this.loadedFileContent.some((group) => group.tabs.length > 0)
        );
    }

    async handleFileSelect() {
        const file = this.fileInput.files[0];
        if (!file) {
            this.fileNameDisplay.textContent = "No file selected";
            this.visualizationContainer.innerHTML = `<p class="info-message" id="visualizationMessage">Upload a file to see the links visualized here.</p>`;
            this.loadedFileContent = null;
            this.fileType = null;
            this.updateButtonsState();
            return;
        }

        this.fileNameDisplay.textContent = `Loaded: ${file.name}`;
        this.updateButtonsState();

        const fileExtension = file.name.split(".").pop().toLowerCase();
        this.fileType = fileExtension;

        try {
            const fileContent = await this.readFileContent(file);
            let parsedData;

            switch (fileExtension) {
                case "txt":
                    parsedData = this.parseTxtContent(fileContent);
                    break;
                case "json":
                    parsedData = this.parseJsonContent(fileContent);
                    break;
                default:
                    alert(
                        "Unsupported file type. Please upload a .txt or .json file."
                    );
                    this.loadedFileContent = null;
                    this.fileType = null;
                    return;
            }
            this.loadedFileContent = parsedData;
            this.visualizeLinks(); // Automatically visualize after file selection
        } catch (error) {
            console.error("Error processing file:", error);
            alert(
                "An error occurred while processing the file. Check console for details."
            );
            this.loadedFileContent = null;
            this.fileType = null;
            this.updateButtonsState();
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

    parseTxtContent(content) {
        const links = content.match(/https?:\/\/[^\s]+/g) || [];
        return [
            {
                title: "Ungrouped Links",
                tabs: links.map((url) => ({
                    url: url,
                    title: this.getHostname(url),
                })),
            },
        ];
    }

    parseJsonContent(content) {
        let jsonData = JSON.parse(content);

        if (!Array.isArray(jsonData)) {
            jsonData = [jsonData];
        }

        const visualizedGroups = [];
        const ungroupedTabs = [];

        for (const item of jsonData) {
            if (item.url && !item.tabs) {
                ungroupedTabs.push({
                    url: item.url,
                    title: item.title || this.getHostname(item.url),
                });
            } else if (item.tabs && Array.isArray(item.tabs)) {
                visualizedGroups.push({
                    title: item.title || "Untitled Group",
                    color: item.color || "grey",
                    tabs: item.tabs.map((tabData) => ({
                        url: tabData.url,
                        title: tabData.title || this.getHostname(tabData.url),
                    })),
                });
            } else {
                console.warn(
                    "Skipping item: Invalid format for visualization",
                    item
                );
            }
        }

        if (ungroupedTabs.length > 0) {
            visualizedGroups.unshift({
                title: "Ungrouped Links",
                color: "grey",
                tabs: ungroupedTabs,
            });
        }
        return visualizedGroups;
    }

    getHostname(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url; // Fallback if not a valid URL
        }
    }

    visualizeLinks() {
        this.visualizationContainer.innerHTML = ""; // Clear previous visualization

        if (
            !this.loadedFileContent ||
            this.loadedFileContent.length === 0 ||
            !this.loadedFileContent.some((group) => group.tabs.length > 0)
        ) {
            this.visualizationContainer.innerHTML = `<p class="info-message" id="visualizationMessage">No links to visualize.</p>`;
            this.updateButtonsState();
            return;
        }

        // Sort groups to put "Ungrouped Links" first if it exists
        this.loadedFileContent.sort((a, b) => {
            if (a.title === "Ungrouped Links") return -1;
            if (b.title === "Ungrouped Links") return 1;
            return 0;
        });

        this.loadedFileContent.forEach((groupData, groupIndex) => {
            if (groupData.tabs.length === 0) return; // Skip empty groups after removals

            const groupDiv = document.createElement("div");
            groupDiv.className = "tab-group";
            if (groupData.color && groupData.color !== "grey") {
                groupDiv.style.borderLeftColor = groupData.color;
            }

            const groupHeader = document.createElement("h4");
            groupHeader.className = "group-header";
            const toggleIcon = document.createElement("span");
            toggleIcon.className = "toggle-icon";
            toggleIcon.textContent = "▼"; // Down arrow
            groupHeader.appendChild(toggleIcon);

            const titleSpan = document.createElement("span");
            titleSpan.className = "group-header-title"; // clickable area
            titleSpan.textContent = groupData.title;
            groupHeader.appendChild(titleSpan);

            const countSpan = document.createElement("span");
            countSpan.className = "tab-count";
            countSpan.textContent = ` (${groupData.tabs.length} tabs)`;
            groupHeader.appendChild(countSpan);

            const headerActions = document.createElement("div");
            headerActions.className = "group-header-actions";

            if (groupData.title !== "Ungrouped Links") {
                // Allow removing entire user-defined groups
                const removeGroupButton = document.createElement("button");
                removeGroupButton.className = "remove-button";
                removeGroupButton.textContent = "Remove Group";
                removeGroupButton.dataset.type = "group";
                removeGroupButton.dataset.groupIndex = groupIndex;
                headerActions.appendChild(removeGroupButton);
            }
            groupHeader.appendChild(headerActions);
            groupDiv.appendChild(groupHeader);

            const tabList = document.createElement("div");
            tabList.className = "tab-list";

            groupData.tabs.forEach((tabItem, tabIndex) => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "tab-item";

                // No image for favicon as requested

                const link = document.createElement("a");
                link.href = tabItem.url;
                link.textContent = tabItem.title || tabItem.url;
                link.target = "_blank";
                itemDiv.appendChild(link);

                const removeTabButton = document.createElement("button");
                removeTabButton.className = "remove-button";
                removeTabButton.textContent = "X"; // Shorter text for individual tabs
                removeTabButton.dataset.type = "tab";
                removeTabButton.dataset.groupIndex = groupIndex;
                removeTabButton.dataset.index = tabIndex;
                itemDiv.appendChild(removeTabButton);

                tabList.appendChild(itemDiv);
            });
            groupDiv.appendChild(tabList);
            this.visualizationContainer.appendChild(groupDiv);
        });
        this.updateButtonsState(); // Update state after visualization (e.g., if all tabs were removed)
    }

    removeTab(groupIndex, tabIndex) {
        if (
            this.loadedFileContent[groupIndex] &&
            this.loadedFileContent[groupIndex].tabs[tabIndex]
        ) {
            this.loadedFileContent[groupIndex].tabs.splice(tabIndex, 1);
            this.visualizeLinks(); // Re-render the visualization
        }
    }

    removeGroup(groupIndex) {
        if (this.loadedFileContent[groupIndex]) {
            // Remove the group entirely
            this.loadedFileContent.splice(groupIndex, 1);
            this.visualizeLinks(); // Re-render the visualization
        }
    }

    async handleOpenLinks() {
        if (
            !this.loadedFileContent ||
            !this.loadedFileContent.some((group) => group.tabs.length > 0)
        ) {
            alert(
                "No links to open. Please upload a file or ensure groups are not empty."
            );
            return;
        }

        if (
            confirm(
                "Are you sure you want to open all visible links in new tabs?"
            )
        ) {
            for (const group of this.loadedFileContent) {
                const tabIds = [];
                for (const tabData of group.tabs) {
                    if (tabData.url) {
                        try {
                            const newTab = await browserAPI.tabs.create({
                                url: tabData.url,
                                active: false,
                            });
                            tabIds.push(newTab.id);
                        } catch (error) {
                            console.error(
                                "Error opening tab:",
                                tabData.url,
                                error
                            );
                        }
                    }
                }
                // Only group if it's an actual group AND there are tabs to group
                if (tabIds.length > 0 && group.title !== "Ungrouped Links") {
                    try {
                        const newGroup = await browserAPI.tabs.group({
                            tabIds: tabIds,
                        });
                        await browserAPI.tabGroups.update(newGroup, {
                            title: group.title,
                            color: group.color,
                        });
                    } catch (error) {
                        console.error(
                            "Error creating tab group:",
                            group.title,
                            error
                        );
                    }
                }
            }
            alert("Links opened successfully!");

            try {
                // Find the current tab (which is the options page)
                const tabs = await browserAPI.tabs.query({
                    currentWindow: true,
                    active: true,
                });
                if (tabs.length > 0) {
                    // Close the currently active tab
                    await browserAPI.tabs.remove(tabs[0].id);
                }
            } catch (error) {
                console.error("Error closing the options tab:", error);
            }
            // Optionally, clear visualization after opening links
            this.fileInput.value = ""; // Clear file input
            this.loadedFileContent = null;
            this.updateButtonsState();
            this.visualizationContainer.innerHTML = `<p class="info-message">Upload a file to see the links visualized here.</p>`;
        }
    }
}

// Initialize classes on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("initializing options page");
    new DarkModeToggle();
    new OptionsPageHandler();
});
