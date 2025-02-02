# Link Opener Browser Extension

![image](https://github.com/user-attachments/assets/a9628c96-9142-4cda-aafc-8454ad1d20dd)


_Work in progress_

A simple extension, which exports all open tabs in the session to a `.txt` file and can open links from a `.txt` file.

Created because I have a lot of tabs. Also I always wondered how to create a browser extension and now I know.

Why not just use session restore or sync between devices or `Ctrl/Cmd + Shift + t`? There might be different use cases like privacy oriented browsers, incognito mode, sync between devices without the need of authentification, backups, opening predefined set of tabs or similar.

---

### How-to


- Run the build process

  ```
    node build.js
  ```
  Note: NPM is not needed, as well as package.json as this runs a simple non-module script. (See Section Problems for an explanation) 

-   Clone this repository

    -   Chrome

        1.  Open `chrome://extensions/`
        1.  Enable `Developer mode` (top right)
        1.  Click `Load Unpacked`
        1.  Select the Chrome folder

    -   Firefox
        1.  Open `about:debugging#/runtime/this-firefox`
        1.  Click `Load Temporary Add-on...`
        1.  Select the `manifest.json` file from the Firefox folder

-   Voilà, you can now use it

---

### Problems

Firefox and Chrome use different manifest versions, but an extension must have a specific manifest.json file. The build script just replaces the contents of manifest.json with the specific chrome or firefox attributes.

Firefox does not currently support manifest v3 _entirely_ and as such the serviceWorker is currently disabled and the extension cannot be loaded in. 

---

### To-dos

-   [ ] Dark Mode (Toggle + context from browser or system)
-   [ ] Extension Icon
-   [x] Support different browsers
-   [ ] Add a `.crx` file for easier installation Chromeium
-   [ ] Add a `zip` archive for easier installation on FF and not as a temporary add-on
-   [ ] Add support for tab groups
-   [ ] CSV or JSON export (for those tab groups)
-   [ ] Simplify Build process to minimize code duplication (for example store version and other metadata separate from manifest version)
-   [x] Create a simple build program for packaging into crx or zip and changing the manifest file
-   [x] tidy up the UI
-   [ ] Drag and drop UI
-   [ ] Keyboard shortcut
