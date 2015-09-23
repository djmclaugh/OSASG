var express = require("express");
var guest_names = require("./guest_names");

var router = express.Router();

function checkCredentials(req, res, next) {
  if (!req.session.username || !guest_names.isValidName(req.session.username)) {
    req.session.username = guest_names.assignGuestName();
    req.session.isGuest = true;
  }
  next();
}

router.use('/', checkCredentials);

router.get('/', function(req, res) {
  res.render('index', {title: 'Open Source Abstract Strategy Games', username: req.session.username});
});

module.exports = router;