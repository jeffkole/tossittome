Changelog
=========

v3.0.6
------
### Server (3.0.6)
* Fixes tossing on pages with strict Content-Security-Policy of script-src.
  Does so by redirecting to a page where the user can complete the toss.
  **Note**: Requires an updated bookmarklet to work properly.

v3.0.5
------
### Server (3.0.5)
* Fixes tossing on pages protected by a Content-Security-Policy of content-src.
  Does so by correctly using an ifram to talk back to the server.

v3.0.4
------
### Server (3.0.4)
* Sends tosses back to the server via HTTPS

v3.0.3
------
### Server (3.0.3)
* Adds about page

v3.0.2
------
### Extension (3.0.2)
* Cleans up the code
* Adds an ID to the extension that is sent back with log messages

v3.0.1
------
### Server (3.0.1)
* Fixes bug with catch history link in extension popup

### Extension (3.0.1)
* Bumps version just for republishing

v3.0.0
------
### Server (3.0.0)
* Distributes the extension through Google Chrome store
* General user interface changes
  * Adds tour to the welcome page
  * Adds small history to the logged in home page
  * Adds getting started links for bookmarklet and extension installations
  * Improves bookmarklet instructions
  * Adds drop down menus to top-level navigation
* Adds history of tosses and catches

### Extension (3.0.0)
* Catch history is displayed in popup
* Historical pages that have been closed are opened from the popup
* Option to open in toss window has been removed
* Historical views open pages in new tab or navigate to an already open tab if
  the extension is active
* Attempts to fix the bug when multiple of the same page are opened
* Logs info from the extension to the server

v2.3.1
------
### Server (2.3.1)
* Fixes bookmarklet dialog on technology.nasa.gov

v2.3.0
------
### Server (2.3.0)
* Adds ability to add new catchers
* Cleans up document title from prior bookmarklet behavior

v2.2.1
------
### Server (2.2.1)
* Fixes look and feel of bookmarklet login on mobile Chrome
* Fixes bug when cancelling login from bookmarklet

v2.2.0
------
### Server (2.2.0)
* Improves font styling consistency in the bookmarklet
* Improves bookmarklet scalability
* Adds version info to the extension download
* Adds /admin/version endpoint
* Uses XHR for login from bookmarklet
* Improves the user experience for iOS users

### Infrastructure
* Updates deploy script to update post-receive hook
* post-receive hook handles branch deletes

v2.1.0
------
### Server (2.1.0)
* Updates the bookmarklet styling to look more like iOS
* Simplifies the bookmarklet installation process
* Includes the stylistic stylings of Scott Forman

### Extension (2.1.0)
* Includes the stylistic stylings of Scott Forman

v2.0.0
------
### Server (2.0.0)
* Updates to the styling
* Accepts POSTs from extension and bookmarklet
* Removes `script` added on bookmarklet initialization

### Extension (2.0.0)
* Requests login via POST

v1.2.3
------
### Server
* Fixes bugs associated with using request 'host' header

### Tests
* Resets `auto_increment` before tests run

v1.2.2
------
### Server
* Adds improved error handling

v1.2.1
------
### Extension
* Sends extension version with requests to the server.

v1.2.0
------
### Server
* Adds abiity to toss to someone else.

v1.1.0
------
### Extension
* Adds option to open tosses in the current window or in a window designated for
  TossItToMe.

v1.0.0
------
The very first version.
