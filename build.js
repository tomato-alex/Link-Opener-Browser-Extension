// build.js
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const option = args.includes("firefox") ? "firefox" : "chrome";

// Define manifest file paths
const manifestPath = path.join("./", "manifest.json");
const commonManifestPath = path.join("./", "manifest.common.json");
const chromeManifestPath = path.join("./", "manifest.chrome.json");
const firefoxManifestPath = path.join("./", "manifest.firefox.json");

// Determine which manifest to use
const manifestToUse =
    option === "firefox" ? firefoxManifestPath : chromeManifestPath;

try {
    const commonManifest = JSON.parse(
        fs.readFileSync(commonManifestPath, "utf8")
    );

    const specificManifest = JSON.parse(fs.readFileSync(manifestToUse, "utf8"));

    const finalManifest = {
        ...commonManifest,
        ...specificManifest,
    };

    fs.writeFileSync(manifestPath, JSON.stringify(finalManifest, null, 2));

    console.log("Manifest merged successfully.");
} catch (error) {
    console.error("Error merging manifests:", error);
}
