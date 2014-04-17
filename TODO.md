* Do back-off for server errors in background.js
* Replace `response.send(500, error)` with something correct
* Cross out links for closed tabs in popup
* Ensure db access errors are properly handled
* Ensure userDao.insertUser error message duplicateEmail is checked instead of
  noResults
* Remove the `<script>` tag added by the bookmarklet when toss is completed
* Reset mysql auto_increments after tests run
