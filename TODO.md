* Do back-off for server errors in background.js
* Add general error handling to server
* Replace `response.send(500, error)` with something correct
* Cross out links for closed tabs in popup
* Ensure db access errors are properly handled
* Set up nice 404 and 50x error pages
* Ensure userDao.insertUser error message duplicateEmail is checked instead of
  noResults
* Remove the `<script>` tag added by the bookmarklet when toss is completed
