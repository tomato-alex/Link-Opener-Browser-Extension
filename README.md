# Link Opener Browser Extension

![image](https://github.com/user-attachments/assets/4f0d8dd1-a095-46d6-972b-151f50503d1a)

_Work in progress_

A simple extension, which exports all open tabs in the session to a `.txt` file and can open links from a `.txt` file.

Created because I have a lot of tabs. Also I always wondered how to create a browser extension and now I know.

Why not just use session restore or sync between devices or `Ctrl/Cmd + Shift + t`? There might be different use cases like privacy oriented browsers, incognito mode, sync between devices without the need of authentification, backups, opening predefined set of tabs or similar.

---

### How-to

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

Why 2 different extensions? Firefox does not currently support manifest v3 _entirely_ and as such the serviceWorker is currently disabled and the extension cannot be loaded in. There is an option to add a build script or include both extensions as separate installable packages, but as a hobby project this is a next step of maturity which doesn't make sense in the prototyping phase (considerations are being made).

---

### To-dos

[]   Dark Mode (Toggle + context from browser or system)
[]   Extension Icon
[]   Support different browsers
[]   Add a `.crx` file for easier installation Chromeium
[]   Add a `zip` archive for easier installation on FF and not as a temporary add-on
[]   Add support for tab groups
[]   CSV or JSON export (for those tab groups)
[]   Rethink the architecture to minimize duplication (build process)
[]   Create a simple build program for packaging into crx or zip and changing the manifest file
[]   tidy up the UI
