* Do back-off for server errors in background.js
* Replace `response.send(500, error)` with something correct (throw error?)
* Cross out links for closed tabs in popup
* Add overlay with toss info to opened tabs
* Ensure db access errors are properly handled
* Ensure userDao.insertUser error message duplicateEmail is checked instead of
  noResults
* Render escaped characters properly from page titles
* Reload a page when clicking on link in popup if since closed
