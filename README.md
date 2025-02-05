# Link Opener Browser Extension

![image](https://github.com/user-attachments/assets/b375a818-368e-498f-ba99-0c8727dc6fb3) | ![image](https://github.com/user-attachments/assets/b591500b-4569-4615-91e7-760a16d63497)



_Work in progress_

A simple extension, which exports all open tabs in the session to a `.txt` file and can open links from a `.txt` file.

Created because I have a lot of tabs. Also I always wondered how to create a browser extension and now I know.

Why not just use session restore or sync between devices or `Ctrl/Cmd + Shift + t`? There might be different use cases like privacy oriented browsers, incognito mode, sync between devices without the need of authentification, backups, opening predefined set of tabs or similar.

---

### How-to

-   Clone this repository

-   Run the build process

    ```
      node build.js
    ```

    or for Firefox

    ```
      node build.js -o firefox
    ```

    Note: NPM is not needed, as well as package.json as this runs a simple non-module script. (See Section Problems for an explanation)

- Importing the extension

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

-   [x] Dark Mode (Toggle + context from browser or system)
-   [x] Extension Icon
-   [x] Support different browsers
-   [ ] Add a `.crx` file for easier installation Chromeium
-   [ ] Add a `zip` archive for easier installation on FF and not as a temporary add-on
-   [x] Simplify Build process to minimize code duplication
-   [x] Create a simple build program for packaging into crx or zip and changing the manifest file
-   [x] Tidy up the UI
-   [ ] Drag and drop UI
-   [ ] Keyboard shortcut

### Not currently possible or viable

-   Add support for tab groups
-   CSV or JSON export (for those tab groups)

It only makes sense to export to those formats if support for groups is added. Currently the chrome documentation does not point towards a way to programatically create [tab groups](https://developer.chrome.com/docs/extensions/reference/api/tabGroups#method-update). Otherwise, a simple list of files is sufficient. However tab support outlines have been defined and the method to export to csv works, but is disabled. As such, also only .txt files are accepted.
