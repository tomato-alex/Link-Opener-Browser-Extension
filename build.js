// build.js
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const option = args.includes("firefox") ? "firefox" : "chrome";

// Define manifest file paths
const manifestPath = path.join("./", "manifest.json");
const chromeManifestPath = path.join("./", "manifest.chrome.json");
const firefoxManifestPath = path.join("./", "manifest.firefox.json");

// Determine which manifest to use
const manifestToUse =
    option === "firefox" ? firefoxManifestPath : chromeManifestPath;

// Replace manifest.json with the correct one
fs.copyFile(manifestToUse, manifestPath, (err) => {
    if (err) {
        console.error("Error replacing manifest:", err);
    } else {
        console.log(`Successfully replaced manifest with ${option} version.`);
    }
});
