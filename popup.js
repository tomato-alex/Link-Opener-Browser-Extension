document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;

    // Check if dark mode was previously enabled (from localStorage)
    if (localStorage.getItem("darkMode") === "enabled") {
        body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }

    // Toggle dark mode when checkbox is clicked
    darkModeToggle.addEventListener("change", () => {
        if (darkModeToggle.checked) {
            body.classList.add("dark-mode");
            localStorage.setItem("darkMode", "enabled");
        } else {
            body.classList.remove("dark-mode");
            localStorage.setItem("darkMode", "disabled");
        }
    });
});

// Function to open links from the uploaded file
document.getElementById("openLinks").addEventListener("click", function () {
    const fileInput = document.getElementById("fileInput").files[0];

    if (!fileInput) {
        alert("Please select a file first.");
        return;
    }

    const fileExtension = fileInput.name.split(".").pop().toLowerCase();

    if (fileExtension == "txt") {
        openTxtFile(fileInput);
    } else if (fileExtension == "csv") {
        openCsvFile(fileInput);
    } else if (fileExtension == "json") {
        openJsonFile(fileInput);
    }
});

function openTxtFile(fileInput) {
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
}

function openCsvFile(fileInput) {
    const reader = new FileReader();

    reader.onload = function (event) {
        const fileContent = event.target.result;
        const rows = fileContent.split("\n");
        const headers = rows[0].split(",");

        const data = rows.slice(1).map((row) => {
            const values = row.split(",");
            let rowData = {};

            // Map each value to the corresponding header
            headers.forEach((header, index) => {
                rowData[header.trim()] = values[index]?.trim();
            });

            return rowData;
        });

        reader.readAsText(fileInput);
    };
}
function openJsonFile(fileInput) {
    const reader = new FileReader();

    reader.onload = async function (event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            console.log("Parsed JSON:", jsonData); // Debug: Check parsed data

            if (!Array.isArray(jsonData)) {
                return;
            }

            for (const item of jsonData) {
                if (item.url) {
                    // It's a single tab
                    await chrome.tabs.create({ url: item.url });
                } else if (item.tabs && Array.isArray(item.tabs)) {
                    // It's a group
                    let tabIds = [];
                    for (const tabData of item.tabs) {
                        const newTab = await chrome.tabs.create({
                            url: tabData.url,
                        });
                        tabIds.push(newTab.id);
                    }

                    // Tab group is created using this, tabGroups.create doesnt exist despite what chatgpt and gemini think.
                    // When its created, do a callback on the created group and add the new tab ids. Old ids dont work (duh)
                    await chrome.tabs.group(
                        {
                            tabIds: tabIds,
                        },
                        async (groupId) => {
                            await chrome.tabGroups.update(groupId, {
                                title: item.title,
                                color: item.color,
                                collapsed: item.collapsed,
                            });
                        }
                    );
                } else {
                    console.warn("Skipping item: Invalid format", item);
                }
            }
        } catch (error) {
            console.error("Error processing JSON file:", error);
        }
    };

    reader.onerror = function (error) {
        console.error("Error reading file:", error);
        alert("Error reading the file.");
    };

    reader.readAsText(fileInput);
}

// Function to export all open tabs to a text file
document.getElementById("exportTabsTxt").addEventListener("click", function () {
    // Query all open tabs in the current window
    console.log("exporting txt");

    chrome.tabs.query({ currentWindow: true }, function (tabs) {
        const urls = tabs.map((tab) => tab.url).join("\n");

        exportTab(urls, "plain");
    });
});

document.getElementById("exportTabsCsv").addEventListener("click", function () {
    // Query all open tabs in the current window
    /*chrome.tabs.query({ currentWindow: true }, function (tabs) {
        const urls = tabs.map((tab) => tab.url).join("\n");

        exportTab(urls, "csv");
    });*/

    console.log("exporting csv");

    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const tabDetails = [];

        tabs.forEach(async (tab) => {
            // Get the group info if available
            const tabGroupId = tab.groupId;
            console.log("tabGroupId", tabGroupId);

            let tabTitle = "";
            let tabGroup = {
                title: "",
                color: "",
            };
            if (tabGroupId !== -1) {
                await getTabName(tabGroupId).then((title) => {
                    tabTitle = title;
                });
            }

            tabDetails.push({
                url: tab.url,
                groupName: tabTitle,
            });

            // If it's the last tab, proceed to save
            if (tabDetails.length === tabs.length) {
                const urls =
                    "Tab URL,Group\n" +
                    tabDetails
                        .map((tab) => `${tab.url}, ${tab.groupName}`)
                        .join("\n");

                exportTab(urls, "csv");
            }
        });
    });
});

document
    .getElementById("exportTabsJson")
    .addEventListener("click", async function () {
        let tabDetails = [];

        // Needed because aparently chrome.tabs.query is async
        // created issues and this is wrapped in a promise.
        const tabs = await new Promise((resolve) =>
            chrome.tabs.query({ currentWindow: true }, resolve)
        );

        for (const tab of tabs) {
            const tabGroupId = tab.groupId;
            let groupTitle = "";
            let groupColor = "";

            let tabRecord = {
                id: tab.id,
                url: tab.url,
                title: tab.title,
                active: tab.active,
                pinned: tab.pinned,
            };

            if (tabGroupId !== -1) {
                const group = await getGroupInfo(tabGroupId);
                groupTitle = group.title;
                groupColor = group.color;

                let groupEntry = tabDetails.find(
                    (group) => group.id === tabGroupId
                );
                if (!groupEntry) {
                    groupEntry = {
                        id: tabGroupId,
                        title: group.title,
                        color: group.color,
                        collapsed: group.collapsed,
                        tabs: [],
                    };
                    tabDetails.push(groupEntry);
                }
                groupEntry.tabs.push(tabRecord);
            } else {
                tabDetails.push(tabRecord);
            }
        }

        console.log("tabDetails", tabDetails);
        exportTab(JSON.stringify(tabDetails, null, 2), "json");
    });

// Helper function to get tab group info
function getGroupInfo(groupId) {
    return new Promise((resolve) => {
        chrome.tabGroups.get(groupId, (group) => {
            resolve({ title: group.title, color: group.color });
        });
    });
}

// Helper function because get is an async operation.
// https://stackoverflow.com/questions/65976883/how-is-async-behavior-useful-if-we-have-to-await-for-the-result-to-proceed

function getTabName(groupId) {
    return new Promise((resolve) => {
        chrome.tabGroups.get(groupId, (group) => {
            resolve(group.title);
        });
    });
}

// Helper function to unify exporting tabs
function exportTab(urls, fileExportType) {
    let blob = new Blob();
    if (fileExportType == "json") {
        console.log("urls", urls);
        blob = new Blob([urls], {
            type: "application/json",
        });
    } else {
        blob = new Blob([urls], { type: "text/" + fileExportType });
    }

    const fileName = `open_tabs_${fileExportType}_${new Date().toISOString()}.`;
    const fileType = fileExportType === "plain" ? "txt" : fileExportType;

    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName + fileType; // Filename for the exported tabs
    a.click();

    URL.revokeObjectURL(url); // Clean up after download
}

// Enable/disable the "Open Links" button based on file input
document.getElementById("fileInput").addEventListener("change", function () {
    const fileNameDisplay = document.getElementById("fileName");
    const openLinksButton = document.getElementById("openLinks");
    const file = fileInput.files[0];
    if (file) {
        fileNameDisplay.textContent = `Loaded file: ${file.name}`;
        openLinksButton.classList.remove("disabled");
        openLinksButton.disabled = false;
    } else {
        fileNameDisplay.textContent = "";
        openLinksButton.classList.add("disabled");
        openLinksButton.disabled = true;
    }
});
