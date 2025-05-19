# 🦞 Lobster

## Link Opener - A Simple Tab Session Saver and Restorer

![Screenshot 1](https://github.com/user-attachments/assets/b375a818-368e-498f-ba99-0c8727dc6fb3) | ![Screenshot 2](https://github.com/user-attachments/assets/b591500b-4569-4615-91e7-760a16d63497)

> _A simple, privacy-friendly tool to save and reopen browser sessions – with tab groups support on Chrome._

---

### ✅ Features

-   Export all open tabs to a `.txt` file
-   Open links from a `.txt` file
-   Export and import **tab groups** (Chrome only) via `.json`
-   Dark mode toggle + system/browser preference
-   Minimal, distraction-free UI

Created because I have way too many tabs, wanted more control over sessions, and always wanted to build a browser extension.

---

## 🖥️ Why Not Use Built-In Sync?

This extension shines in scenarios like:

-   Using **incognito** or privacy-focused browsers
-   Working across devices **without login/sync**
-   Wanting to **save specific tab groups** as named presets
-   Creating **backups** of your browsing sessions
-   Avoiding reliance on `Ctrl/Cmd + Shift + T` or browser restore

---

## 🚧 Current Status

-   ✅ **Chrome:** Fully functional
-   🕓 **Firefox:** Pending support for [API 139 Tab Groups](https://bugzilla.mozilla.org/show_bug.cgi?id=1857200)
    -   Supports `.txt` export and import
    -   Workaround in place for import window issues and manifest v3 limitations, utilizing manifest v2 build process.

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/tomato-alex/lobster.git
cd lobster
```

### 2. Run the build script

```bash
node build.js # For Chrome (default)
node build.js -o firefox # For Firefox
```

> ℹ️ No NPM install or `package.json` needed. This is a simple build script that swaps the manifest file based on the target browser.

### 3. Load the extension

#### 🕶 Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the extension folder

#### 🦊 Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select the \`manifest.json\` from the working directory (extension folder)

---

## 🛠️ Known Issues and Shortcomings

-   Firefox:
    -   No tab group support yet (coming in API 139)
    -   File picker causes popup to close – move logic to background script
    -   Incomplete support for Manifest V3 and `serviceWorker`
-   Manifest differences between Chrome and Firefox require dynamic replacement (`build.js` handles this)

---

## 📋 To-Do

### 🌍 Core Functionality

-   [x] Dark Mode toggle
-   [x] New extension icon
-   [x] Support Chrome and Firefox
-   [x] Export/import tab groups (`.json`)
-   [x] Simplify build script
-   [x] Clean up UI
-   [ ] Drag & Drop support
-   [ ] Keyboard shortcuts
-   [ ] Distinguish between `chrome` and `browser` APIs in code (this might not be needed)
-   [ ] Rename \`build.js\` to something more fun (`lobster.js`?)

### 📦 Packaging

-   [ ] Create `.crx` file for easier Chrome installation
-   [ ] Create `.zip` for simpler Firefox install

---

## 🧪 Not Yet Possible (Or Practical)

-   **CSV Export:**  
    Technically feasible, but currently disabled. Exporting tab groups in a structured way makes more sense with `.json` for now. If future API changes allow stable group operations across browsers, CSV might be reintroduced.

---

## About

Built for fun, function, and out of a bit of tab-hoarding desperation.
Feel free to fork, improve, or contribute!
