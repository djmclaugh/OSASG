var express = require("express");
var guest_names = require("./db/guest_names");

var router = express.Router();

function setUp(req, res, next) {
  req.OSASG = {};
  next();
}

function checkIfUser(req, res, next) {
  next();
}

function checkIfGuest(req, res, next) {
  if (!req.session_data.username || !guest_names.isValidPair(req.session_data.username, req.session_data.uuid)) {
    var credentials = guest_names.assignGuestNameAndSessionID();
	  req.session_data.uuid = credentials.uuid;
	  req.session_data.username = credentials.username;
  }
  next();
}

router.use('/', setUp);
router.use('/', checkIfGuest);

router.get('/', function(req, res) {
  res.render('index', {title: 'Open Source Abstract Strategy Games', username: req.session_data.username});
});

module.exports = router;