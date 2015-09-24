var express = require("express");
var guest_names = require("./guest_names");

var router = express.Router();

function checkCredentials(req, res, next) {
  console.log(req.sessionID);
  if (!req.session.username) {
    req.session.username = guest_names.getGuestName();
    if (req.session.username == null) {
      req.session.username = req.sesisonID;
    }
    req.session.isGuest = true;
  }
  next();
}

router.get('/', checkCredentials, function(req, res) {
  res.render('index', {title: 'Open Source Abstract Strategy Games', username: req.session.username});
});

module.exports = router;