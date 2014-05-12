Changelog
=========

v2.4.0 (in progress)
------
### Server (2.4.0)
* Adds tour to the welcome page
* Adds small history to the logged in home page
* Adds getting started links for bookmarklet and extension installations

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
