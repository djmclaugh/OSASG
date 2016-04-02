var express = require("express");
var guest_names = require("./guest_names");
var gameManager = require("./game_manager").prototype.getInstance();

var router = express.Router();

function checkCredentials(req, res, next) {
  if (!req.session.username) {
    guest_names.getGuestName(function(username) {
      req.session.username = username;
      if (req.session.username == null) {
        req.session.username = req.session.id;
      }
      req.session.isGuest = true;
      next();
    });
  } else {
    next();
  }
}

router.use(checkCredentials);

router.get("/", function(req, res) {
  res.render("index", {
      title: "Open Source Abstract Strategy Games",
      username: req.session.username,
      matches: gameManager.getMatchesUserCanJoin()
  });
});

router.get("/creatematch/:gameTitle", function(req, res) {
  gameManager.createNewMatchup(req.params.gameTitle, {}, null);
  res.redirect("/");
});

router.get("/match/:gameId", function(req, res) {
  res.render("match", {
      title: req.params.gameId,
      username: req.session.username,
      id: req.params.gameId
  });
});

router.get("/api/activeMatches", function(req, res) {
  res.send(gameManager.getMatchesUserCanJoin(req.session.username));
});

module.exports = router;
