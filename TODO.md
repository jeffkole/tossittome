* Do back-off for server errors in background.js
* Replace `response.send(500, error)` with something correct (throw error?)
* Cross out links for closed tabs in popup
* Add overlay with toss info to opened tabs
* Ensure db access errors are properly handled
* Ensure userDao.insertUser error message duplicateEmail is checked instead of
  noResults
* Render escaped characters properly from page titles
* Render a page with full history of tossed and received pages
* Fix failures when the title is too long (like on
  https://www.reddit.com/r/IAmA/comments/40cmzb/i_am_90_years_old_an_officer_during_wwii_a/)
